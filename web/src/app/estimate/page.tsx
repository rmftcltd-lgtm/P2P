"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import {
  distanceKm,
  estimateFare,
  estimateFreightFare,
  estimateDriverTake,
  estimateSenderFare,
} from "@/lib/geo";
import { spaceMeta } from "@/lib/spaces";
import { BRAND_NAME } from "@/lib/brand";
import { fareRange, formatFareRange } from "@/lib/fees";
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
  return (
    <Suspense fallback={<main className="atmosphere min-h-screen" />}>
      <EstimatePageInner />
    </Suspense>
  );
}

function modeFromParam(value: string | null): FareGuideMode {
  return value === "sender" ? "sender" : "driver";
}

function EstimatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<FareGuideMode>(() =>
    modeFromParam(searchParams.get("mode")),
  );
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [space, setSpace] = useState("boot_sedan");
  const [session, setSession] = useState<{
    name: string;
    role: string;
  } | null>(null);
  const [trips, setTrips] = useState<OpportunityTrip[]>([]);
  const [stuff, setStuff] = useState<OpportunityStuff[]>([]);
  const [opsBusy, setOpsBusy] = useState(false);
  const spaceLabels = useLabels("SPACE");

  useEffect(() => {
    setMode(modeFromParam(searchParams.get("mode")));
  }, [searchParams]);

  function selectMode(next: FareGuideMode) {
    setMode(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", next);
    router.replace(`/estimate?${params.toString()}`, { scroll: false });
  }

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
    const courierFreight = estimateFreightFare(d, space);
    const amount = estimateFare(d, space);
    const senderFare = estimateSenderFare(amount);
    const driverTake = estimateDriverTake(amount);
    const saving = Math.round((courierFreight - senderFare) * 100) / 100;
    return {
      distance: d,
      courierFreight,
      amount,
      senderFare,
      driverTake,
      total: senderFare,
      saving,
    };
  }, [from, to, space]);

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
    mode === "driver" ? stuff.slice(0, 5) : trips.slice(0, 5);
  const hasRoute = Boolean(from && to);
  const showOpportunities =
    hasRoute && !opsBusy && opportunities.length > 0;
  const showEmptyListCta =
    Boolean(estimate) && hasRoute && !opsBusy && opportunities.length === 0;

  const listLabel =
    mode === "driver" ? "List this journey" : "List this send";

  const priceGuideNote =
    mode === "driver"
      ? "Price is set by the sender so this is just a price guide based on space size and distance."
      : "Price is set by the driver so this is just a price guide based on space size and distance.";

  const savingBand = fareRange(Math.max(0, estimate?.saving ?? 0));

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
              onClick={() => selectMode(tab.id)}
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

        <div className="panel relative z-20 mt-6 space-y-4 p-5" role="tabpanel">
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
        </div>

        {estimate ? (
          <div className="panel relative z-10 mt-6 space-y-3 p-5">
            {mode === "driver" ? (
              <>
                <div className="flex justify-between font-display text-2xl font-bold">
                  <span>You could earn</span>
                  <span>{formatFareRange(estimate.driverTake)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate">{priceGuideNote}</p>
              </>
            ) : (
              <>
                <div className="flex justify-between text-sm text-slate">
                  <span>Freight cost</span>
                  <span className="line-through">
                    {formatFareRange(estimate.courierFreight)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{BRAND_NAME}</span>
                  <span>{formatFareRange(estimate.senderFare)}</span>
                </div>
                <p className="text-sm font-medium text-moss">
                  You save between ${savingBand.low} to ${savingBand.high}
                </p>
                <div className="flex justify-between border-t border-[var(--line)] pt-3 font-display text-2xl font-bold">
                  <span>To send</span>
                  <span>{formatFareRange(estimate.total)}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate">{priceGuideNote}</p>
              </>
            )}
          </div>
        ) : null}

        {opsBusy && hasRoute ? (
          <p className="mt-8 text-sm text-slate">Looking for opportunities…</p>
        ) : null}

        {showOpportunities ? (
          <section className="mt-8 overflow-hidden rounded-2xl border-2 border-sea bg-sea-soft/80 p-5 shadow-[0_12px_40px_rgba(28,79,71,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">
              Available now
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-sea md:text-4xl">
              {mode === "driver" ? "Stuff needing a lift" : "Lonely seats nearby"}
            </h2>
            <p className="mt-2 text-base font-medium text-ink/80">
              {mode === "driver"
                ? `${opportunities.length} open listing${opportunities.length === 1 ? "" : "s"} on this journey — claim one or list your own.`
                : `${opportunities.length} driver${opportunities.length === 1 ? "" : "s"} already heading this way — book one or list your send.`}
            </p>

            <div className="mt-5 space-y-3">
              {mode === "driver"
                ? stuff.slice(0, 5).map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-sea/20 bg-white/90 p-4"
                    >
                      <p className="font-display text-lg font-semibold">{item.itemTitle || "Item"}</p>
                      <p className="mt-1 text-sm text-slate">
                        {item.pickupAddress.split(",")[0]} →{" "}
                        {item.dropoffAddress.split(",")[0]}
                      </p>
                      <p className="mt-1 text-sm font-medium text-sea">
                        {spaceMeta(item.spaceNeeded)?.label ?? item.spaceNeeded} · $
                        {item.offerAmount.toFixed(0)} · {item.customerName}
                      </p>
                      <Link
                        href="/browse/stuff"
                        className="mt-3 inline-block text-sm font-semibold text-sea underline underline-offset-4"
                      >
                        View on Find stuff to take
                      </Link>
                    </article>
                  ))
                : trips.slice(0, 5).map((trip) => (
                    <article
                      key={trip.id}
                      className="rounded-xl border border-sea/20 bg-white/90 p-4"
                    >
                      <p className="font-display text-lg font-semibold">{trip.driver.name}</p>
                      <p className="mt-1 text-sm text-slate">
                        {trip.fromAddress.split(",")[0]} → {trip.toAddress.split(",")[0]}
                      </p>
                      <p className="mt-1 text-sm font-medium text-sea">
                        Departs {new Date(trip.departAt).toLocaleString()} ·{" "}
                        {trip.listedPrice != null
                          ? `from $${trip.listedPrice}`
                          : "Open to offers"}
                      </p>
                      <Link
                        href="/browse/drivers"
                        className="mt-3 inline-block text-sm font-semibold text-sea underline underline-offset-4"
                      >
                        View on Find your stuff a ride
                      </Link>
                    </article>
                  ))}
            </div>

            <button
              type="button"
              className="btn btn-primary mt-6 w-full"
              disabled={!estimate}
              onClick={() => void continueListing()}
            >
              {listLabel}
            </button>
          </section>
        ) : null}

        {showEmptyListCta ? (
          <button
            type="button"
            className="btn btn-primary mt-8 w-full"
            disabled={!estimate}
            onClick={() => void continueListing()}
          >
            {listLabel}
          </button>
        ) : null}
      </div>
    </main>
  );
}
