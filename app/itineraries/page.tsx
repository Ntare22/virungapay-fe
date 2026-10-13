import type { Metadata } from "next";
import { ItinerariesScreen } from "../components/itineraries-screen";

export const metadata: Metadata = { title: "Itineraries · VirungaPay" };

export default function ItinerariesPage() {
  return <ItinerariesScreen />;
}
