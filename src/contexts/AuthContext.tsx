"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
  homeId?: string;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const user = (session?.user as SessionUser | undefined) ?? null;
  const loading = status === "loading";

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) return { error: result.error };
    await update();
    router.push("/dashboard");
    router.refresh();
    return {};
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
