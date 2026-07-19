import Link from "next/link";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LONELY_COVER_FEE, LONELY_COVER_LIMIT } from "@/lib/spaces";

export const metadata = {
  title: "Terms and Conditions · Lonelyseat",
  description:
    "Lonelyseat customer terms and conditions for using the peer-to-peer delivery platform across Aotearoa New Zealand.",
};

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 font-display text-2xl font-semibold">{children}</h2>;
}

function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-slate">{children}</p>;
}

function Ul({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-slate">{children}</ul>;
}

export default async function TermsPage() {
  const user = await getSession();
  const fee = LONELY_COVER_FEE.toFixed(2);
  const coverLimit = LONELY_COVER_LIMIT.toLocaleString("en-NZ");

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-3 text-slate">
          Lonelyseat customer terms · Effective 19 July 2026 · Governed by the laws of New Zealand
        </p>
        <P>
          These Terms update Lonelyseat&apos;s earlier customer terms (including the 1 May 2019
          version) for the current platform and New Zealand law. Related:{" "}
          <Link href="/lonely-cover" className="text-sea underline underline-offset-4">
            Lonely Cover Policy
          </Link>
          .
        </P>

        <H2>1. Overview</H2>
        <P>
          Lonelyseat provides a peer-to-peer, on-the-way delivery marketplace (&quot;Service&quot;)
          through the Lonelyseat website and/or app that Lonelyseat may operate from time to time
          (together, the &quot;Platform&quot;). The Platform enables customers (&quot;Customers&quot;,
          &quot;you&quot; or &quot;your&quot;) — including senders and drivers — to make or accept a
          booking request (&quot;Booking Request&quot;) so a registered driver can accept that request
          (together, a &quot;Booking&quot;) and perform the delivery of item(s) (the
          &quot;Consignment&quot;).
        </P>
        <P>
          Lonelyseat is a platform operator. Lonelyseat is not a transportation carrier or common
          carrier. Drivers decide whether to offer and perform pick-up, carry, and delivery services.
        </P>

        <H2>2. Acceptance of agreement</H2>
        <Ul>
          <li>
            Access to and use of the Platform and Service is conditional on your acceptance of these
            terms and conditions (&quot;Terms&quot;) and any other conditions and notices on the
            Platform, which together form a legally binding agreement between Lonelyseat and you (the
            &quot;Agreement&quot;), as varied from time to time.
          </li>
          <li>
            Creating an account, logging in, or using the Service indicates acceptance of this
            Agreement. If you do not accept it, you must not use the Service.
          </li>
          <li>
            Electronic acceptance and records may form part of the Agreement under Part 4 of the{" "}
            <strong className="text-ink">Contract and Commercial Law Act 2017</strong> (electronic
            transactions).
          </li>
          <li>
            If anything on the Platform conflicts with these Terms, these Terms prevail (except where
            mandatory New Zealand law requires otherwise).
          </li>
          <li>
            You must be at least 18 years old and have legal capacity to enter this Agreement. Drivers
            must hold a valid New Zealand driver licence (and any other licence or permit required for
            the Consignment) under the{" "}
            <strong className="text-ink">Land Transport Act 1998</strong> and related rules.
          </li>
        </Ul>

        <H2>3. Commencement</H2>
        <P>
          The Agreement begins when you register for the Service. On registration you receive a user
          account (&quot;User Account&quot;) to access the Service.
        </P>

        <H2>4. Amendment of agreement</H2>
        <P>
          Lonelyseat may change these Terms from time to time. For material changes, Lonelyseat will
          take reasonable steps to notify you (for example via the Platform and/or the email on your
          User Account). The current Terms will be posted on the Platform. Continued use of the
          Service after the effective date of updated Terms signifies acceptance, except where
          mandatory law requires a different process. Nothing in this clause limits rights you may
          have under the{" "}
          <strong className="text-ink">Fair Trading Act 1986</strong> or the{" "}
          <strong className="text-ink">Consumer Guarantees Act 1993</strong>.
        </P>

        <H2>5. How to book the Service</H2>
        <P>When logged into your User Account you may make a Booking Request. You will be asked for:</P>
        <Ul>
          <li>
            a description of the Consignment (including space/size and what it will fit in);
          </li>
          <li>
            the pick-up address within the Territory, and the name of the person authorised to hand
            over the Consignment (&quot;Authorised Sender&quot;);
          </li>
          <li>
            the drop-off address within the Territory, and the name of the person or organisation to
            receive it (&quot;Authorised Recipient&quot;);
          </li>
          <li>
            the earliest collection time (&quot;Pick-Up Time&quot;) and any preferred delivery window
            or time preference; and
          </li>
          <li>any optional Lonely Cover selection and other listing acknowledgements on the Platform.</li>
        </Ul>
        <P>
          We will then show an estimate or quote for the Service (&quot;Service Fee&quot;). If you
          proceed, payment is authorised via Lonelyseat&apos;s payment provider (currently card
          payments processed through Stripe or another provider we nominate). Your Booking Request is
          then submitted to the Platform for matching or acceptance by drivers.
        </P>

        <H2>6. Overview of Service</H2>
        <Ul>
          <li>
            After you submit a Booking Request (subject to clause 15), Lonelyseat uploads it to the
            Platform. Drivers may view open requests; acceptance is generally on a first-come basis,
            subject to matching, offers, and these Terms.
          </li>
          <li>Lonelyseat does not guarantee that any Booking Request will be accepted.</li>
          <li>
            Once a Booking is made, the driver will endeavour to attend the pick-up address around
            the Pick-Up Time, may verify sender details, and may photograph the Consignment.
          </li>
          <li>
            While the Consignment is in transit, status updates may be available via the Platform
            (including inbox, email, and/or SMS where enabled).
          </li>
          <li>
            At drop-off, the driver may require a signature or confirmation unless otherwise
            instructed, may leave the Consignment with a person who represents they are authorised to
            receive it, and may photograph the Consignment again.
          </li>
        </Ul>

        <H2>7. Engagement of drivers</H2>
        <Ul>
          <li>
            Lonelyseat uploads Booking Requests to the Platform subject to these Terms. Drivers
            perform deliveries as independent service providers, not as Lonelyseat employees (unless
            Lonelyseat expressly says otherwise in writing).
          </li>
          <li>
            By using the Platform you agree to interact lawfully with other users, including
            obligations under applicable workplace, health and safety, and transport laws where they
            apply to you.
          </li>
          <li>
            A registered driver may perform a Booking personally, through their employees, or via a
            subcontracted driver, provided performance remains consistent with these Terms and any
            Lonelyseat driver requirements.
          </li>
        </Ul>

        <H2>8. Consignments</H2>
        <Ul>
          <li>
            You warrant that you have lawful authority to authorise collection, transport, and
            delivery of the Consignment as booked.
          </li>
          <li>
            You warrant that each Consignment (including packaging) will not cause damage or injury
            to any person or property in the ordinary course of carriage, storage, and transport.
          </li>
          <li>
            Unless you purchase Lonely Cover, consignments travel at the{" "}
            <strong className="text-ink">owner&apos;s risk</strong> under Part 5 of the{" "}
            <strong className="text-ink">Contract and Commercial Law Act 2017</strong>. Lonelyseat
            does not sell regulated insurance. Optional Lonely Cover is contractual protection
            described in the{" "}
            <Link href="/lonely-cover" className="text-sea underline underline-offset-4">
              Lonely Cover Policy
            </Link>{" "}
            (${fee} / up to ${coverLimit}). You may also arrange your own insurance.
          </li>
          <li>
            If a Consignment is heavier than reasonably liftable alone, you must arrange another
            person to help the driver load and unload.
          </li>
          <li>
            You must not book or permit delivery of: people; stolen or illegal items; fragile or
            perishable goods unless clearly labelled and notified at booking; money or negotiable
            instruments (unless Lonelyseat has approved); dangerous goods under the{" "}
            <strong className="text-ink">Land Transport Rule: Dangerous Goods 2005</strong> (or any
            replacement rule) or other law unless the driver holds required licences and complies with
            legal requirements; illicit drugs, fireworks, weapons or firearms unless lawful and
            properly licensed; hazardous materials that remain hazardous even if packaged carefully;
            chemicals, gases, poisons, radioactive materials, infectious substances and similar
            controlled materials unless licensed carriage applies; human tissue or living organisms
            unless clearly labelled and notified; or anything otherwise unlawful.
          </li>
          <li>
            A driver has no authority to bind Lonelyseat. You must not agree alternative terms with a
            driver that contradict this Agreement.
          </li>
          <li>Changes after a Booking is allocated to a driver may incur additional Service Fees.</li>
        </Ul>

        <H2>9. Service Fee</H2>
        <Ul>
          <li>
            <strong className="text-ink">Consumer accounts:</strong> We advise the Service Fee when
            you create a Booking Request. If you proceed, your card (or other approved method) is
            charged or authorised for that amount. The Service Fee is inclusive of GST (if any),
            unless we state otherwise.
          </li>
          <li>
            <strong className="text-ink">Commercial accounts:</strong> Where Lonelyseat has approved
            an account, the Service Fee may be charged to that account plus GST (if any) under the{" "}
            <strong className="text-ink">Goods and Services Tax Act 1985</strong>, with tax invoices
            issued as required.
          </li>
          <li>
            If you cancel a Booking that a driver has accepted but the Consignment has not been
            picked up, Lonelyseat may refund or release the Service Fee according to the Platform
            cancellation rules (including mutual or forced cancellation flows).
          </li>
        </Ul>

        <H2>10. Payment</H2>
        <Ul>
          <li>
            By providing payment details, you authorise Lonelyseat and its payment processor to charge
            or authorise the Service Fee (and any agreed extras such as Lonely Cover or donations)
            until payment succeeds. You are responsible for insufficient-funds and similar charges.
          </li>
          <li>
            Lonelyseat may retain payment tokens/details as needed to process fees under this
            Agreement, in line with our privacy practices and card-scheme rules.
          </li>
          <li>
            Nothing prevents Lonelyseat recovering unpaid Service Fees, including reasonable
            recovery costs on a solicitor–client basis where recoverable by law.
          </li>
          <li>
            Amounts due must be paid without deduction, set-off, or counterclaim, except where a
            set-off is required or permitted by mandatory law.
          </li>
        </Ul>

        <H2>11. Attendance</H2>
        <P>
          The driver will wait a maximum of 10 minutes at pick-up and drop-off unless the Platform
          states otherwise for a corridor or Booking. If after that time the Authorised Sender or
          Recipient is not present:
        </P>
        <Ul>
          <li>
            at pick-up — the driver may leave, and the Service Fee may not be refunded; or
          </li>
          <li>
            at drop-off — the driver may leave the Consignment with an apparent authorised person, or
            if nobody is available, follow Platform instructions (including return or storage), and
            additional fees may apply.
          </li>
        </Ul>

        <H2>12. Your obligations</H2>
        <P>You acknowledge and agree that:</P>
        <Ul>
          <li>registration and account information will be complete, accurate, and kept up to date;</li>
          <li>
            information you provide (including third-party contact details) will be complete and
            accurate, and you have a lawful basis (including consent where required under the{" "}
            <strong className="text-ink">Privacy Act 2020</strong>) to provide another person&apos;s
            details;
          </li>
          <li>Booking details will be complete and accurate as required by clause 5;</li>
          <li>
            you will not solicit drivers for off-platform work using Platform contacts without our
            prior written consent;
          </li>
          <li>
            the Consignment will be ready at pick-up as booked (generally at least 15 minutes before
            the stated ready time);
          </li>
          <li>you will arrange acceptance at drop-off as booked;</li>
          <li>
            Authorised Sender and Recipient will be present where required and able to confirm
            pick-up/drop-off unless otherwise instructed;
          </li>
          <li>
            the Consignment is suitable and safe to carry, and is secured, packaged, and labelled in
            compliance with applicable law;
          </li>
          <li>you will allow photography and reasonable inspection of the Consignment by the driver; and</li>
          <li>
            you will not unlawfully defame Lonelyseat, its people, drivers, or other customers —
            without limiting your right to make genuine complaints to Lonelyseat or to regulators
            (including under the Fair Trading Act 1986 or Privacy Act 2020).
          </li>
        </Ul>

        <H2>13. Our obligations</H2>
        <P>
          Subject to your compliance with this Agreement, Lonelyseat will provide the Platform and
          Service with reasonable care and skill. Where you are a consumer, nothing in these Terms
          limits non-excludable rights under the Consumer Guarantees Act 1993 or the Fair Trading Act
          1986.
        </P>

        <H2>14. User Account</H2>
        <Ul>
          <li>
            You must create a User Account and provide personal information reasonably requested
            (typically name, physical address (not a PO Box alone), phone, and email).
          </li>
          <li>
            Information you supply must be true, complete, and accurate. You must safeguard login
            credentials and are responsible for use of your account.
          </li>
          <li>
            You warrant you have capacity and authority to enter this Agreement. Unless Lonelyseat
            agrees otherwise, one natural person or organisation should maintain one primary account;
            impersonation is prohibited.
          </li>
          <li>
            Lonelyseat is not liable for loss caused by incomplete, inaccurate, misleading, or
            fraudulent information you supply, to the extent permitted by law.
          </li>
        </Ul>

        <H2>15. Termination</H2>
        <Ul>
          <li>
            Lonelyseat may suspend or terminate your User Account, the Agreement, and access to the
            Service if it reasonably considers you have breached the Agreement or misused the
            Platform. Where practicable we will notify you. On termination you must stop using the
            Service and must not create a new account to evade the termination.
          </li>
          <li>
            On termination Lonelyseat need not continue providing the Service to you; you remain
            liable for fees already incurred.
          </li>
          <li>Accrued rights and remedies survive termination.</li>
        </Ul>

        <H2>16. Privacy</H2>
        <P>
          Lonelyseat collects, uses, and discloses personal information in accordance with the{" "}
          <strong className="text-ink">Privacy Act 2020</strong> and our Privacy Policy (available on
          the Platform or on request). By using the Service you acknowledge that policy. If we have
          not yet published a dedicated privacy URL on this rebuild, contact{" "}
          <a href="mailto:hello@lonelyseat.test" className="text-sea underline underline-offset-4">
            hello@lonelyseat.test
          </a>{" "}
          for privacy requests (access, correction, and complaints).
        </P>

        <H2>17. Confidentiality</H2>
        <P>
          You must keep Confidential Information confidential during and after the Agreement, except
          where disclosure is required by law, needed to perform obligations under the Agreement, or
          the information is public other than through your breach. These obligations survive
          termination.
        </P>

        <H2>18. Loss or damage to Consignment</H2>
        <Ul>
          <li>
            Unless Lonely Cover applies to a Booking, carriage is at{" "}
            <strong className="text-ink">owner&apos;s risk</strong> under Part 5 of the Contract and
            Commercial Law Act 2017. Lonelyseat&apos;s and (as between you and Lonelyseat) the
            platform&apos;s liability for loss or damage to the Consignment is limited accordingly,
            except where liability cannot be excluded by law.
          </li>
          <li>
            If you purchase Lonely Cover for a Booking, reimbursement for qualifying loss or damage
            is governed by the{" "}
            <Link href="/lonely-cover" className="text-sea underline underline-offset-4">
              Lonely Cover Policy
            </Link>{" "}
            (including the ${coverLimit} maximum, claim steps, and exclusions), not by any older
            “declared value” wording in prior Lonelyseat terms.
          </li>
          <li>
            For Lonely Cover or other Platform claims, you must keep evidence of damage and repair or
            replacement value, and submit claims within the timeframes in the Lonely Cover Policy (or
            otherwise within seven days of delivery, return, or when you first became aware of the
            loss or damage, if Lonely Cover does not apply and a limited Platform remedy is offered).
          </li>
          <li>
            Lonelyseat is not responsible for loss or damage merely because delivery occurs outside
            approximate times you preferred, or because special instructions were not followed, unless
            Lonelyseat expressly agreed in writing to be responsible — in which case liability is
            limited as in clause 19.
          </li>
          <li>
            To the maximum extent permitted by law, Lonelyseat is not liable for consequential,
            indirect, or special loss arising from a driver&apos;s late or non-delivery. Drivers remain
            responsible for their own negligence to the extent the law requires.
          </li>
        </Ul>

        <H2>19. Refund and liability</H2>
        <Ul>
          <li>
            You may request a refund of the Service Fee if the driver fails to attend pick-up or
            complete delivery for reasons not caused by your breach. Lonelyseat will consider refunds
            reasonably and in line with Platform rules. Contact{" "}
            <a href="mailto:hello@lonelyseat.test" className="text-sea underline underline-offset-4">
              hello@lonelyseat.test
            </a>
            .
          </li>
          <li>
            Subject to clause 18, Lonely Cover, and mandatory law, Lonelyseat excludes liability for
            loss or damage (including indirect or consequential loss) arising from your use of the
            Service.
          </li>
          <li>
            Where you acquire the Service for business purposes, you agree the guarantees in the
            Consumer Guarantees Act 1993 are contracted out of to the extent permitted by section 43
            of that Act. Where you are a consumer, those guarantees and Fair Trading Act protections
            continue to apply and prevail over any inconsistent exclusion.
          </li>
          <li>
            If a non-excludable condition or warranty applies, Lonelyseat&apos;s liability is limited —
            where the law allows — to re-supply of the Service or a refund of the Service Fee, at
            Lonelyseat&apos;s option.
          </li>
          <li>
            Nothing excludes liability for fraud, wilful default, or any liability that cannot be
            excluded under New Zealand law. Personal injury claims are generally subject to the ACC
            scheme under the{" "}
            <strong className="text-ink">Accident Compensation Act 2001</strong>.
          </li>
          <li>
            Neither party is liable for delay or non-performance caused by a force majeure event
            outside reasonable control (including natural disasters, war, terrorism, extreme weather,
            fire, or industrial action), except that payment obligations already accrued are not
            excused.
          </li>
        </Ul>

        <H2>20. Modification, suspension, and termination of the Platform</H2>
        <P>
          Lonelyseat may modify, suspend, or discontinue the Platform, or suspend or terminate your
          access, where reasonably necessary (including for security, legal, or operational reasons).
          Where practicable we will give notice. Lonelyseat is not liable solely because of suspension,
          termination, deletion of Platform content you posted, or modification of the Platform,
          except where liability cannot be excluded. Continued use after notice of modifications
          indicates acceptance of the Platform as modified.
        </P>

        <H2>21. Indemnity</H2>
        <P>
          You indemnify Lonelyseat and its officers, directors, employees, and agents against loss
          (including reasonable solicitor–client costs) arising from third-party claims to the extent
          caused by your use of the Service, your breach of the Agreement, or your unlawful
          infringement of third-party rights — except to the extent caused by Lonelyseat&apos;s
          negligence or breach. This clause survives termination.
        </P>

        <H2>22. Dispute resolution</H2>
        <Ul>
          <li>
            Raise a dispute in writing (nature of dispute, outcome sought, and proposed resolution)
            (&quot;Dispute Notice&quot;).
          </li>
          <li>The parties will meet in good faith to try to resolve it.</li>
          <li>
            If unresolved within two weeks of the Dispute Notice, either party may refer the matter to
            mediation. If the parties cannot agree a mediator, either may ask the New Zealand Law
            Society (or its relevant branch president) to appoint one. Mediation costs are shared
            equally unless agreed otherwise.
          </li>
          <li>
            Nothing prevents either party seeking urgent injunctive or similar relief from a New
            Zealand court. Consumers may also use applicable dispute or complaints avenues under New
            Zealand consumer law.
          </li>
        </Ul>

        <H2>23. Notices</H2>
        <P>
          Notices must be in writing in English. To Lonelyseat: Lonelyseat Limited, Attention: The
          Director, Frankton, Hamilton, New Zealand ·{" "}
          <a href="mailto:hello@lonelyseat.test" className="text-sea underline underline-offset-4">
            hello@lonelyseat.test
          </a>{" "}
          (or{" "}
          <a href="mailto:admin@lonelyseat.co.nz" className="text-sea underline underline-offset-4">
            admin@lonelyseat.co.nz
          </a>{" "}
          if that address is active). Lonelyseat may update its notice details on the Platform. Notices
          to you may be sent to the details on your User Account.
        </P>

        <H2>24. General</H2>
        <Ul>
          <li>
            Nothing in this Agreement creates a partnership, joint venture, agency, or employment
            relationship between Lonelyseat and you.
          </li>
          <li>
            You must not assign your rights or obligations without Lonelyseat&apos;s prior written
            consent.
          </li>
          <li>Failure to enforce a right is not a waiver.</li>
          <li>Rights under this Agreement are cumulative.</li>
          <li>
            Consents may be given or withheld in Lonelyseat&apos;s reasonable discretion unless the
            Agreement says otherwise.
          </li>
          <li>
            This Agreement is the entire agreement between the parties about its subject matter and
            supersedes prior communications.
          </li>
          <li>
            Lonelyseat is not a common carrier and reserves the right to refuse a Booking Request or
            Service where reasonably necessary (including safety, legality, or abuse of the Platform).
          </li>
          <li>
            You consent to Lonelyseat communicating with Authorised Recipients as needed to complete
            a Booking.
          </li>
          <li>
            This Agreement is governed by New Zealand law. The parties submit to the non-exclusive
            jurisdiction of the New Zealand courts.
          </li>
        </Ul>

        <H2>25. Definitions</H2>
        <P>In this Agreement, unless the context requires otherwise:</P>
        <Ul>
          <li>
            <strong className="text-ink">App</strong> means an iOS or Android app offered by
            Lonelyseat from time to time.
          </li>
          <li>
            <strong className="text-ink">Authorised Recipient / Authorised Sender</strong> have the
            meanings in clause 5.
          </li>
          <li>
            <strong className="text-ink">Booking</strong> means a Customer booking processed on the
            Platform and accepted by a Registered Driver.
          </li>
          <li>
            <strong className="text-ink">Business Day</strong> means a day that is not a Saturday,
            Sunday, or public holiday in the relevant Territory.
          </li>
          <li>
            <strong className="text-ink">Confidential Information</strong> means the Agreement and
            non-public information about Lonelyseat, its operations, products, services, drivers, and
            senders acquired through the Service.
          </li>
          <li>
            <strong className="text-ink">Consignment</strong> means the item(s) described in a Booking
            Request.
          </li>
          <li>
            <strong className="text-ink">Driver / Registered Driver</strong> means a driver approved
            to offer deliveries on the Platform (including permitted subcontractors/employees bound by
            these Terms as applicable).
          </li>
          <li>
            <strong className="text-ink">GST</strong> means goods and services tax under the Goods and
            Services Tax Act 1985.
          </li>
          <li>
            <strong className="text-ink">Lonelyseat</strong> means Lonelyseat Limited (or the Lonelyseat
            entity operating the Platform).
          </li>
          <li>
            <strong className="text-ink">Platform / Service / Service Fee / Terms / Territory / Website</strong>{" "}
            have the meanings given in these Terms; Territory means the New Zealand area(s) where
            Lonelyseat operates, as updated from time to time; Website includes lonelyseat.vercel.app
            and lonelyseat.co.nz (or successor domains).
          </li>
        </Ul>
        <P>
          Words in the singular include the plural and vice versa; headings are for convenience only;
          &quot;includes&quot; means includes without limitation; time references are to New Zealand
          time unless stated otherwise. If something must be done on a non-Business Day, it may be
          done on the next Business Day.
        </P>

        <p className="mt-12 text-sm text-slate">
          Thank you for reading the Lonelyseat Terms. This page is a platform rebuild of Lonelyseat
          customer terms for demonstration and product use; it is not a substitute for tailored legal
          advice.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/lonely-cover" className="btn btn-primary">
            Lonely Cover Policy
          </Link>
          <Link href="/register" className="btn btn-dark">
            Create an account
          </Link>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
