import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { requireAuth, getRole, roleAtLeast } from "./security";
import { geminiSuggest } from "./gemini";
import { forecastSteg } from "./forecast";

admin.initializeApp();

export const aiSuggest = onCall(async (req) => {
  const uid = requireAuth(req);
  const role = await getRole(uid);
  if (!roleAtLeast(role, "worker")) throw new Error("PERMISSION_DENIED");

  const prompt = String(req.data?.prompt ?? "");
  const context = (req.data?.context ?? {}) as Record<string, any>;

  return await geminiSuggest({ prompt, context });
});

export const stegForecast = onCall(async (req) => {
  const uid = requireAuth(req);
  const role = await getRole(uid);
  if (!roleAtLeast(role, "planner")) throw new Error("PERMISSION_DENIED");

  const horizonDays = Number(req.data?.horizonDays ?? 14);
  return await forecastSteg({ horizonDays });
});