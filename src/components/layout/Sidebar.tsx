import Link from 'next/link';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  Users, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentPath?: string;
}

export function Sidebar({ currentPath = '/dashboard' }: SidebarProps) {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Rota', icon: CalendarDays, href: '/rota' },
    { label: 'Leave', icon: Clock, href: '/leave' },
    { label: 'Staff', icon: Users, href: '/staff' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <aside className="w-64 bg-midnight text-pearl flex flex-col h-screen fixed left-0 top-0 border-r border-slate/20 shadow-lg">
      <div className="p-6">
        <h1 className="font-display font-semibold text-2xl tracking-wide text-gold">CareRota</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-sans font-medium transition-all duration-200",
                isActive 
                  ? "bg-pearl/10 text-gold" 
                  : "text-pearl/70 hover:bg-pearl/5 hover:text-pearl"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate/20">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-amethyst/20 flex items-center justify-center text-amethyst font-bold font-sans">
            AM
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Alice Manager</span>
            <span className="text-xs text-pearl/50">Gold Care Homes</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
