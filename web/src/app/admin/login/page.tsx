"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
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
    if (data.user.role !== "ADMIN") {
      setError("This login is for Lonelyseat admins only");
      await fetch("/api/auth/logout", { method: "POST" });
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="atmosphere flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">Admin</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Lonelyseat ops</h1>
        <p className="mt-2 text-slate">Sign in to manage users, orders, listings, and labels.</p>
        <form onSubmit={onSubmit} className="panel mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="field" placeholder="admin@lonelyseat.test" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" name="password" type="password" required className="field" />
          </div>
          {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate">
          <Link href="/" className="underline underline-offset-4">
            Back to Lonelyseat
          </Link>
        </p>
      </div>
    </main>
  );
}
