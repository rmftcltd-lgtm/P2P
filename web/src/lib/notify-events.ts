import { notify, linkTo } from "@/lib/notify";
import {
  bookingDetailsHtml,
  bookingDetailsText,
  plainFromParts,
  renderEmail,
  type BookingEmailDetails,
} from "@/lib/email-templates";

type Party = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

async function sendBranded(opts: {
  to: Party;
  subject: string;
  greeting?: string;
  paragraphs: string[];
  details?: BookingEmailDetails;
  ctas?: { label: string; href: string }[];
  faqLines?: string[];
  preheader?: string;
}) {
  const detailsHtml = opts.details ? bookingDetailsHtml(opts.details) : undefined;
  const detailsText = opts.details ? bookingDetailsText(opts.details) : undefined;
  const html = renderEmail({
    preheader: opts.preheader ?? opts.subject,
    greeting: opts.greeting,
    paragraphs: opts.paragraphs,
    detailsHtml,
    ctas: opts.ctas,
    faqLines: opts.faqLines,
  });
  const text = plainFromParts({
    greeting: opts.greeting,
    paragraphs: opts.paragraphs,
    detailsText,
    ctas: opts.ctas,
  });
  await notify({
    toEmail: opts.to.email,
    toPhone: opts.to.phone,
    subject: opts.subject,
    text,
    html,
  });
}

function firstName(name?: string | null) {
  if (!name?.trim()) return "there";
  return name.trim().split(/\s+/)[0]!;
}

/** Signup — role-specific welcome. */
export async function notifyWelcome(user: Party & { role: string }) {
  const isDriver = user.role === "DRIVER";
  const paragraphs = isDriver
    ? [
        "We warmly welcome you into the Lonelyseat community — and we really look forward to helping you find some lonely stuff for your lonely seats.",
        "List a journey, claim seats that fit your corridor, and earn while you are already heading that way.",
      ]
    : [
        "We warmly welcome you into the Lonelyseat community of keen drivers and senders.",
        "We really look forward to helping you find a lonely seat for your lonely stuff.",
      ];
  await sendBranded({
    to: user,
    subject: "Thanks for choosing Lonelyseat",
    greeting: `Kia ora ${firstName(user.name)}!`,
    paragraphs,
    ctas: [
      {
        label: isDriver ? "Start listing journeys" : "Start listing your items",
        href: linkTo(isDriver ? "/driver/trips" : "/customer"),
      },
      { label: "Browse the marketplace", href: linkTo(isDriver ? "/browse/stuff" : "/browse/drivers") },
      { label: "Help & FAQs", href: linkTo("/pages/help") },
    ],
    faqLines: isDriver
      ? ["How do driver payouts work?", "What spaces can I offer?"]
      : ["How do I list an item?", "What is Lonely Cover?"],
  });
}

/** Incomplete registration nudges (for cron / admin tooling). */
export async function notifyRegistrationReminder(
  user: Party & { role: string },
  stage: "2d" | "10d",
) {
  const early = stage === "2d";
  await sendBranded({
    to: user,
    subject: early
      ? "You are almost good to go"
      : "Finish signing up with us today",
    greeting: `Hey ${firstName(user.name)},`,
    paragraphs: early
      ? [
          "We notice you are keen to be part of our Lonelyseat community, but we still need a few more details from you.",
        ]
      : [
          "Really keen to get you telling some Lonelyseat stories.",
          "You are almost there — we just need a few more details to finish your registration.",
        ],
    ctas: [
      {
        label: early ? "Complete registration" : "Finish my registration",
        href: linkTo(user.role === "DRIVER" ? "/driver" : "/customer"),
      },
    ],
  });
}

