"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  user?: { name: string; role: string } | null;
  tone?: "light" | "dark";
};

export function SiteHeader({ user, tone = "light" }: Props) {
  const router = useRouter();

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
          Drivers
        </Link>
        <Link href="/browse/stuff" className="nav-link">
          Stuff
        </Link>
        <Link href="/estimate" className="nav-link">
          Estimate
        </Link>
        {user ? (
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
