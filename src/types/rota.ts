export interface RotaEntry {
  id: number;
  homeId: number;
  staffId: number;
  shiftCodeId: number;
  rotaDate: string;
  isPublished: boolean;
}

export interface ShiftCode {
  id: number;
  homeId: number;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  colorHex: string;
}
