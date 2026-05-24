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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  homeName?: string;
  userName?: string;
  userRole?: string;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || '';
}

export function Sidebar({ homeName = "Marlborough Court", userName = "Manager", userRole = "Home Manager" }: SidebarProps) {
  const pathname = usePathname();

  const trimmedName = (userName ?? "").trim();
  const displayName = trimmedName !== "" ? trimmedName : "Manager";

  const navItems: { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; href: string }[] = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Monthly Rota", icon: Calendar, href: "/rota" },
    { label: "Leave", icon: CalendarOff, href: "/leave" },
    { label: "Staff Directory", icon: Users, href: "/staff" },
    { label: "Export", icon: Download, href: "/export" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <aside className="hidden xl:flex w-60 glass-sidebar flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="font-display font-bold text-gold text-xl">CR</span>
          </div>
          <div>
            <span className="font-sans font-semibold text-white text-base tracking-wide">CareRota</span>
            <p className="text-[10px] text-white/40 mt-px truncate max-w-32">{homeName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href as string}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans font-medium transition-all duration-150 ease-out relative",
                isActive
                  ? "bg-white/15 text-white font-semibold shadow-sm"
                  : "text-white/50 hover:bg-white/8 hover:text-white/90"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-gold rounded-r-full" />
              )}
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/8 space-y-1">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gold font-bold font-sans text-xs shrink-0 ring-1 ring-white/20">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 truncate">{userRole}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 transition-colors text-sm"
        >
          <LogOut size={14} strokeWidth={2} />
          <span>Sign out</span>
        </button>
        <p className="text-center text-[10px] text-white/20 pt-2">Powered by Alchemetryx</p>
      </div>
    </aside>
  );
}