/** New offer / seat request received. */
export async function notifyOfferCreated(opts: {
  to: Party;
  fromName: string;
  requestCode: string;
  deliveryId: string;
  itemTitle?: string | null;
  initiator: "SENDER" | "DRIVER";
  details?: BookingEmailDetails;
}) {
  const forDriver = opts.initiator === "SENDER";
  await sendBranded({
    to: opts.to,
    subject: forDriver
      ? "You have a new request"
      : `A new request for booking #${opts.requestCode}`,
    greeting: `Hey ${firstName(opts.to.name)}!`,
    paragraphs: forDriver
      ? [
          "Great news — you have a new request. Someone with lonely stuff wants you to deliver for them.",
          "Open the link below to review and accept.",
        ]
      : [
          "Great news — you have a new request. A lonely seat is available to take your stuff.",
          `Go to Inbox to accept booking #${opts.requestCode}.`,
        ],
    details: opts.details
      ? {
          ...opts.details,
          otherPartyName: opts.fromName,
        }
      : undefined,
    ctas: [
      { label: "Open request", href: linkTo(`/inbox/${opts.deliveryId}`) },
      { label: "Help & FAQs", href: linkTo("/pages/help") },
    ],
    faqLines: ["How do offers work?", "When do I pay?"],
  });
}

/** Both parties when an offer is accepted / booking confirmed. */
export async function notifyOfferAccepted(opts: {
  sender: Party;
  driver: Party;
  requestCode: string;
  deliveryId: string;
  details: BookingEmailDetails;
}) {
  await Promise.all([
    sendBranded({
      to: opts.sender,
      subject: "Your request has been confirmed",
      greeting: `Hey ${firstName(opts.sender.name)}!`,
      paragraphs: [
        "Great news — your lonely stuff has found a lonely seat!",
        "You are all good to go. Booking details are below.",
      ],
      details: {
        ...opts.details,
        otherPartyName: opts.driver.name,
        otherPartyPhone: opts.driver.phone,
      },
      ctas: [
        {
          label: "Track my stuff",
          href: linkTo(`/customer/deliveries/${opts.deliveryId}`),
        },
        { label: "Send more stuff", href: linkTo("/customer") },
      ],
      faqLines: ["How does escrow work?", "What is Lonely Cover?"],
    }),
    sendBranded({
      to: opts.driver,
      subject: "Your request has been accepted",
      greeting: `Hey ${firstName(opts.driver.name)}!`,
      paragraphs: [
        "Great news — your request has been accepted. You are one step closer to helping a lonely seat find lonely stuff.",
        "Safe travels. Booking details and pick-up notes are below.",
      ],
      details: {
        ...opts.details,
        otherPartyName: opts.sender.name,
        otherPartyPhone: opts.sender.phone,
      },
      ctas: [
        {
          label: "Open delivery",
          href: linkTo(`/driver/deliveries/${opts.deliveryId}`),
        },
        { label: "Find more lonely stuff", href: linkTo("/browse/stuff") },
      ],
      faqLines: ["When do I get paid?", "What if pick-up fails?"],
    }),
  ]);
}

/** Offer declined or sibling offer not chosen. */
export async function notifyOfferUnsuccessful(opts: {
  to: Party;
  role: "SENDER" | "DRIVER";
  requestCode: string;
}) {
  const isDriver = opts.role === "DRIVER";
  await sendBranded({
    to: opts.to,
    subject: isDriver
      ? "Your request was unsuccessful"
      : "Your request has been unsuccessful",
    greeting: `Hey ${firstName(opts.to.name)},`,
    paragraphs: isDriver
      ? [
          "Sorry to be the bearer of bad news — your lonely seat was not the chosen one this time, and it might be lonely for a little while yet.",
          "The good news is senders are listing all the time, so there will be lonely stuff desperate to find its way onto your lonely seat in no time.",
        ]
      : [
          "Your stuff was not the chosen stuff this time.",
          "The good news is drivers are listing all the time, so there will be a lonely seat desperate to find your lonely stuff in no time.",
        ],
    ctas: [
      {
        label: isDriver ? "Find more lonely stuff" : "Find more lonely seats",
        href: linkTo(isDriver ? "/browse/stuff" : "/browse/drivers"),
      },
    ],
  });
}

