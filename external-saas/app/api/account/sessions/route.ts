import { jsonbParameter } from "@/src/db/json";
import { withTenant } from "@/src/db/tenant";
import { assertSameOrigin, requireAuthContext, responseFromError } from "@/src/server/auth-context";

export const runtime = "nodejs";

function currentSessionToken(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (["authjs.session-token", "__Secure-authjs.session-token"].includes(rawName)) return decodeURIComponent(rawValue.join("="));
  }
  return "";
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await requireAuthContext();
    const token = currentSessionToken(request);
    const deleted = await withTenant(context.userId, context.householdId, async (transaction) => {
      const rows = token
        ? await transaction`delete from app.sessions where user_id = ${context.userId} and session_token <> ${token} returning session_token`
        : [];
      await transaction`
        insert into app.audit_events (household_id, actor_user_id, action, entity_type, entity_id, details)
        values (${context.householdId}, ${context.userId}, 'sessions.revoked', 'user', ${context.userId}, ${jsonbParameter({ count: rows.length })}::jsonb)
      `;
      return rows;
    });
    return Response.json({ revoked: deleted.length }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return responseFromError(error);
  }
}
