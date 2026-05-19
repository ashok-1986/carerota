"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, cardItem } from '@/lib/animations';
import { StaffCard } from './StaffCard';
import { StaffFilters } from './StaffFilters';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import type { StaffMember } from '@/hooks/useStaff';

interface StaffDirectoryProps {
  staff: StaffMember[];
  isLoading?: boolean;
}

export function StaffDirectory({ staff, isLoading }: StaffDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const roles = useMemo(() => {
    const unique = Array.from(new Set(staff.map((s) => s.role))).sort();
    return ['All Roles', ...unique];
  }, [staff]);

  const floors = useMemo(() => {
    const seen = new Set<string>();
    return staff
      .filter((s) => s.floorName && !seen.has(s.floorName))
      .map((s) => ({ id: s.floorName!, name: s.floorName! }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (roleFilter && s.role !== roleFilter) return false;
      if (floorFilter && s.floorName !== floorFilter) return false;
      if (statusFilter === 'active' && !s.isActive) return false;
      if (statusFilter === 'inactive' && s.isActive) return false;
      return true;
    });
  }, [staff, searchQuery, roleFilter, floorFilter, statusFilter]);

  const activeCount = staff.filter((s) => s.isActive).length;
  const inactiveCount = staff.length - activeCount;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-slate/10 rounded animate-pulse" />
          <div className="h-8 w-24 bg-slate/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate/20 bg-white p-4 h-40">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-slate/10 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate/10 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate/10 rounded animate-pulse" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate/10 flex gap-2">
                <div className="h-8 flex-1 bg-slate/10 rounded animate-pulse" />
                <div className="h-8 flex-1 bg-slate/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate">
          <span>{filtered.length} staff</span>
          {(searchQuery || roleFilter || floorFilter || statusFilter) && (
            <span>· filtered from {staff.length}</span>
          )}
        </div>
        <Link
          href="/staff/new"
          className="inline-flex items-center gap-1.5 h-8 rounded-lg bg-midnight px-3 text-xs font-medium text-white hover:bg-midnight/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Staff Member
        </Link>
      </div>

      <StaffFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        floorFilter={floorFilter}
        onFloorChange={setFloorFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        roles={roles}
        floors={floors}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description={
            searchQuery || roleFilter || floorFilter || statusFilter
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'Add your first staff member to get started.'
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((s) => (
            <motion.div key={s.id} variants={cardItem}>
              <StaffCard
                id={s.id}
                name={s.name}
                role={s.role}
                employmentType={s.employmentType}
                contractedHours={s.contractedHours}
                payRateHourly={s.payRateHourly}
                isActive={s.isActive}
                floorName={s.floorName}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}