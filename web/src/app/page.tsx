import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";

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
              Match stuff you need to send with Kiwis already heading that way.
            </h1>
            <p className="animate-rise-delay-2 mt-4 max-w-lg text-base leading-relaxed text-white/70 md:text-lg">
              Fill the lonely seat, save about half vs courier, and cut the carbon of empty cars.
            </p>
            <div className="animate-rise-delay-2 mt-9 flex flex-wrap gap-3">
              <Link href="/browse/stuff" className="btn btn-primary">
                Search Stuff
              </Link>
              <Link href="/browse/drivers" className="btn btn-ghost">
                Search Drivers
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
              <h3 className="font-display text-2xl font-semibold">I&apos;m a Sender</h3>
              <ol className="mt-5 space-y-4 text-slate leading-relaxed">
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">01</span>
                  <span>List your stuff — space, pickup, dropoff, and times that work.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">02</span>
                  <span>Match with a driver already heading your way.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">03</span>
                  <span>Track live, get a drop-off photo, then review your driver.</span>
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
              <h3 className="font-display text-2xl font-semibold">I&apos;m a Driver</h3>
              <ol className="mt-5 space-y-4 text-slate leading-relaxed">
                <li className="flex gap-3">
                  <span className="font-display text-leaf-deep">01</span>
                  <span>Verify your licence, go online, set your corridor.</span>
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

      <section className="bg-moss px-5 py-20 text-paper md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
          {[
            {
              title: "Save ~50%",
              body: "Auckland → Christchurch desk chair ~$70 vs ~$150 courier — driver keeps most of it.",
            },
            {
              title: "On-the-way matching",
              body: "Fill empty seats and boots on journeys already happening — Kerikeri to Invercargill.",
            },
            {
              title: "Trusted community",
              body: "Licence vetting, escrow until delivered, live GPS, and two-way reviews.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-2xl font-semibold text-leaf">{item.title}</h2>
              <p className="mt-3 max-w-sm leading-relaxed text-paper/70">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-14 max-w-6xl border-t border-white/10 pt-8">
          <Link href="/estimate" className="text-sm font-medium text-paper/80 underline-offset-4 hover:text-leaf hover:underline">
            Get a fare estimate before you join →
          </Link>
        </div>
      </section>
    </main>
  );
}
