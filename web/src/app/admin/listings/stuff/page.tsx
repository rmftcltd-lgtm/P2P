"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Stuff = {
  id: string;
  requestCode: string;
  itemTitle: string | null;
  spaceNeeded: string;
  price: number;
  from: string;
  to: string;
  createdAt: string;
  senderName: string;
  status: string;
};

export default function AdminStuffListingsPage() {
  const [rows, setRows] = useState<Stuff[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/listings/stuff");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRows(data.listings);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this stuff listing?")) return;
    await fetch(`/api/admin/listings/stuff?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell
      title="Manage Listings · Stuff"
      actions={
        <Link className="btn btn-dark text-sm" href="/admin/listings/drivers">
          Driver listings
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Sender</th>
              <th className="px-4 py-3 font-semibold">Space</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.itemTitle || s.requestCode}</div>
                  <div className="text-xs text-slate">
                    #{s.requestCode} · {s.from} → {s.to}
                  </div>
                </td>
                <td className="px-4 py-3">{s.senderName}</td>
                <td className="px-4 py-3">{s.spaceNeeded}</td>
                <td className="px-4 py-3">${s.price.toFixed(2)}</td>
                <td className="px-4 py-3">{s.status}</td>
                <td className="px-4 py-3">{new Date(s.createdAt).toLocaleDateString("en-NZ")}</td>
                <td className="px-4 py-3">
                  <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-slate">No open stuff listings.</p> : null}
      </div>
    </AdminShell>
  );
}
