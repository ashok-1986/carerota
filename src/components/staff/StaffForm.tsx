"use client";

import { useState } from 'react';
import { updateStaff } from '@/app/(app)/staff/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StaffFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  floors?: any[];
  onSuccess?: () => void;
}

export function StaffForm({ initialData, floors = [], onSuccess }: StaffFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    role: initialData?.role || 'caregiver',
    employmentType: initialData?.employmentType || 'full_time',
    contractedHours: initialData?.contractedHours || '',
    payRateHourly: initialData?.payRateHourly ? (initialData.payRateHourly / 100).toFixed(2) : '',
    homeFloorId: initialData?.homeFloorId || '',
    isActive: initialData?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData?.id) return;

    setIsLoading(true);
    try {
      await updateStaff(initialData.id, {
        ...formData,
        contractedHours: formData.contractedHours ? parseFloat(formData.contractedHours) : null,
        payRateHourly: formData.payRateHourly ? parseFloat(formData.payRateHourly) : null,
      });
      toast.success('Staff profile updated');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update staff');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select 
          value={formData.role} 
          onValueChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="caregiver">Caregiver</SelectItem>
            <SelectItem value="senior_caregiver">Senior Caregiver</SelectItem>
            <SelectItem value="registered_nurse">Registered Nurse</SelectItem>
            <SelectItem value="home_manager">Home Manager</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employmentType">Employment Type</Label>
        <Select 
          value={formData.employmentType} 
          onValueChange={(val) => setFormData(prev => ({ ...prev, employmentType: val }))}
        >
          <SelectTrigger id="employmentType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full_time">Full-time</SelectItem>
            <SelectItem value="part_time">Part-time</SelectItem>
            <SelectItem value="bank">Bank</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractedHours">Contracted Hrs/Wk</Label>
          <Input 
            id="contractedHours" 
            type="number" 
            step="0.5"
            value={formData.contractedHours}
            onChange={(e) => setFormData(prev => ({ ...prev, contractedHours: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payRateHourly">Hourly Rate (£)</Label>
          <Input 
            id="payRateHourly" 
            type="number" 
            step="0.01"
            value={formData.payRateHourly}
            onChange={(e) => setFormData(prev => ({ ...prev, payRateHourly: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="homeFloorId">Assigned Floor</Label>
        <Select 
          value={formData.homeFloorId} 
          onValueChange={(val) => setFormData(prev => ({ ...prev, homeFloorId: val === 'none' ? '' : val }))}
        >
          <SelectTrigger id="homeFloorId">
            <SelectValue placeholder="Select floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No specific floor</SelectItem>
            {floors.map(floor => (
              <SelectItem key={floor.id} value={floor.id}>{floor.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 pt-2 pb-4">
        <input 
          type="checkbox" 
          id="isActive" 
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4 rounded border-slate/30 text-teal focus:ring-teal/20"
        />
        <Label htmlFor="isActive" className="cursor-pointer font-medium">Active Account</Label>
      </div>

      <div className="pt-4 border-t border-slate/10">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
