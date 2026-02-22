import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";
import { useState } from "react";
import { notify } from "../ui/Toast";

export default function AiCenter() {
  const [prompt, setPrompt] = useState("Проанализируй склад и предложи оптимизацию буфера/ленты.");
  const [out, setOut] = useState<string>("");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>AI Center</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ padding: 10, borderRadius: 12, border: "1px solid #ddd", minHeight: 120 }}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={async () => {
            try {
              const fn = httpsCallable(functions, "aiSuggest");
              const res = await fn({ prompt, context: {} });
              const data = res.data as any;
              setOut(`${data.text}\n\nHints:\n- ${data.hints?.join("\n- ")}`);
              notify.ok("AI OK");
            } catch (e: any) {
              notify.err(String(e?.message ?? e));
            }
          }}
        >
          Ask AI
        </button>

        <button
          onClick={async () => {
            try {
              const fn = httpsCallable(functions, "stegForecast");
              const res = await fn({ horizonDays: 14 });
              const data = res.data as any;
              setOut(JSON.stringify(data, null, 2));
              notify.ok("Forecast OK");
            } catch (e: any) {
              notify.err(String(e?.message ?? e));
            }
          }}
        >
          Forecast
        </button>
      </div>

      <pre style={{ whiteSpace: "pre-wrap", border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
        {out}
      </pre>
    </div>
  );
}