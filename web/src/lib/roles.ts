// web/src/lib/roles.ts
import { UserRole } from "../types";

export const ROLE_ORDER: Record<UserRole, number> = {
  viewer: 0,
  worker: 1,
  planner: 2,
  manager: 3,
  admin: 4,
};

export const ROLE_LABEL: Record<UserRole, { ru: string; de: string }> = {
  admin: { ru: "Админ", de: "Admin" },
  manager: { ru: "Управляющий", de: "Leitung" },
  planner: { ru: "Планировщик", de: "Planung" },
  worker: { ru: "Работник", de: "Worker" },
  viewer: { ru: "Просмотр", de: "Viewer" },
};

export function maxRole(roles?: UserRole[] | null): UserRole {
  const arr = Array.isArray(roles) ? roles : [];
  let best: UserRole = "viewer";
  for (const r of arr) {
    if (ROLE_ORDER[r] > ROLE_ORDER[best]) best = r;
  }
  return best;
}

export function atLeast(role: UserRole, needed: UserRole) {
  return ROLE_ORDER[role] >= ROLE_ORDER[needed];
}

export function hasAtLeast(roles: UserRole[] | null | undefined, needed: UserRole) {
  return atLeast(maxRole(roles), needed);
}

export function hasAny(roles: UserRole[] | null | undefined, needed: UserRole[]) {
  const set = new Set(Array.isArray(roles) ? roles : []);
  return needed.some((r) => set.has(r));
}