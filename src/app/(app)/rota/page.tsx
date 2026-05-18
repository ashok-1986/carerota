'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PayPeriodNav } from '@/components/rota/PayPeriodNav';
import { FloorTabs } from '@/components/rota/FloorTabs';
import { RotaToolbar } from '@/components/rota/RotaToolbar';
import { MonthlyRotaGrid } from '@/components/rota/MonthlyRotaGrid';
import { RotaLegend } from '@/components/rota/RotaLegend';
import { addDays } from 'date-fns';

export default function RotaPage() {
  // Mock State for UI Demonstration
  const [activeFloorId, setActiveFloorId] = useState('floor-1');
  const [isDraft, setIsDraft] = useState(true);
  
  // Mock dates (19th of current month to 18th of next)
  const startDate = new Date(2026, 4, 19); // May 19, 2026
  const endDate = new Date(2026, 5, 18);   // June 18, 2026
  
  // Generate array of 31 days
  const days = Array.from({ length: 31 }).map((_, i) => addDays(startDate, i));

  // Mock Floors
  const floors = [
    { id: 'floor-1', name: 'King George' },
    { id: 'floor-2', name: 'Union Jack' },
    { id: 'floor-3', name: 'Thames' },
  ];

  // Mock Sections and Staff
  const sections = [
    {
      title: 'RNs Day',
      staff: [
        { id: 'staff-1', name: 'Sarah Jenkins', contractedHours: 36 },
        { id: 'staff-2', name: 'Michael O\'Brien', contractedHours: 24 },
      ]
    },
    {
      title: 'Carer Day',
      staff: [
        { id: 'staff-3', name: 'Emma Watson', contractedHours: 36 },
        { id: 'staff-4', name: 'David Smith', contractedHours: 36 },
        { id: 'staff-5', name: 'Chloe Patel', contractedHours: 12 },
      ]
    },
    {
      title: 'RNs Night',
      staff: [
        { id: 'staff-6', name: 'James Morrison', contractedHours: 36 },
      ]
    }
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <PageHeader 
        title="Monthly Rota" 
        description="Plan and publish the schedule for King George Care Home."
        breadcrumbs={[
          { label: 'CareRota' },
          { label: 'Rota' }
        ]}
      />

      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <FloorTabs 
          floors={floors} 
          activeFloorId={activeFloorId} 
          onTabChange={setActiveFloorId} 
        />
        
        <PayPeriodNav 
          startDate={startDate} 
          endDate={endDate} 
          onPrevious={() => {}} 
          onNext={() => {}} 
        />
      </div>

      <RotaToolbar 
        isDraft={isDraft} 
        onPublish={() => setIsDraft(false)} 
        onExport={() => console.log('Export requested')} 
      />

      {/* The Core Builder Grid */}
      <MonthlyRotaGrid 
        days={days} 
        sections={sections} 
      />

      <RotaLegend />
    </div>
  );
}
