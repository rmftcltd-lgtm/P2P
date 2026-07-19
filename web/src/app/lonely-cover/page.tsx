import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LONELY_COVER_FEE, LONELY_COVER_LIMIT } from "@/lib/spaces";

export const metadata = {
  title: "Lonely Cover Policy · Lonelyseat",
  description: `Optional Lonely Cover — $${LONELY_COVER_FEE} protects your stuff up to $${LONELY_COVER_LIMIT.toLocaleString("en-NZ")} while it travels with a Lonelyseat driver.`,
};

export default async function LonelyCoverPolicyPage() {
  const user = await getSession();
  const fee = LONELY_COVER_FEE.toFixed(2);
  const limit = LONELY_COVER_LIMIT.toLocaleString("en-NZ");

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">Policy</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Lonely Cover
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate">
          Optional contractual protection for senders —{" "}
          <strong className="text-ink">${fee} NZD</strong> per delivery, up to{" "}
          <strong className="text-ink">${limit} NZD</strong>. Lonely Cover is{" "}
          <em>not</em> insurance.
        </p>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">About Lonelyseat and Lonely Cover</h2>
          <p className="leading-relaxed text-slate">
            Lonelyseat is a platform and does not provide transportation services. We are not a
            transportation carrier. It is the third-party driver&apos;s sole decision whether to offer
            and provide the pick-up, carry, and delivery services requested by senders.
          </p>
          <p className="leading-relaxed text-slate">
            All item(s) sent using the Lonelyseat platform are sent at the{" "}
            <strong className="text-ink">&quot;owner&apos;s risk&quot;</strong> within the meaning of the
            carriage-of-goods rules in{" "}
            <strong className="text-ink">Part 5 of the Contract and Commercial Law Act 2017</strong>{" "}
            (which consolidated the former Carriage of Goods Act 1979, as amended including by the
            Carriage of Goods Amendment Act 2013). By using the platform, senders agree to this.
          </p>
          <p className="leading-relaxed text-slate">
            Lonelyseat provides Lonely Cover, which is not regulated insurance under New Zealand
            insurance law, but optional contractual protection that a sender may choose and pay
            for. Lonely Cover costs <strong className="text-ink">${fee}</strong> per delivery and
            must be purchased when the delivery is arranged. No additional protection can or will
            be added once the delivery is accepted. If a sender opts into Lonely Cover, Lonelyseat
            will reimburse the sender for loss or damage arising from theft or property damage to
            the sender&apos;s item(s) during a delivery and arising directly from a driver&apos;s
            negligence, up to a maximum of <strong className="text-ink">${limit}</strong> per
            item(s).
          </p>
          <p className="leading-relaxed text-slate">
            To qualify, the sender must declare the value of the item(s) in the delivery and comply
            with Lonelyseat&apos;s other requirements when initiating the delivery on the platform,
            including taking a picture of the item(s). To claim, the sender must complete an online
            claim form and provide Lonelyseat with any packaging used (where applicable) for the
            damaged item(s), proof of value, and — where applicable — a satisfactory Police report.
          </p>
          <p className="leading-relaxed text-slate">
            No matter what total value the sender declares for a delivery or any individual item(s)
            in it, Lonelyseat&apos;s maximum reimbursement for loss or damage to item(s) in a
            delivery is <strong className="text-ink">${limit}</strong>.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Carrier&apos;s liability, permits, motor vehicle insurance, and personal injury
          </h2>
          <p className="leading-relaxed text-slate">
            Because drivers act as their own employers when providing services via the Lonelyseat
            platform, Lonelyseat does not — and has no responsibility to — provide or pay for any
            permit, licence, or insurance a driver may need (or that may be advisable) to perform
            services via the Lonelyseat platform.
          </p>
          <p className="leading-relaxed text-slate">
            Before accepting certain item(s), every driver has a responsibility to ensure they hold
            all necessary permits and/or licences to carry those item(s) when performing a
            delivery. Drivers should also check with their insurer: many policies require commercial
            or business-use cover if a personal vehicle is used for business purposes. Vehicle
            licensing and roadworthiness obligations under the{" "}
            <strong className="text-ink">Land Transport Act 1998</strong> and related rules remain
            the driver&apos;s responsibility.
          </p>
          <p className="leading-relaxed text-slate">
            Lonelyseat does not provide health insurance or any other compensation to drivers if
            they are hurt or injured while performing a delivery. Personal injury cover in New
            Zealand is primarily provided through the Accident Compensation Corporation (ACC)
            scheme under the{" "}
            <strong className="text-ink">Accident Compensation Act 2001</strong>. All drivers should
            be familiar with their rights and responsibilities under ACC.
          </p>
          <p className="leading-relaxed text-slate">
            Drivers expressly acknowledge that Lonelyseat does not provide motor vehicle liability
            or health insurance to drivers, and is not responsible for paying for any liability that
            may arise from a driver&apos;s performance of a delivery — including bodily injury or
            damage to property caused by or to the driver while on a delivery.
          </p>
          <ol className="list-decimal space-y-3 pl-5 leading-relaxed text-slate">
            <li>
              The driver owns, or has the legal right to operate, the vehicle used in a delivery,
              and has a valid policy of motor vehicle liability insurance covering any vehicle used
              during a delivery, with cover in types and amounts required by, or consistent with,
              all applicable legal requirements and industry standards (including commercial motor
              cover when applicable), and is named or scheduled on the insurance policy. Any vehicle
              used during a delivery must meet applicable safety standards and statutory motor
              vehicle requirements. Drivers must keep proof of all required licences and insurance
              with them at all times during a delivery.
            </li>
            <li>
              Drivers are solely responsible for all liability that results from, or is alleged as a
              result of, the vehicle used during a delivery, including personal injuries, death, and
              property damage.
            </li>
            <li>
              Drivers are responsible for contacting their insurers in the event of a motor vehicle
              accident or claims against a driver&apos;s insurance policy for damage or injury during
              a delivery.
            </li>
            <li>
              Lonelyseat has no responsibility or liability for any driver or sender not having the
              proper authority, permits, licences, or insurance to enter into the transactions agreed
              upon.
            </li>
          </ol>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Limits on recovery</h2>
          <p className="leading-relaxed text-slate">
            Lonely Cover limits a sender&apos;s recovery for loss or damage to certain item(s). If
            the delivery contains one of the item(s) below, Lonelyseat&apos;s maximum obligation for
            loss or damage is as follows:
          </p>
          <ul className="list-disc space-y-3 pl-5 leading-relaxed text-slate">
            <li>
              <strong className="text-ink">Cheques:</strong> If a delivery containing a cheque is
              lost or damaged, Lonelyseat will not pay the face value of the cheque. Liability is
              limited to the cost of stopping payment on and reissuing the cheque, not to exceed{" "}
              <strong className="text-ink">$100</strong> per delivery.
            </li>
            <li>
              <strong className="text-ink">Coins, currency, postage stamps, negotiable instruments, money orders:</strong>{" "}
              No reimbursement.
            </li>
            <li>
              <strong className="text-ink">Phone cards, tickets, gift cards, and similar cards:</strong>{" "}
              Liability is limited to the cost of replacing the physical card, certificate, or
              printed matter (as with cheques, gift certificates, coupons, or similar printed
              matter), not to exceed <strong className="text-ink">$100</strong> per delivery.
            </li>
            <li>
              <strong className="text-ink">Live animal(s):</strong> The sender must provide proof of
              actual value (invoice, sales receipt, or verifiable value of a like item). Lonelyseat
              cannot and will not reimburse for emotional damages related to the loss of a live
              animal&apos;s life, or any other direct or indirect damages related to that loss, as
              such a value is indeterminable. Reimbursement up to the full limits of Lonely Cover.
            </li>
            <li>
              <strong className="text-ink">Perishable item(s):</strong> Not covered under Lonely
              Cover, even where loss or damage is due to packaging, spoiling, or degradation —
              except where spoiling is due to the driver&apos;s misconduct, negligence, or failure to
              complete delivery within the time set out in the request. In that exception,
              Lonelyseat may reimburse up to the Lonely Cover limit where proof of value is provided.
            </li>
            <li>
              <strong className="text-ink">Media:</strong> Liability for loss or damage to a
              delivery containing media (such as documents, film, or photographs) is limited to the
              replacement cost of the media on which the content is recorded. Reimbursement up to
              the limits of Lonely Cover.
            </li>
            <li>
              <strong className="text-ink">Heirlooms, antiques, one-of-a-kind:</strong> The sender
              must provide proof of actual value (invoice, sales receipt, appraisal, or verifiable
              value of a like item). Lonelyseat cannot and will not reimburse for &quot;sentimental
              value&quot; or related damages. Reimbursement up to the limits of Lonely Cover.
            </li>
            <li>
              <strong className="text-ink">Unopened, new-in-box consumer electronics:</strong>{" "}
              Reimbursement up to the limits of Lonely Cover, provided there is significant visible
              damage to the packaging that occurred while in the driver&apos;s possession.
            </li>
            <li>
              <strong className="text-ink">Used electronics:</strong> &quot;Used&quot; means any
              item(s) that have been opened and removed from original packaging, even if never
              actually used. Reimbursement is limited to market value at Lonelyseat&apos;s
              discretion, up to <strong className="text-ink">$500</strong> per delivery. The sender
              must provide adequate proof that the item was undamaged and operative at pick-up, plus
              an assessment of the damage by a professional repairer.
            </li>
            <li>
              <strong className="text-ink">Prohibited and undisclosed special item(s):</strong> No
              reimbursement.
            </li>
          </ul>
          <p className="leading-relaxed text-slate">
            Lonelyseat will not reimburse any sender for any delivery or item(s) in excess of
            Lonelyseat&apos;s maximum limits, regardless of actual value. Lonelyseat is also not
            liable for loss and/or damage if the item(s) are not properly protected to withstand
            transport (where appropriate).
          </p>
          <p className="leading-relaxed text-slate">
            Lonely Cover does not apply to any prohibited item(s) or any undisclosed special
            item(s), and under no circumstances will Lonelyseat reimburse anyone for loss or damage
            to those item(s).
          </p>
          <p className="leading-relaxed text-slate">
            <strong className="text-ink">Please note:</strong> A driver is never obliged to take
            anything that has not been inspected, and may always cancel the delivery without penalty
            if the sender does not allow inspection or gives the driver a hard time about asking to
            inspect.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Proof of value and packaging</h2>
          <p className="leading-relaxed text-slate">
            A sender must prove the value of the item(s) subject to the claim, regardless of the
            value declared or the Lonely Cover limit the sender is entitled to. Lonelyseat will not
            pay on a claim without proof of the declared value. The user must also provide
            documentation that verifies the replacement or repair cost of the item(s).
          </p>
          <p className="leading-relaxed text-slate">
            The sender must also provide all packaging (if any) used for the item(s) subject to the
            claim, or the item(s) themselves, when submitting a claim. In cases of unexplained loss
            or other mysterious disappearance, the sender must also provide a satisfactory Police
            report for the lost item(s) or delivery.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Filing a claim</h2>
          <p className="leading-relaxed text-slate">
            A sender must file a claim within <strong className="text-ink">three business days</strong>{" "}
            of delivery. To file a claim the sender must complete all of the following:
          </p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>Collect proof-of-value documentation for the item(s) that are part of the claim.</li>
            <li>Collect pictures of the item(s) that are part of the claim.</li>
            <li>
              For damaged item(s), obtain and keep the damaged item(s). If Lonelyseat pays out on a
              claim, the damaged item(s) must be delivered to Lonelyseat and ownership transfers to
              Lonelyseat upon payout.
            </li>
            <li>
              Fill out the claim form on our platform in the user dashboard and upload any evidence
              or information outlined to support the claim.
            </li>
          </ul>
          <p className="leading-relaxed text-slate">
            Lonelyseat aims to resolve sender claims within{" "}
            <strong className="text-ink">five business days</strong> after a completed claim form and
            supporting documentation are received. Lonelyseat will notify senders of its decision and
            the amount to be paid. After Lonelyseat has assessed the sender&apos;s claim, if the
            claim is approved, Lonelyseat will release any money still held in escrow to the sender
            and pay out any additional Lonely Cover amount. Where a claim is successful, a review
            will be posted against the driver by admin on their profile.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Repairing or replacing an item(s)</h2>
          <p className="leading-relaxed text-slate">
            When repairing or replacing item(s), Lonelyseat may reimburse the sender based on:
          </p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>the lowest price paid for the item(s);</li>
            <li>the replacement cost of the item(s) at the time and place of loss or damage; or</li>
            <li>the cost of repairing the damaged item(s).</li>
          </ul>
          <p className="leading-relaxed text-slate">
            The user must provide a third-party repair quote or evaluation from a qualified repair
            facility. If the third party decides that the item(s) are not repairable, Lonelyseat will
            pay the actual or replacement value up to the maximum liability under Lonely Cover.
          </p>
          <p className="leading-relaxed text-slate">
            A sender must submit all repair quotes as part of the claims process. While Lonelyseat
            may pay the cost of repair, it is the sender&apos;s responsibility to have the item(s)
            repaired.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Loss or damage to a limited part of item(s)
          </h2>
          <p className="leading-relaxed text-slate">
            If a set of item(s) is lost or damaged, Lonelyseat is only liable for the value of the
            part of the set that is lost or damaged — not the value of the whole pair or set.
          </p>
          <p className="leading-relaxed text-slate">
            If any part of an item (including any part of a machine) that consists of several parts
            is lost or damaged, Lonelyseat is only liable for the value of the part lost or damaged,
            not to exceed the declared value of that part. Lonelyseat will not be liable for the
            value of the complete item(s).
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Third-party claims providers</h2>
          <p className="leading-relaxed text-slate">
            Lonelyseat may use a third-party provider to manage the claims process. For damage to
            Lonelyseat special item(s), Lonelyseat will analyse the integrity of packaging and
            associated materials and will determine adequate packaging in its sole discretion.
          </p>
          <p className="leading-relaxed text-slate">
            The sender and driver acknowledge and agree that, outside Lonely Cover, Lonelyseat does
            not have control over — and has no responsibility for — any damage to the content(s) of
            a delivery, and that a driver is solely responsible to a sender for that damage.
          </p>
          <p className="leading-relaxed text-slate">
            Other details regarding Lonely Cover and claims for loss and damage can be found in our{" "}
            <Link href="/pages/help" className="text-sea underline underline-offset-4">
              Help
            </Link>{" "}
            page and FAQ.
          </p>
        </section>

        <p className="mt-12 text-sm text-slate">
          Last updated 19 July 2026 · Amounts in New Zealand dollars · This page restates Lonelyseat
          Lonely Cover terms for the platform rebuild. It is not legal advice; seek independent advice
          if you need it for your situation.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/estimate" className="btn btn-primary">
            See fare with Lonely Cover
          </Link>
          <Link href="/customer" className="btn btn-dark">
            Send stuff
          </Link>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
