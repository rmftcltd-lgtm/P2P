"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { usePolling } from "@/lib/use-polling";

type FeedItem = {
  kind: "system" | "message";
  id: string;
  createdAt: string;
  body: string;
  status?: string | null;
  photoUrl?: string | null;
  sender?: { id: string; name: string; role: string };
};

type DeliveryMeta = {
  id: string;
  requestCode: string;
  status: string;
  itemTitle?: string | null;
  customerId: string;
  driverId?: string | null;
  pickupPhotoUrl?: string | null;
  dropoffPhotoUrl?: string | null;
  cancellationStatus?: string;
};

export default function InboxThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(
    null,
  );
  const [delivery, setDelivery] = useState<DeliveryMeta | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [cancelMode, setCancelMode] = useState<"MUTUAL" | "FORCED">("MUTUAL");
  const [cancelReason, setCancelReason] = useState("");
  const [invoice, setInvoice] = useState<{
    lonelyseatInvoice: { amount: number; fees: number };
    driverInvoice: { payout: number };
  } | null>(null);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    setUser(meData.user);
    const res = await fetch(`/api/deliveries/${id}/messages`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load thread");
      return;
    }
    setDelivery(data.delivery);
    setFeed(data.feed ?? []);

    if (data.delivery?.status === "DELIVERED" && data.delivery?.dropoffPhotoUrl) {
      const inv = await fetch(`/api/deliveries/${id}/invoice`);
      if (inv.ok) setInvoice(await inv.json());
    }
  }, [id, router]);

  usePolling(load, 8000);

  async function send(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/deliveries/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, photoUrl: photoUrl || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not send");
      return;
    }
    setBody("");
    setPhotoUrl("");
    void load();
  }

  async function requestCancel() {
    if (cancelReason.trim().length < 3) {
      setError("Cancellation reason is required");
      return;
    }
    const res = await fetch(`/api/deliveries/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: cancelMode, reason: cancelReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Cancel failed");
      return;
    }
    void load();
  }

  async function respondCancel(action: "accept" | "reject") {
    const res = await fetch(`/api/deliveries/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not respond");
      return;
    }
    void load();
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col px-5 py-6 md:px-10">
        <div className="flex items-center justify-between gap-3">
          <Link href="/inbox" className="text-sm text-slate">
            ← Messages
          </Link>
          {delivery && (
            <p className="text-sm font-semibold text-moss">
              Request #{delivery.requestCode}
            </p>
          )}
        </div>
        <h1 className="font-display mt-3 text-3xl font-bold">
          {delivery?.itemTitle ?? "Delivery thread"}
        </h1>
        <p className="text-sm text-slate">{delivery?.status.replaceAll("_", " ")}</p>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pb-4">
          {feed.map((item) =>
            item.kind === "system" ? (
              <p key={item.id} className="text-center text-sm text-moss">
                <span className="text-xs text-slate">
                  {new Date(item.createdAt).toLocaleString()}
                  <br />
                </span>
                {item.body}
              </p>
            ) : (
              <div
                key={item.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  item.sender?.id === user?.id
                    ? "ml-auto bg-leaf/40"
                    : "bg-white/70"
                }`}
              >
                <p className="text-xs text-slate">{item.sender?.name}</p>
                <p>{item.body}</p>
                {item.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt="Attachment"
                    className="mt-2 max-h-48 rounded-lg"
                  />
                )}
              </div>
            ),
          )}
          {delivery?.pickupPhotoUrl && (
            <p className="text-center text-sm text-slate">
              Pickup photo on file
            </p>
          )}
          {delivery?.dropoffPhotoUrl && (
            <p className="text-center text-sm text-moss">
              Drop-off photo on file — invoices unlocked
            </p>
          )}
        </div>

        {invoice && (
          <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <p className="font-semibold">Lonelyseat Invoice</p>
              <p className="text-sm">Total ${invoice.lonelyseatInvoice.amount.toFixed(2)}</p>
              <p className="text-xs text-slate">
                Fees ${invoice.lonelyseatInvoice.fees.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="font-semibold">Driver Invoice</p>
              <p className="text-sm">Payout ${invoice.driverInvoice.payout.toFixed(2)}</p>
            </div>
          </div>
        )}

        {delivery?.cancellationStatus === "REQUESTED" && (
          <div className="panel mb-4 space-y-2 border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold">Mutual cancellation pending</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void respondCancel("accept")}
              >
                Accept cancel
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={() => void respondCancel("reject")}
              >
                Keep booking
              </button>
            </div>
          </div>
        )}

        {delivery &&
          ["PENDING", "ACCEPTED"].includes(delivery.status) &&
          delivery.cancellationStatus !== "REQUESTED" && (
            <div className="panel mb-4 space-y-2 p-4">
              <p className="text-sm font-semibold">Cancellation request</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cancelMode === "MUTUAL"}
                    onChange={() => setCancelMode("MUTUAL")}
                  />
                  Mutual
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cancelMode === "FORCED"}
                    onChange={() => setCancelMode("FORCED")}
                  />
                  Forced (no refund)
                </label>
              </div>
              <input
                className="field"
                placeholder="Reason (required)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <button type="button" className="btn btn-dark" onClick={() => void requestCancel()}>
                Confirm
              </button>
            </div>
          )}

        <form onSubmit={send} className="sticky bottom-0 space-y-2 border-t border-[var(--line)] bg-[rgba(247,245,242,0.92)] py-4 backdrop-blur">
          <input
            className="field"
            placeholder="Photo URL (optional camera proof)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="field flex-1"
              placeholder="Type message here…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
