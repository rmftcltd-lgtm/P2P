"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Order = {
  id: string;
  requestCode: string;
  date: string;
  senderName: string;
  driverName: string;
  from: string;
  to: string;
  spaceNeeded: string;
  itemTitle: string | null;
  price: number;
  totalCharge: number;
  lonelyseatFee: number;
  charity: number;
  driverEarning: number;
  status: string;
  paymentStatus: string;
};

const money = (n: number) => `$${n.toFixed(2)}`;

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load");
      setLoading(false);
      return;
    }
    setRows(data.orders);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load();
  }

  return (
    <AdminShell title="Manage Orders">
      <form className="mb-6 flex flex-wrap gap-2" onSubmit={onSearch}>
        <input
          className="field max-w-sm flex-1"
          placeholder="Search code, address, sender…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="field w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="PICKED_UP">Picked up</option>
          <option value="IN_TRANSIT">In transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      {loading ? <p className="text-slate">Loading…</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Sender</th>
              <th className="px-3 py-3 font-semibold">Driver</th>
              <th className="px-3 py-3 font-semibold">Price</th>
              <th className="px-3 py-3 font-semibold">Fee</th>
              <th className="px-3 py-3 font-semibold">Charity</th>
              <th className="px-3 py-3 font-semibold">Driver $</th>
              <th className="px-3 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-3 py-3">
                  <div className="font-medium">{o.itemTitle || o.requestCode}</div>
                  <div className="text-xs text-slate">
                    #{o.requestCode} · {o.from} → {o.to}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold">{o.status}</span>
                </td>
                <td className="px-3 py-3">{o.senderName}</td>
                <td className="px-3 py-3">{o.driverName}</td>
                <td className="px-3 py-3">{money(o.price)}</td>
                <td className="px-3 py-3">{money(o.lonelyseatFee)}</td>
                <td className="px-3 py-3">{money(o.charity)}</td>
                <td className="px-3 py-3">{money(o.driverEarning)}</td>
                <td className="px-3 py-3">{new Date(o.date).toLocaleDateString("en-NZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
