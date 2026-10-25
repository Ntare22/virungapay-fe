import type { Metadata } from "next";
import { Suspense } from "react";
import { PackagesScreen } from "../../../components/packages-screen";
import { LogoLoader } from "../../../components/logo-loader";

export const metadata: Metadata = { title: "Package · VirungaPay" };

export default function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LogoLoader label="Loading package" />}>
      <SavedPackage params={params} />
    </Suspense>
  );
}

async function SavedPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackagesScreen packageId={id} />;
}
