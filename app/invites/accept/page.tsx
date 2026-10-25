import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInvite } from "../../components/accept-invite";

export const metadata: Metadata = {
  title: "Accept Invite · VirungaPay",
  description: "Choose a password and open your VirungaPay account.",
};

export default function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#1C2416]">Loading the invite.</p>}>
      <InviteToken searchParams={searchParams} />
    </Suspense>
  );
}

async function InviteToken({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  return <AcceptInvite token={token} />;
}
