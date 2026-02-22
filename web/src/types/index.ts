// web/src/types/index.ts

// ===== ROLES =====
export type UserRole = "viewer" | "worker" | "planner" | "manager" | "admin";

// ===== USER =====
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  roles: UserRole[];
  userDoc?: Record<string, any>;
}

// ===== SYSTEM RULES / CONSTITUTION =====
export interface SystemRulesDoc {
  id: "system";
  textRu: string;
  textDe: string;
  updatedAt: number;
  updatedBy: string;
}

// ===== BUFFER ROWS =====
export interface BufferRowDoc {
  rowId: string; // пример: "R1"
  enabled: boolean;
  updatedAt: number;
  updatedBy: string;
}

// ===== AUDIT LOG =====
export type AuditAction = "SET_USER_ROLES" | "SAVE_SYSTEM_RULES" | "SET_BUFFER_ROW";

export interface AuditLogDoc {
  id: string;
  action: AuditAction;
  actorUid: string;
  actorRoles: UserRole[];
  target?: string | null; // uid пользователя или rowId
  before?: any;
  after?: any;
  meta?: any;
  createdAt: number;
}

// ===== SLOT =====
export type SlotStatus = "EMPTY" | "OCCUPIED";

export interface SlotDoc {
  id: string;
  row: number;
  floor: number;
  status: SlotStatus;

  gestellNo?: string | null;
  steg?: string | null;
  lengthMm?: number | null;
  qty?: number | null;

  labelDate?: string | null;
  labelManufacturer?: string | null;
  labelPhotoUrl?: string | null;
  labelRawText?: string | null;
  labelQr?: string | null;

  updatedAt: number;
  updatedBy: string;
}

// ===== MOVEMENTS =====
export type MovementAction = "SET_SLOT" | "CLEAR_SLOT" | "SEND_TO_PRODUCTION" | "SEND_TO_BELT" | "UNDO";

export interface MovementDoc {
  id: string;
  action: MovementAction;
  actorUid: string;
  actorRole: UserRole;

  from: any;
  to: any;

  meta?: any;
  undoOf?: string;

  createdAt: number;
}

// ===== BELT =====
export interface BeltPlaceDoc {
  placeId: "B1" | "B2";
  payload: {
    steg: string;
    qty: number;
    lengthMm?: number | null;
    labelDate?: string | null;
    fromSlot?: string | null;
    updatedAt: number;
    updatedBy: string;
  } | null;
}

// ===== PROFILE =====
export interface ProfileDoc {
  id: string;
  name: string;
  stegUsage: Array<{
    steg: string;
    normQty: number;
  }>;
  updatedAt: number;
}

// ===== STEG =====
export interface StegCatalogItem {
  id: string;
  name: string;
  updatedAt: number;
}