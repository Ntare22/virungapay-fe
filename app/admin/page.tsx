import type { Metadata } from "next";
import { AdminScreen } from "../components/admin-screen";

export const metadata: Metadata = {
  title: "Admin · VirungaPay",
};

export default function AdminPage() {
  return <AdminScreen />;
}
