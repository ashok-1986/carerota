"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { StaffForm } from './StaffForm';

interface EditStaffSheetProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  member: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  floors: any[];
}

export function EditStaffSheet({ member, floors }: EditStaffSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" className="gap-2 h-10 px-4 rounded-xl border-slate/20 text-midnight hover:bg-slate/5" />
        }
      >
        <Pencil className="size-4" />
        Edit Staff
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display">Edit Staff Profile</SheetTitle>
        </SheetHeader>
        <StaffForm 
          initialData={member} 
          floors={floors} 
          onSuccess={() => setOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
}
