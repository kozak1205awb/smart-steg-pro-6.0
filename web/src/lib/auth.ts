// web/src/lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { AppUser, UserRole } from "../types";

// ✅ единое имя для Login.tsx
export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// (оставим алиас на старое имя, если где-то уже использовал)
export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function register(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // новый пользователь по умолчанию viewer
  await ensureUserDoc(cred.user, "viewer");
  return cred;
}

export async function logout() {
  await signOut(auth);
}

export function subscribeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

/**
 * Создаёт /users/{uid} если его нет.
 * Важно: roles массив, как у тебя в rules и типах.
 */
export async function ensureUserDoc(user: User, defaultRole: UserRole) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const now = Date.now();

  if (!snap.exists()) {
    const payload: AppUser = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      roles: [defaultRole],
      userDoc: {},
    };
    await setDoc(ref, { ...payload, createdAt: now, updatedAt: now } as any);
  } else {
    // не трогаем roles здесь
    await updateDoc(ref, {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      updatedAt: now,
      _lastLoginAt: serverTimestamp(),
    } as any);
  }
}