import type { Metadata } from "next";
import { Suspense } from "react";
import { PayScreen } from "../../components/pay-screen";

export const metadata: Metadata = { title: "Pay · VirungaPay" };

export default function PayPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#6c757d]">Loading the itinerary.</p>}>
      <PayLink params={params} />
    </Suspense>
  );
}

async function PayLink({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PayScreen token={token} />;
}
