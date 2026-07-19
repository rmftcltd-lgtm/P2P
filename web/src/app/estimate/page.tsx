"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { PlacePicker, type PlaceValue } from "@/components/PlacePicker";
import { distanceKm, estimateFare } from "@/lib/geo";
import { spaceToPackageSize, LONELY_COVER_FEE } from "@/lib/spaces";
import { useLabels } from "@/lib/use-labels";
import { SpacePicker } from "@/components/SpacePicker";

export default function EstimatePage() {
  const [from, setFrom] = useState<PlaceValue | null>(null);
  const [to, setTo] = useState<PlaceValue | null>(null);
  const [space, setSpace] = useState("boot_sedan");
  const [cover, setCover] = useState(false);
  const [donateBrake, setDonateBrake] = useState(false);
  const [donateTrees, setDonateTrees] = useState(false);
  const spaceLabels = useLabels("SPACE");

  const estimate = useMemo(() => {
    if (!from || !to) return null;
    const d = distanceKm(from.lat, from.lng, to.lat, to.lng);
    const amount = estimateFare(d, spaceToPackageSize(space));
    const insurance = cover ? LONELY_COVER_FEE : 0;
    const donate =
      (donateBrake ? amount * 0.01 : 0) + (donateTrees ? amount * 0.01 : 0);
    const total = amount + insurance + donate;
    return {
      distance: d,
      amount,
      insurance,
      donate: Math.round(donate * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [from, to, space, cover, donateBrake, donateTrees]);

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-xl px-5 py-8 md:px-10">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Fare guide</h1>
        <p className="mt-2 text-slate">Quick NZD estimate — no account needed.</p>

        <div className="panel mt-8 space-y-4 p-5">
          <PlacePicker
            id="estimate-from"
            label="From"
            value={from}
            onChange={setFrom}
            placeholder="Pick-up address…"
          />
          <PlacePicker
            id="estimate-to"
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
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} />
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
        </div>

        {estimate && (
          <div className="panel mt-6 space-y-2 p-5">
            <p className="text-sm text-slate">~{estimate.distance.toFixed(0)} km</p>
            <Row label="Amount" value={estimate.amount} />
            {estimate.insurance > 0 && <Row label="Lonely Cover" value={estimate.insurance} />}
            {estimate.donate > 0 && <Row label="Donate" value={estimate.donate} />}
            <div className="flex justify-between border-t border-[var(--line)] pt-3 font-display text-2xl font-bold">
              <span>Total</span>
              <span>${estimate.total.toFixed(2)}</span>
            </div>
          </div>
        )}
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
