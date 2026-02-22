import {
  addDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { col, ref } from "./db";
import { SlotDoc, MovementDoc, MovementAction, UserRole, BeltPlaceDoc } from "../types";

/**
 * Физические правила склада:
 * - Если этаж 1 стал пуст → этажи выше считаем пустыми (в этом ряду).
 * - "€" / отправка в производство очищает ячейку (и применяем правила).
 * - Любое действие логируем в movements (для отчётов и undo).
 */

export function slotId(row: number, floor: number) {
  return `${row}-${floor}`;
}

export async function setSlot(args: {
  slot: Omit<SlotDoc, "id" | "updatedAt" | "updatedBy">;
  actorUid: string;
  actorRole: UserRole;
}) {
  const id = slotId(args.slot.row, args.slot.floor);
  const now = Date.now();

  const before = await getDoc(ref.slot(id));
  const beforeData = before.exists() ? (before.data() as SlotDoc) : null;

  const payload: SlotDoc = {
    id,
    ...args.slot,
    updatedAt: now,
    updatedBy: args.actorUid
  };

  await setDoc(ref.slot(id), payload, { merge: true });

  await logMovement({
    action: "SET_SLOT",
    actorUid: args.actorUid,
    actorRole: args.actorRole,
    from: beforeData,
    to: payload
  });

  // apply gravity rule if becomes empty at floor 1
  if (payload.floor === 1 && payload.status === "EMPTY") {
    await applyEmptyFirstFloorRule(payload.row, args.actorUid, args.actorRole);
  }
}

export async function clearSlot(args: {
  row: number;
  floor: number;
  actorUid: string;
  actorRole: UserRole;
  reason?: string;
}) {
  const id = slotId(args.row, args.floor);
  const now = Date.now();

  const before = await getDoc(ref.slot(id));
  const beforeData = before.exists() ? (before.data() as SlotDoc) : null;

  const payload: Partial<SlotDoc> = {
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
    updatedAt: now,
    updatedBy: args.actorUid
  };

  await setDoc(ref.slot(id), payload as any, { merge: true });

  await logMovement({
    action: "CLEAR_SLOT",
    actorUid: args.actorUid,
    actorRole: args.actorRole,
    from: beforeData,
    to: { id, row: args.row, floor: args.floor, ...payload },
    meta: { reason: args.reason ?? null }
  });

  if (args.floor === 1) {
    await applyEmptyFirstFloorRule(args.row, args.actorUid, args.actorRole);
  }
}

export async function sendToProduction(args: {
  row: number;
  floor: number;
  actorUid: string;
  actorRole: UserRole;
}) {
  const id = slotId(args.row, args.floor);
  const before = await getDoc(ref.slot(id));
  const beforeData = before.exists() ? (before.data() as SlotDoc) : null;

  await clearSlot({
    row: args.row,
    floor: args.floor,
    actorUid: args.actorUid,
    actorRole: args.actorRole,
    reason: "production"
  });

  await logMovement({
    action: "SEND_TO_PRODUCTION",
    actorUid: args.actorUid,
    actorRole: args.actorRole,
    from: beforeData,
    to: null
  });
}

/**
 * Буфер: логически это не отдельное хранение, а статус "ряд = буфер".
 * Планировщик видит только буферные ряды отдельно.
 */
export async function setBufferRow(args: {
  row: number;
  enabled: boolean;
  actorUid: string;
}) {
  const rowId = `R${args.row}`;
  await setDoc(
    ref.bufferRow(rowId),
    {
      rowId,
      enabled: args.enabled,
      updatedAt: Date.now(),
      updatedBy: args.actorUid
    },
    { merge: true }
  );
}

/**
 * Лента: 2 места B1/B2. TTL 1.5h — если никто не обновляет, считаем устаревшим.
 */
export const BELT_TTL_MS = 90 * 60 * 1000;

export function isBeltPayloadFresh(p: BeltPlaceDoc["payload"]) {
  if (!p) return false;
  return Date.now() - p.updatedAt <= BELT_TTL_MS;
}

export async function sendToBelt(args: {
  placeId: "B1" | "B2";
  payload: NonNullable<BeltPlaceDoc["payload"]>;
  actorUid: string;
  actorRole: UserRole;
}) {
  const before = await getDoc(ref.belt(args.placeId));
  const beforeData = before.exists() ? (before.data() as BeltPlaceDoc) : null;

  const docPayload: BeltPlaceDoc = {
    placeId: args.placeId,
    payload: { ...args.payload, updatedAt: Date.now(), updatedBy: args.actorUid }
  };

  await setDoc(ref.belt(args.placeId), docPayload, { merge: true });

  await logMovement({
    action: "SEND_TO_BELT",
    actorUid: args.actorUid,
    actorRole: args.actorRole,
    from: beforeData,
    to: docPayload
  });
}

/**
 * История/Undo: отменяем последнее действие конкретного пользователя (worker/versorge),
 * если оно было "SET_SLOT/CLEAR_SLOT/MOVE/SEND..." и у него есть from/to.
 */
export async function undoLast(args: { actorUid: string; actorRole: UserRole }) {
  const q = query(
    col.movements(),
    where("actorUid", "==", args.actorUid),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("NO_MOVES");

  const last = snap.docs[0];
  const lastData = last.data() as any;

  const action = lastData.action as MovementAction;
  const from = lastData.from ?? null;
  const to = lastData.to ?? null;

  // простое правило: если действие меняло слот — откатываем слот обратно в from
  if (from?.id && (action === "SET_SLOT" || action === "CLEAR_SLOT" || action === "SEND_TO_PRODUCTION")) {
    await setDoc(ref.slot(from.id), from, { merge: true });

    await logMovement({
      action: "UNDO",
      actorUid: args.actorUid,
      actorRole: args.actorRole,
      from: to,
      to: from,
      undoOf: last.id
    });
    return;
  }

  // belt undo
  if (to?.placeId && action === "SEND_TO_BELT") {
    if (from) {
      await setDoc(ref.belt(to.placeId), from, { merge: true });
    } else {
      await setDoc(ref.belt(to.placeId), { placeId: to.placeId, payload: null }, { merge: true });
    }

    await logMovement({
      action: "UNDO",
      actorUid: args.actorUid,
      actorRole: args.actorRole,
      from: to,
      to: from,
      undoOf: last.id
    });
    return;
  }

  throw new Error("UNDO_NOT_SUPPORTED");
}

/**
 * 🔥 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ:
 * createdAt НЕ должен требоваться снаружи — мы добавляем его внутри.
 */
type MovementInsert = Omit<MovementDoc, "id" | "createdAt"> & { undoOf?: string };

async function logMovement(m: MovementInsert) {
  await addDoc(
    col.movements(),
    {
      ...m,
      createdAt: Date.now(),
      _ts: serverTimestamp()
    } as any
  );
}

async function applyEmptyFirstFloorRule(row: number, actorUid: string, actorRole: UserRole) {
  // если 1 этаж пуст — очищаем 2..5 (чтобы не было "в воздухе")
  for (let floor = 2; floor <= 5; floor++) {
    const id = slotId(row, floor);
    const snap = await getDoc(ref.slot(id));
    const beforeData = snap.exists() ? (snap.data() as SlotDoc) : null;

    await setDoc(
      ref.slot(id),
      {
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
        updatedBy: actorUid
      } as any,
      { merge: true }
    );

    await logMovement({
      action: "CLEAR_SLOT",
      actorUid,
      actorRole,
      from: beforeData,
      to: { id, row, floor, status: "EMPTY" } as any,
      meta: { reason: "empty_first_floor_rule" }
    });
  }
}