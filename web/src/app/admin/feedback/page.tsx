"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/feedback");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRows(data.feedback);
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this feedback?")) return;
    await fetch(`/api/admin/feedback?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell title="User Feedback">
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">From</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Message</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">
                  {f.user ? f.user.name : f.name || "Anonymous"}
                  <div className="text-xs text-slate">{f.user?.email || f.email || "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="field w-auto py-1 text-xs"
                    value={f.status}
                    onChange={(e) => setStatus(f.id, e.target.value)}
                  >
                    <option value="NEW">New</option>
                    <option value="READ">Read</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </td>
                <td className="max-w-md px-4 py-3">{f.message}</td>
                <td className="px-4 py-3">{new Date(f.createdAt).toLocaleString("en-NZ")}</td>
                <td className="px-4 py-3">
                  <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(f.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-slate">No feedback yet.</p> : null}
      </div>
    </AdminShell>
  );
}
