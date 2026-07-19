"use client";

import { useEffect, useState } from "react";

export type LabelOption = { key: string; label: string };

const FALLBACKS: Record<string, LabelOption[]> = {
  SPACE: [
    { key: "shoebox", label: "Shoebox / parcel" },
    { key: "frontseat", label: "Front seat" },
    { key: "backseat", label: "Back seat" },
    { key: "boot_sedan", label: "Boot (sedan)" },
    { key: "boot_hatch", label: "Boot (hatch/wagon)" },
    { key: "boot_other", label: "Boot (other)" },
    { key: "trailer", label: "Trailer" },
  ],
  TIME: [
    { key: "flexible", label: "Flexible" },
    { key: "morning", label: "Morning only (7am–midday)" },
    { key: "afternoon", label: "Afternoon only (midday–6pm)" },
    { key: "evening", label: "Evening only (after 6pm)" },
  ],
  RIDE: [
    { key: "pd", label: "Motorised PD (e.g. scooter / bike)" },
    { key: "hatch", label: "Hatchback" },
    { key: "sedan_small", label: "Small sedan" },
    { key: "ute", label: "Ute" },
    { key: "van_small", label: "Small van" },
    { key: "suv", label: "SUV" },
  ],
};

export function useLabels(category: "SPACE" | "TIME" | "RIDE") {
  const [labels, setLabels] = useState<LabelOption[]>(FALLBACKS[category] ?? []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/labels?category=${category}`);
        const data = await res.json();
        if (!cancelled && res.ok && Array.isArray(data.labels) && data.labels.length > 0) {
          setLabels(data.labels);
        }
      } catch {
        /* keep fallbacks */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return labels;
}
