"use client";

import { StaffDirectory } from '@/components/staff/StaffDirectory';
import { useStaff } from '@/hooks/useStaff';
import { useFloors } from '@/hooks/useFloors';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function StaffPage() {
  const { data: staff = [], isLoading, isError } = useStaff();
  const { data: floors = [], isLoading: isLoadingFloors } = useFloors();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold font-sans text-midnight">Staff Directory</h1>
          <p className="text-sm text-slate mt-1">
            Manage your care team members, roles, and employment details.
          </p>
        </div>
        <Link href="/settings?tab=home" className="text-sm font-medium text-gold-600 hover:text-gold-700 hover:underline bg-gold/10 px-4 py-2 rounded-md transition-colors">
          Floor Settings &rarr;
        </Link>
      </div>

      {isLoading || isLoadingFloors ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : isError ? (
        <div className="text-center p-8 text-danger">
          Failed to load staff directory. Please try again.
        </div>
      ) : (
        <StaffDirectory staff={staff} floors={floors} />
      )}
    </div>
  );
}
