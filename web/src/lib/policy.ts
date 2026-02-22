// web/src/lib/policy.ts
import { UserRole } from "../types";
import { hasAtLeast } from "./roles";

// централизованная политика UI (одно место)
export type AppSection =
  | "dashboard"
  | "warehouse"
  | "profiles"
  | "steg"
  | "ai"
  | "reports"
  | "admin";

export const SECTION_MIN_ROLE: Record<AppSection, UserRole> = {
  dashboard: "viewer",
  warehouse: "worker",
  profiles: "planner",
  steg: "planner",
  ai: "planner",
  reports: "manager",
  admin: "admin",
};

export function canAccessSection(roles: UserRole[] | null | undefined, section: AppSection) {
  return hasAtLeast(roles, SECTION_MIN_ROLE[section]);
}