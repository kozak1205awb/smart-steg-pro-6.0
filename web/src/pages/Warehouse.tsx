import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { SlotDoc } from "../types";
import { useAppUser } from "../appUser";

type SlotKey = string; // "R1-F1"

const ROWS = 38;
const FLOORS = 5;
const TOTAL_PLACES = ROWS * FLOORS;

function keyOf(row: number, floor: number): SlotKey {
  return `R${row}-F${floor}`;
}
function parseKey(k: SlotKey): { row: number; floor: number } {
  const m = /^R(\d+)-F(\d+)$/.exec(k);
  if (!m) return { row: 0, floor: 0 };
  return { row: Number(m[1]), floor: Number(m[2]) };
}

function normalizeSlot(d: any): SlotDoc | null {
  if (!d) return null;
  if (typeof d.row !== "number" || typeof d.floor !== "number") return null;
  return d as SlotDoc;
}

export default function Warehouse() {
  const { appUser } = useAppUser();

  const [slotsMap, setSlotsMap] = useState<Record<SlotKey, SlotDoc>>({});
  const [loading, setLoading] = useState(true);

  // выбранная ячейка для просмотра
  const [selected, setSelected] = useState<SlotKey | null>(null);

  // управление перемещением
  const [fromKey, setFromKey] = useState<SlotKey | null>(null);
  const [toKey, setToKey] = useState<SlotKey | null>(null);

  useEffect(() => {
    const qy = query(collection(db, "slots"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const next: Record<SlotKey, SlotDoc> = {};
        snap.forEach((docSnap) => {
          const d = normalizeSlot(docSnap.data());
          if (!d) return;
          next[keyOf(d.row, d.floor)] = { ...d, id: docSnap.id };
        });
        setSlotsMap(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const selectedDoc = useMemo(() => {
    if (!selected) return null;
    return slotsMap[selected] ?? null;
  }, [selected, slotsMap]);

  const stats = useMemo(() => {
    let occupied = 0;
    let totalQty = 0;
    const uniqueSteg = new Set<string>();

    for (let r = 1; r <= ROWS; r++) {
      for (let f = 1; f <= FLOORS; f++) {
        const k = keyOf(r, f);
        const s = slotsMap[k];
        if (s && s.status === "OCCUPIED") {
          occupied++;
          if (typeof s.qty === "number") totalQty += s.qty;
          if (s.steg) uniqueSteg.add(s.steg);
        }
      }
    }

    const free = TOTAL_PLACES - occupied;
    const pct = TOTAL_PLACES ? Math.round((occupied / TOTAL_PLACES) * 1000) / 10 : 0;
    return { occupied, free, pct, totalQty, uniqueSteg: uniqueSteg.size };
  }, [slotsMap]);

  const occupancyWidth = `${Math.min(100, Math.max(0, stats.pct))}%`;

  // клик по ячейке:
  // - если активен режим move: сначала from, потом to
  // - иначе просто selected
  const onCellClick = (k: SlotKey) => {
    setSelected(k);

    // если еще не выбрали from — ставим from
    if (!fromKey) {
      setFromKey(k);
      return;
    }
    // если from уже есть и to нет — ставим to (если не совпадает)
    if (fromKey && !toKey) {
      if (k === fromKey) return;
      setToKey(k);
      return;
    }
    // если уже есть и from и to — начинаем заново (удобно)
    setFromKey(k);
    setToKey(null);
  };

  // правила очистки ячейки + правило "пустого этажа"
  async function clearSlotWithGravity(targetKey: SlotKey, reason: "CLEAR" | "PRODUCTION") {
    const { row, floor } = parseKey(targetKey);
    if (!row || !floor) return;

    const actorUid = appUser?.uid ?? "system";

    await runTransaction(db, async (tx) => {
      // 1) чистим выбранную
      const baseRef = doc(db, "slots", targetKey);
      tx.set(
        baseRef,
        {
          id: targetKey,
          row,
          floor,
          status: "EMPTY",
          gestellNo: null,
          steg: null,
          lengthMm: null,
          qty: null,
          labelDate: null,
          labelManufacturer: null,
          labelPhotoUrl: null,
          labelRawText: null,
          labelQr: null,
          updatedAt: Date.now(),
          updatedBy: actorUid,
          lastAction: reason,
          lastActionAt: Date.now(),
        },
        { merge: true }
      );

      // 2) если освободили F1, то этажи выше в этом ряду => EMPTY
      if (floor === 1) {
        for (let f = 2; f <= FLOORS; f++) {
          const k = keyOf(row, f);
          const ref = doc(db, "slots", k);
          tx.set(
            ref,
            {
              id: k,
              row,
              floor: f,
              status: "EMPTY",
              gestellNo: null,
              steg: null,
              lengthMm: null,
              qty: null,
              labelDate: null,
              labelManufacturer: null,
              labelPhotoUrl: null,
              labelRawText: null,
              labelQr: null,
              updatedAt: Date.now(),
              updatedBy: actorUid,
              lastAction: "GRAVITY_EMPTY",
              lastActionAt: Date.now(),
            },
            { merge: true }
          );
        }
      }
    });
  }

  async function moveFromTo() {
    if (!fromKey || !toKey) return;

    const from = slotsMap[fromKey];
    const to = slotsMap[toKey];

    if (!from || from.status !== "OCCUPIED") {
      alert("FROM должен быть OCCUPIED (занято).");
      return;
    }
    if (to && to.status === "OCCUPIED") {
      alert("TO уже занято. Выбери пустую ячейку.");
      return;
    }

    const { row: fr, floor: ff } = parseKey(fromKey);
    const { row: tr, floor: tf } = parseKey(toKey);
    const actorUid = appUser?.uid ?? "system";

    await runTransaction(db, async (tx) => {
      // записываем TO (копия данных)
      tx.set(
        doc(db, "slots", toKey),
        {
          id: toKey,
          row: tr,
          floor: tf,
          status: "OCCUPIED",
          gestellNo: from.gestellNo ?? null,
          steg: from.steg ?? null,
          lengthMm: from.lengthMm ?? null,
          qty: from.qty ?? null,
          labelDate: from.labelDate ?? null,
          labelManufacturer: from.labelManufacturer ?? null,
          labelPhotoUrl: from.labelPhotoUrl ?? null,
          labelRawText: from.labelRawText ?? null,
          labelQr: from.labelQr ?? null,
          updatedAt: Date.now(),
          updatedBy: actorUid,
          lastAction: "MOVE_IN",
          lastActionAt: Date.now(),
        },
        { merge: true }
      );

      // чистим FROM
      tx.set(
        doc(db, "slots", fromKey),
        {
          id: fromKey,
          row: fr,
          floor: ff,
          status: "EMPTY",
          gestellNo: null,
          steg: null,
          lengthMm: null,
          qty: null,
          labelDate: null,
          labelManufacturer: null,
          labelPhotoUrl: null,
          labelRawText: null,
          labelQr: null,
          updatedAt: Date.now(),
          updatedBy: actorUid,
          lastAction: "MOVE_OUT",
          lastActionAt: Date.now(),
        },
        { merge: true }
      );

      // если перемещением освободили F1 — гравитация (этажи выше => EMPTY)
      if (ff === 1) {
        for (let f = 2; f <= FLOORS; f++) {
          const k = keyOf(fr, f);
          tx.set(
            doc(db, "slots", k),
            {
              id: k,
              row: fr,
              floor: f,
              status: "EMPTY",
              gestellNo: null,
              steg: null,
              lengthMm: null,
              qty: null,
              labelDate: null,
              labelManufacturer: null,
              labelPhotoUrl: null,
              labelRawText: null,
              labelQr: null,
              updatedAt: Date.now(),
              updatedBy: actorUid,
              lastAction: "GRAVITY_EMPTY",
              lastActionAt: Date.now(),
            },
            { merge: true }
          );
        }
      }
    });

    // сброс выбора
    setFromKey(null);
    setToKey(null);
  }

  if (loading) return <div className="panel">Loading…</div>;

  return (
    <div className="page">
      <div className="page-main">
        {/* KPI cards */}
        <div className="cards">
          <div className="card">
            <div className="card-title">TOTAL PLACES</div>
            <div className="card-value">{TOTAL_PLACES}</div>
            <div className="card-sub">Rows {ROWS} × Floors {FLOORS}</div>
          </div>

          <div className="card">
            <div className="card-title">OCCUPIED</div>
            <div className="card-value">
              {stats.occupied}
              <span style={{ fontSize: 14, color: "rgba(233,237,247,.55)" }}>
                /{TOTAL_PLACES} ({stats.pct}%)
              </span>
            </div>
            <div className="progress">
              <div style={{ width: occupancyWidth }} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">FREE</div>
            <div className="card-value">{stats.free}</div>
            <div className="card-sub">Available places</div>
          </div>

          <div className="card">
            <div className="card-title">TOTAL QTY</div>
            <div className="card-value">{stats.totalQty}</div>
            <div className="card-sub">Sum of qty in occupied slots</div>
          </div>

          <div className="card">
            <div className="card-title">UNIQUE STEG</div>
            <div className="card-value">{stats.uniqueSteg}</div>
            <div className="card-sub">Different steg codes</div>
          </div>
        </div>

        {/* panel with grid */}
        <div className="panel">
          <div className="grid-header">
            <div className="grid-title">▦ CURRENT OCCUPANCY</div>

            <div className="legend">
              <span className="dot occupied" /> occupied
              <span className="dot empty" /> empty
              <span style={{ marginLeft: 10, color: "rgba(233,237,247,.55)" }}>
                Rows: 1 → {ROWS}
              </span>
            </div>
          </div>

          <div className="grid-wrap">
            <div className="wh-grid">
              {/* header */}
              <div />
              {Array.from({ length: ROWS }).map((_, idx) => {
                const row = idx + 1;
                return (
                  <div key={`h-${row}`} className="wh-col-label">
                    R{row}
                  </div>
                );
              })}

              {/* floors */}
              {Array.from({ length: FLOORS }).map((_, fIdx) => {
                const floor = FLOORS - fIdx; // F5..F1
                return (
                  <React.Fragment key={`floor-${floor}`}>
                    <div className="wh-row-label">F{floor}</div>

                    {Array.from({ length: ROWS }).map((__, rIdx) => {
                      const row = rIdx + 1;
                      const k = keyOf(row, floor);
                      const s = slotsMap[k];
                      const occ = !!s && s.status === "OCCUPIED";
                      const isSel = selected === k;
                      const isFrom = fromKey === k;
                      const isTo = toKey === k;

                      return (
                        <button
                          key={k}
                          className={[
                            "cell",
                            occ ? "occupied" : "",
                            isSel ? "selected" : "",
                            isTo ? "target" : "",
                          ].join(" ")}
                          onClick={() => onCellClick(k)}
                          title={`${k} · ${occ ? "OCCUPIED" : "EMPTY"}${isFrom ? " (FROM)" : ""}${isTo ? " (TO)" : ""}`}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 10 }} className="small">
            Клик 1 = FROM, клик 2 = TO (для перемещения). Для просмотра деталей тоже можно кликать — они справа.
          </div>
        </div>
      </div>

      {/* details + actions */}
      <div className="page-side">
        <div className="panel details">
          <h3 style={{ marginTop: 0 }}>Cell details</h3>

          {!selected ? (
            <div style={{ color: "rgba(233,237,247,.7)" }}>Выбери ячейку в сетке.</div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div className="pill" style={{ maxWidth: "unset" }}>
                  {selected}
                </div>

                <button className="btn" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className={`badge ${selectedDoc?.status === "OCCUPIED" ? "occupied" : "empty"}`}>
                  Status: {selectedDoc?.status === "OCCUPIED" ? "OCCUPIED" : "EMPTY"}
                </span>
              </div>

              <div style={{ height: 12 }} />

              <div className="kv">
                <div>Steg</div>
                <div>{selectedDoc?.steg ?? "—"}</div>

                <div>Qty</div>
                <div>{typeof selectedDoc?.qty === "number" ? selectedDoc?.qty : "—"}</div>

                <div>Length</div>
                <div>{typeof selectedDoc?.lengthMm === "number" ? `${selectedDoc?.lengthMm} mm` : "—"}</div>

                <div>Gestell</div>
                <div>{selectedDoc?.gestellNo ?? "—"}</div>

                <div>Label date</div>
                <div>{selectedDoc?.labelDate ?? "—"}</div>

                <div>Manufacturer</div>
                <div>{selectedDoc?.labelManufacturer ?? "—"}</div>

                <div>Updated</div>
                <div>{selectedDoc?.updatedAt ? new Date(selectedDoc.updatedAt).toLocaleString() : "—"}</div>
              </div>

              <div className="actionbox">
                <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>Actions (управление)</div>

                <div className="actionrow">
                  <span className="badge empty">FROM: {fromKey ?? "—"}</span>
                  <span className="badge empty">TO: {toKey ?? "—"}</span>
                </div>

                <div className="actionrow">
                  <button className="btn btn-ok" onClick={moveFromTo} disabled={!fromKey || !toKey}>
                    Move
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() => selected && clearSlotWithGravity(selected, "CLEAR")}
                    disabled={!selected}
                  >
                    Clear
                  </button>

                  <button
                    className="btn btn-accent"
                    onClick={() => selected && clearSlotWithGravity(selected, "PRODUCTION")}
                    disabled={!selected}
                    title="€ = отправлено в производство (ячейка становится пустой)"
                  >
                    € Production
                  </button>

                  <button
                    className="btn"
                    onClick={() => {
                      setFromKey(null);
                      setToKey(null);
                    }}
                  >
                    Reset pick
                  </button>
                </div>

                <div className="small">
                  Правило: если очистили F1 (Clear или €) — F2..F5 в этом ряду автоматически становятся EMPTY.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}