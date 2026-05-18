import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { 
  homes, 
  homeFloors, 
  users, 
  staff, 
  shiftCodes, 
  rotaEntries, 
  leaveRequests, 
  auditLog 
} from "../db/schema";

export type Home = InferSelectModel<typeof homes>;
export type NewHome = InferInsertModel<typeof homes>;

export type Floor = InferSelectModel<typeof homeFloors>;
export type NewFloor = InferInsertModel<typeof homeFloors>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Staff = InferSelectModel<typeof staff>;
export type NewStaff = InferInsertModel<typeof staff>;

export type ShiftCode = InferSelectModel<typeof shiftCodes>;
export type NewShiftCode = InferInsertModel<typeof shiftCodes>;

export type RotaEntry = InferSelectModel<typeof rotaEntries>;
export type NewRotaEntry = InferInsertModel<typeof rotaEntries>;

export type LeaveRequest = InferSelectModel<typeof leaveRequests>;
export type NewLeaveRequest = InferInsertModel<typeof leaveRequests>;

export type AuditLog = InferSelectModel<typeof auditLog>;
export type NewAuditLog = InferInsertModel<typeof auditLog>;
