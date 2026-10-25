import type { Metadata } from "next";
import { GuidesScreen } from "../components/guides-screen";

export const metadata: Metadata = { title: "Guides And Drivers · VirungaPay" };

export default function GuidesPage() {
  return <GuidesScreen />;
}
