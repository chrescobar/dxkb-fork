import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  // Auspice requires this endpoint, but DXKB discovery uses the inventory API.
  return NextResponse.json({ datasets: [], narratives: [] });
}
