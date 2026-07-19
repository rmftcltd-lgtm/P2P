import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSession } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";

type Props = { params: Promise<{ slug: string }> };

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.contentPage.findFirst({
    where: { slug, published: true },
  });
  if (!page) notFound();
  const user = await getSession();

  return (
    <main className="atmosphere min-h-screen">
      <SiteHeader user={user} />
      <article className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <p className="text-sm">
          <Link href="/" className="text-sea underline underline-offset-4">
            ← {BRAND_NAME}
          </Link>
        </p>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">{page.title}</h1>
        {page.metaDescription ? <p className="mt-3 text-slate">{page.metaDescription}</p> : null}
        <div
          className="prose-cms mt-8 space-y-4 text-ink leading-relaxed [&_a]:text-sea [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </article>
      <SiteFooter />
    </main>
  );
}
