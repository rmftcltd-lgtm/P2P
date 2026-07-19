#!/usr/bin/env npx tsx
/**
 * End-to-end Lonelyseat journey:
 * Driver Brian Ward + Sender Alf Burns, zero-payment mock escrow.
 */
const BASE = process.env.APP_URL ?? "https://lonelyseat.vercel.app";
const PASSWORD = "password123";

type Jar = Map<string, string>;

function storeCookies(jar: Jar, res: Response) {
  const raw = res.headers.getSetCookie?.() ?? [];
  for (const c of raw) {
    const [pair] = c.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  // Fallback for runtimes without getSetCookie
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
  if (detail !== undefined) console.log(typeof detail === "string" ? detail : JSON.stringify(detail, null, 2));
}

async function main() {
  const brianJar: Jar = new Map();
  const alfJar: Jar = new Map();

  console.log(`E2E against ${BASE}`);

  // --- Register Brian (driver) ---
  try {
    await api(brianJar, "POST", "/api/auth/register", {
      name: "Brian Ward",
      email: "connary_007@hotmail.com",
      password: PASSWORD,
      phone: "+64-21-555-1001",
      role: "DRIVER",
      vehicleType: "ute",
    });
    log("Registered Brian Ward (driver)", "connary_007@hotmail.com");
  } catch (e) {
    const msg = String(e);
    if (msg.includes("409")) {
      await api(brianJar, "POST", "/api/auth/login", {
        email: "connary_007@hotmail.com",
        password: PASSWORD,
      });
      log("Brian already registered — logged in");
    } else throw e;
  }

  const brianMe = await api(brianJar, "GET", "/api/auth/me");
  log("Brian session", { id: brianMe.user.id, role: brianMe.user.role });

  // KYC auto-approve
  await api(brianJar, "POST", "/api/drivers/kyc", {
    licenseNumber: "NZ-DL-BRIAN01",
    idDocumentNote: "E2E test licence for Brian Ward",
    vehicleType: "ute",
  });
  log("Brian KYC approved (demo)");

  // Brian lists a Hamilton → Auckland journey
  const depart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const trip = await api(brianJar, "POST", "/api/trips", {
    tripType: "ONE_WAY",
    fromAddress: "Victoria St, Hamilton Central, Hamilton",
    fromLat: -37.787,
    fromLng: 175.2793,
    toAddress: "Queen St, Auckland CBD, Auckland",
    toLat: -36.8485,
    toLng: 174.7633,
    departAt: depart,
    spaces: ["shoebox", "backseat", "boot_sedan"],
    vehicleType: "ute",
    notes: "E2E test corridor — Brian Ward",
    listedPrice: 0,
  });
  const tripId = trip.trips?.[0]?.id ?? trip.trip?.id;
  if (!tripId) throw new Error(`No trip id: ${JSON.stringify(trip)}`);
  log("Brian listed lonely seat journey", { tripId });

  // --- Register Alf (sender) ---
  try {
    await api(alfJar, "POST", "/api/auth/register", {
      name: "Alf Burns",
      email: "Jaguaretypenz@hotmail.co.nz",
      password: PASSWORD,
      phone: "+64-21-555-2002",
      role: "CUSTOMER",
    });
    log("Registered Alf Burns (sender)", "Jaguaretypenz@hotmail.co.nz");
  } catch (e) {
    const msg = String(e);
    if (msg.includes("409")) {
      await api(alfJar, "POST", "/api/auth/login", {
        email: "Jaguaretypenz@hotmail.co.nz",
        password: PASSWORD,
      });
      log("Alf already registered — logged in");
    } else throw e;
  }

  const alfMe = await api(alfJar, "GET", "/api/auth/me");
  log("Alf session", { id: alfMe.user.id, role: alfMe.user.role });

  // Alf requests Brian's seat
  const deliveryRes = await api(alfJar, "POST", "/api/deliveries", {
    pickupAddress: "Victoria St, Hamilton Central, Hamilton",
    pickupLat: -37.787,
    pickupLng: 175.2793,
    dropoffAddress: "Queen St, Auckland CBD, Auckland",
    dropoffLat: -36.8485,
    dropoffLng: 174.7633,
    spaceNeeded: "shoebox",
    itemTitle: "Alf's parcel box",
    packageNotes: "E2E zero-payment test parcel",
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
  log("Alf created delivery + request to Brian", {
    deliveryId,
    requestCode,
    offerId,
    status: deliveryRes.delivery.status,
    offerAmount: deliveryRes.delivery.offerAmount,
  });

  // Brian accepts the offer
  if (!offerId) {
    // Fallback: Brian offers on open listing
    const offer = await api(brianJar, "POST", "/api/offers", {
      deliveryId,
      note: "Brian can take Alf's parcel",
      amount: 0,
    });
    const accepted = await api(alfJar, "POST", `/api/offers/${offer.offer.id}/respond`, {
      action: "accept",
    });
    log("Brian offered $0 and Alf accepted", {
      status: accepted.delivery.status,
      driverId: accepted.delivery.driverId,
    });
  } else {
    const accepted = await api(brianJar, "POST", `/api/offers/${offerId}/respond`, {
      action: "accept",
    });
    log("Brian accepted Alf's seat request", {
      status: accepted.delivery.status,
      driverId: accepted.delivery.driverId,
    });
  }

  // Alf zero-payment authorize
  const pay = await api(alfJar, "POST", `/api/deliveries/${deliveryId}/pay`, {
    zeroPayment: true,
  });
  log("Zero payment authorised (mock escrow)", {
    mode: pay.mode,
    amount: pay.amount,
    paymentStatus: pay.paymentStatus,
  });

  // Brian: picked up → in transit → delivered
  for (const status of ["PICKED_UP", "IN_TRANSIT", "DELIVERED"] as const) {
    const upd = await api(brianJar, "PATCH", `/api/deliveries/${deliveryId}/status`, {
      status,
      note:
        status === "PICKED_UP"
          ? "Parcel collected from Alf in Hamilton"
          : status === "IN_TRANSIT"
            ? "Heading to Auckland CBD"
            : "Dropped at Queen St — photo on file",
      ...(status === "PICKED_UP"
        ? { pickupPhotoUrl: "https://lonelyseat.vercel.app/hero-taranaki-road.png" }
        : {}),
      ...(status === "DELIVERED"
        ? { dropoffPhotoUrl: "https://lonelyseat.vercel.app/hero-taranaki-road.png" }
        : {}),
    });
    log(`Status → ${status}`, {
      status: upd.delivery.status,
      paymentStatus: upd.delivery.paymentStatus,
      payoutStatus: upd.delivery.payoutStatus,
    });
  }

  // Alf leaves a review
  try {
    const rating = await api(alfJar, "POST", `/api/deliveries/${deliveryId}/rate`, {
      stars: 5,
      comment: "Brian was a legend — parcel arrived safe. E2E test.",
    });
    log("Alf rated Brian", rating.rating ?? rating);
  } catch (e) {
    log("Rating step", String(e));
  }

  const finalBrian = await api(brianJar, "GET", `/api/deliveries/${deliveryId}`);
  const finalAlf = await api(alfJar, "GET", `/api/deliveries/${deliveryId}`);
  log("FINAL delivery (Brian view)", {
    requestCode: finalBrian.deliveries?.[0]?.requestCode ?? finalBrian.delivery?.requestCode,
    status: finalBrian.deliveries?.[0]?.status ?? finalBrian.delivery?.status,
    paymentStatus:
      finalBrian.deliveries?.[0]?.paymentStatus ?? finalBrian.delivery?.paymentStatus,
    offerAmount: finalBrian.deliveries?.[0]?.offerAmount ?? finalBrian.delivery?.offerAmount,
  });
  log("FINAL delivery (Alf view)", {
    status: finalAlf.deliveries?.[0]?.status ?? finalAlf.delivery?.status,
  });

  console.log(`\n========================================`);
  console.log(`E2E COMPLETE`);
  console.log(`Driver: Brian Ward <connary_007@hotmail.com>`);
  console.log(`Sender: Alf Burns <Jaguaretypenz@hotmail.co.nz>`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`Delivery: ${deliveryId} / #${requestCode}`);
  console.log(`Payment: $0 mock escrow`);
  console.log(`Emails: welcome + offer + accept + pay + pickup + transit + delivered`);
  console.log(`(Mailgun sandbox may only deliver to authorised recipients)`);
  console.log(`========================================\n`);
}

main().catch((err) => {
  console.error("\n✗ E2E FAILED", err);
  process.exit(1);
});
