"use client";

import { Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { useState, useRef, useEffect } from "react";

interface TopBarProps {
  title?: string;
  pendingLeaveCount?: number;
  userName?: string;
  userRole?: string;
  homeName?: string;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || '';
}

export function TopBar({ title = "CareRota", pendingLeaveCount = 0, userName = "Manager", userRole = "Home Manager", homeName = "Marlborough Court" }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const trimmedName = (userName ?? "").trim();
  const displayName = trimmedName !== "" ? trimmedName : "Manager";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-16 glass-card border-b border-slate/15 flex items-center justify-between px-6 shrink-0 z-10 rounded-none">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-gold rounded-full" />
          <h2 className="text-lg font-display font-semibold text-midnight tracking-tight">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leave"
            className="relative p-2 hover:bg-slate/5 rounded-xl transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate" />
            {pendingLeaveCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-gold text-midnight text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {pendingLeaveCount > 9 ? "9+" : pendingLeaveCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate/5 rounded-xl transition-colors border border-transparent hover:border-slate/15"
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-xl bg-midnight flex items-center justify-center text-white font-bold font-sans text-xs shadow-sm">
                {getInitials(displayName)}
              </div>
              <span className="hidden sm:block text-sm font-medium text-midnight">{displayName.split(' ')[0]}</span>
            </button>
            
            {userMenuOpen && (
              <div className="glass-card absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50 border border-slate/15">
                <div className="px-4 py-3 border-b border-slate/10">
                  <p className="text-sm font-semibold text-midnight">{displayName}</p>
                  <p className="text-xs text-slate mt-0.5">{userRole}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    className="px-4 py-2.5 text-sm text-midnight flex items-center gap-2.5 hover:bg-slate/5 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-slate" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full px-4 py-2.5 text-sm text-danger flex items-center gap-2.5 hover:bg-danger/5 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:block">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 z-50">
            <Sidebar homeName={homeName} userName={displayName} userRole={userRole} />
          </div>
        </div>
      )}
    </>
  );
}