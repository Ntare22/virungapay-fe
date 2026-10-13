import type { Metadata } from "next";
import { DashboardScreen } from "../components/dashboard-screen";

export const metadata: Metadata = {
  title: "Dashboard · VirungaPay",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
