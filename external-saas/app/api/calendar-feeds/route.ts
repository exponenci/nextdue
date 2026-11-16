import { createFeedToken, hashFeedToken } from "@/src/core/calendar-feed";
import { jsonbParameter } from "@/src/db/json";
import { withTenant } from "@/src/db/tenant";
import { assertSameOrigin, requireAuthContext, requireWritable, responseFromError } from "@/src/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await requireAuthContext();
    const feeds = await withTenant(context.userId, context.householdId, (transaction) => transaction<{ id: string; name: string; createdAt: Date; lastUsedAt: Date | null }[]>`
        select id, name, created_at as "createdAt", last_used_at as "lastUsedAt"
        from app.calendar_feeds
        where household_id = ${context.householdId} and revoked_at is null
        order by created_at desc
      `);
    return Response.json({ feeds }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return responseFromError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireAuthContext();
    requireWritable(context);
    const token = createFeedToken();
    const tokenHash = hashFeedToken(token);
    const feed = await withTenant(context.userId, context.householdId, async (transaction) => {
      const [created] = await transaction<{ id: string }[]>`
        insert into app.calendar_feeds (household_id, token_hash, name, created_by)
        values (${context.householdId}, ${tokenHash}, 'NextDue', ${context.userId})
        returning id
      `;
      await transaction`
        insert into app.audit_events (household_id, actor_user_id, action, entity_type, entity_id)
        values (${context.householdId}, ${context.userId}, 'calendar_feed.created', 'calendar_feed', ${created.id})
      `;
      return created;
    });
    const origin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
    return Response.json({ id: feed.id, url: `${origin}/calendar/${token}` }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return responseFromError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireAuthContext();
    requireWritable(context);
    const revoked = await withTenant(context.userId, context.householdId, async (transaction) => {
      const rows = await transaction<{ id: string }[]>`
        update app.calendar_feeds set revoked_at = now()
        where household_id = ${context.householdId} and revoked_at is null
        returning id
      `;
      await transaction`
        insert into app.audit_events (household_id, actor_user_id, action, entity_type, entity_id, details)
        values (${context.householdId}, ${context.userId}, 'calendar_feed.revoked_all', 'household', ${context.householdId}, ${jsonbParameter({ count: rows.length })}::jsonb)
      `;
      return rows;
    });
    return Response.json({ revoked: revoked.length }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return responseFromError(error);
  }
}
