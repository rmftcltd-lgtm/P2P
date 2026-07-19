"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { DeliveryMap } from "@/components/DeliveryMap";
import { ShareListingButton } from "@/components/ShareListingButton";
import { listingShareUrl } from "@/lib/urgency";

type Listing = {
  requestCode: string;
  itemTitle: string;
  pickupCity: string;
  dropoffCity: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  spaceLabel: string;
  offerAmount: number;
  urgencyLabel: string;
  marketplaceUrl: string | null;
  open: boolean;
  offerCount: number;
  customerFirstName: string;
};

export default function PublicListingPage() {
  const params = useParams<{ code: string }>();
  const code = String(params.code ?? "").replace(/^#/, "");
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    if (!code) return;
    void fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => null);

    void fetch(`/api/listings/${encodeURIComponent(code)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Listing not found");
          return;
        }
        setListing(data.listing);
      })
      .catch(() => setError("Could not load listing"));
  }, [code]);

  const shareUrl = code ? listingShareUrl(code) : "";
  const trademeBlurb = listing
    ? `Need this moved? Lonelyseat can match a Kiwi already heading that way: ${shareUrl}`
    : "";

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <div className="mx-auto max-w-xl px-5 py-8 md:px-10">
        {error ? (
          <p className="text-sm text-[#8a2f2f]">{error}</p>
        ) : !listing ? (
          <p className="text-sm text-slate">Loading listing…</p>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">
              Shared listing #{listing.requestCode}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
              {listing.itemTitle}
            </h1>
            <p className="mt-2 text-slate">
              {listing.pickupCity} → {listing.dropoffCity} · {listing.spaceLabel} ·{" "}
              {listing.urgencyLabel}
            </p>
            <p className="mt-4 font-display text-3xl font-bold">
              ${listing.offerAmount.toFixed(0)}
            </p>
            <p className="mt-1 text-sm text-slate">
              Listed by {listing.customerFirstName}
              {listing.open ? ` · ${listing.offerCount} offer(s)` : " · no longer open"}
            </p>

            {listing.marketplaceUrl ? (
              <p className="mt-4 text-sm">
                <a
                  href={listing.marketplaceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-sea underline underline-offset-4"
                >
                  Open TradeMe / marketplace listing
                </a>
              </p>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)]">
              <DeliveryMap
                className="h-56"
                center={{ lat: listing.pickupLat, lng: listing.pickupLng }}
                zoom={6}
                markers={[
                  {
                    id: "pickup",
                    position: { lat: listing.pickupLat, lng: listing.pickupLng },
                    label: listing.pickupCity,
                    tone: "pickup",
                  },
                  {
                    id: "dropoff",
                    position: { lat: listing.dropoffLat, lng: listing.dropoffLng },
                    label: listing.dropoffCity,
                    tone: "dropoff",
                  },
                ]}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ShareListingButton requestCode={listing.requestCode} />
              {listing.open ? (
                <Link
                  href={
                    user?.role === "DRIVER"
                      ? `/browse/stuff`
                      : `/login?next=${encodeURIComponent(`/l/${listing.requestCode}`)}`
                  }
                  className="btn btn-primary"
                >
                  {user?.role === "DRIVER" ? "Find stuff to take" : "Sign in to offer a lift"}
                </Link>
              ) : null}
            </div>

            <div className="panel mt-8 space-y-3 p-5">
              <h2 className="font-display text-xl font-semibold">Bought on TradeMe?</h2>
              <p className="text-sm text-slate">
                Paste this into your TradeMe listing so buyers can arrange a lonely seat lift:
              </p>
              <textarea
                className="field min-h-24 text-sm"
                readOnly
                value={trademeBlurb}
                onFocus={(e) => e.target.select()}
              />
              <ShareListingButton
                requestCode={listing.requestCode}
                mode="trademe"
                label="Copy TradeMe blurb"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
