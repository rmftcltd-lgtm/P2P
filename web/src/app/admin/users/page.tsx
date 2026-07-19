"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  registrationComplete: boolean;
  idVerified: boolean;
  licenceVerified: boolean;
  kycStatus: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(nextQ = q) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load users");
      setLoading(false);
      return;
    }
    setRows(data.users);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load();
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) await load();
    else {
      const data = await res.json();
      setError(data.error || "Delete failed");
    }
  }

  return (
    <AdminShell title="Manage Users" actions={<span className="text-sm text-slate">Activate, edit, or remove accounts</span>}>
      <form className="mb-6 flex flex-wrap gap-2" onSubmit={onSearch}>
        <input
          className="field max-w-sm flex-1"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      {loading ? <p className="text-slate">Loading…</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate">{u.email}</td>
                <td className="px-4 py-3">{u.role === "CUSTOMER" ? "Sender" : u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.isActive ? "bg-leaf/15 text-moss" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                  {!u.registrationComplete ? (
                    <span className="ml-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                      Incomplete
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-slate">
                  ID {u.idVerified ? "✓" : "—"} / Lic {u.licenceVerified ? "✓" : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link className="btn btn-dark px-3 py-1.5 text-xs" href={`/admin/users/${u.id}`}>
                      Edit
                    </Link>
                    <button
                      className="btn btn-dark px-3 py-1.5 text-xs"
                      type="button"
                      onClick={() => toggleActive(u.id, u.isActive)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(u.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
