import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserRole } from "../types";
import { useAppUser } from "../appUser";

const LEVEL: Record<UserRole, number> = {
  viewer: 0,
  worker: 1,
  planner: 2,
  manager: 3,
  admin: 4,
};

function hasAtLeast(userRoles: UserRole[] | undefined, need: UserRole) {
  const roles = userRoles ?? [];
  const max = roles.reduce((acc, r) => Math.max(acc, LEVEL[r] ?? 0), 0);
  return max >= (LEVEL[need] ?? 0);
}

export default function RequireRole(props: { role: UserRole; children: ReactNode }) {
  const { appUser, loading } = useAppUser();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  if (!appUser) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  if (!hasAtLeast(appUser.roles, props.role)) {
    return (
      <div style={{ padding: 16 }}>
        <b>Нет доступа</b>
        <div style={{ opacity: 0.8, marginTop: 8 }}>
          Нужно: <b>{props.role}</b>, у тебя: <b>{(appUser.roles ?? []).join(", ") || "—"}</b>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}