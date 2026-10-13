import type { Metadata } from "next";
import { TransactionsScreen } from "../../components/transactions-screen";

export const metadata: Metadata = { title: "Transactions · VirungaPay" };

export default function TransactionsPage() {
  return <TransactionsScreen />;
}
