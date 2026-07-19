"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useLabels } from "@/lib/use-labels";
import { BRAND_NAME } from "@/lib/brand";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [role, setRole] = useState<"CUSTOMER" | "DRIVER">(
    params.get("role") === "DRIVER" ? "DRIVER" : "CUSTOMER",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const rideLabels = useLabels("RIDE");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      phone: String(fd.get("phone") || "") || undefined,
      role,
      vehicleType: role === "DRIVER" ? String(fd.get("vehicleType") || "hatch") : undefined,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not register");
      return;
    }
    if (next && next.startsWith("/")) {
      router.push(next);
    } else {
      router.push(role === "DRIVER" ? "/driver" : "/customer");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-mist p-1">
        {(["CUSTOMER", "DRIVER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              role === r ? "bg-white text-ink" : "text-slate hover:text-ink"
            }`}
          >
            {r === "CUSTOMER" ? "I'm sending stuff" : "I'm heading that way"}
          </button>
        ))}
      </div>

      {next ? (
        <p className="rounded-xl bg-sea-soft/50 px-3 py-2 text-sm text-sea">
          After you join we&apos;ll open your listing form with the fare guide details filled in.
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input id="name" name="name" required className="field" placeholder="Alex Chen" />
      </div>
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
          minLength={6}
          className="field"
          placeholder="At least 6 characters"
        />
      </div>
      <div>
        <label className="label" htmlFor="phone">
          Mobile
        </label>
        <input id="phone" name="phone" className="field" placeholder="+64 21 …" />
      </div>
      {role === "DRIVER" && (
        <div>
          <label className="label" htmlFor="vehicleType">
            My ride is a…
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            className="field"
            defaultValue={rideLabels[0]?.key ?? "hatch"}
          >
            {rideLabels.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function RegisterIntro() {
  const params = useSearchParams();
  const next = params.get("next");
  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";
  return (
    <p className="mt-3 text-slate">
      Already on board?{" "}
      <Link href={loginHref} className="font-medium text-sea underline underline-offset-4">
        Sign in
      </Link>
      . By joining you agree to our{" "}
      <Link href="/terms" className="font-medium text-sea underline underline-offset-4">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/lonely-cover" className="font-medium text-sea underline underline-offset-4">
        Lonely Cover
      </Link>{" "}
      policy.
    </p>
  );
}

export default function RegisterPage() {
  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Join {BRAND_NAME}</h1>
        <Suspense fallback={<p className="mt-3 text-slate">Loading…</p>}>
          <RegisterIntro />
        </Suspense>
        <div className="panel mt-8">
          <Suspense fallback={<p className="text-slate">Loading…</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
