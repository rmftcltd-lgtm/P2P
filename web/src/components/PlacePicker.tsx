"use client";

import { useState } from "react";

export type PlaceValue = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  id: string;
  label: string;
  value: PlaceValue | null;
  onChange: (place: PlaceValue) => void;
};

type Hit = PlaceValue & { id: string; label: string };

export function PlacePicker({ id, label, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.address ?? "");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 3) {
      setHits([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setHits([]);
      } else {
        setHits(data.places ?? []);
      }
    } catch {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  }

  function useGps() {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          address: `GPS ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setQuery(next.address);
        setHits([]);
        onChange(next);
      },
      () => setError("Could not read GPS location"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="label mb-0" htmlFor={id}>
          {label}
        </label>
        <button type="button" onClick={useGps} className="text-sm font-semibold text-moss underline-offset-2 hover:underline">
          Use my GPS
        </button>
      </div>
      <input
        id={id}
        className="field"
        value={query}
        placeholder="Search an address…"
        onChange={(e) => void search(e.target.value)}
        autoComplete="off"
      />
      {loading && <p className="mt-2 text-sm text-slate">Searching…</p>}
      {error && <p className="mt-2 text-sm text-[#8a2f2f]">{error}</p>}
      {hits.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-auto rounded-2xl border border-[var(--line)] bg-white/90">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-mist"
                onClick={() => {
                  setQuery(hit.address);
                  setHits([]);
                  onChange({
                    address: hit.address,
                    lat: hit.lat,
                    lng: hit.lng,
                  });
                }}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {value && (
        <p className="mt-2 text-xs text-slate">
          Selected: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
