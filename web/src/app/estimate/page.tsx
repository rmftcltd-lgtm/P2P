"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import {
  distanceKm,
  estimateFare,
  estimateCourierFreightFare,
  estimateDriverTake,
} from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE, spaceMeta } from "@/lib/spaces";
import { useLabels } from "@/lib/use-labels";
import { SpacePicker } from "@/components/SpacePicker";
import {
  fareGuideContinuePath,
  fareGuideRegisterPath,
  saveFareGuideDraft,
  type FareGuideMode,
} from "@/lib/fare-guide-draft";

type OpportunityTrip = {
  id: string;
  fromAddress: string;
  toAddress: string;
  departAt: string;
  listedPrice?: number | null;
  spaces: string[];
  driver: { name: string };
};

type OpportunityStuff = {
  id: string;
  itemTitle: string;
  pickupAddress: string;
  dropoffAddress: string;
  spaceNeeded: string;
  offerAmount: number;
  customerName: string;
};

export default function EstimatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<FareGuideMode>("driver");
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [space, setSpace] = useState("boot_sedan");
  const [cover, setCover] = useState(false);
  const [donateBrake, setDonateBrake] = useState(false);
  const [donateTrees, setDonateTrees] = useState(false);
  const [session, setSession] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [trips, setTrips] = useState<OpportunityTrip[]>([]);
  const [stuff, setStuff] = useState<OpportunityStuff[]>([]);
  const [opsBusy, setOpsBusy] = useState(false);
  const spaceLabels = useLabels("SPACE");

  useEffect(() => {
    void fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          setSession(null);
          return;
        }
        const data = await res.json();
        setSession(data.user);
      })
      .catch(() => setSession(null));
  }, []);

  const estimate = useMemo(() => {
    if (!from || !to) return null;
    const d = distanceKm(from.lat, from.lng, to.lat, to.lng);
    const size = spaceToPackageSize(space);
    const courierFreight = estimateCourierFreightFare(d, size);
    const amount = estimateFare(d, size);
    const driverTake = estimateDriverTake(amount);
    const insurance = cover ? LONELY_COVER_FEE : 0;
    const donate =
      (donateBrake ? amount * 0.01 : 0) + (donateTrees ? amount * 0.01 : 0);
    const total = amount + insurance + donate;
    const saving = Math.round((courierFreight - amount) * 100) / 100;
    return {
      distance: d,
      courierFreight,
      amount,
      driverTake,
      insurance,
      donate: Math.round(donate * 100) / 100,
      total: Math.round(total * 100) / 100,
      saving,
    };
  }, [from, to, space, cover, donateBrake, donateTrees]);

  const loadOpportunities = useCallback(async () => {
    if (!from || !to) {
      setTrips([]);
      setStuff([]);
      return;
    }
    setOpsBusy(true);
    const params = new URLSearchParams({
      fromLat: String(from.lat),
      fromLng: String(from.lng),
      toLat: String(to.lat),
      toLng: String(to.lng),
      radiusKm: "120",
      sort: "latest",
    });
    if (space) params.set("space", space);
    try {
      if (mode === "sender") {
        const res = await fetch(`/api/browse/drivers?${params}`);
        const data = await res.json();
        setTrips(res.ok ? (data.trips ?? []) : []);
        setStuff([]);
      } else {
        const res = await fetch(`/api/browse/stuff?${params}`);
        const data = await res.json();
        setStuff(res.ok ? (data.stuff ?? data.deliveries ?? []) : []);
        setTrips([]);
      }
    } catch {
      setTrips([]);
      setStuff([]);
    } finally {
      setOpsBusy(false);
    }
  }, [from, to, space, mode]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  function persistDraft() {
    if (!from || !to || !estimate) return;
    saveFareGuideDraft({
      mode,
      from,
      to,
      space,
      spaces: [space],
      lonelyCover: cover,
      donateBrake,
      donateTrees,
      listedPrice: estimate.amount,
      offerAmount: estimate.total,
      driverTake: estimate.driverTake,
    });
  }

  async function continueListing() {
    if (!from || !to || !estimate) return;
    persistDraft();

    const continuePath = fareGuideContinuePath(mode);
    if (!session) {
      router.push(fareGuideRegisterPath(mode));
      return;
    }

    if (mode === "driver") {
      if (session.role === "DRIVER") router.push(continuePath);
      else router.push(fareGuideRegisterPath("driver"));
      return;
    }

    if (session.role === "CUSTOMER") router.push(continuePath);
    else router.push(fareGuideRegisterPath("sender"));
  }

  const opportunities =
    mode === "driver"
      ? stuff.slice(0, 5)
      : trips.slice(0, 5);

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={session} />
      <div className="mx-auto max-w-xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
          Fare guide
        </h1>
        <p className="mt-2 text-slate">
          Check a route, see the guide price, then list in a few taps — or grab an
          opportunity already on the road.
        </p>

        <div
          className="relative mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-mist p-1"
          role="tablist"
          aria-label="Fare guide mode"
        >
          {(
            [
              { id: "driver" as const, label: "How much can I get?" },
              { id: "sender" as const, label: "How much to send something?" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold leading-snug transition ${
                mode === tab.id
                  ? "bg-white text-ink shadow-sm"
                  : "text-slate hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="panel mt-6 space-y-4 p-5" role="tabpanel">
          <PlacePicker
            id="estimate-from"
            label={mode === "driver" ? "I'm leaving from" : "Pick-up"}
            value={from}
            onChange={setFrom}
            placeholder="Search address…"
          />
          <PlacePicker
            id="estimate-to"
            label={mode === "driver" ? "I'm heading to" : "Drop-off"}
            value={to}
            onChange={setTo}
            placeholder="Search address…"
          />
          <SpacePicker
            label={mode === "driver" ? "Space I can offer" : "Stuff will fit in"}
            value={space}
            onChange={setSpace}
            options={spaceLabels}
          />

          {mode === "sender" ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cover}
                  onChange={(e) => setCover(e.target.checked)}
                />
                <span>
                  Lonely Cover (+${LONELY_COVER_FEE}) ·{" "}
                  <a href="/lonely-cover" className="text-sea underline underline-offset-4">
                    Policy
                  </a>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={donateBrake}
                  onChange={(e) => setDonateBrake(e.target.checked)}
                />
                Support Brake (+1%)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={donateTrees}
                  onChange={(e) => setDonateTrees(e.target.checked)}
                />
                Support Trees That Count (+1%)
              </label>
            </>
          ) : null}
        </div>

        {estimate ? (
          <div className="panel mt-6 space-y-3 p-5">
            <p className="text-sm text-slate">~{estimate.distance.toFixed(0)} km</p>
            {mode === "driver" ? (
              <>
                <div className="flex justify-between text-sm text-slate">
                  <span>Courier / freight guide</span>
                  <span className="line-through">${estimate.courierFreight.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Typical lonely seat fare</span>
                  <span>${estimate.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--line)] pt-3 font-display text-2xl font-bold">
                  <span>You could earn</span>
                  <span>${estimate.driverTake.toFixed(2)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate">
                  After the platform share. Actual payout depends on the agreed fare and any
                  Lonely Cover or donations on the booking.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm text-slate">
                  <span>Courier / freight guide</span>
                  <span className="line-through">${estimate.courierFreight.toFixed(2)}</span>
                </div>
                <Row label="Lonelyseat" value={estimate.amount} />
                {estimate.insurance > 0 && (
                  <Row label="Lonely Cover" value={estimate.insurance} />
                )}
                {estimate.donate > 0 && <Row label="Donate" value={estimate.donate} />}
                <p className="text-sm font-medium text-moss">
                  You save about ${estimate.saving.toFixed(2)} vs that guide
                </p>
                <div className="flex justify-between border-t border-[var(--line)] pt-3 font-display text-2xl font-bold">
                  <span>To send</span>
                  <span>${estimate.total.toFixed(2)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate">
                  Guide reflects typical NZ courier and domestic freight bands (including
                  Mainfreight-style door-to-door jobs). Actual carrier quotes vary.
                </p>
              </>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate">
            Choose from and to places to see your guide.
          </p>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">
            {mode === "driver" ? "Stuff needing a lift" : "Lonely seats nearby"}
          </h2>
          <p className="mt-1 text-sm text-slate">
            {mode === "driver"
              ? "Open listings along this journey you could claim."
              : "Drivers already heading this way."}
          </p>

          <div className="mt-4 space-y-3">
            {opsBusy && <p className="text-sm text-slate">Looking for opportunities…</p>}
            {!opsBusy && opportunities.length === 0 && from && to && (
              <p className="text-sm text-slate">
                Nothing listed on this drive yet — be the first to publish.
              </p>
            )}
            {!opsBusy &&
              mode === "driver" &&
              stuff.slice(0, 5).map((item) => (
                <article key={item.id} className="panel p-4">
                  <p className="font-semibold">{item.itemTitle || "Item"}</p>
                  <p className="mt-1 text-sm text-slate">
                    {item.pickupAddress.split(",")[0]} → {item.dropoffAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    {spaceMeta(item.spaceNeeded)?.label ?? item.spaceNeeded} · $
                    {item.offerAmount.toFixed(0)} · {item.customerName}
                  </p>
                  <Link href="/browse/stuff" className="mt-3 inline-block text-sm font-medium text-sea underline underline-offset-4">
                    View on Find stuff
                  </Link>
                </article>
              ))}
            {!opsBusy &&
              mode === "sender" &&
              trips.slice(0, 5).map((trip) => (
                <article key={trip.id} className="panel p-4">
                  <p className="font-semibold">{trip.driver.name}</p>
                  <p className="mt-1 text-sm text-slate">
                    {trip.fromAddress.split(",")[0]} → {trip.toAddress.split(",")[0]}
                  </p>
                  <p className="mt-1 text-sm text-slate">
                    Departs {new Date(trip.departAt).toLocaleString()} ·{" "}
                    {trip.listedPrice != null ? `from $${trip.listedPrice}` : "Open to offers"}
                  </p>
                  <Link href="/browse/drivers" className="mt-3 inline-block text-sm font-medium text-sea underline underline-offset-4">
                    View on Find a ride
                  </Link>
                </article>
              ))}
          </div>
        </section>

        <div className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="font-display text-2xl font-semibold">
            {mode === "driver" ? "List this journey" : "List this send"}
          </h2>
          <p className="mt-2 text-sm text-slate">
            {mode === "driver"
              ? "We'll carry your route, space, and guide price into the driver form — sign up if you need an account, then publish."
              : "We'll carry your pick-up, drop-off, space, and guide total into the send form — sign up if you need an account, then post."}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-5 w-full sm:w-auto"
            disabled={!estimate}
            onClick={() => void continueListing()}
          >
            {!estimate
              ? "Add a route first"
              : !session
                ? mode === "driver"
                  ? "Sign up & list this journey"
                  : "Sign up & list this send"
                : mode === "driver"
                  ? session.role === "DRIVER"
                    ? "Continue to list journey"
                    : "Create a driver account to list"
                  : session.role === "CUSTOMER"
                    ? "Continue to list send"
                    : "Create a sender account to list"}
          </button>
          {!session ? (
            <p className="mt-3 text-sm text-slate">
              Already joined?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(fareGuideContinuePath(mode))}`}
                className="font-medium text-sea underline underline-offset-4"
                onClick={() => persistDraft()}
              >
                Sign in
              </Link>{" "}
              and we&apos;ll still pre-fill the form.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}
