"use client";

import { useEffect, useId, useRef, useState } from "react";
import { googleMapsEnabled, loadGoogleMaps } from "@/lib/google-maps";

export type PlaceValue = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  id?: string;
  label: string;
  value: PlaceValue | null;
  onChange: (place: PlaceValue) => void;
  placeholder?: string;
  showGps?: boolean;
};

type Hit = PlaceValue & { id: string; label: string };

/**
 * Google Places Autocomplete (NZ-biased). Falls back to Nominatim search
 * when NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.
 */
export function PlacePicker({
  id,
  label,
  value,
  onChange,
  placeholder = "Search an address…",
  showGps = false,
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(value?.address ?? "");
  const [useFallback, setUseFallback] = useState(!googleMapsEnabled());
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setQuery(value?.address ?? "");
  }, [value?.address]);

  useEffect(() => {
    if (!googleMapsEnabled()) {
      setUseFallback(true);
      return;
    }

    let cancelled = false;
    let listener: google.maps.MapsEventListener | null = null;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    void loadGoogleMaps()
      .then((g) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name", "place_id"],
          componentRestrictions: { country: ["nz"] },
          types: ["geocode"],
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          const loc = place?.geometry?.location;
          if (!place || !loc) {
            setError("Choose an address from the suggestions");
            return;
          }
          const address = place.formatted_address || place.name || "";
          setQuery(address);
          setError("");
          setHits([]);
          onChange({
            address,
            lat: loc.lat(),
            lng: loc.lng(),
          });
        });
        setUseFallback(false);
      })
      .catch(() => {
        if (!cancelled) setUseFallback(true);
      });

    return () => {
      cancelled = true;
      if (listener) listener.remove();
    };
    // Intentionally mount-once for Autocomplete binding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchFallback(q: string) {
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
      setError("Location not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          address: "Current location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setQuery(next.address);
        setHits([]);
        onChange(next);
      },
      () => setError("Could not read location"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="label mb-0" htmlFor={inputId}>
          {label}
        </label>
        {showGps && (
          <button
            type="button"
            onClick={useGps}
            className="text-sm font-medium text-sea underline-offset-2 hover:underline"
          >
            Use my location
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id={inputId}
        className="field"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          if (useFallback) void searchFallback(e.target.value);
          else setQuery(e.target.value);
        }}
        autoComplete="off"
      />
      {useFallback && loading && <p className="mt-2 text-sm text-slate">Searching…</p>}
      {error && <p className="mt-2 text-sm text-[#8a2f2f]">{error}</p>}
      {useFallback && hits.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-[var(--line)] bg-white/95">
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
    </div>
  );
}
