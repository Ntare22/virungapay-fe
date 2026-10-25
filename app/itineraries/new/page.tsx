import type { Metadata } from "next";
import { Suspense } from "react";
import { ItineraryEditor } from "../../components/itinerary-editor";
import { LogoLoader } from "../../components/logo-loader";

export const metadata: Metadata = { title: "New Itinerary · VirungaPay" };

export default function NewItineraryPage({ searchParams }: { searchParams: Promise<{ package?: string; inquiry?: string }> }) {
  return (
    <Suspense fallback={<LogoLoader label="Loading itinerary" className="p-6" />}>
      <NewItinerary searchParams={searchParams} />
    </Suspense>
  );
}

async function NewItinerary({ searchParams }: { searchParams: Promise<{ package?: string; inquiry?: string }> }) {
  const params = await searchParams;
  return <ItineraryEditor packageId={params.package} inquiryId={params.inquiry} />;
}
