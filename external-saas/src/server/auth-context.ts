import { auth } from "@/auth";
import { sql } from "@/src/db/client";

export type AuthContext = {
  userId: string;
  householdId: string;
  role: "owner" | "admin" | "member" | "viewer";
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function bootstrapDevelopmentUser(userId: string, email: string, name: string | null | undefined) {
  if (process.env.NODE_ENV === "production" || process.env.DEV_AUTH_BYPASS !== "true") return;
  await sql.begin(async (transaction) => {
    await transaction`select set_config('app.current_user_id', ${userId}, true)`;
    await transaction`
      insert into app.users (id, email, name)
      values (${userId}, ${email}, ${name || "Development user"})
      on conflict (id) do update set email = excluded.email, name = excluded.name
    `;
    const existing = await transaction<{ householdId: string }[]>`
      select household_id as "householdId" from app.memberships where user_id = ${userId} limit 1
    `;
    if (existing.length) return;
    await transaction`select app.create_personal_household(${userId}, 'Development household')`;
  });
}

export async function requireAuthContext(): Promise<AuthContext> {
  const session = await auth();
  const userId = session?.user?.id || "";
  if (!UUID_PATTERN.test(userId)) throw new Response("Unauthorized", { status: 401 });
  await bootstrapDevelopmentUser(userId, session?.user?.email || "developer@nextdue.local", session?.user?.name);
  const rows = await sql.begin(async (transaction) => {
    await transaction`select set_config('app.current_user_id', ${userId}, true)`;
    return transaction<AuthContext[]>`
      select user_id as "userId", household_id as "householdId", role
      from app.memberships
      where user_id = ${userId}
      order by case role when 'owner' then 0 when 'admin' then 1 when 'member' then 2 else 3 end, household_id
      limit 1
    `;
  });
  const membership = rows[0];
  if (!membership) throw new Response("No household membership", { status: 403 });
  return membership;
}

export function requireWritable(context: AuthContext) {
  if (context.role === "viewer") throw new Response("Read-only membership", { status: 403 });
}

export function requireOwner(context: AuthContext) {
  if (context.role !== "owner") throw new Response("Owner access required", { status: 403 });
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new Response("Origin required", { status: 403 });
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
  if (!allowed.has(origin)) throw new Response("Origin rejected", { status: 403 });
}

export function responseFromError(error: unknown): Response {
  if (error instanceof Response) return error;
  console.error(error);
  return new Response("Internal server error", { status: 500 });
}
