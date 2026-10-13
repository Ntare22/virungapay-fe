import type { Metadata } from "next";
import { InquiriesScreen } from "../../components/inquiries-screen";

export const metadata: Metadata = { title: "Inquiries · VirungaPay" };

export default function InquiriesPage() {
  return <InquiriesScreen />;
}
