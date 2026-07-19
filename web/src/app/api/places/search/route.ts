import { placesQuerySchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { googleMapsApiKey } from "@/lib/google-maps";

/** Public place search — Google Places Text when keyed, else Nominatim. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { q, limit } = placesQuerySchema.parse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit") ?? 5,
    });

    const key = googleMapsApiKey();
    if (key) {
      const url = new URL(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
      );
      url.searchParams.set("query", q);
      url.searchParams.set("region", "nz");
      url.searchParams.set("key", key);
      const res = await fetch(url.toString(), { next: { revalidate: 0 } });
      if (!res.ok) return jsonError("Places provider unavailable", 502);
      const data = (await res.json()) as {
        status: string;
        results?: Array<{
          place_id: string;
          name: string;
          formatted_address: string;
          geometry: { location: { lat: number; lng: number } };
        }>;
        error_message?: string;
      };
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        return jsonError(data.error_message ?? `Google Places ${data.status}`, 502);
      }
      const places = (data.results ?? []).slice(0, limit).map((p) => ({
        id: p.place_id,
        label: p.formatted_address || p.name,
        address: p.formatted_address || p.name,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
      }));
      return jsonOk({ places, provider: "google" });
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("countrycodes", "nz");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Lonelyseat/1.0 (demo)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return jsonError("Places provider unavailable", 502);
    }

    const raw = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      place_id: number;
    }>;

    const places = raw.map((p) => ({
      id: String(p.place_id),
      label: p.display_name,
      address: p.display_name,
      lat: Number(p.lat),
      lng: Number(p.lon),
    }));

    return jsonOk({ places, provider: "nominatim" });
  } catch (err) {
    return handleApiError(err);
  }
}
