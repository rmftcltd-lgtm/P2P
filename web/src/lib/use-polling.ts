"use client";

import { useEffect } from "react";

/** Poll an async callback; first run is deferred so setState is not sync-in-effect. */
export function usePolling(callback: () => void | Promise<void>, intervalMs: number) {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        await callback();
      } finally {
        if (!cancelled) {
          timer = setTimeout(() => {
            void tick();
          }, intervalMs);
        }
      }
    };

    timer = setTimeout(() => {
      void tick();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [callback, intervalMs]);
}
