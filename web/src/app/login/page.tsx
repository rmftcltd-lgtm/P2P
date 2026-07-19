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
    router.push(
      data.user.role === "ADMIN"
        ? "/admin"
        : data.user.role === "DRIVER"
          ? "/driver"
          : "/customer",
    );
    router.refresh();
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Welcome back</h1>
        <p className="mt-3 text-slate">
          New here?{" "}
          <Link href="/register" className="font-medium text-sea underline underline-offset-4">
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
              placeholder="you@example.com"
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
              placeholder="Your password"
            />
          </div>
          {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
