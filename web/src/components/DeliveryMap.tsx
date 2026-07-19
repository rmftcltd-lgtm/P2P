"use client";

import dynamic from "next/dynamic";
import { googleMapsEnabled } from "@/lib/google-maps";

export type MapMarker = {
  id: string;
  position: { lat: number; lng: number } | [number, number];
  label: string;
  tone?: "pickup" | "dropoff" | "driver" | "trip" | "stuff";
};

type Props = {
  center: { lat: number; lng: number } | [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
};

const GoogleMapInner = dynamic(() => import("./GoogleMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mist text-sm text-slate">
      Loading Google Maps…
    </div>
  ),
});

const LeafletMapInner = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mist text-sm text-slate">
      Loading map…
    </div>
  ),
});

function normalizeCenter(
  center: Props["center"],
): { lat: number; lng: number } {
  if (Array.isArray(center)) return { lat: center[0], lng: center[1] };
  return center;
}

export function DeliveryMap(props: Props) {
  const center = normalizeCenter(props.center);
  const MapInner = googleMapsEnabled() ? GoogleMapInner : LeafletMapInner;

  return (
    <div className={`overflow-hidden ${props.className ?? "h-72 md:h-96"}`}>
      <MapInner center={center} zoom={props.zoom} markers={props.markers} />
    </div>
  );
}
