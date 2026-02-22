import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppUser } from "../appUser";

export default function RequireAuth(props: { children: ReactNode }) {
  const { appUser, loading } = useAppUser();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;

  if (!appUser) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  return <>{props.children}</>;
}