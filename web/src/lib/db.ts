// web/src/lib/db.ts
import { collection, doc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Мы сохраняем API как у тебя в коде:
 * col.movements(), col.slots(), col.profiles(), col.stegCatalog(), col.bufferRows()
 * ref.slot(id), ref.profile(id), ref.steg(id), ref.belt(placeId), ref.bufferRow(rowId)
 */

export const col = {
  users: () => collection(db, "users"),
  profiles: () => collection(db, "profiles"),
  stegCatalog: () => collection(db, "stegCatalog"),
  slots: () => collection(db, "slots"),
  movements: () => collection(db, "movements"),
  bufferRows: () => collection(db, "bufferRows"),
  belt: () => collection(db, "belt"),
};

export const ref = {
  user: (uid: string) => doc(db, "users", uid),
  profile: (id: string) => doc(db, "profiles", id),
  steg: (id: string) => doc(db, "stegCatalog", id),
  slot: (id: string) => doc(db, "slots", id),
  movement: (id: string) => doc(db, "movements", id),
  bufferRow: (rowId: string) => doc(db, "bufferRows", rowId),
  belt: (placeId: "B1" | "B2") => doc(db, "belt", placeId),
};