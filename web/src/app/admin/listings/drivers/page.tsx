"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Listing = {
  id: string;
  vehicleType: string;
  spaces: string;
  price: number | null;
  from: string;
  to: string;
  departAt: string;
  createdAt: string;
  status: string;
  tripType: string;
  driverName: string;
};

export default function AdminDriverListingsPage() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/listings/drivers");
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
    if (!confirm("Delete this driver listing?")) return;
    await fetch(`/api/admin/listings/drivers?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell
      title="Manage Listings · Drivers"
      actions={
        <Link className="btn btn-dark text-sm" href="/admin/listings/stuff">
          Stuff listings
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Driver</th>
              <th className="px-4 py-3 font-semibold">Route</th>
              <th className="px-4 py-3 font-semibold">Vehicle</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{d.driverName}</td>
                <td className="px-4 py-3">
                  <div>
                    {d.from} → {d.to}
                  </div>
                  <div className="text-xs text-slate">{new Date(d.departAt).toLocaleString("en-NZ")}</div>
                </td>
                <td className="px-4 py-3">{d.vehicleType}</td>
                <td className="px-4 py-3">{d.tripType}</td>
                <td className="px-4 py-3">{d.price != null ? `$${d.price.toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3">{d.status}</td>
                <td className="px-4 py-3">
                  <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-slate">No driver listings.</p> : null}
      </div>
    </AdminShell>
  );
}
