import { notify, linkTo } from "@/lib/notify";

type Party = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

export async function notifyWelcome(user: Party & { role: string }) {
  const role = user.role === "DRIVER" ? "driver" : "sender";
  await notify({
    toEmail: user.email,
    toPhone: user.phone,
    subject: "Welcome to Lonelyseat",
    text: `Kia ora ${user.name ?? ""}! Your ${role} account is ready. Open ${linkTo(user.role === "DRIVER" ? "/driver" : "/customer")} to get started.`,
  });
}

export async function notifyOfferCreated(opts: {
  to: Party;
  fromName: string;
  requestCode: string;
  deliveryId: string;
  itemTitle?: string | null;
  initiator: "SENDER" | "DRIVER";
}) {
  const what =
    opts.initiator === "SENDER"
      ? `${opts.fromName} requested your lonely seat for ${opts.itemTitle ?? "an item"}`
      : `${opts.fromName} offered to drive your ${opts.itemTitle ?? "item"}`;
  await notify({
    toEmail: opts.to.email,
    toPhone: opts.to.phone,
    subject: `Request #${opts.requestCode}`,
    text: `${what}. Review in Inbox: ${linkTo(`/inbox/${opts.deliveryId}`)}`,
  });
}

export async function notifyOfferAccepted(opts: {
  sender: Party;
  driver: Party;
  requestCode: string;
  deliveryId: string;
}) {
  await Promise.all([
    notify({
      toEmail: opts.sender.email,
      toPhone: opts.sender.phone,
      subject: `Request #${opts.requestCode} accepted`,
      text: `${opts.driver.name ?? "Your driver"} accepted. Track here: ${linkTo(`/customer/deliveries/${opts.deliveryId}`)}`,
    }),
    notify({
      toEmail: opts.driver.email,
      toPhone: opts.driver.phone,
      subject: `Request #${opts.requestCode} — you're on`,
      text: `You accepted the job. Open: ${linkTo(`/driver/deliveries/${opts.deliveryId}`)}`,
    }),
  ]);
}

export async function notifyPaymentAuthorized(opts: {
  sender: Party;
  driver?: Party | null;
  requestCode: string;
  amount: number;
  deliveryId: string;
}) {
  await notify({
    toEmail: opts.sender.email,
    toPhone: opts.sender.phone,
    subject: `Payment held · #${opts.requestCode}`,
    text: `$${opts.amount.toFixed(2)} NZD is authorized and held until delivery. ${linkTo(`/customer/deliveries/${opts.deliveryId}`)}`,
  });
  if (opts.driver?.email || opts.driver?.phone) {
    await notify({
      toEmail: opts.driver.email,
      toPhone: opts.driver.phone,
      subject: `Sender paid · #${opts.requestCode}`,
      text: `Payment authorized for $${opts.amount.toFixed(2)} NZD. Complete the delivery to receive payout.`,
    });
  }
}

export async function notifyStatusChange(opts: {
  sender: Party;
  driver?: Party | null;
  requestCode: string;
  status: string;
  deliveryId: string;
  note?: string;
}) {
  const label = opts.status.replaceAll("_", " ").toLowerCase();
  const text = `Request #${opts.requestCode} is now ${label}.${opts.note ? ` ${opts.note}` : ""}`;
  await Promise.all([
    notify({
      toEmail: opts.sender.email,
      toPhone: opts.sender.phone,
      subject: `Update · #${opts.requestCode}`,
      text: `${text} ${linkTo(`/customer/deliveries/${opts.deliveryId}`)}`,
    }),
    opts.driver
      ? notify({
          toEmail: opts.driver.email,
          toPhone: opts.driver.phone,
          subject: `Update · #${opts.requestCode}`,
          text: `${text} ${linkTo(`/driver/deliveries/${opts.deliveryId}`)}`,
        })
      : Promise.resolve(),
  ]);
}

export async function notifyCancellation(opts: {
  to: Party;
  requestCode: string;
  deliveryId: string;
  mode: string;
  reason: string;
}) {
  await notify({
    toEmail: opts.to.email,
    toPhone: opts.to.phone,
    subject: `Cancellation · #${opts.requestCode}`,
    text: `${opts.mode} cancellation: ${opts.reason}. ${linkTo(`/inbox/${opts.deliveryId}`)}`,
  });
}

export async function notifyPayout(opts: {
  driver: Party;
  requestCode: string;
  amount: number;
}) {
  await notify({
    toEmail: opts.driver.email,
    toPhone: opts.driver.phone,
    subject: `Payout sent · #${opts.requestCode}`,
    text: `$${opts.amount.toFixed(2)} NZD is on its way to your Stripe account for request #${opts.requestCode}.`,
  });
}
