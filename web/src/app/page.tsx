import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function HomePage() {
  const user = await getSession();

  return (
    <main>
      <section className="hero-plane">
        <div className="hero-plane__media" aria-hidden />
        <div className="hero-plane__grain" aria-hidden />
        <SiteHeader user={user} tone="dark" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5.25rem)] max-w-6xl flex-col justify-end px-5 pb-16 pt-10 md:justify-center md:px-10 md:pb-24">
          <div className="max-w-2xl">
            <p className="animate-rise font-display text-5xl font-bold leading-[0.9] tracking-tight text-white md:text-7xl lg:text-8xl">
              Lonelyseat
            </p>
            <h1 className="animate-rise-delay mt-6 max-w-xl text-xl leading-snug text-white/92 md:text-2xl">
              Match your stuff with Kiwis already heading that way.
            </h1>
            <p className="animate-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Fill the lonely seat, pay less than a typical courier or freight quote, and cut the
              carbon from empty cars on Aotearoa&apos;s roads.
            </p>
            <div className="animate-rise-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/browse/stuff" className="btn btn-primary">
                Find stuff to carry
              </Link>
              <Link href="/browse/drivers" className="btn btn-ghost">
                Find a ride
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="atmosphere relative border-t border-[var(--line)] px-5 py-20 md:px-10">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sea">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Two sides. One empty seat.
          </h2>
          <div className="mt-12 grid gap-14 md:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-semibold">I need something sent</h3>
              <ol className="mt-5 space-y-4 text-slate leading-relaxed">
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">01</span>
                  <span>List your stuff — space, pick-up, drop-off, and times that suit.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">02</span>
                  <span>Match with a Kiwi already heading your way.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">03</span>
                  <span>Track live, get a drop-off photo, then leave a review.</span>
                </li>
              </ol>
              <Link
                href={user?.role === "CUSTOMER" ? "/customer" : "/register?role=CUSTOMER"}
                className="btn btn-sea mt-8"
              >
                Start sending
              </Link>
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold">I&apos;m heading that way</h3>
              <ol className="mt-5 space-y-4 text-slate leading-relaxed">
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">01</span>
                  <span>Verify your licence, come online, set your journey.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">02</span>
                  <span>Claim lonely seats — shoebox, seat, boot, or trailer.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">03</span>
                  <span>Pick up, deliver, get paid when escrow releases.</span>
                </li>
              </ol>
              <Link
                href={user?.role === "DRIVER" ? "/driver" : "/register?role=DRIVER"}
                className="btn btn-dark mt-8"
              >
                Start driving
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[var(--sea)] px-5 py-20 text-paper md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
              Fare guide
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
              See what you&apos;d pay next to courier &amp; freight.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-paper/75 md:text-lg">
              Pick your route and space for a quick NZD guide, then stack it against a typical
              NZ courier or freight quote — including Mainfreight-style domestic jobs.
            </p>
          </div>
          <Link href="/estimate" className="btn btn-primary shrink-0 self-start md:self-auto">
            Get a fare estimate
          </Link>
        </div>
      </section>

      <section className="bg-moss px-5 py-20 text-paper md:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Why peer to peer</p>
          <h2 className="mt-3 font-display text-3xl font-bold md:text-4xl">
            Four great things about lonely seats
          </h2>
          <div className="mt-12 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Faster, safer, cheaper",
                body: "Stuff rides with someone already going your way — often sooner than a depot hop, with escrow and reviews, for less than a typical courier or freight quote.",
              },
              {
                title: "Less wasted CO₂",
                body: "Empty seats and boots already burn fuel. Filling them puts spare capacity to work so fewer dedicated vans run half-full across Aotearoa.",
              },
              {
                title: "See people you love",
                body: "Drivers can cover a visit to family or mates, a weekend away, or a work trip — and earn a little while the lonely seat earns its keep.",
              },
              {
                title: "Travel with purpose",
                body: "Turn a drive you were taking anyway into a useful journey: pick up, drop off, connect with other Kiwis, and keep the roads a bit kinder.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="font-display text-2xl font-semibold text-leaf">{item.title}</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-paper/70">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
