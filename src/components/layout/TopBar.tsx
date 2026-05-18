"use client";

import { Bell, Menu, User, Settings, LogOut } from "lucide-react";
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

export function TopBar({ title = "CareRota", pendingLeaveCount = 0, userName = "Manager", userRole = "Home Manager", homeName = "Marlborough Court" }: TopBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate/20 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button
            className="hidden lg:block p-2 hover:bg-slate/10 rounded-md transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-midnight" />
          </button>
          <h2 className="text-lg font-semibold text-midnight">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/leave"
            className="relative p-2 hover:bg-slate/10 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate" />
            {pendingLeaveCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gold text-midnight text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingLeaveCount > 9 ? "9+" : pendingLeaveCount}
              </span>
            )}
          </Link>

          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 hover:bg-slate/10 rounded-full transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-midnight flex items-center justify-center text-white font-bold font-sans text-xs">
                {getInitials(userName)}
              </div>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate/20 shadow-md overflow-hidden z-50"
                style={{ minWidth: "13rem" }}
              >
                <div className="px-4 py-3 border-b border-slate/10">
                  <p className="text-sm font-semibold text-midnight">{userName}</p>
                  <p className="text-xs text-slate mt-0.5">{userRole}</p>
                </div>
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-slate/50 flex items-center gap-2 cursor-not-allowed">
                    <User className="w-4 h-4" />
                    My Profile
                  </div>
                  <Link
                    href="/settings"
                    className="px-4 py-2 text-sm text-midnight flex items-center gap-2 hover:bg-slate/5 transition-colors"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full px-4 py-2 text-sm text-danger flex items-center gap-2 hover:bg-slate/5 transition-colors text-left"
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
            <Sidebar homeName={homeName} userName={userName} userRole={userRole} />
          </div>
        </div>
      )}
    </>
  );
}