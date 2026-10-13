import type { Metadata } from "next";
import { Suspense } from "react";
import { ItineraryEditor } from "../../components/itinerary-editor";

export const metadata: Metadata = { title: "Itinerary · VirungaPay" };

export default function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#6c757d]">Loading itinerary.</p>}>
      <SavedItinerary params={params} />
    </Suspense>
  );
}

async function SavedItinerary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItineraryEditor itineraryId={id} />;
}
