"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";

export default function AdminPageCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [position, setPosition] = useState("FOOTER");
  const [metaDescription, setMetaDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug: slug || undefined,
        content,
        position,
        metaDescription: metaDescription || undefined,
        published,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Create failed");
      return;
    }
    router.push(`/admin/pages/${data.page.id}`);
  }

  return (
    <AdminShell title="Create Page / Listing">
      <p className="mb-6">
        <Link href="/admin/pages" className="text-sm text-sea underline underline-offset-4">
          ← Pages
        </Link>
      </p>
      <form className="panel max-w-2xl space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="label">Title</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Slug (optional)</span>
          <input className="field" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from title" />
        </label>
        <label className="block">
          <span className="label">Content (HTML ok)</span>
          <textarea className="field min-h-[200px]" value={content} onChange={(e) => setContent(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Position</span>
          <select className="field" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="HEADER">Header</option>
            <option value="FOOTER">Footer</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Meta description</span>
          <textarea className="field min-h-[60px]" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>
        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
        <button className="btn btn-primary" type="submit">
          Create page
        </button>
      </form>
    </AdminShell>
  );
}
