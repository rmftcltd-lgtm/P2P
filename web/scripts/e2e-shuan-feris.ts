#!/usr/bin/env npx tsx
/**
 * End-to-end Lonelyseat journey:
 * Driver Shuan Bruce + Sender Feris Paul — seat-sized blanket, $0 pay.
 * Uses real Gmail addresses so lifecycle emails can be inspected.
 */
const BASE = process.env.APP_URL ?? "https://lonelyseat.vercel.app";
const PASSWORD = "password123";

const DRIVER = {
  name: "Shuan Bruce",
  email: "rm.nzsa@gmail.com",
  phone: "+64-21-555-3003",
};
const SENDER = {
  name: "Feris Paul",
  email: "rm.ftcltd@gmail.com",
  phone: "+64-21-555-4004",
};

type Jar = Map<string, string>;

function storeCookies(jar: Jar, res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  const single = res.headers.get("set-cookie");
  if (single && raw.length === 0) {
    const [pair] = single.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
}

function cookieHeader(jar: Jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function api(
  jar: Jar,
  method: string,
  path: string,
  body?: unknown,
) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(jar.size ? { Cookie: cookieHeader(jar) } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  storeCookies(jar, res);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function log(step: string, detail?: unknown) {
  console.log(`\n✓ ${step}`);
  if (detail !== undefined)
    console.log(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
}

async function registerOrLogin(
  jar: Jar,
  user: { name: string; email: string; phone: string },
  role: "DRIVER" | "CUSTOMER",
  extra?: Record<string, unknown>,
) {
  try {
    await api(jar, "POST", "/api/auth/register", {
      name: user.name,
      email: user.email,
      password: PASSWORD,
      phone: user.phone,
      role,
      ...extra,
    });
    log(`Registered ${user.name} (${role})`, user.email);
  } catch (e) {
    const msg = String(e);
    if (msg.includes("409")) {
      await api(jar, "POST", "/api/auth/login", {
        email: user.email,
        password: PASSWORD,
      });
      log(`${user.name} already registered — logged in`);
    } else throw e;
  }
}

async function main() {
  const driverJar: Jar = new Map();
  const senderJar: Jar = new Map();

  console.log(`E2E against ${BASE}`);
  console.log(`Emails expected at ${DRIVER.email} and ${SENDER.email}`);

  const ops = await fetch(`${BASE}/api/ops/status`).then((r) => r.json()).catch(() => null);
  if (ops) {
    log("Ops / email config", {
      email: ops.email ?? ops.notify?.email ?? ops,
    });
  }

  await registerOrLogin(driverJar, DRIVER, "DRIVER", { vehicleType: "car" });
  const driverMe = await api(driverJar, "GET", "/api/auth/me");
  log("Shuan session", { id: driverMe.user.id, role: driverMe.user.role });
  if (!driverMe.user.registrationComplete) {
    await api(driverJar, "PATCH", "/api/profile", {
      name: DRIVER.name,
      phone: DRIVER.phone,
      physicalAddress: "Hamilton, Waikato",
    });
    log("Shuan profile completed");
  }

  await api(driverJar, "POST", "/api/drivers/kyc", {
    licenseNumber: "NZ-DL-SHUAN01",
    idDocumentNote: "E2E test licence for Shuan Bruce",
    vehicleType: "car",
  });
  log("Shuan KYC approved (demo)");

  // Wellington → Palmerston North drive; front seat for a folded blanket
  const depart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const trip = await api(driverJar, "POST", "/api/trips", {
    tripType: "ONE_WAY",
    fromAddress: "Lambton Quay, Wellington CBD, Wellington",
    fromLat: -41.2865,
    fromLng: 174.7762,
    toAddress: "The Square, Palmerston North",
    toLat: -40.3523,
    toLng: 175.6082,
    departAt: depart,
    spaces: ["frontseat", "backseat", "shoebox"],
    vehicleType: "car",
    notes: "E2E — Shuan Bruce, seat free for a folded blanket",
  });
  const tripId = trip.trips?.[0]?.id ?? trip.trip?.id;
  if (!tripId) throw new Error(`No trip id: ${JSON.stringify(trip)}`);
  log("Shuan listed lonely seat journey", { tripId });

  await registerOrLogin(senderJar, SENDER, "CUSTOMER");
  const senderMe = await api(senderJar, "GET", "/api/auth/me");
  log("Feris session", { id: senderMe.user.id, role: senderMe.user.role });
  if (!senderMe.user.registrationComplete) {
    await api(senderJar, "PATCH", "/api/profile", {
      name: SENDER.name,
      phone: SENDER.phone,
      physicalAddress: "Te Aro, Wellington",
    });
    log("Feris profile completed");
  }

  const deliveryRes = await api(senderJar, "POST", "/api/deliveries", {
    pickupAddress: "Lambton Quay, Wellington CBD, Wellington",
    pickupLat: -41.2865,
    pickupLng: 174.7762,
    dropoffAddress: "The Square, Palmerston North",
    dropoffLat: -40.3523,
    dropoffLng: 175.6082,
    spaceNeeded: "frontseat",
    itemTitle: "Folded blanket (fits on a front seat)",
    packageNotes: "Soft folded blanket — sits neatly on a car seat. Zero-pay E2E.",
    fullyPackaged: true,
    greetAtPickup: true,
    greetAtDropoff: true,
    lonelyCover: false,
    tripId,
    timePreference: "flexible",
  });
  const deliveryId = deliveryRes.delivery.id;
  const requestCode = deliveryRes.delivery.requestCode;
  const offerId = deliveryRes.offer?.id;
  log("Feris created delivery + request to Shuan", {
    deliveryId,
    requestCode,
    offerId,
    status: deliveryRes.delivery.status,
    itemTitle: deliveryRes.delivery.itemTitle,
    spaceNeeded: deliveryRes.delivery.spaceNeeded,
    offerAmount: deliveryRes.delivery.offerAmount,
  });

  if (!offerId) {
    const offer = await api(driverJar, "POST", "/api/offers", {
      deliveryId,
      note: "Shuan can take Feris's blanket on the front seat",
    });
    const accepted = await api(senderJar, "POST", `/api/offers/${offer.offer.id}/respond`, {
      action: "accept",
    });
    log("Shuan offered and Feris accepted", {
      status: accepted.delivery.status,
      driverId: accepted.delivery.driverId,
    });
  } else {
    const accepted = await api(driverJar, "POST", `/api/offers/${offerId}/respond`, {
      action: "accept",
    });
    log("Shuan accepted Feris's seat request", {
      status: accepted.delivery.status,
      driverId: accepted.delivery.driverId,
    });
  }

  // Brief pause so async Mailgun sends from prior steps can flush
  await new Promise((r) => setTimeout(r, 1500));

  const pay = await api(senderJar, "POST", `/api/deliveries/${deliveryId}/pay`, {
    zeroPayment: true,
  });
  log("Zero payment authorised (mock escrow)", {
    mode: pay.mode,
    amount: pay.amount,
    paymentStatus: pay.paymentStatus,
  });

  await new Promise((r) => setTimeout(r, 800));

  for (const status of ["PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const) {
    const upd = await api(driverJar, "PATCH", `/api/deliveries/${deliveryId}/status`, {
      status,
      note:
        status === "PICKED_UP"
          ? "Collected Feris's blanket from Wellington CBD"
          : status === "IN_TRANSIT"
            ? "On the road to Palmerston North"
            : "Blanket handed over at The Square",
      ...(status === "PICKED_UP"
        ? { pickupPhotoUrl: "https://lonelyseat.vercel.app/hero-chair-handoff.png" }
        : {}),
      ...(status === "DELIVERED"
        ? { dropoffPhotoUrl: "https://lonelyseat.vercel.app/hero-chair-handoff.png" }
        : {}),
    });
    log(`Status → ${status}`, {
      status: upd.delivery.status,
      paymentStatus: upd.delivery.paymentStatus,
      payoutStatus: upd.delivery.payoutStatus,
    });
    await new Promise((r) => setTimeout(r, 600));
  }

  try {
    const rating = await api(senderJar, "POST", `/api/deliveries/${deliveryId}/rate`, {
      stars: 5,
      comment: "Shuan looked after the blanket perfectly. E2E test.",
    });
    log("Feris rated Shuan", rating.rating ?? rating);
  } catch (e) {
    log("Rating step", String(e));
  }

  const finalDriver = await api(driverJar, "GET", `/api/deliveries/${deliveryId}`);
  const d =
    finalDriver.deliveries?.[0] ?? finalDriver.delivery ?? finalDriver;
  log("FINAL delivery", {
    requestCode: d.requestCode,
    status: d.status,
    paymentStatus: d.paymentStatus,
    offerAmount: d.offerAmount,
    itemTitle: d.itemTitle,
    spaceNeeded: d.spaceNeeded,
  });

  console.log(`\n========================================`);
  console.log(`E2E COMPLETE`);
  console.log(`Driver: ${DRIVER.name} <${DRIVER.email}>`);
  console.log(`Sender: ${SENDER.name} <${SENDER.email}>`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`Item: Folded blanket (front seat)`);
  console.log(`Delivery: ${deliveryId} / #${requestCode}`);
  console.log(`Payment: $0 mock escrow`);
  console.log(`Check inboxes for lifecycle emails (welcome, offer, accept, pay, pickup, transit, delivered)`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error("\n✗ E2E FAILED", err);
  process.exit(1);
});
