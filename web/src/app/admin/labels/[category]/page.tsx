"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { slugify } from "@/lib/slugify";

type Label = {
  id: string;
  category: string;
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
};

const titles: Record<string, string> = {
  time: "Time Preference",
  space: "Stuff will fit in",
  ride: "My ride is a",
};

export default function AdminLabelsPage() {
  const { category } = useParams<{ category: string }>();
  const cat = (category || "time").toUpperCase();
  const [rows, setRows] = useState<Label[]>([]);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/labels?category=${cat}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRows(data.labels);
  }

  useEffect(() => {
    void load();
  }, [cat]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    const key = slugify(label).replace(/-/g, "_") || `label_${Date.now()}`;
    const res = await fetch("/api/admin/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, key, label }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Create failed");
      return;
    }
    setLabel("");
    setOk("Label added.");
    await load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this label?")) return;
    await fetch(`/api/admin/labels/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell title={`Edit Labels · ${titles[category] || category}`}>
      <div className="mb-6 flex flex-wrap gap-2">
        <Link className="btn btn-dark text-sm" href="/admin/labels/time">
          Time Preference
        </Link>
        <Link className="btn btn-dark text-sm" href="/admin/labels/space">
          Stuff will fit in
        </Link>
        <Link className="btn btn-dark text-sm" href="/admin/labels/ride">
          My ride is a
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-2" onSubmit={onCreate}>
        <input
          className="field max-w-sm flex-1"
          placeholder="New label name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">
          Add label
        </button>
      </form>
      {error ? <p className="mb-3 text-sm text-[#8a2f2f]">{error}</p> : null}
      {ok ? <p className="mb-3 text-sm text-moss">{ok}</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Label</th>
              <th className="px-4 py-3 font-semibold">Key</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{l.label}</td>
                <td className="px-4 py-3">
                  <code className="text-xs">{l.key}</code>
                </td>
                <td className="px-4 py-3">{l.sortOrder}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      l.active ? "bg-leaf/15 text-moss" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {l.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      className="btn btn-dark px-3 py-1.5 text-xs"
                      type="button"
                      onClick={() => toggle(l.id, l.active)}
                    >
                      {l.active ? "Deactivate" : "Activate"}
                    </button>
                    <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(l.id)}>
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
