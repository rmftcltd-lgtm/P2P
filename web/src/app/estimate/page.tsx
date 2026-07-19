"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { DEMO_PLACES, distanceKm, estimateFare, traditionalCompareFare } from "@/lib/geo";
import { SPACE_OPTIONS, spaceToPackageSize, LONELY_COVER_FEE } from "@/lib/spaces";

const FEE_RATE = 0.14;

export default function EstimatePage() {
  const [from, setFrom] = useState<PlaceValue | null>({
    address: DEMO_PLACES[0].address,
    lat: DEMO_PLACES[0].lat,
    lng: DEMO_PLACES[0].lng,
  });
  const [to, setTo] = useState<PlaceValue | null>({
    address: DEMO_PLACES[5].address,
    lat: DEMO_PLACES[5].lat,
    lng: DEMO_PLACES[5].lng,
  });
  const [space, setSpace] = useState("boot_sedan");
  const [cover, setCover] = useState(false);
  const [donateBrake, setDonateBrake] = useState(false);
  const [donateTrees, setDonateTrees] = useState(false);

  const estimate = useMemo(() => {
    if (!from || !to) return null;
    const d = distanceKm(from.lat, from.lng, to.lat, to.lng);
    const amount = estimateFare(d, spaceToPackageSize(space));
    const fees = Math.round(amount * FEE_RATE * 100) / 100;
    const insurance = cover ? LONELY_COVER_FEE : 0;
    const donate =
      (donateBrake ? amount * 0.01 : 0) + (donateTrees ? amount * 0.01 : 0);
    const total = amount + insurance + donate;
    return {
      distance: d,
      amount,
      fees,
      insurance,
      donate: Math.round(donate * 100) / 100,
      total: Math.round(total * 100) / 100,
      traditional: traditionalCompareFare(amount),
    };
  }, [from, to, space, cover, donateBrake, donateTrees]);

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-5 py-8 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">Get an estimate</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight md:text-5xl">Price guide</h1>
        <p className="mt-2 text-slate">
          Instant NZD estimate before you list or request — no account needed.
        </p>

        <div className="panel mt-8 space-y-4 p-5">
          <PlacePicker
            id="estimate-from"
            label="Item location"
            value={from}
            onChange={setFrom}
            placeholder="Search pickup address…"
          />
          <PlacePicker
            id="estimate-to"
            label="Item destination"
            value={to}
            onChange={setTo}
            placeholder="Search drop-off address…"
          />
          <label className="block text-sm">
            <span className="label">Stuff will fit in</span>
            <select className="field" value={space} onChange={(e) => setSpace(e.target.value)}>
              {SPACE_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} />
            Lonely Cover (+${LONELY_COVER_FEE}, up to $2,000)
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
        </div>

        {estimate && (
          <div className="panel mt-6 space-y-2 p-5">
            <p className="text-sm text-slate">~{estimate.distance.toFixed(0)} km</p>
            <Row label="Amount" value={estimate.amount} />
            <Row label="Platform fees (incl. in guide)" value={estimate.fees} muted />
            <Row label="Lonely Cover" value={estimate.insurance} />
            <Row label="Donate" value={estimate.donate} />
            <div className="flex justify-between border-t border-[var(--line)] pt-3 font-display text-2xl font-bold">
              <span>Total</span>
              <span>${estimate.total.toFixed(2)}</span>
            </div>
            <p className="text-sm text-slate">
              Typical courier compare ~${estimate.traditional.toFixed(0)}
            </p>
            <p className="text-xs leading-relaxed text-slate">
              I, the Sender, agree items are carried at the owner&apos;s risk unless Lonely Cover
              applies or the driver intentionally causes loss or damage.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-slate" : ""}`}>
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}
