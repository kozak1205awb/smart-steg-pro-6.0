// web/src/db.ts
import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Firestore,
} from "firebase/firestore";

import { db as firestoreDb } from "./lib/firebase";

// ✅ единая точка доступа к Firestore
export const db: Firestore = firestoreDb;

// ✅ короткие хелперы как ты и используешь в коде
export function col<T = any>(path: string): CollectionReference<T> {
  return collection(db, path) as CollectionReference<T>;
}

export function ref<T = any>(path: string): DocumentReference<T> {
  // path: "users/uid" или "movements/abc"
  return doc(db, path) as DocumentReference<T>;
}