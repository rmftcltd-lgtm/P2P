import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminHomePage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/");

  const [users, orders, trips, stuff, incomplete, feedback] = await Promise.all([
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.delivery.count(),
    prisma.driverTrip.count(),
    prisma.delivery.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { registrationComplete: false } }),
    prisma.userFeedback.count({ where: { status: "NEW" } }),
  ]);

  const cards = [
    { href: "/admin/users", label: "Users", value: users },
    { href: "/admin/orders", label: "Orders", value: orders },
    { href: "/admin/listings/drivers", label: "Driver listings", value: trips },
    { href: "/admin/listings/stuff", label: "Open stuff", value: stuff },
    { href: "/admin/incomplete", label: "Incomplete signups", value: incomplete },
    { href: "/admin/feedback", label: "New feedback", value: feedback },
  ];

  return (
    <AdminShell title="Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="panel transition hover:border-leaf">
            <p className="text-sm text-slate">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
