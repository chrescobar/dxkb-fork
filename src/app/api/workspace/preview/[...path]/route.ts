import { NextRequest, NextResponse } from "next/server";
import { requireAuthToken } from "@/lib/auth/session";
import { getRequiredEnv } from "@/lib/env";
import { getMimeType } from "@/components/workspace/file-viewer/file-viewer-registry";

const defaultMaxBytes = 10 * 1024 * 1024; // 1 MB
const maxBytesCap = 2 * 1024 * 1024; // 2 MB server-enforced cap

/**
 * Workspace file preview proxy route.
 * Like the view route, but reads only the first N bytes (rounded down to the
 * last newline) so that large files never blow up the client.
 *
 * Query params:
 *   ?maxBytes=N  — requested byte limit (default 1 MB, capped at 2 MB)
 *
 * Response headers:
 *   X-Truncated: true  — set when the response was truncated
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const authToken = await requireAuthToken();
    if (authToken instanceof NextResponse) return authToken;

    const resolved = await params;
    const segments = resolved.path ?? [];
    const workspacePath =
      "/" + segments.map((s) => decodeURIComponent(s)).join("/");

    const maxBytesParam = request.nextUrl.searchParams.get("maxBytes");
    const maxBytes = maxBytesParam
      ? Math.min(Math.max(Number(maxBytesParam) || defaultMaxBytes, 1), maxBytesCap)
      : defaultMaxBytes;

    // Get the download URL from the Workspace API
    const wsResponse = await fetch(getRequiredEnv("WORKSPACE_API_URL"), {
      method: "POST",
      headers: {
        "Content-Type": "application/jsonrpc+json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        id: 1,
        method: "Workspace.get_download_url",
        params: [{ objects: [workspacePath] }],
        jsonrpc: "2.0",
      }),
    });

    if (!wsResponse.ok) {
      const responseText = await wsResponse.text();
      console.error(
        "BV-BRC API error:",
        wsResponse.status,
        wsResponse.statusText,
        responseText,
      );
      return NextResponse.json(
        {
          error: `BV-BRC API error: ${wsResponse.status} ${wsResponse.statusText}`,
        },
        { status: wsResponse.status },
      );
    }

    const data = await wsResponse.json();
    const downloadUrl = data?.result?.[0]?.[0];

    if (!downloadUrl) {
      return NextResponse.json(
        { error: "Download URL not found for the requested path" },
        { status: 404 },
      );
    }

    // Fetch the actual file content from Shock
    const shockResponse = await fetch(downloadUrl);

    if (!shockResponse.ok) {
      console.error(
        "Shock download error:",
        shockResponse.status,
        shockResponse.statusText,
      );
      return NextResponse.json(
        { error: "Failed to fetch file content from storage" },
        { status: 502 },
      );
    }

    const lastSegment = segments[segments.length - 1] ?? "download";
    const filename = decodeURIComponent(lastSegment);
    const contentType = getMimeType(filename);

    // Check if the file is small enough to return in full
    const contentLength = shockResponse.headers.get("Content-Length");
    const fileSize = contentLength ? Number(contentLength) : null;

    if (fileSize !== null && fileSize <= maxBytes) {
      // File fits within the limit — stream it in full (no truncation)
      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(fileSize),
      };
      return new NextResponse(shockResponse.body, { status: 200, headers });
    }

    // Large file — read only the first maxBytes, rounding down to the last newline
    const reader = shockResponse.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { error: "Failed to read file stream" },
        { status: 502 },
      );
    }

    const chunks: Uint8Array[] = [];
    let bytesRead = 0;
    let truncated = false;

    try {
      while (bytesRead < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;

        const remaining = maxBytes - bytesRead;
        if (value.byteLength <= remaining) {
          chunks.push(value);
          bytesRead += value.byteLength;
        } else {
          chunks.push(value.slice(0, remaining));
          bytesRead += remaining;
          truncated = true;
          break;
        }
      }

      if (!truncated && bytesRead >= maxBytes) {
        truncated = true;
      }
    } finally {
      // Cancel the remaining stream to free the connection
      reader.cancel().catch(() => { /* connection already closed */ });
    }

    // Combine chunks into a single buffer
    const combined = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    // If truncated, round down to the last newline for clean line breaks
    let finalBytes = combined;
    if (truncated) {
      const newlineCode = 0x0a; // \n
      let lastNewline = -1;
      for (let i = combined.length - 1; i >= 0; i--) {
        if (combined[i] === newlineCode) {
          lastNewline = i;
          break;
        }
      }
      if (lastNewline > 0) {
        finalBytes = combined.slice(0, lastNewline + 1);
      }
      // If no newline found, return the full buffer (single very long line)
    }

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(finalBytes.byteLength),
    };

    if (truncated) {
      headers["X-Truncated"] = "true";
    }

    return new NextResponse(finalBytes, { status: 200, headers });
  } catch (error) {
    console.error("Workspace preview API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
