// web/src/appUser.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

import { auth, db } from "./lib/firebase";
import type { AppUser, UserRole } from "./types";

type AppUserState = {
  user: AppUser | null;
  appUser: AppUser | null; // алиас для старого кода
  loading: boolean;
};

const AppUserContext = createContext<AppUserState>({
  user: null,
  appUser: null,
  loading: true,
});

export function useAppUser() {
  return useContext(AppUserContext);
}

export function AppUserProvider({ children }: { children: React.ReactNode }) {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [userDoc, setUserDoc] = useState<Record<string, any> | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!fbUser) {
      setUserDoc(null);
      setLoadingDoc(false);
      return;
    }

    setLoadingDoc(true);
    const ref = doc(db, "users", fbUser.uid);

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setUserDoc(snap.exists() ? (snap.data() as any) : null);
        setLoadingDoc(false);
      },
      () => {
        setUserDoc(null);
        setLoadingDoc(false);
      }
    );

    return () => unsub();
  }, [fbUser]);

  const value = useMemo<AppUserState>(() => {
    const loading = loadingAuth || loadingDoc;

    if (!fbUser) return { user: null, appUser: null, loading };

    const rolesRaw = (userDoc?.roles ?? userDoc?.role ?? []) as any;
    const roles: UserRole[] = Array.isArray(rolesRaw)
      ? rolesRaw
      : typeof rolesRaw === "string"
      ? [rolesRaw]
      : [];

    const user: AppUser = {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      photoURL: fbUser.photoURL,
      roles,
      userDoc: userDoc ?? undefined,
    };

    return { user, appUser: user, loading };
  }, [fbUser, userDoc, loadingAuth, loadingDoc]);

  return <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>;
}