import { useEffect, useState } from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { col, ref } from "../lib/db";
import { ProfileDoc } from "../types";
import { notify } from "../ui/Toast";
import { useTranslation } from "react-i18next";

export default function Profiles() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<ProfileDoc[]>([]);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [usage, setUsage] = useState("PA1:1,PA2:1");

  useEffect(() => {
    const unsub = onSnapshot(col.profiles(), (snap) => {
      const out: ProfileDoc[] = [];
      snap.forEach((d) => out.push(d.data() as ProfileDoc));
      out.sort((a, b) => a.id.localeCompare(b.id));
      setProfiles(out);
    });
    return () => unsub();
  }, []);

  function parseUsage(s: string): Array<{ steg: string; normQty: number }> {
    return s
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [steg, qty] = p.split(":").map((x) => x.trim());
        return { steg, normQty: Number(qty ?? 0) };
      })
      .filter((x) => x.steg && Number.isFinite(x.normQty));
  }

  async function upsert(p: ProfileDoc) {
    await setDoc(ref.profile(p.id), p, { merge: true });
    notify.ok("Saved");
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>{t("profiles")}</h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="6010-001" value={id} onChange={(e) => setId(e.target.value)} style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd" }} />
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd", minWidth: 240 }} />
        <input placeholder="PA1:1,PA2:1,PA5:2" value={usage} onChange={(e) => setUsage(e.target.value)} style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd", minWidth: 260 }} />

        <button
          onClick={async () => {
            if (!id.trim()) return;
            await upsert({
              id: id.trim(),
              name: name.trim() || id.trim(),
              stegUsage: parseUsage(usage),
              updatedAt: Date.now()
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

              // ожидаем колонки: id, name, usage (например "PA1:1,PA2:1")
              let cnt = 0;
              for (const r of rows) {
                const rid = String(r.id ?? r.ID ?? r.profile ?? "").trim();
                if (!rid) continue;
                const rname = String(r.name ?? r.Name ?? rid).trim();
                const rusage = String(r.usage ?? r.stegUsage ?? "").trim();
                await upsert({
                  id: rid,
                  name: rname || rid,
                  stegUsage: parseUsage(rusage || "PA1:1"),
                  updatedAt: Date.now()
                });
                cnt++;
              }

              notify.ok(`${t("importXlsx")}: ${cnt}`);
            }}
          />
          {t("importXlsx")}
        </label>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>ID</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Name</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Steg</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.id}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{p.name}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                  {p.stegUsage.map((x) => `${x.steg}:${x.normQty}`).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}