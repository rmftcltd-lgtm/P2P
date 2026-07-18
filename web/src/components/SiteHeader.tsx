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
    <header className="relative z-20 flex items-center justify-between gap-4 px-5 py-5 md:px-10">
      <Link href="/" className="font-display text-2xl font-bold tracking-tight">
        Lonelyseat
      </Link>
      <nav className="flex items-center gap-2 text-sm md:gap-3">
        {user ? (
          <>
            <span className="hidden text-slate sm:inline">
              {user.name} · {user.role === "CUSTOMER" ? "sender" : "driver"}
            </span>
            <Link
              href={user.role === "DRIVER" ? "/driver" : "/customer"}
              className="btn btn-ghost px-4 py-2"
            >
              Dashboard
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
              Join Lonelyseat
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
