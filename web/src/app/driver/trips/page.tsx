"use client";

import Link from "next/link";
import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { DEMO_PLACES } from "@/lib/geo";
import { SPACE_OPTIONS, TRIP_TYPE_LABELS } from "@/lib/spaces";
import { usePolling } from "@/lib/use-polling";

type Trip = {
  id: string;
  tripType: "ONE_WAY" | "DAY_TRIP" | "MULTI";
  fromAddress: string;
  toAddress: string;
  departAt: string;
  returnAt?: string | null;
  spaces: string;
  vehicleType: string;
  status: string;
  notes?: string | null;
};

export default function DriverTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripType, setTripType] = useState<"ONE_WAY" | "DAY_TRIP" | "MULTI">(
    "ONE_WAY",
  );
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [departAt, setDepartAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [spaces, setSpaces] = useState<string[]>(["shoebox", "backseat"]);
  const [vehicleType, setVehicleType] = useState("car");
  const [listedPrice, setListedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [multiToIdx, setMultiToIdx] = useState(4);
  const [multiDepartAt, setMultiDepartAt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.replace("/login");
      return;
    }
    const meData = await me.json();
    if (meData.user.role !== "DRIVER") {
      router.replace("/customer");
      return;
    }
    setUser(meData.user);
    const res = await fetch("/api/trips");
    const data = await res.json();
    setTrips(data.trips ?? []);
  }, [router]);

  usePolling(load, 15000);

  function toggleSpace(key: string) {
    setSpaces((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (fromIdx === toIdx) {
      setError("From and to must differ");
      return;
    }
    if (!departAt) {
      setError("Choose a departure date/time");
      return;
    }
    if (spaces.length === 0) {
      setError("Select at least one lonely seat / space");
      return;
    }
    setBusy(true);
    setError("");
    const from = DEMO_PLACES[fromIdx];
    const to = DEMO_PLACES[toIdx];
    const payload: Record<string, unknown> = {
      tripType,
      fromAddress: from.address,
      fromLat: from.lat,
      fromLng: from.lng,
      toAddress: to.address,
      toLat: to.lat,
      toLng: to.lng,
      departAt: new Date(departAt).toISOString(),
      returnAt:
        tripType === "DAY_TRIP" && returnAt
          ? new Date(returnAt).toISOString()
          : undefined,
      spaces,
      vehicleType,
      listedPrice: listedPrice ? Number(listedPrice) : undefined,
      notes: notes || undefined,
    };

    if (tripType === "MULTI") {
      const mid = DEMO_PLACES[multiToIdx];
      payload.extraLegs = [
        {
          fromAddress: to.address,
          fromLat: to.lat,
          fromLng: to.lng,
          toAddress: mid.address,
          toLat: mid.lat,
          toLng: mid.lng,
          departAt: new Date(multiDepartAt || departAt).toISOString(),
        },
      ];
    }

    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create listing");
      return;
    }
    setMessage(data.message ?? "Listing created");
    setNotes("");
    await load();
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[1.05fr_0.95fr] md:px-10">
        <section>
          <Link href="/driver" className="text-sm text-slate hover:underline">
            ← Back to radio
          </Link>
          <h1 className="mt-3 font-display text-4xl font-bold">
            List a lonely seat
          </h1>
          <p className="mt-2 text-slate">
            Tutorials: one-way, day trip, or multiple listings — publish the journey
            you&apos;re already making so senders can fill your empty space.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Trip type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["ONE_WAY", "DAY_TRIP", "MULTI"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTripType(t)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      tripType === t ? "bg-leaf text-ink" : "bg-mist text-slate"
                    }`}
                  >
                    {TRIP_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="from">
                From
              </label>
              <select
                id="from"
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
            </div>
            <div>
              <label className="label" htmlFor="to">
                To
              </label>
              <select
                id="to"
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
            </div>

            <div>
              <label className="label" htmlFor="depart">
                Departs
              </label>
              <input
                id="depart"
                type="datetime-local"
                className="field"
                value={departAt}
                onChange={(e) => setDepartAt(e.target.value)}
                required
              />
            </div>

            {tripType === "DAY_TRIP" && (
              <div>
                <label className="label" htmlFor="return">
                  Return (same day)
                </label>
                <input
                  id="return"
                  type="datetime-local"
                  className="field"
                  value={returnAt}
                  onChange={(e) => setReturnAt(e.target.value)}
                />
              </div>
            )}

            {tripType === "MULTI" && (
              <div className="space-y-3 rounded-2xl bg-white/50 p-4">
                <p className="font-semibold">Extra leg (multiple listings)</p>
                <select
                  className="field"
                  value={multiToIdx}
                  onChange={(e) => setMultiToIdx(Number(e.target.value))}
                >
                  {DEMO_PLACES.map((p, i) => (
                    <option key={p.label} value={i}>
                      Next stop: {p.label}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  className="field"
                  value={multiDepartAt}
                  onChange={(e) => setMultiDepartAt(e.target.value)}
                  placeholder="Second leg departs"
                />
              </div>
            )}

            <div>
              <label className="label">Spaces available</label>
              <div className="flex flex-wrap gap-2">
                {SPACE_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSpace(s.key)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      spaces.includes(s.key)
                        ? "bg-leaf font-semibold text-ink"
                        : "bg-mist text-slate"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="vehicle">
                Vehicle
              </label>
              <select
                id="vehicle"
                className="field"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="bike">Bike</option>
                <option value="scooter">Scooter</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </div>

            <div>
              <label className="label" htmlFor="price">
                Asking price (NZD, optional)
              </label>
              <input
                id="price"
                type="number"
                min={1}
                step={1}
                className="field"
                value={listedPrice}
                onChange={(e) => setListedPrice(e.target.value)}
                placeholder="e.g. 110"
              />
            </div>

            <div>
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className="field min-h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Flexible on timing, boot only, etc."
              />
            </div>

            {error && <p className="text-sm text-[#8a2f2f]">{error}</p>}
            {message && <p className="text-sm text-moss">{message}</p>}

            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Publishing…" : "Publish journey"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Your listings</h2>
          <div className="mt-4 space-y-3">
            {trips.length === 0 && (
              <p className="text-slate">No journeys listed yet.</p>
            )}
            {trips.map((t) => (
              <article
                key={t.id}
                className="rounded-2xl border border-[var(--line)] bg-white/55 p-4"
              >
                <p className="font-semibold">
                  {t.fromAddress.split(",")[0]} → {t.toAddress.split(",")[0]}
                </p>
                <p className="mt-1 text-sm text-slate">
                  {TRIP_TYPE_LABELS[t.tripType]} · {t.status.toLowerCase()} ·{" "}
                  {new Date(t.departAt).toLocaleString()} · {t.vehicleType}
                </p>
                <p className="mt-1 text-sm text-slate">
                  Spaces: {JSON.parse(t.spaces || "[]").join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
