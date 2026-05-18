import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ConfirmDialog({ isOpen, onConfirm, onCancel, message }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; message: string }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-slate-700">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-danger text-white rounded">Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
