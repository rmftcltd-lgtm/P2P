"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";
import type { MapMarker } from "./DeliveryMap";

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
};

function toLatLng(position: MapMarker["position"]): google.maps.LatLngLiteral {
  if (Array.isArray(position)) {
    return { lat: Number(position[0]), lng: Number(position[1]) };
  }
  const p = position as { lat: number; lng: number };
  return { lat: Number(p.lat), lng: Number(p.lng) };
}

export default function GoogleMapInner({
  center,
  zoom = 13,
  markers = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Polyline>>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    void loadGoogleMaps().then((g) => {
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new g.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
        });
      } else {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);
      }

      for (const overlay of overlaysRef.current) overlay.setMap(null);
      overlaysRef.current = [];

      const path: google.maps.LatLngLiteral[] = [];
      for (const m of markers) {
        const position = toLatLng(m.position);
        if (m.tone === "pickup" || m.tone === "dropoff") path.push(position);

        const color =
          m.tone === "dropoff"
            ? "#1c4f47"
            : m.tone === "driver"
              ? "#f0c01a"
              : "#0e1210";

        const marker = new g.maps.Marker({
          map: mapRef.current!,
          position,
          title: m.label,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        const info = new g.maps.InfoWindow({ content: m.label });
        marker.addListener("click", () =>
          info.open({ map: mapRef.current!, anchor: marker }),
        );
        overlaysRef.current.push(marker);
      }

      if (path.length >= 2) {
        const line = new g.maps.Polyline({
          path,
          map: mapRef.current!,
          strokeColor: "#1c4f47",
          strokeOpacity: 0.9,
          strokeWeight: 3,
        });
        overlaysRef.current.push(line);
        const bounds = new g.maps.LatLngBounds();
        for (const p of path) bounds.extend(p);
        for (const m of markers) {
          if (m.tone === "driver") bounds.extend(toLatLng(m.position));
        }
        mapRef.current!.fitBounds(bounds, 48);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, zoom, markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}
