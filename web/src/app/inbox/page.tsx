"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { usePolling } from "@/lib/use-polling";

type Offer = {
  id: string;
  status: string;
  initiator: "SENDER" | "DRIVER";
  amount: number;
  note?: string | null;
  createdAt: string;
  expiresAt?: string;
  fromUser: { id: string; name: string; role: string };
  toUser: { id: string; name: string; role: string };
  delivery: {
    id: string;
    requestCode: string;
    itemTitle?: string | null;
    status: string;
    pickupAddress: string;
    dropoffAddress: string;
  };
};

type User = { id?: string; name: string; role: string };

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    setUser(meData.user);
    const res = await fetch("/api/offers");
    const data = await res.json();
    setOffers(data.offers ?? []);
  }, [router]);

  usePolling(load, 10000);

  async function respond(offerId: string, action: "accept" | "reject") {
    setError("");
    setMessage("");
    const res = await fetch(`/api/offers/${offerId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not respond");
      return;
    }
    setMessage(action === "accept" ? "Offer accepted." : "Offer declined.");
    void load();
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">Messages</h1>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 text-sm text-moss">{message}</p>}

        <div className="mt-8 space-y-3">
          {offers.map((o) => {
            const incoming = o.toUser.id === user?.id;
            return (
              <article key={o.id} className="panel p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {incoming ? o.fromUser.name : o.toUser.name}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      {o.delivery.itemTitle ?? "Delivery"} · {o.status.toLowerCase()} · $
                      {o.amount.toFixed(0)}
                    </p>
                    {o.status === "PENDING" && o.expiresAt ? (
                      <p className="mt-1 text-xs text-leaf-deep">
                        Confirm within 30 minutes · expires{" "}
                        {new Date(o.expiresAt).toLocaleTimeString("en-NZ", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                    {o.note && <p className="mt-1 text-sm text-slate">{o.note}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/inbox/${o.delivery.id}`}
                      className="btn btn-ghost px-3 py-2 text-center"
                    >
                      Open thread
                    </Link>
                    {incoming && o.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary px-3 py-2"
                          onClick={() => void respond(o.id, "accept")}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark px-3 py-2"
                          onClick={() => void respond(o.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {offers.length === 0 && (
            <p className="text-slate">
              No messages yet. Browse{" "}
              <Link href="/browse/drivers" className="underline underline-offset-4">
                drivers
              </Link>{" "}
              or{" "}
              <Link href="/browse/stuff" className="underline underline-offset-4">
                stuff
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
