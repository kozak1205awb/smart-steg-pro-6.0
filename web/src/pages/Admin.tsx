import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { AppUser, BufferRowDoc, SystemRulesDoc, UserRole } from "../types";
import { notify } from "../ui/Toast";
import { useAppUser } from "../appUser";
import { setBufferRow } from "../lib/warehouse";
import { useTranslation } from "react-i18next";

function firstRole(u: AppUser): UserRole {
  const r = u.roles?.[0];
  return (r ?? "viewer") as UserRole;
}

export default function Admin() {
  const { t } = useTranslation();
  const { appUser } = useAppUser();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [rules, setRules] = useState<SystemRulesDoc | null>(null);

  const [newUid, setNewUid] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("viewer");

  const [row, setRow] = useState(1);
  const [bufferEnabled, setBufferEnabled] = useState(true);

  // USERS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const out: AppUser[] = [];
      snap.forEach((d) => out.push(d.data() as AppUser));
      out.sort((a, b) => (a.email ?? a.uid).localeCompare(b.email ?? b.uid));
      setUsers(out);
    });
    return () => unsub();
  }, []);

  // RULES
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rules", "system"), (snap) => {
      setRules(snap.exists() ? (snap.data() as SystemRulesDoc) : null);
    });
    return () => unsub();
  }, []);

  const canEdit = useMemo(() => {
    const roles = appUser?.roles ?? [];
    return roles.includes("admin");
  }, [appUser?.roles]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>{t("admin")}</h2>

      {!canEdit && (
        <div style={{ border: "1px solid #ffd6d6", background: "#fff5f5", borderRadius: 14, padding: 12 }}>
          <b>Нет доступа</b>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Эта страница доступна только роли <b>admin</b>.
          </div>
        </div>
      )}

      {/* USERS */}
      <section style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Users</h3>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            placeholder="uid (Firebase Auth)"
            value={newUid}
            onChange={(e) => setNewUid(e.target.value)}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd", minWidth: 280 }}
          />

          <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} style={{ padding: 8, borderRadius: 10 }}>
            <option value="viewer">viewer</option>
            <option value="worker">worker</option>
            <option value="planner">planner</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>

          <button
            disabled={!canEdit}
            onClick={async () => {
              try {
                if (!newUid.trim()) return;

                await setDoc(
                  doc(db, "users", newUid.trim()),
                  {
                    uid: newUid.trim(),
                    email: null,
                    displayName: null,
                    photoURL: null,
                    roles: [newRole],
                    updatedAt: Date.now(),
                    updatedBy: appUser?.uid ?? "system",
                    createdAt: Date.now(),
                  },
                  { merge: true }
                );

                notify.ok("User updated");
                setNewUid("");
              } catch (e: any) {
                notify.err(String(e?.message ?? e));
              }
            }}
          >
            Set role
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>uid/email</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const current = firstRole(u);

                return (
                  <tr key={u.uid}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{u.email ?? u.uid}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>
                      <select
                        disabled={!canEdit}
                        value={current}
                        onChange={async (e) => {
                          try {
                            await updateDoc(doc(db, "users", u.uid), {
                              roles: [e.target.value],
                              updatedAt: Date.now(),
                              updatedBy: appUser?.uid ?? "system",
                            } as any);
                            notify.ok("Role saved");
                          } catch (err: any) {
                            notify.err(String(err?.message ?? err));
                          }
                        }}
                      >
                        <option value="viewer">viewer</option>
                        <option value="worker">worker</option>
                        <option value="planner">planner</option>
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* RULES */}
      <section style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>{t("rules")} (Конституция)</h3>

        <div style={{ display: "grid", gap: 8 }}>
          <label>RU</label>
          <textarea
            value={rules?.textRu ?? ""}
            onChange={(e) =>
              setRules((r) =>
                r
                  ? { ...r, textRu: e.target.value }
                  : { id: "system", textRu: e.target.value, textDe: "", updatedAt: Date.now(), updatedBy: appUser?.uid ?? "" }
              )
            }
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", minHeight: 120 }}
          />

          <label>DE</label>
          <textarea
            value={rules?.textDe ?? ""}
            onChange={(e) =>
              setRules((r) =>
                r
                  ? { ...r, textDe: e.target.value }
                  : { id: "system", textRu: "", textDe: e.target.value, updatedAt: Date.now(), updatedBy: appUser?.uid ?? "" }
              )
            }
            style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", minHeight: 120 }}
          />

          <button
            disabled={!canEdit}
            onClick={async () => {
              try {
                if (!appUser) return;

                const payload: SystemRulesDoc = {
                  id: "system",
                  textRu: rules?.textRu ?? "",
                  textDe: rules?.textDe ?? "",
                  updatedAt: Date.now(),
                  updatedBy: appUser.uid,
                };

                await setDoc(doc(db, "rules", "system"), payload, { merge: true });
                notify.ok("Rules saved");
              } catch (e: any) {
                notify.err(String(e?.message ?? e));
              }
            }}
          >
            {t("save")}
          </button>
        </div>
      </section>

      {/* BUFFER */}
      <section style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Buffer rows (планировщик видит отдельно)</h3>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label>Row</label>
          <input
            type="number"
            value={row}
            onChange={(e) => setRow(Number(e.target.value))}
            style={{ padding: 8, borderRadius: 10, border: "1px solid #ddd", width: 90 }}
          />
          <label>Enabled</label>
          <input type="checkbox" checked={bufferEnabled} onChange={(e) => setBufferEnabled(e.target.checked)} />

          <button
            disabled={!canEdit}
            onClick={async () => {
              try {
                if (!appUser) return;
                const ok = confirm(`Set row ${row} buffer=${bufferEnabled}?`);
                if (!ok) return;

                await setBufferRow({ row, enabled: bufferEnabled, actorUid: appUser.uid });
                notify.ok("Buffer row updated");
              } catch (e: any) {
                notify.err(String(e?.message ?? e));
              }
            }}
          >
            Apply
          </button>
        </div>

        <div style={{ marginTop: 8, opacity: 0.75 }}>
          План: первые 4 ряда можно включить в буфер (или любые), и менять по кнопке.
        </div>
      </section>
    </div>
  );
}