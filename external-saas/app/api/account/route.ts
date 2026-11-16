import { sql } from "@/src/db/client";
import { assertSameOrigin, requireAuthContext, requireOwner, responseFromError } from "@/src/server/auth-context";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireAuthContext();
    requireOwner(context);
    const body = await request.json();
    if (body?.confirmation !== "DELETE") return new Response("Confirmation required", { status: 400 });
    await sql.begin(async (transaction) => {
      await transaction`select set_config('app.current_user_id', ${context.userId}, true)`;
      await transaction`delete from app.households where id = ${context.householdId}`;
      const [remaining] = await transaction<{ count: number }[]>`
        select count(*)::int as count from app.memberships where user_id = ${context.userId}
      `;
      if (remaining.count === 0) await transaction`delete from app.users where id = ${context.userId}`;
    });
    return new Response(null, { status: 204, headers: { "clear-site-data": '"cache", "cookies", "storage"' } });
  } catch (error) {
    return responseFromError(error);
  }
}
