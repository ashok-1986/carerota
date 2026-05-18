import { useState, useCallback } from 'react';

type DragState = {
  isDragging: boolean;
  startStaffId: string | null;
  startShiftDate: string | null;
  paintedCells: Set<string>; // Set of "staffId|shiftDate"
};

export function useRotaDrag(onSelectionComplete: (cells: Array<{ staffId: string, shiftDate: string }>) => void) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startStaffId: null,
    startShiftDate: null,
    paintedCells: new Set(),
  });

  const startDrag = useCallback((staffId: string, shiftDate: string) => {
    setDragState({
      isDragging: true,
      startStaffId: staffId,
      startShiftDate: shiftDate,
      paintedCells: new Set([`${staffId}|${shiftDate}`]),
    });
  }, []);

  const onDragOver = useCallback((staffId: string, shiftDate: string) => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;
      
      const newSet = new Set(prev.paintedCells);
      newSet.add(`${staffId}|${shiftDate}`);
      
      return {
        ...prev,
        paintedCells: newSet,
      };
    });
  }, []);

  const endDrag = useCallback(() => {
    setDragState((prev) => {
      if (!prev.isDragging) return prev;

      const cells = Array.from(prev.paintedCells).map(cellKey => {
        const [staffId, shiftDate] = cellKey.split('|');
        return { staffId, shiftDate };
      });

      onSelectionComplete(cells);

      return {
        isDragging: false,
        startStaffId: null,
        startShiftDate: null,
        paintedCells: new Set(),
      };
    });
  }, [onSelectionComplete]);

  return {
    dragState,
    startDrag,
    onDragOver,
    endDrag,
  };
}
