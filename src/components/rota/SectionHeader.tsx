"use client";

import { formatSectionLabel } from '@/lib/utils';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface SectionHeaderProps {
  title: string;
  count: number;
  floorId?: string;
}

export function SectionHeader({ title, count, floorId }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 glass-card rounded-lg mt-6 first:mt-0 border-slate/20">
      <div className="w-1.5 h-4 bg-gold rounded-full" />
      <h3 className="font-sans text-[11px] uppercase tracking-widest font-bold text-midnight">
        {formatSectionLabel(title)}
      </h3>
      <span className="flex items-center gap-1 bg-midnight/10 text-midnight/70 px-2 py-0.5 rounded-full text-[10px] font-bold">
        <Users size={9} />
        {count}
      </span>
      {floorId && (
        <Link
          href={`/staff?floor=${encodeURIComponent(floorId)}`}
          className="ml-auto text-[10px] text-slate/50 hover:text-teal transition-colors mr-2"
          title="View floor staff"
        >
          View all →
        </Link>
      )}
    </div>
  );
}
