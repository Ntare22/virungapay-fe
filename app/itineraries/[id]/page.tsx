import type { Metadata } from "next";
import { Suspense } from "react";
import { ItineraryEditor } from "../../components/itinerary-editor";
import { LogoLoader } from "../../components/logo-loader";

export const metadata: Metadata = { title: "Itinerary · VirungaPay" };

export default function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LogoLoader label="Loading itinerary" className="p-6" />}>
      <SavedItinerary params={params} />
    </Suspense>
  );
}

async function SavedItinerary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ItineraryEditor itineraryId={id} />;
}
