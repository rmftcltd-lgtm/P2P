"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk(false);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name || undefined,
        email: email || undefined,
        message,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send");
      return;
    }
    setOk(true);
    setMessage("");
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight">Feedback</h1>
        <p className="mt-3 text-slate">Tell us what to improve — admins review every message.</p>
        <form className="panel mt-8 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="label">Name</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Message</span>
            <textarea
              className="field min-h-[140px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={5}
            />
          </label>
          {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}
          {ok ? <p className="text-sm text-moss">Thanks — we got it.</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send feedback"}
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link href="/" className="text-sea underline underline-offset-4">
            Back home
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
