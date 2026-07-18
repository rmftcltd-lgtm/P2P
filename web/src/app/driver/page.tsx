"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { DeliveryMap } from "@/components/DeliveryMap";
import { DEMO_PLACES } from "@/lib/geo";
import { usePolling } from "@/lib/use-polling";
import type { DeliveryStatusValue } from "@/lib/delivery-status";

type Job = {
  id: string;
  status: DeliveryStatusValue;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  offerAmount: number;
  distanceKm: number;
  distanceFromDriverKm: number;
  packageSize: string;
  packageNotes?: string | null;
  customer: { name: string };
};

type Active = {
  id: string;
  status: DeliveryStatusValue;
  pickupAddress: string;
  dropoffAddress: string;
  offerAmount: number;
};

export default function DriverPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Active[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    if (meData.user.driver) {
      setIsOnline(meData.user.driver.isOnline);
      if (meData.user.driver.lat != null) setLat(meData.user.driver.lat);
      if (meData.user.driver.lng != null) setLng(meData.user.driver.lng);
    }

    const jobsRes = await fetch("/api/drivers/jobs");
    const jobsData = await jobsRes.json();
    setJobs(jobsData.jobs ?? []);

    const mine = await fetch("/api/deliveries");
    const mineData = await mine.json();
    setActive(
      (mineData.deliveries ?? []).filter((d: Active) =>
        ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"].includes(d.status),
      ),
    );
  }, [router]);

  usePolling(load, 4000);

  async function setLocation(nextLat: number, nextLng: number) {
    setLat(nextLat);
    setLng(nextLng);
    const res = await fetch("/api/drivers/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: nextLat, lng: nextLng }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not update location");
      return;
    }
    setMessage("Location updated");
    await load();
  }

  async function toggleOnline() {
    setError("");
    const res = await fetch("/api/drivers/location", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: !isOnline }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not change availability");
      return;
    }
    setIsOnline(data.driver.isOnline);
    setMessage(data.driver.isOnline ? "You are online" : "You are offline");
    await load();
  }

  async function accept(id: string) {
    setError("");
    const res = await fetch(`/api/deliveries/${id}/accept`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not accept");
      return;
    }
    router.push(`/driver/deliveries/${id}`);
  }

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:grid-cols-[0.95fr_1.05fr] md:px-10">
        <section>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Driver radio
          </h1>
          <p className="mt-2 text-slate">
            Set your pin, go online, and claim jobs within ~8 km of pickup.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={toggleOnline}
              className={`btn ${isOnline ? "btn-primary" : "btn-dark"}`}
            >
              {isOnline ? "Online — go offline" : "Go online"}
            </button>
            <span className="text-sm text-slate">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>

          <div className="mt-6">
            <label className="label" htmlFor="place">
              Simulate location
            </label>
            <select
              id="place"
              className="field"
              defaultValue=""
              onChange={(e) => {
                const place = DEMO_PLACES[Number(e.target.value)];
                if (place) setLocation(place.lat, place.lng);
              }}
            >
              <option value="" disabled>
                Jump to a demo neighborhood…
              </option>
              {DEMO_PLACES.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {(message || error) && (
            <p className={`mt-4 text-sm ${error ? "text-[#8a2f2f]" : "text-moss"}`}>
              {error || message}
            </p>
          )}

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-[var(--line)]">
            <DeliveryMap
              center={[lat, lng]}
              markers={[
                {
                  id: "me",
                  position: [lat, lng],
                  label: "You",
                  tone: "driver",
                },
                ...jobs.slice(0, 5).map((j) => ({
                  id: j.id,
                  position: [j.pickupLat, j.pickupLng] as [number, number],
                  label: `$${j.offerAmount} · ${j.distanceFromDriverKm.toFixed(1)} km`,
                  tone: "pickup" as const,
                })),
              ]}
            />
          </div>

          {active.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold">Active job</h2>
              {active.map((a) => (
                <Link
                  key={a.id}
                  href={`/driver/deliveries/${a.id}`}
                  className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white/60 p-4"
                >
                  <span>
                    {a.pickupAddress.split(",")[0]} → {a.dropoffAddress.split(",")[0]}
                  </span>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold">Nearby open jobs</h2>
          {!isOnline && (
            <p className="mt-2 text-sm text-slate">
              Go online to accept — you can still browse nearby requests.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {jobs.length === 0 && (
              <p className="text-slate">No open jobs in range right now.</p>
            )}
            {jobs.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-[var(--line)] bg-white/55 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {job.pickupAddress.split(",")[0]} →{" "}
                      {job.dropoffAddress.split(",")[0]}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      ${job.offerAmount.toFixed(2)} · trip {job.distanceKm} km ·{" "}
                      {job.distanceFromDriverKm.toFixed(1)} km to pickup ·{" "}
                      {job.packageSize.toLowerCase()} · {job.customer.name}
                    </p>
                    {job.packageNotes && (
                      <p className="mt-1 text-sm text-slate">{job.packageNotes}</p>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>
                <button
                  type="button"
                  onClick={() => accept(job.id)}
                  className="btn btn-primary mt-4"
                  disabled={!isOnline || active.length > 0}
                >
                  Accept job
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
