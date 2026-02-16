import { getServerAuthToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const MINHASH_SERVICE_URL = process.env.MINHASH_SERVICE_URL;

/**
 * Proxy to Minhash service (Similar Genome Finder).
 * POST /api/services/minhash
 * Body: JSON-RPC payload { method, params, version, id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 },
      );
    }

    const response = await fetch(MINHASH_SERVICE_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": await getServerAuthToken() || "",
        },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Minhash service error", ...data },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Minhash proxy error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
