import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";

export default async function HomePage() {
  const user = await getSession();

  return (
    <main className="atmosphere relative min-h-screen overflow-hidden">
      <div className="grid-noise pointer-events-none absolute inset-0" />
      <SiteHeader user={user} />

      <section className="relative mx-auto grid min-h-[calc(100vh-5.5rem)] max-w-6xl items-end gap-10 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-10 md:pb-20">
        <div className="relative z-10">
          <p className="animate-rise font-display text-5xl font-bold leading-[0.92] tracking-tight text-ink md:text-7xl lg:text-8xl">
            Lonelyseat
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-xl text-2xl leading-snug text-ink md:text-3xl">
            Match stuff you need to send with Kiwis already heading that way.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-slate md:text-lg">
            A better way to deliver stuff across Aotearoa — fill the lonely seat,
            save about half vs traditional courier, and cut the carbon of empty cars.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/browse/stuff" className="btn btn-primary">
              Search Stuff
            </Link>
            <Link href="/browse/drivers" className="btn btn-dark">
              Search Drivers
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link
              href={user?.role === "CUSTOMER" ? "/customer" : "/register?role=CUSTOMER"}
              className="underline text-slate"
            >
              I&apos;m a sender
            </Link>
            <Link
              href={user?.role === "DRIVER" ? "/driver" : "/register?role=DRIVER"}
              className="underline text-slate"
            >
              I&apos;m a driver
            </Link>
            <Link href="/estimate" className="underline text-slate">
              Get an estimate
            </Link>
          </div>
        </div>

        <div className="relative animate-rise-delay min-h-[320px] md:min-h-[480px]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-moss shadow-[0_30px_80px_rgba(26,26,26,0.28)]">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(26,26,26,0.8)] via-transparent to-[rgba(26,26,26,0.2)]" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-[#f7f5f2] md:p-8">
              <p className="font-display text-2xl font-semibold md:text-3xl">
                Like carsharing —
                <br />
                but you get paid to carry their stuff.
              </p>
            </div>
            <div className="pulse-soft absolute right-8 top-8 h-16 w-16 rounded-full bg-leaf/40 blur-sm" />
            <div className="absolute right-12 top-12 h-8 w-8 rounded-full bg-leaf" />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-5 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold">How it works</h2>
          <div className="mt-10 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="font-display text-xl font-semibold">I&apos;m a Sender</h3>
              <ol className="mt-4 space-y-3 text-slate leading-relaxed">
                <li>1. List your stuff — space needed, pickup, dropoff, times that work.</li>
                <li>2. Match with a driver already heading your way (or browse rides).</li>
                <li>3. Track live, get a drop-off photo, then review your driver.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">I&apos;m a Driver</h3>
              <ol className="mt-4 space-y-3 text-slate leading-relaxed">
                <li>1. Verify your licence, go online, set your location or corridor.</li>
                <li>2. Claim lonely seats — shoebox, seat, boot, or trailer space.</li>
                <li>3. Pick up, deliver, get paid (escrow releases on completion).</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
          {[
            {
              title: "Save ~50%",
              body: "Press example: Auckland → Christchurch desk chair ~$70 vs ~$150 traditional — driver keeps most of it.",
            },
            {
              title: "On-the-way matching",
              body: "Fill empty seats and boots on journeys already happening — Kerikeri to Invercargill corridors.",
            },
            {
              title: "Trusted community",
              body: "Licence vetting, escrow until delivered, live GPS, two-way reviews — rebuilt from Lonelyseat’s trust model.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-display text-2xl font-semibold">{item.title}</h2>
              <p className="mt-3 max-w-sm text-slate leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
