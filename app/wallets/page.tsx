import type { Metadata } from "next";
import { OperatorWalletsScreen } from "../components/operator-wallets-screen";

export const metadata: Metadata = { title: "Wallets · VirungaPay" };

export default function WalletsPage() {
  return <OperatorWalletsScreen />;
}
