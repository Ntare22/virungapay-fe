import type { Metadata } from "next";
import { FeesScreen } from "../../components/fees-screen";

export const metadata: Metadata = { title: "Transaction fees · VirungaPay" };

export default function FeesPage() {
  return <FeesScreen />;
}
