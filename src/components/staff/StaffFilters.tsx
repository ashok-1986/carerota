"use client";

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StaffFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleChange: (role: string) => void;
  floorFilter: string;
  onFloorChange: (floor: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  roles: string[];
  floors: { id: string; name: string }[];
  activeCount: number;
  inactiveCount: number;
}

const STATUS_OPTIONS = ['All Status', 'Active', 'Inactive'];

export function StaffFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleChange,
  floorFilter,
  onFloorChange,
  statusFilter,
  onStatusChange,
  roles,
  floors,
  activeCount,
  inactiveCount,
}: StaffFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or role..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full pl-9 pr-8 rounded-lg border border-slate/20 bg-white text-sm text-midnight placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate hover:text-midnight cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-8 rounded-lg border border-slate/20 bg-white px-2.5 text-xs text-midnight focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors cursor-pointer"
        >
          {roles.map((role) => (
            <option key={role} value={role === 'All Roles' ? '' : role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={floorFilter}
          onChange={(e) => onFloorChange(e.target.value)}
          className="h-8 rounded-lg border border-slate/20 bg-white px-2.5 text-xs text-midnight focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors cursor-pointer"
        >
          <option value="">All Floors</option>
          {floors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-slate/20 bg-white overflow-hidden">
          {STATUS_OPTIONS.map((status) => {
            const isActive = statusFilter === (status === 'All Status' ? '' : status.toLowerCase());
            return (
              <button
                key={status}
                onClick={() => onStatusChange(status === 'All Status' ? '' : status.toLowerCase())}
                className={cn(
                  'h-8 px-3 text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-midnight text-white'
                    : 'text-slate hover:bg-slate/5'
                )}
              >
                {status}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 ml-auto text-xs text-slate">
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal" />
            {activeCount} active
          </span>
          <span className="opacity-40">/</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate" />
            {inactiveCount} inactive
          </span>
        </div>
      </div>
    </div>
  );
}