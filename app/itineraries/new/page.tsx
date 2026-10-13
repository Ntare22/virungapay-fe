import type { Metadata } from "next";
import { Suspense } from "react";
import { ItineraryEditor } from "../../components/itinerary-editor";

export const metadata: Metadata = { title: "New itinerary · VirungaPay" };

export default function NewItineraryPage({ searchParams }: { searchParams: Promise<{ package?: string; inquiry?: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#6c757d]">Loading itinerary.</p>}>
      <NewItinerary searchParams={searchParams} />
    </Suspense>
  );
}

async function NewItinerary({ searchParams }: { searchParams: Promise<{ package?: string; inquiry?: string }> }) {
  const params = await searchParams;
  return <ItineraryEditor packageId={params.package} inquiryId={params.inquiry} />;
}
