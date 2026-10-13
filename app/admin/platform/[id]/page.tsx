import type { Metadata } from "next";
import { Suspense } from "react";
import { PlatformStatementScreen } from "../../../components/platform-statement-screen";

export const metadata: Metadata = { title: "Statement · VirungaPay" };

export default function PlatformStatementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#6c757d]">Loading statement.</p>}>
      <Statement params={params} />
    </Suspense>
  );
}

async function Statement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlatformStatementScreen walletId={id} />;
}
