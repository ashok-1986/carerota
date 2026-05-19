"use client";

interface SectionHeaderProps {
  title: string;
  count: number;
}

export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 bg-slate/5 border-y border-slate/10 mt-6 first:mt-0">
      <h3 className="font-sans font-bold text-midnight">{title}</h3>
      <span className="bg-pearl px-2 py-0.5 rounded-full text-xs font-medium text-slate border border-slate/20 shadow-sm">
        {count} staff
      </span>
    </div>
  );
}
