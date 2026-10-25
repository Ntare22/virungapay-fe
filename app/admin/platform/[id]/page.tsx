import type { Metadata } from "next";
import { Suspense } from "react";
import { PlatformStatementScreen } from "../../../components/platform-statement-screen";
import { LogoLoader } from "../../../components/logo-loader";

export const metadata: Metadata = { title: "Statement · VirungaPay" };

export default function PlatformStatementPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LogoLoader label="Loading statement" />}>
      <Statement params={params} />
    </Suspense>
  );
}

async function Statement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlatformStatementScreen walletId={id} />;
}
