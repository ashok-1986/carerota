import { AppShell } from "@/components/layout/AppShell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHomeById } from "@/db/queries/homes";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !session.user.homeId) {
    redirect("/login");
  }

  let homeName: string | undefined;
  try {
    const home = await getHomeById(session.user.homeId);
    if (home?.name) {
      homeName = home.name;
    }
  } catch (error) {
    console.error("Failed to load care home details for layout:", error);
  }

  const userName = session.user.name ?? undefined;
  const userRole = session.user.role ?? undefined;

  return (
    <AppShell homeName={homeName} userName={userName} userRole={userRole}>
      {children}
    </AppShell>
  );
}
