import type { Metadata } from "next";
import { headers } from "next/headers";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { LiveVotingPortal } from "@/components/live-voting-portal";
import { getPortalData } from "@/lib/portal-data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPortalData();
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  const metadataBase = new URL(host ? `${protocol}://${host}` : "http://localhost:3000");

  return {
    metadataBase,
    title: settings.campaign_title,
    description: settings.campaign_subtitle,
    openGraph: {
      title: settings.campaign_title,
      description: settings.campaign_subtitle,
      type: "website",
      siteName: "Everything Jos",
      images: [{ url: "/og.png", width: 1733, height: 909, alt: settings.campaign_title }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.campaign_title,
      description: settings.campaign_subtitle,
      images: ["/og.png"],
    },
  };
}

export default async function Home() {
  const { creators, counts, settings, error } = await getPortalData();

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 text-[#2B2B2B] sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <Hero
          title={settings.campaign_title}
          subtitle={settings.campaign_subtitle}
        />

        {error ? (
          <div className="rounded-[20px] bg-white px-6 py-10 text-center shadow-[0_8px_30px_rgba(43,43,43,0.06)]">
            <p className="font-display text-lg font-semibold">
              We couldn&apos;t load the creators just now.
            </p>
            <p className="mt-2 text-sm text-[#737373]">
              Please refresh the page in a moment.
            </p>
          </div>
        ) : (
          <LiveVotingPortal
            creators={creators}
            initialCounts={counts}
            votingOpen={settings.voting_open}
          />
        )}

        <Footer />
      </div>
    </main>
  );
}
