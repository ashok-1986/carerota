"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  CalendarOff,
  Users,
  Download,
  Settings,
  LogOut,
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  homeName?: string;
  userName?: string;
  userRole?: string;
}

export function Sidebar({ homeName = "Marlborough Court", userName = "Manager", userRole = "Home Manager" }: SidebarProps) {
  const pathname = usePathname();

  const navItems: { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; href: string }[] = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Rota", icon: Calendar, href: "/rota" },
    { label: "Leave", icon: CalendarOff, href: "/leave" },
    { label: "Staff", icon: Users, href: "/staff" },
    { label: "Export", icon: Download, href: "/export" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-60 bg-midnight text-pearl flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-5 h-5 text-gold" strokeWidth={2} />
          <span className="font-display font-semibold text-2xl tracking-wide text-gold">CareRota</span>
        </div>
        <p className="text-xs text-slate mt-2 ml-7">{homeName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href as string}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md font-sans font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold rounded-full" />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-midnight font-bold font-sans text-xs shrink-0">
            {getInitials(userName || "AM")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-xs text-white/50 truncate">{userRole}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-md text-white/60 hover:bg-white/5 hover:text-white transition-colors text-sm"
        >
          <LogOut size={16} strokeWidth={2} />
          <span>Sign out</span>
        </button>
        <p className="text-center text-xs text-white/30 pt-2">Powered by Alchemetryx</p>
      </div>
    </aside>
  );
}