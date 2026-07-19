"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";

type CmsPage = { title: string; slug: string };

export function SiteFooter() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/pages?position=FOOTER");
      const data = await res.json();
      if (res.ok) setPages(data.pages ?? []);
    }
    void load();
  }, []);

  async function onFeedback(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setStatus("");
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || undefined, email: email || undefined, message }),
    });
    setSending(false);
    if (!res.ok) {
      const data = await res.json();
      setStatus(data.error || "Could not send feedback");
      return;
    }
    setMessage("");
    setStatus("Thanks — we got your feedback.");
  }

  return (
    <footer className="border-t border-[var(--line)] bg-moss text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr] md:px-10">
        <div>
          <Link href="/" className="font-display text-2xl font-bold text-leaf">
            {BRAND_NAME}
          </Link>
          <p className="mt-2 max-w-md text-sm text-paper/70">
            Peer-to-peer delivery for Aotearoa — fill the lonely seat, cut the freight bill.
          </p>
          <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {pages.map((p) => (
              <Link key={p.slug} href={`/pages/${p.slug}`} className="text-paper/80 underline-offset-4 hover:underline">
                {p.title}
              </Link>
            ))}
            <Link href="/terms" className="text-paper/80 underline-offset-4 hover:underline">
              Terms
            </Link>
            <Link href="/lonely-cover" className="text-paper/80 underline-offset-4 hover:underline">
              Lonely Cover
            </Link>
            <Link href="/admin/login" className="text-paper/50 underline-offset-4 hover:underline">
              Admin
            </Link>
          </nav>
        </div>
        <form onSubmit={onFeedback} className="space-y-3">
          <p className="text-sm font-semibold">Quick feedback</p>
          <input
            className="field border-white/10 bg-white/10 text-paper placeholder:text-paper/40"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="field border-white/10 bg-white/10 text-paper placeholder:text-paper/40"
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            className="field min-h-[80px] border-white/10 bg-white/10 text-paper placeholder:text-paper/40"
            placeholder="What's working? What's missing?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            minLength={5}
          />
          {status ? <p className="text-sm text-leaf">{status}</p> : null}
          <button type="submit" disabled={sending} className="btn btn-primary">
            {sending ? "Sending…" : "Send feedback"}
          </button>
        </form>
      </div>
    </footer>
  );
}
