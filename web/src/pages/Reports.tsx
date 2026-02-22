import { useState } from "react";
import { useAppUser } from "../appUser";
import { getWorkerStats } from "../lib/analytics";
import { notify } from "../ui/Toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Reports() {
  const { appUser } = useAppUser();
  const [data, setData] = useState<any>(null);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Reports</h2>

      <button
        onClick={async () => {
          if (!appUser) return;
          try {
            const s = await getWorkerStats(appUser.uid);
            setData(s);
            notify.ok("Stats OK");
          } catch (e: any) {
            notify.err(String(e?.message ?? e));
          }
        }}
      >
        Load my stats
      </button>

      {data && (
        <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 12 }}>
          <div><b>Total movements:</b> {data.total}</div>
          <div><b>Work actions:</b> {data.moved}</div>

          <div style={{ height: 320, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(data.byAction).map(([k, v]) => ({ action: k, count: v }))}
              >
                <XAxis dataKey="action" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}