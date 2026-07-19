"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  position: string;
  metaDescription: string | null;
  published: boolean;
};

export default function AdminPageEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/pages/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Not found");
        return;
      }
      setPage(data.page);
    }
    void load();
  }, [id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!page) return;
    setError("");
    setOk("");
    const res = await fetch(`/api/admin/pages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: page.title,
        content: page.content,
        position: page.position,
        metaDescription: page.metaDescription,
        published: page.published,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setPage(data.page);
    setOk("Saved.");
  }

  if (!page) {
    return (
      <AdminShell title="Edit page">
        <p className="text-slate">{error || "Loading…"}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Edit · ${page.title}`}>
      <p className="mb-6">
        <Link href="/admin/pages" className="text-sm text-sea underline underline-offset-4">
          ← Pages
        </Link>
      </p>
      <form className="panel max-w-2xl space-y-4" onSubmit={onSave}>
        <label className="block">
          <span className="label">Title</span>
          <input
            className="field"
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="label">Slug</span>
          <input className="field" value={page.slug} disabled />
        </label>
        <label className="block">
          <span className="label">Content</span>
          <textarea
            className="field min-h-[220px]"
            value={page.content}
            onChange={(e) => setPage({ ...page, content: e.target.value })}
            required
          />
        </label>
        <label className="block">
          <span className="label">Position</span>
          <select
            className="field"
            value={page.position}
            onChange={(e) => setPage({ ...page, position: e.target.value })}
          >
            <option value="HEADER">Header</option>
            <option value="FOOTER">Footer</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Meta description</span>
          <textarea
            className="field min-h-[60px]"
            value={page.metaDescription || ""}
            onChange={(e) => setPage({ ...page, metaDescription: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={page.published}
            onChange={(e) => setPage({ ...page, published: e.target.checked })}
          />
          Published
        </label>
        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
        {ok ? <p className="text-sm text-moss">{ok}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit">
            Save
          </button>
          <button className="btn btn-dark" type="button" onClick={() => router.push("/admin/pages")}>
            Cancel
          </button>
        </div>
      </form>
    </AdminShell>
  );
}
