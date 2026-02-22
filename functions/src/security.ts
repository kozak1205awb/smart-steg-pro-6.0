import * as admin from "firebase-admin";
import { UserRole } from "./types";

export function requireAuth(context: any) {
  if (!context.auth?.uid) throw new Error("UNAUTHENTICATED");
  return context.auth.uid as string;
}

export async function getRole(uid: string): Promise<UserRole> {
  const snap = await admin.firestore().doc(`users/${uid}`).get();
  const data = snap.data();
  if (!data || data.active !== true) return "viewer";
  return (data.role as UserRole) ?? "viewer";
}

export function roleAtLeast(role: UserRole, needed: UserRole): boolean {
  const order: Record<UserRole, number> = {
    viewer: 0,
    worker: 1,
    planner: 2,
    manager: 3,
    admin: 4
  };
  return order[role] >= order[needed];
}