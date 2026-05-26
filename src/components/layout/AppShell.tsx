"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  CalendarOff,
  Users,
  MoreHorizontal,
  Settings,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Monthly Rota", icon: Calendar, href: "/rota" },
    { label: "Leave", icon: CalendarOff, href: "/leave" },
    { label: "Staff Directory", icon: Users, href: "/staff" },
  ];

  const isMoreActive = pathname.startsWith("/settings") || pathname.startsWith("/export");

  return (
    <div className="flex h-screen bg-pearl font-sans text-midnight overflow-hidden">
      {/* Sidebar hidden on viewports < 1280px (xl) */}
      <Sidebar homeName={homeName} userName={userName} userRole={userRole} />
      
      <div className="flex-1 flex flex-col xl:pl-60 h-full">
        {/* TopBar care home name hidden on screens < 640px */}
        <TopBar title={title} homeName={homeName} userName={userName} userRole={userRole} />
        
        <main className="flex-1 overflow-auto bg-pearl pb-16 xl:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Viewports < 1280px (xl) */}
      <TooltipProvider>
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex xl:hidden items-center justify-around h-16 px-2 shadow-lg">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 relative",
                      isActive ? "text-[#008B8B]" : "text-slate-400 hover:text-midnight"
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-0 inset-x-4 h-[3px] bg-[#008B8B] rounded-b-full" />
                    )}
                    <Icon className="w-5.5 h-5.5" strokeWidth={isActive ? 2.5 : 2} />
                  </Link>
                } />
                <TooltipContent side="top">
                  <p className="text-xs font-semibold">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* More Trigger (Settings & Export) */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button
                title="More Options"
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-all duration-150 relative outline-none cursor-pointer",
                  isMoreActive ? "text-[#008B8B]" : "text-slate-400 hover:text-midnight"
                )}
              >
                {isMoreActive && (
                  <span className="absolute top-0 inset-x-4 h-[3px] bg-[#008B8B] rounded-b-full" />
                )}
                <MoreHorizontal className="w-5.5 h-5.5" strokeWidth={isMoreActive ? 2.5 : 2} />
              </button>
            } />
            <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 rounded-xl p-1.5 shadow-md mb-2">
              <DropdownMenuItem render={
                <Link
                  href="/export"
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                    pathname.startsWith("/export") ? "bg-[#008B8B]/10 text-[#008B8B] font-bold" : "text-midnight hover:bg-slate-50"
                  )}
                >
                  <Download className="w-4 h-4" />
                  <span>Export & Reports</span>
                </Link>
              } />
              <DropdownMenuItem render={
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer",
                    pathname.startsWith("/settings") ? "bg-[#008B8B]/10 text-[#008B8B] font-bold" : "text-midnight hover:bg-slate-50"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
              } />
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </TooltipProvider>
    </div>
  );
}