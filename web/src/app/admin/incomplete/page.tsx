"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function AdminIncompletePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/incomplete");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRows(data.users);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this incomplete registration?")) return;
    await fetch(`/api/admin/incomplete?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell title="Incomplete Registrations">
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Started</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role === "CUSTOMER" ? "Sender" : u.role}</td>
                <td className="px-4 py-3">{new Date(u.createdAt).toLocaleString("en-NZ")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link className="btn btn-dark px-3 py-1.5 text-xs" href={`/admin/users/${u.id}`}>
                      Edit
                    </Link>
                    <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(u.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="p-4 text-slate">No incomplete registrations.</p> : null}
      </div>
    </AdminShell>
  );
}
