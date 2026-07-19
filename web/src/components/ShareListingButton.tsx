"use client";

import { useState } from "react";
import { listingShareUrl } from "@/lib/urgency";

export function ShareListingButton({
  requestCode,
  label = "Copy share link",
  mode = "link",
  className = "btn btn-sea",
}: {
  requestCode: string;
  label?: string;
  mode?: "link" | "trademe";
  className?: string;
}) {
  const [status, setStatus] = useState("");

  async function copy() {
    const url = listingShareUrl(requestCode);
    const text =
      mode === "trademe"
        ? `Need this moved? Lonelyseat can match a Kiwi already heading that way: ${url}`
        : url;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
      setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Copy failed");
    }
  }

  return (
    <button type="button" className={className} onClick={() => void copy()}>
      {status || label}
    </button>
  );
}
