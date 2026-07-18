"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

export type MapMarker = {
  id: string;
  position: LatLngExpression;
  label: string;
  tone?: "pickup" | "dropoff" | "driver";
};

type Props = {
  center: LatLngExpression;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
};

const MapInner = dynamic(() => import("./DeliveryMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-mist text-sm text-slate">
      Loading map…
    </div>
  ),
});

export function DeliveryMap(props: Props) {
  return (
    <div className={`overflow-hidden ${props.className ?? "h-72 md:h-96"}`}>
      <MapInner {...props} />
    </div>
  );
}
