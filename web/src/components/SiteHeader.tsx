"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  user?: { name: string; role: string } | null;
};

export function SiteHeader({ user }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-10">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight">
        Lonelyseat
      </Link>
      <nav className="flex flex-wrap items-center gap-1 text-sm md:gap-2">
        <Link href="/browse/drivers" className="btn btn-ghost px-3 py-2">
          Search drivers
        </Link>
        <Link href="/browse/stuff" className="btn btn-ghost px-3 py-2">
          Search stuff
        </Link>
        <Link href="/estimate" className="btn btn-ghost px-3 py-2">
          Estimate
        </Link>
        {user ? (
          <>
            <Link href="/inbox" className="btn btn-ghost px-3 py-2">
              Inbox
            </Link>
            <Link
              href={user.role === "DRIVER" ? "/driver" : "/customer"}
              className="btn btn-ghost px-3 py-2"
            >
              {user.role === "DRIVER" ? "Drive" : "Stuff"}
            </Link>
            <button type="button" onClick={logout} className="btn btn-dark px-4 py-2">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost px-4 py-2">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary px-4 py-2">
              Join
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
