declare global {
  interface Window {
    google?: typeof google;
    [key: string]: unknown;
  }
}

export function googleMapsApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

export function googleMapsEnabled() {
  return Boolean(googleMapsApiKey());
}

let loadPromise: Promise<typeof google> | null = null;

/** Load Maps JavaScript API + Places library once (browser only). */
export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is browser-only"));
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) return loadPromise;

  const key = googleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = `__lonelyseatGoogleMapsInit`;
    window[callbackName] = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps failed to initialize"));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-lonelyseat-google-maps="1"]',
    );
    if (existing) {
      if (window.google?.maps?.places) resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.dataset.lonelyseatGoogleMaps = "1";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${callbackName}&v=weekly`;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
