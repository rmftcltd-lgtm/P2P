import { requireSession } from "@/lib/auth";
import { placesQuerySchema } from "@/lib/validators";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const { q, limit } = placesQuerySchema.parse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit") ?? 5,
    });

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "RelayDeliveryMVP/1.0 (local-dev)",
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

    return jsonOk({ places });
  } catch (err) {
    return handleApiError(err);
  }
}
