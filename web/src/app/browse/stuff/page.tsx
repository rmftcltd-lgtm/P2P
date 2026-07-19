"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { useLabels } from "@/lib/use-labels";
import { usePolling } from "@/lib/use-polling";
import { SpacePicker } from "@/components/SpacePicker";

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
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [space, setSpace] = useState("");
  const [sort, setSort] = useState("latest");
  const [stuff, setStuff] = useState<Stuff[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const spaceLabels = useLabels("SPACE");

  const search = useCallback(async () => {
    if (!from || !to) return;
    const me = await fetch("/api/auth/me");
    if (me.ok) {
      const meData = await me.json();
      setUser(meData.user);
    }
    setBusy(true);
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
  }, [from, to, space, sort]);

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
    spaceLabels.find((s) => s.key === key)?.label ?? key;

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-3xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Find stuff to take
        </h1>
        <p className="mt-2 text-slate">Gear that needs a lift along your route.</p>

        <div className="panel mt-8 grid gap-3 p-5 sm:grid-cols-2">
          <PlacePicker
            id="stuff-from"
            label="From"
            value={from}
            onChange={setFrom}
            placeholder="Pick-up address…"
          />
          <PlacePicker
            id="stuff-to"
            label="To"
            value={to}
            onChange={setTo}
            placeholder="Drop-off address…"
          />
          <SpacePicker
            label="Space"
            value={space}
            onChange={setSpace}
            options={spaceLabels}
            allowAny
            anyLabel="Flexible"
          />
          <label className="block text-sm">
            <span className="label">Sort</span>
            <select className="field" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="price">Price</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn-primary sm:col-span-2"
            onClick={() => void search()}
            disabled={!from || !to}
          >
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
                  <p className="font-semibold">{item.itemTitle}</p>
                  <p className="mt-1 text-sm text-slate">
                    {item.pickupAddress.split(",")[0]} → {item.dropoffAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {spaceLabel(item.spaceNeeded)} · {item.customerName}
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
                    Offer to carry
                  </button>
                </div>
              </div>
            </article>
          ))}
          {stuff.length === 0 && !busy && (
            <p className="text-slate">Nothing listed on this drive yet.</p>
          )}
        </div>

        <p className="mt-8 text-sm text-slate">
          <Link href="/driver/trips" className="underline underline-offset-4">
            List a lonely seat instead
          </Link>
        </p>
      </div>
    </main>
  );
}
