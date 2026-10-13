import type { Metadata } from "next";
import { PaymentsScreen } from "../components/payments-screen";

export const metadata: Metadata = { title: "Payments · VirungaPay" };

export default function PaymentsPage() {
  return <PaymentsScreen />;
}
