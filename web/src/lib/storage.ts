import { ref as sRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Централизованная загрузка фото этикетки.
 * Имена файлов делаем "умные" — чтобы AI/отчеты могли жить.
 */
export async function uploadLabelPhoto(args: {
  file: File;
  row?: number;
  floor?: number;
  steg?: string | null;
  labelDate?: string | null; // ISO date
}): Promise<{ url: string; path: string }> {
  const safeSteg = (args.steg ?? "UNKNOWN").replace(/[^\w\-]/g, "_");
  const safeDate = (args.labelDate ?? new Date().toISOString().slice(0, 10)).replace(/[^\d\-]/g, "");
  const rf = args.row && args.floor ? `R${args.row}_F${args.floor}` : "R?_F?";
  const name = `${rf}_${safeSteg}_${safeDate}_${Date.now()}.jpg`;
  const path = `labels/${name}`;

  const r = sRef(storage, path);
  await uploadBytes(r, args.file);
  const url = await getDownloadURL(r);

  return { url, path };
}