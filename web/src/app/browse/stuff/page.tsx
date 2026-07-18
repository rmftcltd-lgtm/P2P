"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { DEMO_PLACES } from "@/lib/geo";
import { SPACE_OPTIONS } from "@/lib/spaces";
import { usePolling } from "@/lib/use-polling";

type Stuff = {
  id: string;
  requestCode: string;
  itemTitle: string;
  pickupAddress: string;
  dropoffAddress: string;
  spaceNeeded: string;
  offerAmount: number;
  createdAt: string;
  customerName: string;
  offerCount: number;
  fullyPackaged: boolean;
  greetAtPickup: boolean;
  greetAtDropoff: boolean;
};

type User = { name: string; role: string };

export default function BrowseStuffPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [space, setSpace] = useState("");
  const [sort, setSort] = useState("latest");
  const [stuff, setStuff] = useState<Stuff[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const search = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const meData = await me.json();
      setUser(meData.user);
    }
    setBusy(true);
    const from = DEMO_PLACES[fromIdx];
    const to = DEMO_PLACES[toIdx];
    const params = new URLSearchParams({
      fromLat: String(from.lat),
      fromLng: String(from.lng),
      toLat: String(to.lat),
      toLng: String(to.lng),
      sort,
      radiusKm: "200",
    });
    if (space) params.set("space", space);
    const res = await fetch(`/api/browse/stuff?${params}`);
    const data = await res.json();
    setBusy(false);
    setStuff(data.stuff ?? []);
  }, [fromIdx, toIdx, space, sort]);

  usePolling(search, 60000);

  async function offerOn(item: Stuff) {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "DRIVER") {
      setError("Use a driver account to offer on stuff");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryId: item.id,
        note: `I'd like to carry your ${item.itemTitle}`,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send offer");
      return;
    }
    setMessage(`Offer sent for request #${item.requestCode}. Watch Inbox for their reply.`);
    void search();
  }

  const spaceLabel = (key: string) =>
    SPACE_OPTIONS.find((s) => s.key === key)?.label ?? key;

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <p className="text-sm uppercase tracking-wide text-slate">Stuff listing</p>
        <h1 className="font-display mt-2 text-4xl font-bold">Search stuff</h1>
        <p className="mt-2 text-slate">
          Browse items needing a ride on your corridor — offer to drive, sender accepts.
        </p>

        <div className="panel mt-8 grid gap-3 p-5 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="label">From</span>
            <select
              className="field"
              value={fromIdx}
              onChange={(e) => setFromIdx(Number(e.target.value))}
            >
              {DEMO_PLACES.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="label">To</span>
            <select
              className="field"
              value={toIdx}
              onChange={(e) => setToIdx(Number(e.target.value))}
            >
              {DEMO_PLACES.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="label">Space</span>
            <select className="field" value={space} onChange={(e) => setSpace(e.target.value)}>
              <option value="">Flexible</option>
              {SPACE_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="label">Sort</span>
            <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="price">Price</option>
            </select>
          </label>
          <button type="button" className="btn btn-primary sm:col-span-2" onClick={() => void search()}>
            Search
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-4 text-sm text-moss">{message}</p>}

        <div className="mt-6 space-y-3">
          {stuff.map((item) => (
            <article key={item.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {item.itemTitle}{" "}
                    <span className="text-sm font-normal text-slate">
                      #{item.requestCode}
                    </span>
                  </p>
                  <p className="text-sm text-slate">
                    {item.pickupAddress.split(",")[0]} → {item.dropoffAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    Fits: {spaceLabel(item.spaceNeeded)} · {item.customerName} ·{" "}
                    {item.offerCount} offer{item.offerCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Packaged: {item.fullyPackaged ? "yes" : "owner risk"} · Greet pickup:{" "}
                    {item.greetAtPickup ? "yes" : "owner risk"} · Greet drop-off:{" "}
                    {item.greetAtDropoff ? "yes" : "owner risk"}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    Listed {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold">${item.offerAmount.toFixed(0)}</p>
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    disabled={busy}
                    onClick={() => void offerOn(item)}
                  >
                    Offer to drive
                  </button>
                </div>
              </div>
            </article>
          ))}
          {stuff.length === 0 && !busy && (
            <p className="text-slate">No open stuff on this corridor yet.</p>
          )}
        </div>

        <p className="mt-8 text-sm text-slate">
          Listing a journey instead?{" "}
          <Link href="/driver/trips" className="underline">
            Create lonely seat
          </Link>
        </p>
      </div>
    </main>
  );
}
