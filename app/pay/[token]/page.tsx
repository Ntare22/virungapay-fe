import type { Metadata } from "next";
import { Suspense } from "react";
import { PayScreen } from "../../components/pay-screen";
import { LogoLoader } from "../../components/logo-loader";

export const metadata: Metadata = { title: "Pay · VirungaPay" };

export default function PayPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense fallback={<LogoLoader label="Loading the itinerary" />}>
      <PayLink params={params} />
    </Suspense>
  );
}

async function PayLink({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PayScreen token={token} />;
}
