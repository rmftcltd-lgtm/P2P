import { linkTo } from "@/lib/notify";

const ORANGE = "#e8782a";
const INK = "#0e1210";
const SLATE = "#5a6560";
const PAPER = "#f2f5f3";
const MOSS = "#121816";

export type BookingEmailDetails = {
  requestCode: string;
  itemTitle?: string | null;
  pickupAddress: string;
  dropoffAddress: string;
  spaceNeeded?: string | null;
  offerAmount?: number | null;
  preferredDate?: Date | string | null;
  preferredDropoffDate?: Date | string | null;
  packageNotes?: string | null;
  otherPartyName?: string | null;
  otherPartyPhone?: string | null;
};

function fmtDate(d?: Date | string | null) {
  if (!d) return "Flexible";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Flexible";
  return date.toLocaleString("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtMoney(n?: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)} NZD`;
}

export function bookingDetailsText(b: BookingEmailDetails) {
  const lines = [
    `Request #${b.requestCode}`,
    b.itemTitle ? `Item: ${b.itemTitle}` : null,
    `From: ${b.pickupAddress}`,
    `To: ${b.dropoffAddress}`,
    `Pick-up: ${fmtDate(b.preferredDate)}`,
    `Drop-off: ${fmtDate(b.preferredDropoffDate)}`,
    b.spaceNeeded ? `Stuff will fit in: ${b.spaceNeeded}` : null,
    b.offerAmount != null ? `Total: ${fmtMoney(b.offerAmount)}` : null,
    b.otherPartyName
      ? `Contact: ${b.otherPartyName}${b.otherPartyPhone ? ` · ${b.otherPartyPhone}` : ""}`
      : null,
    b.packageNotes ? `Notes: ${b.packageNotes}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function bookingDetailsHtml(b: BookingEmailDetails) {
  const rows: [string, string][] = [
    ["Request", `#${b.requestCode}`],
    ...(b.itemTitle ? [["Item", b.itemTitle] as [string, string]] : []),
    ["From", b.pickupAddress],
    ["To", b.dropoffAddress],
    ["Pick-up", fmtDate(b.preferredDate)],
    ["Drop-off", fmtDate(b.preferredDropoffDate)],
    ...(b.spaceNeeded
      ? [["Stuff will fit in", b.spaceNeeded] as [string, string]]
      : []),
    ...(b.offerAmount != null
      ? [["Total", fmtMoney(b.offerAmount)] as [string, string]]
      : []),
    ...(b.otherPartyName
      ? [
          [
            "Contact",
            `${b.otherPartyName}${b.otherPartyPhone ? ` · ${b.otherPartyPhone}` : ""}`,
          ] as [string, string],
        ]
      : []),
    ...(b.packageNotes ? [["Notes", b.packageNotes] as [string, string]] : []),
  ];
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0;background:${PAPER};border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          ([k, v]) => `
        <tr>
          <td style="padding:10px 14px;font-size:13px;color:${SLATE};width:38%;border-bottom:1px solid rgba(14,18,16,0.08);">${k}</td>
          <td style="padding:10px 14px;font-size:14px;color:${INK};border-bottom:1px solid rgba(14,18,16,0.08);">${escapeHtml(v)}</td>
        </tr>`,
        )
        .join("")}
    </table>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type Cta = { label: string; href: string };

/** Branded Lonelyseat HTML email shell. */
export function renderEmail(opts: {
  preheader?: string;
  greeting?: string;
  paragraphs: string[];
  detailsHtml?: string;
  ctas?: Cta[];
  faqLines?: string[];
}) {
  const ctas = (opts.ctas ?? [])
    .map(
      (c, i) => `
      <a href="${c.href}" style="display:inline-block;margin:6px 8px 6px 0;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;${
        i === 0
          ? `background:${ORANGE};color:#fff;`
          : `background:${MOSS};color:#fff;`
      }">${escapeHtml(c.label)}</a>`,
    )
    .join("");

  const paras = opts.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:${INK};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const faq =
    opts.faqLines && opts.faqLines.length
      ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(14,18,16,0.1);">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${SLATE};text-transform:uppercase;letter-spacing:0.06em;">FAQs</p>
          ${opts.faqLines
            .map(
              (f) =>
                `<p style="margin:0 0 6px;font-size:14px;color:${SLATE};">${escapeHtml(f)}</p>`,
            )
            .join("")}
          <p style="margin:10px 0 0;font-size:14px;"><a href="${linkTo("/pages/help")}" style="color:${ORANGE};">Find more answers in Help</a></p>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en-NZ">
<body style="margin:0;padding:0;background:${PAPER};font-family:Georgia,'Times New Roman',serif;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(14,18,16,0.08);">
        <tr>
          <td style="background:${MOSS};padding:22px 28px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:${ORANGE};letter-spacing:-0.02em;">Lonelyseat</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(242,245,243,0.65);text-transform:uppercase;letter-spacing:0.12em;">Aotearoa</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            ${opts.greeting ? `<p style="margin:0 0 16px;font-size:20px;font-weight:700;color:${INK};">${escapeHtml(opts.greeting)}</p>` : ""}
            ${paras}
            ${opts.detailsHtml ?? ""}
            ${ctas ? `<div style="margin:20px 0 8px;">${ctas}</div>` : ""}
            ${faq}
            <p style="margin:28px 0 0;font-size:14px;color:${SLATE};">Thanks,<br/><strong style="color:${INK};">The Lonelyseat Team</strong></p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:${SLATE};">Fill the lonely seat · <a href="${linkTo("/")}" style="color:${ORANGE};">lonelyseat.vercel.app</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

export function plainFromParts(opts: {
  greeting?: string;
  paragraphs: string[];
  detailsText?: string;
  ctas?: Cta[];
}) {
  const bits = [
    opts.greeting,
    ...opts.paragraphs,
    opts.detailsText,
    ...(opts.ctas ?? []).map((c) => `${c.label}: ${c.href}`),
    "Thanks,\nThe Lonelyseat Team",
  ].filter(Boolean);
  return bits.join("\n\n");
}
