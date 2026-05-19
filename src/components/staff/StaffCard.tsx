"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Clock, ShieldCheck } from 'lucide-react';

interface StaffCardProps {
  id: string;
  name: string;
  role: string;
  employmentType: string;
  contractedHours: number | null;
  payRateHourly: number | null;
  isActive: boolean;
  floorName: string | null;
}

const employmentTypeLabel: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  bank: 'Bank',
};

const roleColorMap: Record<string, { bg: string; text: string }> = {
  'Registered Nurse': { bg: 'bg-amethyst/15', text: 'text-amethyst' },
  'Nurse': { bg: 'bg-amethyst/15', text: 'text-amethyst' },
  'RN': { bg: 'bg-amethyst/15', text: 'text-amethyst' },
  'Senior Caregiver': { bg: 'bg-teal/15', text: 'text-teal' },
  'Senior Carer': { bg: 'bg-teal/15', text: 'text-teal' },
  'Caregiver': { bg: 'bg-midnight/10', text: 'text-midnight' },
  'Carer': { bg: 'bg-midnight/10', text: 'text-midnight' },
  'Care Assistant': { bg: 'bg-midnight/10', text: 'text-midnight' },
  'Activity Coordinator': { bg: 'bg-gold/10', text: 'text-amber-700' },
  'Housekeeping': { bg: 'bg-slate/10', text: 'text-slate' },
  'Kitchen': { bg: 'bg-slate/10', text: 'text-slate' },
};

const employmentBadge: Record<string, { bg: string; text: string }> = {
  full_time: { bg: 'bg-teal/10', text: 'text-teal' },
  part_time: { bg: 'bg-amethyst/10', text: 'text-amethyst' },
  bank: { bg: 'bg-gold/10', text: 'text-amber-700' },
};

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || '';
}

function getRoleColor(role: string): { bg: string; text: string } {
  for (const [key, value] of Object.entries(roleColorMap)) {
    if (role.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return { bg: 'bg-slate/10', text: 'text-slate' };
}

function getEmploymentBadge(emp: string): { bg: string; text: string } {
  return employmentBadge[emp] ?? { bg: 'bg-slate/10', text: 'text-slate' };
}

export function StaffCard({
  id,
  name,
  role,
  employmentType,
  contractedHours,
  payRateHourly,
  isActive,
  floorName,
}: StaffCardProps) {
  const initials = getInitials(name);
  const roleColor = getRoleColor(role);
  const empBadge = getEmploymentBadge(employmentType);

  return (
    <motion.div
      className="group rounded-xl border border-slate/20 bg-white p-4 shadow-sm hover:border-gold/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            isActive ? 'bg-midnight text-white' : 'bg-slate/20 text-slate'
          )}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-midnight truncate">{name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded', roleColor.bg, roleColor.text)}>
                  {role}
                </span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded', empBadge.bg, empBadge.text)}>
                  {employmentTypeLabel[employmentType] ?? employmentType}
                </span>
                {!isActive && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate/10 text-slate">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {employmentTypeLabel[employmentType] ?? employmentType}
                {contractedHours != null && ` · ${contractedHours} hrs/wk`}
              </span>
            </div>

            {floorName && (
              <div className="flex items-center gap-1.5 text-xs text-slate">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span className="px-1.5 py-0.5 rounded bg-midnight/8 text-midnight text-[10px]">{floorName}</span>
              </div>
            )}

            {payRateHourly != null && payRateHourly > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-teal font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>£{(payRateHourly / 100).toFixed(2)}/hr</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate/10">
        <a
          href={`/staff/${id}`}
          className="flex-1 rounded-lg border border-slate/20 bg-white px-3 py-1.5 text-center text-xs font-medium text-midnight hover:bg-slate/5 transition-colors cursor-pointer"
        >
          View Profile
        </a>
        <a
          href={`/staff/${id}/edit`}
          className="flex-1 rounded-lg bg-midnight px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-midnight/90 transition-colors cursor-pointer"
        >
          Edit
        </a>
      </div>
    </motion.div>
  );
}