import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db, sql } from "@/src/db/client";
import {
  oauthAccounts,
  sessions,
  users,
  verificationTokens
} from "@/src/db/schema";

const providers: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile", prompt: "select_account" } }
  }));
}

if (process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET) {
  providers.push({
    id: "oidc",
    name: process.env.OIDC_NAME || "Company SSO",
    type: "oidc",
    issuer: process.env.OIDC_ISSUER,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    authorization: { params: { scope: "openid email profile" } },
    checks: ["pkce", "state"],
    profile(profile) {
      return {
        id: String(profile.sub),
        name: typeof profile.name === "string" ? profile.name : null,
        email: typeof profile.email === "string" ? profile.email : null,
        image: typeof profile.picture === "string" ? profile.picture : null
      };
    }
  });
}

const devBypass = process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";

if (devBypass) {
  providers.push(Credentials({
    id: "development",
    name: "Development login",
    credentials: {},
    async authorize() {
      const email = z.string().email().parse(process.env.DEV_AUTH_EMAIL || "developer@nextdue.local");
      const id = z.string().uuid().parse(process.env.DEV_AUTH_USER_ID || "00000000-0000-4000-8000-000000000001");
      return { id, email, name: "Development user" };
    }
  }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: oauthAccounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  providers,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: devBypass ? "jwt" : "database" },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "oidc" || !process.env.OIDC_ALLOWED_DOMAIN) return true;
      const email = typeof profile?.email === "string" ? profile.email : "";
      const verified = profile?.email_verified === true;
      return verified && email.toLowerCase().endsWith(`@${process.env.OIDC_ALLOWED_DOMAIN.toLowerCase()}`);
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, user, token }) {
      if (session.user) session.user.id = user?.id || token.sub || "";
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      const userId = user.id;
      if (!userId) return;
      await sql.begin(async (transaction) => {
        await transaction`select set_config('app.current_user_id', ${userId}, true)`;
        await transaction`select app.create_personal_household(${userId}, ${user.name ? `${user.name}'s household` : "My household"})`;
      });
    },
    async linkAccount({ account }) {
      // Sign-in tokens are not retained. Calendar access uses a separate consent flow and encrypted store.
      await db.update(oauthAccounts).set({ access_token: null, refresh_token: null, id_token: null })
        .where(and(
          eq(oauthAccounts.provider, account.provider),
          eq(oauthAccounts.providerAccountId, account.providerAccountId)
        ));
    }
  }
});
