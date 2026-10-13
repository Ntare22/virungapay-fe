import type { Metadata } from "next";
import { Suspense } from "react";
import { PackagesScreen } from "../../../components/packages-screen";

export const metadata: Metadata = { title: "Package · VirungaPay" };

export default function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-[#6c757d]">Loading package.</p>}>
      <SavedPackage params={params} />
    </Suspense>
  );
}

async function SavedPackage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackagesScreen packageId={id} />;
}
