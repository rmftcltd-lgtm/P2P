"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
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
    if (next && next.startsWith("/")) {
      router.push(next);
    } else {
      router.push(
        data.user.role === "ADMIN"
          ? "/admin"
          : data.user.role === "DRIVER"
            ? "/driver"
            : "/customer",
      );
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-8 space-y-4">
      {next ? (
        <p className="rounded-xl bg-sea-soft/50 px-3 py-2 text-sm text-sea">
          After you sign in we&apos;ll open your listing form with the fare guide details filled in.
        </p>
      ) : null}
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
  );
}

function LoginIntro() {
  const params = useSearchParams();
  const next = params.get("next");
  const registerHref = next
    ? `/register?next=${encodeURIComponent(next)}`
    : "/register";
  return (
    <p className="mt-3 text-slate">
      New here?{" "}
      <Link href={registerHref} className="font-medium text-sea underline underline-offset-4">
        Create an account
      </Link>
    </p>
  );
}

export default function LoginPage() {
  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Welcome back</h1>
        <Suspense fallback={<p className="mt-3 text-slate">Loading…</p>}>
          <LoginIntro />
        </Suspense>
        <Suspense fallback={<p className="mt-8 text-slate">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
