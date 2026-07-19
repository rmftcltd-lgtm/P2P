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
          Optional protection for stuff travelling with a Lonelyseat driver. Add{" "}
          <strong className="text-ink">${fee}</strong> when you list an item to cover loss or
          damage up to <strong className="text-ink">${limit}</strong>.
        </p>

        <section className="mt-12 space-y-3">
          <h2 className="font-display text-2xl font-semibold">1. What Lonely Cover is</h2>
          <p className="leading-relaxed text-slate">
            Lonely Cover is an optional add-on offered by Lonelyseat when you create a delivery
            request. It is not compulsory motor vehicle insurance and does not replace the
            driver&apos;s own vehicle cover. Without Lonely Cover, items travel at the
            sender&apos;s risk except where the driver intentionally causes loss or damage.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">2. Fee and cover limit</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>
              Lonely Cover fee: <strong className="text-ink">${fee} NZD</strong> per delivery
              request (added to your fare estimate and checkout total).
            </li>
            <li>
              Maximum payout: <strong className="text-ink">${limit} NZD</strong> for loss of or
              damage to the listed item during an accepted Lonelyseat trip.
            </li>
            <li>
              Cover applies only to the delivery you opted into Lonely Cover for — it does not
              roll over to future trips.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">3. When cover applies</h2>
          <p className="leading-relaxed text-slate">Cover applies while your item is:</p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>in the care of the matched Lonelyseat driver after pickup has been confirmed; and</li>
            <li>before drop-off is marked complete (including drop-off photo where required).</li>
          </ul>
          <p className="leading-relaxed text-slate">
            Escrow payment remains held until delivery is complete. Lonely Cover claims are
            assessed after the trip status is finalised (delivered, cancelled with evidence, or
            reported lost/damaged).
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">4. What is covered</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>Accidental loss of the listed item while in the driver&apos;s custody.</li>
            <li>Accidental damage to the listed item during transit on the agreed corridor.</li>
            <li>
              Reasonable repair cost or replacement value (whichever is lower), up to the cover
              limit and subject to evidence.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">5. What is not covered</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>Items you did not declare accurately (wrong title, size, or fragility).</li>
            <li>Cash, jewellery, precious metals, firearms, illegal goods, or hazardous materials.</li>
            <li>Perishable food, live animals, or plants unless Lonelyseat has agreed in writing.</li>
            <li>
              Damage caused by inadequate packaging when you did not tick that the item would be
              fully packaged (you accept that risk at listing).
            </li>
            <li>Pre-existing damage, wear and tear, or cosmetic marks that do not affect use.</li>
            <li>
              Loss after drop-off is complete, or where nobody was available to greet the driver
              when greeting was required.
            </li>
            <li>Trips cancelled before pickup, or where payment was never authorised.</li>
            <li>Consequential loss (missed events, business interruption, sentimental value).</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">6. Your responsibilities</h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate">
            <li>Describe the item truthfully and choose a realistic space size.</li>
            <li>Package sensibly for road travel unless you accept un-packaged risk.</li>
            <li>Be reachable for pickup and drop-off windows you set.</li>
            <li>
              Report loss or damage in Inbox within <strong className="text-ink">48 hours</strong>{" "}
              of the trip ending, with photos and a short description.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">7. How to claim</h2>
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed text-slate">
            <li>Open the delivery thread in Inbox and message with photos of the damage or empty drop-off.</li>
            <li>Include the request ID, what happened, and an estimate of repair or replacement cost.</li>
            <li>
              Lonelyseat reviews the thread, driver notes, GPS/status history, and any drop-off
              photo.
            </li>
            <li>
              Approved claims are paid up to ${limit} NZD, less any salvage value where relevant.
              Declined claims include a short reason in the thread.
            </li>
          </ol>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">8. Drivers</h2>
          <p className="leading-relaxed text-slate">
            Lonely Cover does not reduce your duty of care. Drive carefully, handle items as
            described, and take pickup/drop-off photos when asked. Intentional damage or theft
            remains your responsibility and may lead to account removal and recovery action.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">9. Changes</h2>
          <p className="leading-relaxed text-slate">
            We may update this policy for new corridors, partners, or legal requirements. The
            version linked at the time you opt into Lonely Cover on a request is the one that
            applies to that trip. Fee and limit shown at checkout always control for that
            delivery.
          </p>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-display text-2xl font-semibold">10. Contact</h2>
          <p className="leading-relaxed text-slate">
            Questions or claims:{" "}
            <a href="mailto:hello@lonelyseat.test" className="text-sea underline underline-offset-4">
              hello@lonelyseat.test
            </a>{" "}
            · or use{" "}
            <Link href="/feedback" className="text-sea underline underline-offset-4">
              Feedback
            </Link>
            .
          </p>
        </section>

        <p className="mt-12 text-sm text-slate">
          Last updated 19 July 2026 · New Zealand dollars · Demo policy for the Lonelyseat rebuild.
        </p>

        <p className="mt-8">
          <Link href="/estimate" className="btn btn-primary">
            See fare with Lonely Cover
          </Link>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
