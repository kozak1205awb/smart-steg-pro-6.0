export type UserRole = "admin" | "manager" | "planner" | "worker" | "viewer";

export type MovementAction =
  | "MOVE"
  | "SET_SLOT"
  | "CLEAR_SLOT"
  | "SEND_TO_PRODUCTION"
  | "SEND_TO_BUFFER"
  | "SEND_TO_BELT"
  | "RETURN_FROM_PRODUCTION"
  | "UNDO";

export interface AppUserDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MovementDoc {
  action: MovementAction;
  actorUid: string;
  actorRole: UserRole;
  createdAt: number;

  from?: any;
  to?: any;

  undoOf?: string;

  meta?: Record<string, any>;
}