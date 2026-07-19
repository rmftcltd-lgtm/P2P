"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(fd.get("email")),
        password: String(fd.get("password")),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not sign in");
      return;
    }
    router.push(data.user.role === "DRIVER" ? "/driver" : "/customer");
    router.refresh();
  }

  return (
    <main className="atmosphere relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 grid-noise opacity-50" />
      <SiteHeader />
      <div className="relative mx-auto max-w-md px-5 py-12 md:px-0">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Welcome back</h1>
        <p className="mt-3 text-slate">
          New here?{" "}
          <Link href="/register" className="font-medium text-sea underline decoration-sea/40 underline-offset-4 hover:decoration-sea">
            Create an account
          </Link>
        </p>

        <form onSubmit={onSubmit} className="panel mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="field"
              placeholder="sender@lonelyseat.test"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="field"
              placeholder="password123"
            />
          </div>
          {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 rounded-xl border border-[var(--line)] bg-mist/70 p-4 text-sm leading-relaxed text-slate">
          Demo: <code>sender@lonelyseat.test</code> or <code>driver@lonelyseat.test</code> /
          <code> password123</code>
          <br />
          (aliases <code>customer@relay.test</code> / <code>driver@relay.test</code> still work)
        </p>
      </div>
    </main>
  );
}
