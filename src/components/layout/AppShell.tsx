"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  homeName?: string;
  userName?: string;
  userRole?: string;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/rota": "Monthly Rota",
  "/leave": "Leave Management",
  "/staff": "Staff Directory",
  "/export": "Export & Reports",
  "/settings": "Settings",
};

export function AppShell({ children, homeName, userName, userRole }: AppShellProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "CareRota";

  return (
    <div className="flex h-screen bg-pearl font-sans text-midnight overflow-hidden">
      <Sidebar homeName={homeName} userName={userName} userRole={userRole} />
      <div className="flex-1 flex flex-col pl-60 h-full">
        <TopBar title={title} />
        <main className="flex-1 overflow-auto bg-pearl">
          {children}
        </main>
      </div>
    </div>
  );
}