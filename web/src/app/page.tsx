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
            Relay
          </p>
          <h1 className="animate-rise-delay mt-5 max-w-xl text-2xl font-500 leading-snug text-ink md:text-3xl">
            Local deliveries, matched to drivers already nearby.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-slate md:text-lg">
            Request a pickup, broadcast to online drivers, and follow the hop from
            door to door — without a fleet of your own.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href={user?.role === "CUSTOMER" ? "/customer" : "/register?role=CUSTOMER"}
              className="btn btn-primary"
            >
              Request a delivery
            </Link>
            <Link
              href={user?.role === "DRIVER" ? "/driver" : "/register?role=DRIVER"}
              className="btn btn-dark"
            >
              Drive with Relay
            </Link>
          </div>
        </div>

        <div className="relative animate-rise-delay min-h-[320px] md:min-h-[480px]">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-moss shadow-[0_30px_80px_rgba(18,23,18,0.25)]">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1616401784844-014e90b8df0b?auto=format&fit=crop&w=1600&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,23,18,0.75)] via-transparent to-[rgba(31,61,42,0.25)]" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-[#f4f8ef] md:p-8">
              <p className="font-display text-2xl font-semibold md:text-3xl">
                City-scale matching.
                <br />
                Neighborhood speed.
              </p>
            </div>
            <div className="pulse-soft absolute right-8 top-8 h-16 w-16 rounded-full bg-leaf/40 blur-sm" />
            <div className="absolute right-12 top-12 h-8 w-8 rounded-full bg-leaf" />
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--line)] bg-[rgba(255,255,255,0.45)] px-5 py-16 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
          {[
            {
              title: "Request",
              body: "Customers pin pickup and dropoff, set package size, and publish a fair offer.",
            },
            {
              title: "Match",
              body: "Online drivers within radius see nearby jobs sorted by distance to pickup.",
            },
            {
              title: "Deliver",
              body: "Accepted jobs move through pickup → transit → delivered with a live event log.",
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
