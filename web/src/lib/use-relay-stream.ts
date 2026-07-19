"use client";

import { useEffect, useRef } from "react";
import type { RelayEvent } from "@/lib/events";

type Options = {
  topics?: string;
  enabled?: boolean;
  onEvent?: (event: RelayEvent) => void;
};

export function useRelayStream({
  topics = "user",
  enabled = true,
  onEvent,
}: Options) {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource(`/api/stream?topics=${encodeURIComponent(topics)}`);

    const onRelay = (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data) as RelayEvent;
        onEventRef.current?.(data);
      } catch {
        /* ignore malformed */
      }
    };

    es.addEventListener("relay", onRelay);
    return () => {
      es.removeEventListener("relay", onRelay);
      es.close();
    };
  }, [topics, enabled]);
}
