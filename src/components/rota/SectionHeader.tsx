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
    <div className="flex items-center gap-3 py-2.5 px-4 bg-midnight text-white/90 mt-6 first:mt-0">
      <div className="w-1.5 h-4 bg-gold rounded-full" />
      <h3 className="font-sans text-[11px] uppercase tracking-widest font-bold text-white">
        {formatSectionLabel(title)}
      </h3>
      <span className="flex items-center gap-1 bg-white/15 text-white/80 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10">
        <Users size={9} />
        {count}
      </span>
      {floorId && (
        <Link
          href={`/staff?floor=${encodeURIComponent(title)}`}
          className="ml-auto text-[10px] text-white/40 hover:text-white/70 transition-colors mr-2"
          title="View floor staff"
        >
          View all →
        </Link>
      )}
    </div>
  );
}