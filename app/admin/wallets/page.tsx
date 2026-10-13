import type { Metadata } from "next";
import { WalletsScreen } from "../../components/wallets-screen";

export const metadata: Metadata = {
  title: "Wallets · VirungaPay",
};

export default function WalletsPage() {
  return <WalletsScreen />;
}
