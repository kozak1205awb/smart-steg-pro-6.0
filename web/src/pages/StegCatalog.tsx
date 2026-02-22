import { useEffect, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import * as XLSX from "xlsx";
import { col, ref } from "../lib/db";
import { setDoc } from "firebase/firestore";
import { StegCatalogItem } from "../types";
import { notify } from "../ui/Toast";
import { useTranslation } from "react-i18next";
import { useAppUser } from "../appUser";
import { maxRole, ROLE_LABEL } from "../lib/roles";

export default function StegCatalog() {
  const { t, i18n } = useTranslation();
  const { appUser } = useAppUser();
  const [items, setItems] = useState<StegCatalogItem[]>([]);
  const [id, setId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(col.stegCatalog(), (snap) => {
      const out: StegCatalogItem[] = [];
      snap.forEach((d) => out.push(d.data() as StegCatalogItem));
      out.sort((a, b) => a.id.localeCompare(b.id));
      setItems(out);
    });
    return () => unsub();
  }, []);

  async function upsert(item: StegCatalogItem) {
    await setDoc(ref.steg(item.id), item, { merge: true });
    notify.ok("Saved");
  }

  const role = appUser ? maxRole(appUser.roles) : null;
  const roleText = role ? (ROLE_LABEL[role]?.[i18n.language === "de" ? "de" : "ru"] ?? role) : "";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>{t("stegCatalog")}</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          placeholder="PA1"
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd", minWidth: 240 }}
        />
        <button
          onClick={async () => {
            if (!id.trim()) return;
            await upsert({
              id: id.trim(),
              name: name.trim() || id.trim(),
              updatedAt: Date.now(),
            });
            setId("");
            setName("");
          }}
        >
          {t("save")}
        </button>

        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const data = await file.arrayBuffer();
              const wb = XLSX.read(data);
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

              let cnt = 0;
              for (const r of rows) {
                const rid = String(r.id ?? r.ID ?? r.steg ?? "").trim();
                if (!rid) continue;
                const rname = String(r.name ?? r.Name ?? rid).trim();
                await upsert({ id: rid, name: rname, updatedAt: Date.now() });
                cnt++;
              }
              notify.ok(`${t("importXlsx")}: ${cnt}`);
            }}
          />
          {t("importXlsx")}
        </label>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <div style={{ opacity: 0.7, marginBottom: 8 }}>
          Роль: {roleText}. Каталог нужен для норм/планирования/прогноза.
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Name</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{x.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{x.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {new Date(x.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}