export async function notifyPaymentAuthorized(opts: {
  sender: Party;
  driver?: Party | null;
  requestCode: string;
  amount: number;
  deliveryId: string;
}) {
  await sendBranded({
    to: opts.sender,
    subject: `Payment held · #${opts.requestCode}`,
    greeting: `Hey ${firstName(opts.sender.name)},`,
    paragraphs: [
      `$${opts.amount.toFixed(2)} NZD is authorised and held in escrow until delivery is complete.`,
      "You can view payment status anytime in your booking.",
    ],
    ctas: [
      {
        label: "View booking",
        href: linkTo(`/customer/deliveries/${opts.deliveryId}`),
      },
    ],
    faqLines: ["How do payments work?", "When is the card charged?"],
  });
  if (opts.driver?.email || opts.driver?.phone) {
    await sendBranded({
      to: opts.driver,
      subject: `Sender paid · #${opts.requestCode}`,
      greeting: `Hey ${firstName(opts.driver.name)},`,
      paragraphs: [
        `Payment of $${opts.amount.toFixed(2)} NZD is authorised. Complete the delivery to receive your payout.`,
      ],
      ctas: [
        {
          label: "Open delivery",
          href: linkTo(`/driver/deliveries/${opts.deliveryId}`),
        },
      ],
    });
  }
}

/** Status-specific emails aligned to Platform flow. */
export async function notifyStatusChange(opts: {
  sender: Party;
  driver?: Party | null;
  requestCode: string;
  status: string;
  deliveryId: string;
  note?: string;
  details?: BookingEmailDetails;
  payoutAmount?: number;
}) {
  const details = opts.details;
  const track = linkTo(`/customer/deliveries/${opts.deliveryId}`);
  const drive = linkTo(`/driver/deliveries/${opts.deliveryId}`);

  if (opts.status === "PICKED_UP") {
    await sendBranded({
      to: opts.sender,
      subject: "Your stuff has been picked up",
      greeting: `Hey ${firstName(opts.sender.name)}!`,
      paragraphs: [
        "Your lonely stuff is no longer lonely — it has been successfully picked up.",
        "If you have not already, feel free to message the driver to confirm you are on track.",
        ...(opts.note ? [opts.note] : []),
      ],
      details,
      ctas: [
        { label: "Track my stuff", href: track },
        { label: "Open Inbox", href: linkTo(`/inbox/${opts.deliveryId}`) },
      ],
    });
    return;
  }

  if (opts.status === "IN_TRANSIT") {
    await sendBranded({
      to: opts.sender,
      subject: "Your driver is on their way",
      greeting: `Hey ${firstName(opts.sender.name)}!`,
      paragraphs: [
        "We can see your driver is on the way with your stuff. Track progress with the link below.",
        "Have fun sending with Lonelyseat!",
      ],
      details: details
        ? {
            ...details,
            otherPartyName: opts.driver?.name,
            otherPartyPhone: opts.driver?.phone,
          }
        : undefined,
      ctas: [{ label: "Track my stuff", href: track }],
    });
    return;
  }

  if (opts.status === "DELIVERED") {
    await Promise.all([
      sendBranded({
        to: opts.sender,
        subject: "Your stuff has arrived",
        greeting: `Hey ${firstName(opts.sender.name)}!`,
        paragraphs: [
          "We see your stuff has arrived! Cheers for sending with Lonelyseat — we look forward to helping you again soon.",
          "Now is a perfect time to write your review. Reviews are an important part of the Lonelyseat community.",
        ],
        details,
        ctas: [
          { label: "Leave a review", href: track },
          { label: "List more items", href: linkTo("/customer") },
          { label: "See past deliveries", href: linkTo("/customer") },
        ],
        faqLines: ["How do payments work?", "What is Lonely Cover?"],
      }),
      opts.driver
        ? sendBranded({
            to: opts.driver,
            subject: "You have completed your journey",
            greeting: `Hey ${firstName(opts.driver.name)}!`,
            paragraphs: [
              opts.payoutAmount != null
                ? `We have issued you a payout of $${opts.payoutAmount.toFixed(2)} NZD. It should arrive in your account after about three business days (weekends and holidays may add delay).`
                : "Thanks for completing this delivery. Your payout will show in transaction history once processed.",
              "You can view payout status in your driver account.",
            ],
            details,
            ctas: [
              { label: "Open delivery", href: drive },
              { label: "Find more lonely stuff", href: linkTo("/browse/stuff") },
            ],
            faqLines: ["When will I get my payout?", "How do I calculate my payout?"],
          })
        : Promise.resolve(),
      notifyInvoice({
        to: opts.sender,
        role: "SENDER",
        requestCode: opts.requestCode,
        deliveryId: opts.deliveryId,
        amount: opts.details?.offerAmount,
        details,
      }),
      opts.driver
        ? notifyInvoice({
            to: opts.driver,
            role: "DRIVER",
            requestCode: opts.requestCode,
            deliveryId: opts.deliveryId,
            amount: opts.payoutAmount,
            details,
          })
        : Promise.resolve(),
    ]);
    return;
  }

  // Fallback for ACCEPTED / CANCELLED / other
  const label = opts.status.replaceAll("_", " ").toLowerCase();
  await Promise.all([
    sendBranded({
      to: opts.sender,
      subject: `Update · #${opts.requestCode}`,
      greeting: `Hey ${firstName(opts.sender.name)},`,
      paragraphs: [
        `Request #${opts.requestCode} is now ${label}.${opts.note ? ` ${opts.note}` : ""}`,
      ],
      ctas: [{ label: "View booking", href: track }],
    }),
    opts.driver
      ? sendBranded({
          to: opts.driver,
          subject: `Update · #${opts.requestCode}`,
          greeting: `Hey ${firstName(opts.driver.name)},`,
          paragraphs: [
            `Request #${opts.requestCode} is now ${label}.${opts.note ? ` ${opts.note}` : ""}`,
          ],
          ctas: [{ label: "Open delivery", href: drive }],
        })
      : Promise.resolve(),
  ]);
}

