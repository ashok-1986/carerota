"use client";

import { formatSectionLabel } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  count: number;
}

export function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-4 bg-midnight/6 border-y border-slate/10 mt-6 first:mt-0">
      <h3 className="font-sans text-[11px] uppercase tracking-widest font-semibold text-midnight">
        {formatSectionLabel(title)}
      </h3>
      <span className="bg-teal/10 text-teal px-2 py-0.5 rounded-full text-[10px] font-semibold border border-teal/20">
        {count} staff
      </span>
    </div>
  );
}