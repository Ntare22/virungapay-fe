import type { Metadata } from "next";
import { PlatformWalletsScreen } from "../../components/platform-wallets-screen";

export const metadata: Metadata = { title: "Platform wallets · VirungaPay" };

export default function PlatformWalletsPage() {
  return <PlatformWalletsScreen />;
}
