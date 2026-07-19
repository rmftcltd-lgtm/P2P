"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";

type Page = {
  id: string;
  title: string;
  slug: string;
  position: string;
  published: boolean;
  updatedAt: string;
};

export default function AdminPagesListPage() {
  const [rows, setRows] = useState<Page[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/pages");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setRows(data.pages);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this page?")) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell
      title="Manage content pages"
      actions={
        <Link className="btn btn-primary text-sm" href="/admin/pages/new">
          Create Page
        </Link>
      }
    >
      {error ? <p className="mb-4 text-sm text-[#8a2f2f]">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-mist/60 text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Position</th>
              <th className="px-4 py-3 font-semibold">Published</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3">
                  <code className="text-xs">{p.slug}</code>
                </td>
                <td className="px-4 py-3">{p.position}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.published ? "bg-leaf/15 text-moss" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {p.published ? "Yes" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(p.updatedAt).toLocaleDateString("en-NZ")}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Link className="btn btn-dark px-3 py-1.5 text-xs" href={`/admin/pages/${p.id}`}>
                      Edit
                    </Link>
                    <Link className="btn btn-dark px-3 py-1.5 text-xs" href={`/pages/${p.slug}`} target="_blank">
                      View
                    </Link>
                    <button className="btn btn-dark px-3 py-1.5 text-xs" type="button" onClick={() => remove(p.id)}>
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
