import { NextResponse } from "next/server";
import { sql } from "@/src/db/client";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: "misconfigured", database: false }, { status: 503 });
  }

  try {
    await sql`select 1`;
    return NextResponse.json({ status: "ok", database: true });
  } catch {
    return NextResponse.json({ status: "unavailable", database: false }, { status: 503 });
  }
}
