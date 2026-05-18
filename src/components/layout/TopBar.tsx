import { Bell, Search } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-16 bg-pearl border-b border-slate/20 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="font-display font-semibold text-xl text-midnight">King George Care Home</span>
      </div>
      
      <div className="flex items-center gap-6 text-slate">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate/50" />
          <input 
            type="text" 
            placeholder="Search staff or shifts..." 
            className="pl-9 pr-4 py-2 bg-white border border-slate/20 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all w-64"
          />
        </div>
        
        <button className="relative p-2 hover:bg-slate/10 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
