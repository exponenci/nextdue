import { sql } from "@/src/db/client";
import { jsonbParameter } from "@/src/db/json";
import { assertSameOrigin, requireAuthContext, requireWritable, responseFromError } from "@/src/server/auth-context";
import { stateWriteSchema } from "@/src/server/state-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "cache-control": "private, no-store, max-age=0" };

export async function GET() {
  try {
    const context = await requireAuthContext();
    const rows = await sql.begin(async (transaction) => {
      await transaction`select set_config('app.current_user_id', ${context.userId}, true)`;
      return transaction<{ revision: number; state: unknown }[]>`
        select revision::int as revision, state
        from app.household_snapshots
        where household_id = ${context.householdId}
      `;
    });
    const snapshot = rows[0];
    return Response.json(snapshot || { revision: 0, state: null }, { headers: noStoreHeaders });
  } catch (error) {
    return responseFromError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireAuthContext();
    requireWritable(context);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 1_100_000) return new Response("Payload too large", { status: 413 });
    const parsed = stateWriteSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "Invalid household state", issues: parsed.error.issues }, { status: 400, headers: noStoreHeaders });
    const { revision, state } = parsed.data;
    const updated = await sql.begin(async (transaction) => {
      await transaction`select set_config('app.current_user_id', ${context.userId}, true)`;
      const rows = revision === 0
        ? await transaction<{ revision: number }[]>`
            insert into app.household_snapshots (household_id, revision, schema_version, state, updated_by)
            values (${context.householdId}, 1, ${state.version}, ${jsonbParameter(state)}::jsonb, ${context.userId})
            on conflict (household_id) do nothing
            returning revision::int as revision
          `
        : await transaction<{ revision: number }[]>`
            update app.household_snapshots
            set revision = revision + 1,
                schema_version = ${state.version},
                state = ${jsonbParameter(state)}::jsonb,
                updated_by = ${context.userId},
                updated_at = now()
            where household_id = ${context.householdId} and revision = ${revision}
            returning revision::int as revision
          `;
      if (!rows.length) return null;
      await transaction`
        insert into app.audit_events (household_id, actor_user_id, action, entity_type, entity_id, details)
        values (${context.householdId}, ${context.userId}, 'state.updated', 'household_snapshot', ${context.householdId}, ${jsonbParameter({ fromRevision: revision, toRevision: rows[0].revision })}::jsonb)
      `;
      return rows[0];
    });
    if (!updated) return Response.json({ error: "revision_conflict" }, { status: 409, headers: noStoreHeaders });
    return Response.json(updated, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof SyntaxError) return new Response("Invalid JSON", { status: 400 });
    return responseFromError(error);
  }
}
