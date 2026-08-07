import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  // Auspice probes this endpoint on startup; DXKB does not publish narratives.
  return NextResponse.json(
    { error: "narratives are not supported" },
    { status: 501 },
  );
}
