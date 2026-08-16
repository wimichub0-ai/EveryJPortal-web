import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CreatorSpotlight } from "@/components/creator-spotlight";
import { getCreatorPageData } from "@/lib/portal-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CreatorPageProps = {
  params: Promise<{ slug: string }>;
};

async function getRequestBaseUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return new URL(host ? `${protocol}://${host}` : "http://localhost:3000");
}

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { creator } = await getCreatorPageData(slug);
  if (!creator) notFound();

  const metadataBase = await getRequestBaseUrl();
  const title = `${creator.name} — House Of Creators`;
  const description = `Support ${creator.name} in House Of Creators with a vote and subscribe to the YouTube channel.`;
  const imageUrl = new URL(`/c/${encodeURIComponent(slug)}/opengraph-image`, metadataBase);

  return {
    metadataBase,
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Everything Jos",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: creator.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const { slug } = await params;
  const { creator, counts, settings } = await getCreatorPageData(slug);
  if (!creator) notFound();

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-7 text-[#2B2B2B] sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 text-center">
          <Link
            href="/"
            className="font-display text-sm font-bold uppercase tracking-[0.12em] text-[#2B2B2B] transition hover:text-[#D98912]"
          >
            {settings.campaign_title}
          </Link>
        </header>

        <CreatorSpotlight
          creator={creator}
          initialCounts={counts}
          votingOpen={settings.voting_open}
        />

        <div className="pb-8 pt-7 text-center">
          <Link
            href="/"
            className="font-display text-sm font-semibold text-[#666] underline-offset-4 transition hover:text-[#D98912] hover:underline"
          >
            See all creators →
          </Link>
        </div>
      </div>
    </main>
  );
}
