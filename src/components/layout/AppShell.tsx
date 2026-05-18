import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  // In a real implementation, we'd get the current path from usePathname()
  return (
    <div className="flex h-screen bg-pearl font-sans text-midnight overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64 h-full">
        <TopBar />
        <main className="flex-1 overflow-auto bg-pearl">
          {children}
        </main>
      </div>
    </div>
  );
}
