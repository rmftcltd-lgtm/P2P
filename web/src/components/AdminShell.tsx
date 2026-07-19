"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Manage Users" },
  { href: "/admin/orders", label: "Manage Orders" },
  { href: "/admin/listings/drivers", label: "Listings · Drivers" },
  { href: "/admin/listings/stuff", label: "Listings · Stuff" },
  { href: "/admin/labels/time", label: "Labels · Time preference" },
  { href: "/admin/labels/space", label: "Labels · Stuff will fit in" },
  { href: "/admin/labels/ride", label: "Labels · My ride is a" },
  { href: "/admin/pages", label: "Content pages" },
  { href: "/admin/incomplete", label: "Incomplete registrations" },
  { href: "/admin/feedback", label: "User feedback" },
];

export function AdminShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function gate() {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      if (data.user?.role !== "ADMIN") {
        router.replace("/");
        return;
      }
      setReady(true);
    }
    void gate();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef1ef] text-slate">
        Checking admin access…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1ef] text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[var(--line)] bg-moss text-paper md:min-h-screen md:border-b-0 md:border-r md:border-white/10">
        <div className="px-5 py-5">
          <Link href="/admin" className="font-display text-xl font-bold text-leaf">
            Lonelyseat
          </Link>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-paper/55">Admin</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-6">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-leaf text-white" : "text-paper/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-paper/60 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white/80 px-5 py-4 backdrop-blur md:px-8">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
        <div className="px-5 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
