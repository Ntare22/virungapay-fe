import type { Metadata } from "next";
import { PackagesScreen } from "../../components/packages-screen";

export const metadata: Metadata = { title: "Packages · VirungaPay" };

export default function PackagesPage() {
  return <PackagesScreen />;
}
