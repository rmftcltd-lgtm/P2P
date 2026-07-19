export type RelayEvent =
  | {
      type: "delivery.created";
      deliveryId: string;
      pickupLat: number;
      pickupLng: number;
      offerAmount: number;
    }
  | {
      type: "delivery.updated";
      deliveryId: string;
      status: string;
      customerId: string;
      driverId?: string | null;
    }
  | {
      type: "driver.location";
      driverId: string;
      lat: number;
      lng: number;
      isOnline: boolean;
    }
  | {
      type: "jobs.refresh";
      reason: string;
    };

type Handler = (event: RelayEvent) => void;

const channels = new Map<string, Set<Handler>>();

export function publish(channel: string, event: RelayEvent) {
  const set = channels.get(channel);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(event);
    } catch (err) {
      console.error("event handler error", err);
    }
  }
}

export function subscribe(channel: string, handler: Handler) {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(handler);
  return () => {
    set!.delete(handler);
    if (set!.size === 0) channels.delete(channel);
  };
}

export function publishDeliveryCreated(payload: Extract<RelayEvent, { type: "delivery.created" }>) {
  publish("drivers:jobs", payload);
  publish("jobs:refresh", { type: "jobs.refresh", reason: "delivery.created" });
}

export function publishDeliveryUpdated(
  payload: Extract<RelayEvent, { type: "delivery.updated" }>,
) {
  publish(`user:${payload.customerId}`, payload);
  if (payload.driverId) publish(`user:${payload.driverId}`, payload);
  publish("drivers:jobs", payload);
  publish("jobs:refresh", { type: "jobs.refresh", reason: "delivery.updated" });
}
