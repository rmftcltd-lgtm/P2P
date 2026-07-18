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
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 py-10 md:px-0">
        <h1 className="font-display text-4xl font-bold">Welcome back</h1>
        <p className="mt-2 text-slate">
          New here?{" "}
          <Link href="/register" className="underline decoration-leaf-deep underline-offset-4">
            Create an account
          </Link>
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
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

        <p className="mt-6 rounded-2xl bg-mist/80 p-4 text-sm leading-relaxed text-slate">
          Demo: <code>sender@lonelyseat.test</code> or <code>driver@lonelyseat.test</code> /
          <code> password123</code>
          <br />
          (aliases <code>customer@relay.test</code> / <code>driver@relay.test</code> still work)
        </p>
      </div>
    </main>
  );
}