export async function notifyInvoice(opts: {
  to: Party;
  role: "SENDER" | "DRIVER";
  requestCode: string;
  deliveryId: string;
  amount?: number | null;
  details?: BookingEmailDetails;
}) {
  const isSender = opts.role === "SENDER";
  await sendBranded({
    to: opts.to,
    subject: `Invoice · #${opts.requestCode}`,
    greeting: `Hey ${firstName(opts.to.name)},`,
    paragraphs: [
      isSender
        ? "Thanks for sending with Lonelyseat. Here are your payment details."
        : "Thanks for driving with Lonelyseat. Here are your payment details.",
      opts.amount != null
        ? `Amount: $${opts.amount.toFixed(2)} NZD for booking #${opts.requestCode}.`
        : `Booking #${opts.requestCode} — see your booking history for full payment status.`,
      isSender
        ? "You can view payment status in your booking history. If you have questions, reply to this email or contact support."
        : "You can view payout status in your transaction history.",
    ],
    details: opts.details,
    ctas: [
      {
        label: "View booking",
        href: linkTo(
          isSender
            ? `/customer/deliveries/${opts.deliveryId}`
            : `/driver/deliveries/${opts.deliveryId}`,
        ),
      },
      { label: "Help & FAQs", href: linkTo("/pages/help") },
    ],
    faqLines: ["How do payments work?", "How do I calculate my payments?"],
  });
}

export async function notifyPayout(opts: {
  driver: Party;
  requestCode: string;
  amount: number;
}) {
  await sendBranded({
    to: opts.driver,
    subject: `Payout sent · #${opts.requestCode}`,
    greeting: `Hey ${firstName(opts.driver.name)}!`,
    paragraphs: [
      `We have issued you a payout of $${opts.amount.toFixed(2)} NZD for request #${opts.requestCode}.`,
      "This should arrive in your account after about three business days, allowing for weekends and holidays.",
      "You can view payout status in your driver account.",
    ],
    ctas: [
      { label: "Driver home", href: linkTo("/driver") },
      { label: "Help & FAQs", href: linkTo("/pages/help") },
    ],
    faqLines: ["When will I get my payout?", "How do I calculate my payout?"],
  });
}

