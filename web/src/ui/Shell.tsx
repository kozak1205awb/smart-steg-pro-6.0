import React, { ReactNode, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppUser } from "../appUser";
import { logout } from "../lib/auth";
import { hasAtLeast, maxRole, ROLE_LABEL } from "../lib/roles";

function NavLink({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  const loc = useLocation();
  const active = loc.pathname === to || loc.pathname.startsWith(to + "/");
  return (
    <Link to={to} className={active ? "active" : ""}>
      {label}
    </Link>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { appUser } = useAppUser();

  const langKey = i18n.language === "de" ? "de" : "ru";

  const roleText = useMemo(() => {
    if (!appUser) return "";
    const r = maxRole(appUser.roles);
    return ROLE_LABEL[r]?.[langKey] ?? r;
  }, [appUser, langKey]);

  const canWorker = !!appUser && hasAtLeast(appUser.roles, "worker");
  const canPlanner = !!appUser && hasAtLeast(appUser.roles, "planner");
  const canManager = !!appUser && hasAtLeast(appUser.roles, "manager");
  const canAdmin = !!appUser && hasAtLeast(appUser.roles, "admin");

  return (
    <div className="app-wrap">
      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <div className="brand-badge">▦</div>
            <span>
              SMART-STEG-<strong>PRO</strong>
            </span>
          </div>

          <div className="nav">
            <NavLink to="/" label={t("dashboard") ?? "dashboard"} />
            {canWorker && <NavLink to="/warehouse" label={t("warehouse") ?? "warehouse"} />}
            {canPlanner && <NavLink to="/profiles" label={t("profiles") ?? "profiles"} />}
            {canPlanner && <NavLink to="/steg" label={t("stegCatalog") ?? "stegCatalog"} />}
            {canManager && <NavLink to="/reports" label={t("reports") ?? "reports"} />}
            {canPlanner && <NavLink to="/ai" label={t("aiCenter") ?? "aiCenter"} />}
            {canAdmin && <NavLink to="/admin" label={t("admin") ?? "admin"} />}
          </div>

          <div className="right-actions">
            <select
              className="select"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="ru">RU</option>
              <option value="de">DE</option>
            </select>

            <div className="pill" title={appUser?.email ?? ""}>
              {appUser ? `${appUser.displayName ?? appUser.email ?? appUser.uid} · ${roleText}` : ""}
            </div>

            <button className="btn btn-accent" onClick={() => logout()}>
              {t("signOut") ?? "signOut"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}