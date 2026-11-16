import { generateCalendarFeed, hashFeedToken } from "@/src/core/calendar-feed";
import { sql } from "@/src/db/client";
import { householdStateSchema } from "@/src/server/state-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return new Response("Not found", { status: 404 });
  const tokenHash = hashFeedToken(token);
  const [record] = await sql<{ id: string; state: unknown }[]>`
    select feed_id as id, state from app.read_calendar_feed(${tokenHash})
  `;
  if (!record) return new Response("Not found", { status: 404 });
  const parsed = householdStateSchema.safeParse(record.state);
  if (!parsed.success) return new Response("Calendar temporarily unavailable", { status: 503 });
  return new Response(generateCalendarFeed(parsed.data), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": "inline; filename=nextdue.ics",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow"
    }
  });
}