/** Mutual cancel request / accepted / rejected, plus forced cancel. */
export async function notifyCancellation(opts: {
  to: Party;
  requestCode: string;
  deliveryId: string;
  mode: string;
  reason: string;
  variant?:
    | "mutual_request"
    | "mutual_accepted"
    | "mutual_rejected"
    | "forced"
    | "generic";
  requesterRole?: "SENDER" | "DRIVER";
  details?: BookingEmailDetails;
}) {
  const variant = opts.variant ?? "generic";
  const inbox = linkTo(`/inbox/${opts.deliveryId}`);

  if (variant === "mutual_request") {
    const fromDriver = opts.requesterRole === "DRIVER";
    await sendBranded({
      to: opts.to,
      subject: "Request for cancellation",
      greeting: `Hey ${firstName(opts.to.name)},`,
      paragraphs: fromDriver
        ? [
            "The driver you matched with has requested a mutual cancellation.",
            "Please confirm below so we can relist your stuff as fast as we can — or decline if you want to continue.",
            `Reason: ${opts.reason}`,
          ]
        : [
            "The sender has requested a mutual cancellation.",
            "Please confirm below so we can get you back on the road to find more lonely stuff — or decline if you want to continue.",
            `Reason: ${opts.reason}`,
          ],
      details: opts.details,
      ctas: [
        { label: "Confirm or decline", href: inbox },
        {
          label: fromDriver ? "Find lonely seats" : "Find lonely stuff",
          href: linkTo(fromDriver ? "/browse/drivers" : "/browse/stuff"),
        },
      ],
    });
    return;
  }

  if (variant === "mutual_accepted") {
    await sendBranded({
      to: opts.to,
      subject: "Mutual cancellation request accepted",
      greeting: `Hey ${firstName(opts.to.name)},`,
      paragraphs: [
        "Your cancellation request for this delivery has been successful.",
        `Reason: ${opts.reason}`,
      ],
      details: opts.details,
      ctas: [
        { label: "Open Inbox", href: inbox },
        { label: "Browse marketplace", href: linkTo("/browse/stuff") },
      ],
    });
    return;
  }

  if (variant === "mutual_rejected") {
    await sendBranded({
      to: opts.to,
      subject: `Cancellation for booking #${opts.requestCode} has been rejected`,
      greeting: `Hey ${firstName(opts.to.name)},`,
      paragraphs: [
        `Your mutual cancellation request for booking #${opts.requestCode} has been rejected.`,
        "We apologise for any inconvenience and hope things work out better next time.",
      ],
      details: opts.details,
      ctas: [
        { label: "See delivery info", href: inbox },
        { label: "Browse marketplace", href: linkTo("/") },
      ],
    });
    return;
  }

  await sendBranded({
    to: opts.to,
    subject: `Booking #${opts.requestCode} has been cancelled`,
    greeting: `Hey ${firstName(opts.to.name)},`,
    paragraphs: [
      `${opts.mode} cancellation for booking #${opts.requestCode}.`,
      `Reason: ${opts.reason}`,
      "People are listing all the time — you can find another match on the Platform.",
    ],
    details: opts.details,
    ctas: [
      { label: "Open Inbox", href: inbox },
      { label: "Browse marketplace", href: linkTo("/") },
    ],
  });
}

/** Admin alert helper (damage / refused pick-up). */
export async function notifyAdminAlert(opts: {
  subject: string;
  paragraphs: string[];
  linkPath?: string;
}) {
  const adminEmail =
    process.env.ADMIN_NOTIFY_EMAIL ??
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ??
    process.env.EMAIL_FROM ??
    null;
  if (!adminEmail) {
    console.info("[notify:admin:mock]", opts.subject, opts.paragraphs);
    return;
  }
  await sendBranded({
    to: { email: adminEmail, name: "Admin" },
    subject: opts.subject,
    greeting: "Hi Admin,",
    paragraphs: opts.paragraphs,
    ctas: opts.linkPath
      ? [{ label: "Open in admin", href: linkTo(opts.linkPath) }]
      : [{ label: "Open admin", href: linkTo("/admin") }],
  });
}
