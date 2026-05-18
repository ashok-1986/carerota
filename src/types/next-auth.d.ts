import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      homeId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    homeId?: string;
  }
}
