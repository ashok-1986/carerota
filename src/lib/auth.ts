import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { staff, homes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { customAdapter } from "./auth-adapter";
import { rateLimit, rateLimitShared } from "./rate-limit";

const { handlers: nextAuthHandlers, auth: baseAuth, signIn: baseSignIn, signOut: baseSignOut } = NextAuth({
  adapter: customAdapter(),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,      // 8 hours — sessions expire after 8 hours of inactivity
    updateAge: 60 * 60,        // Refresh the token every hour to keep it current
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL ?? 'support@alchemetryx.com',
      normalizeIdentifier(identifier: string): string {
        const { allowed } = rateLimit(`magic:${identifier}`, 3, 300_000);
        if (!allowed) throw new Error('Too many magic link requests');
        const [local, domain] = identifier.toLowerCase().trim().split("@");
        const parsedDomain = domain.split(",")[0];
        return `${local}@${parsedDomain}`;
      }
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials, req: any) {
        if (!credentials?.email || !credentials?.password) return null;

        const headersObj = req?.headers && typeof req.headers.get === 'function' 
          ? {
              'x-forwarded-for': req.headers.get('x-forwarded-for'),
              'x-real-ip': req.headers.get('x-real-ip')
            }
          : req?.headers;

        const ip = headersObj?.['x-forwarded-for']?.split(',')[0]?.trim() 
          ?? headersObj?.['x-real-ip'] 
          ?? 'unknown';

        const { allowed, retryAfter } = await rateLimitShared(`login:${ip}`, 5, 60_000);
        
        if (!allowed) {
          throw new Error(`Too many login attempts. Try again in ${retryAfter} seconds.`);
        }

        // Fail closed: credentials must be verified against real DB-backed users.
        // No hardcoded fallback accounts. Password auth is not implemented here;
        // the primary flow is the email magic link (Resend provider).
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
      if (!token.role || !token.homeId) {
        // Look up from staff table (magic-link flow)
        try {
          const [staffRecord] = await db
            .select()
            .from(staff)
            .where(eq(staff.authUserId, token.sub as string))
            .limit(1);
          if (staffRecord) {
            token.role = staffRecord.role;
            token.homeId = staffRecord.homeId;
          }
        } catch (e) {
          console.error("Error fetching staff details for JWT callback:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.homeId = token.homeId as string;
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

  // Fail closed. The dev fallback below is STRICTLY opt-in for local development:
  // it requires NODE_ENV === 'development', an explicit AUTH_DEV_BYPASS=true flag,
  // AND a configured AUTH_SECRET. It must never run in production or tests, and
  // must never auto-trigger just because AUTH_SECRET is missing.
  const devBypassEnabled =
    process.env.NODE_ENV === 'development' &&
    process.env.AUTH_DEV_BYPASS === 'true' &&
    !!process.env.AUTH_SECRET;

  if (!devBypassEnabled) return null;

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
          payRateHourly: "1500", // pence (£15.00/hr) — canonical unit
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
};

export const signIn = baseSignIn;
export const signOut = baseSignOut;
