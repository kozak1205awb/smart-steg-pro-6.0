import { getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { col } from "./db";

export async function getWorkerStats(uid: string) {
  const q = query(col.movements(), where("actorUid", "==", uid), orderBy("createdAt", "desc"), limit(500));
  const snap = await getDocs(q);

  const byAction: Record<string, number> = {};
  let moved = 0;

  snap.forEach((d) => {
    const a = (d.data() as any).action as string;
    byAction[a] = (byAction[a] ?? 0) + 1;
    if (a === "MOVE" || a === "SET_SLOT" || a === "CLEAR_SLOT" || a === "SEND_TO_BELT" || a === "SEND_TO_PRODUCTION") moved++;
  });

  return { total: snap.size, moved, byAction };
}