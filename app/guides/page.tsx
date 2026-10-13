import type { Metadata } from "next";
import { GuidesScreen } from "../components/guides-screen";

export const metadata: Metadata = { title: "Guides and drivers · VirungaPay" };

export default function GuidesPage() {
  return <GuidesScreen />;
}
