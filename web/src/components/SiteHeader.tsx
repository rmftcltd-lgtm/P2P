"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  user?: { name: string; role: string } | null;
  tone?: "light" | "dark";
};

type CmsPage = { title: string; slug: string };

export function SiteHeader({ user, tone = "light" }: Props) {
  const router = useRouter();
  const [headerPages, setHeaderPages] = useState<CmsPage[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/pages?position=HEADER");
        const data = await res.json();
        if (res.ok) setHeaderPages(data.pages ?? []);
      } catch {
        /* ignore */
      }
    }
    void load();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className={`site-header ${tone === "light" ? "site-header--solid" : ""}`}>
      <Link href="/" className="font-display text-xl font-bold tracking-tight md:text-2xl">
        Lonelyseat
      </Link>
      <nav className="flex flex-wrap items-center gap-0.5 md:gap-1">
        <Link href="/browse/drivers" className="nav-link">
          Find your stuff a ride
        </Link>
        <Link href="/browse/stuff" className="nav-link">
          Find stuff to take
        </Link>
        <Link href="/map" className="nav-link">
          Live map
        </Link>
        <Link href="/estimate" className="nav-link">
          How much?
        </Link>
        {headerPages.map((p) => (
          <Link key={p.slug} href={`/pages/${p.slug}`} className="nav-link">
            {p.title}
          </Link>
        ))}
        {user ? (
          <>
            {user.role === "ADMIN" ? (
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            ) : (
              <>
                <Link href="/inbox" className="nav-link">
                  Inbox
                </Link>
                <Link
                  href={user.role === "DRIVER" ? "/driver" : "/customer"}
                  className="nav-link"
                >
                  {user.role === "DRIVER" ? "Drive" : "Send"}
                </Link>
              </>
            )}
            <button type="button" onClick={logout} className="btn btn-dark ml-1 px-3.5 py-2 text-sm">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary ml-1 px-3.5 py-2 text-sm">
              Join
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
