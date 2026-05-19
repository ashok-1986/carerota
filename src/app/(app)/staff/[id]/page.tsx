import { getStaffById, getStaffRotaEntries } from '@/db/queries/staff';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, MapPin, PoundSterling } from 'lucide-react';

const roleLabels: Record<string, string> = {
  registered_nurse: 'Registered Nurse',
  senior_caregiver: 'Senior Caregiver',
  caregiver: 'Caregiver',
  home_manager: 'Home Manager',
};

const empLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  bank: 'Bank',
};

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map((n) => n[0] ?? '').slice(0, 2).join('').toUpperCase() || '';
}

function formatRole(role: string): string {
  return roleLabels[role] ?? role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getStaffById(id);

  if (!member) notFound();

  const entries = await getStaffRotaEntries(id);

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-slate hover:text-midnight transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Staff Directory
      </Link>

      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-start gap-6">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-midnight to-teal flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
            {getInitials(member.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-midnight">{member.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal/10 text-teal border border-teal/20">
                    {formatRole(member.role)}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amethyst/10 text-amethyst border border-amethyst/20">
                    {empLabels[member.employmentType] ?? member.employmentType}
                  </span>
                  {!member.isActive && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate/10 text-slate border border-slate/20">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/rota?staff=${member.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-midnight rounded-xl text-sm font-semibold hover:bg-gold/90 transition-colors"
              >
                <Calendar className="size-4" />
                View Rota
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/50 rounded-xl p-4 border border-slate/10">
                <div className="flex items-center gap-2 text-xs text-slate mb-1">
                  <Clock className="size-3.5" />
                  Contracted Hours
                </div>
                <p className="text-lg font-bold text-midnight">
                  {member.contractedHours != null ? `${member.contractedHours} hrs/wk` : '—'}
                </p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-slate/10">
                <div className="flex items-center gap-2 text-xs text-slate mb-1">
                  <PoundSterling className="size-3.5" />
                  Hourly Rate
                </div>
                <p className="text-lg font-bold text-teal">
                  {member.payRateHourly != null ? `£${(member.payRateHourly / 100).toFixed(2)}` : '—'}
                </p>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-slate/10">
                <div className="flex items-center gap-2 text-xs text-slate mb-1">
                  <MapPin className="size-3.5" />
                  Floor
                </div>
                <p className="text-lg font-bold text-midnight">{member.floorName ?? 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-display font-semibold text-midnight mb-4">Recent Rota Entries</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-slate py-8 text-center">No rota entries found.</p>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white/60 border border-slate/15 rounded-lg p-2 text-center"
              >
                <p className="text-[10px] text-slate/60 font-medium">{entry.shiftDate?.slice(5) ?? ''}</p>
                <p className="text-sm font-bold text-midnight mt-0.5">{entry.code ?? '—'}</p>
                <p className="text-[9px] text-slate/40 mt-0.5">{entry.isPublished ? 'Published' : 'Draft'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
