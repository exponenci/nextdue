import { withTenant } from "@/src/db/tenant";
import { requireAuthContext, responseFromError } from "@/src/server/auth-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await requireAuthContext();
    const snapshot = await withTenant(context.userId, context.householdId, async (transaction) => {
      const [current] = await transaction<{ revision: number; state: unknown; updatedAt: Date }[]>`
        select revision::int as revision, state, updated_at as "updatedAt"
        from app.household_snapshots where household_id = ${context.householdId}
      `;
      await transaction`
        insert into app.audit_events (household_id, actor_user_id, action, entity_type, entity_id)
        values (${context.householdId}, ${context.userId}, 'account.exported', 'household', ${context.householdId})
      `;
      return current;
    });
    return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), householdId: context.householdId, snapshot: snapshot || null }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="nextdue-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store"
      }
    });
  } catch (error) {
    return responseFromError(error);
  }
}
