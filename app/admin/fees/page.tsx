import type { Metadata } from "next";
import { FeesScreen } from "../../components/fees-screen";

export const metadata: Metadata = { title: "Transaction Fees · VirungaPay" };

export default function FeesPage() {
  return <FeesScreen />;
}
