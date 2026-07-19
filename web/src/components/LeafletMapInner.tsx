"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import type { MapMarker } from "./DeliveryMap";

const icon = (tone: MapMarker["tone"]) => {
  const color =
    tone === "dropoff" ? "#1c4f47" : tone === "driver" ? "#f0c01a" : "#0e1210";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:999px;background:${color};border:2px solid #fff"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
};

export default function LeafletMapInner({
  center,
  zoom = 13,
  markers = [],
}: Props) {
  const path = markers
    .filter((m) => m.tone === "pickup" || m.tone === "dropoff")
    .map((m) => m.position);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path.length >= 2 && (
        <Polyline positions={path} pathOptions={{ color: "#1c4f47", weight: 3 }} />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={m.position} icon={icon(m.tone)}>
          <Popup>{m.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
