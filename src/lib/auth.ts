import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { staff, homes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { customAdapter } from "./auth-adapter";

const { handlers: nextAuthHandlers, auth: baseAuth, signIn: baseSignIn, signOut: baseSignOut } = NextAuth({
  adapter: customAdapter(),
  session: { strategy: "jwt" },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL ?? 'support@alchemetryx.com',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Hardcoded admin account for testing while email is broken
        // Replace with DB lookup after Resend domain is verified
        if (
          credentials.email === process.env.ADMIN_EMAIL &&
          credentials.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: 'admin-test',
            email: credentials.email as string,
            name: 'Maribel Pascual',
            role: 'manager',
            homeId: process.env.TEST_HOME_ID ?? '',
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-email',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string | undefined;
        token.homeId = (user as Record<string, unknown>).homeId as string | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;

        // If credentials login already populated role/homeId via JWT, use those
        if (token.role && token.homeId) {
          session.user.role = token.role as string;
          session.user.homeId = token.homeId as string;
        } else {
          // Otherwise look up from staff table (magic-link flow)
          try {
            const [staffRecord] = await db
              .select()
              .from(staff)
              .where(eq(staff.authUserId, token.sub as string))
              .limit(1);
            if (staffRecord) {
              session.user.role = staffRecord.role;
              session.user.homeId = staffRecord.homeId;
            }
          } catch (e) {
            console.error("Error fetching session staff details:", e);
          }
        }
      }
      return session;
    },
  },
});

export const handlers = nextAuthHandlers;

export const auth = async (...args: unknown[]) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (baseAuth as any)(...args);
  if (session) return session;

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || !process.env.AUTH_SECRET) {
    try {
      const firstHome = await db.select().from(homes).limit(1);
      if (!firstHome.length) return null;
      const homeId = firstHome[0].id;

      const managerStaff = await db.select().from(staff).where(eq(staff.role, 'home_manager')).limit(1);
      let staffMember = managerStaff[0];

      if (!staffMember) {
        const allStaff = await db.select().from(staff).limit(1);
        if (allStaff.length) {
          staffMember = allStaff[0];
        } else {
          const [newStaff] = await db.insert(staff).values({
            homeId,
            name: "Default Manager",
            role: "home_manager",
            employmentType: "full_time",
            contractedHours: "36.00",
            payRateHourly: "15.00",
            isActive: true,
          }).returning();
          staffMember = newStaff;
        }
      }

      return {
        user: {
          id: staffMember.id,
          name: staffMember.name,
          email: "manager@goldcarehomes.com",
          role: "home_manager",
          homeId: staffMember.homeId,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (e) {
      console.warn("Auth fallback failed:", e);
      return null;
    }
  }

  return null;
};

export const signIn = baseSignIn;
export const signOut = baseSignOut;
