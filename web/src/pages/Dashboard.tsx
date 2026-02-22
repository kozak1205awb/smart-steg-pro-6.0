import { useTranslation } from "react-i18next";
import { useAppUser } from "../appUser";
import { maxRole, ROLE_LABEL } from "../lib/roles";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { appUser } = useAppUser();

  const role = appUser ? maxRole(appUser.roles) : null;
  const roleText =
    role ? ROLE_LABEL[role]?.[i18n.language === "de" ? "de" : "ru"] ?? role : "";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>{t("dashboard")}</h2>

      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <div><b>User:</b> {appUser?.email ?? appUser?.uid ?? ""}</div>
        <div><b>Role:</b> {roleText}</div>

        <div style={{ marginTop: 8, opacity: 0.8 }}>
          Здесь будет сводка: заполненность склада, буфер, лента, риски по Steg, план на сегодня.
        </div>
      </div>
    </div>
  );
}