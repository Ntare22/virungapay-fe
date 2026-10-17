import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Mark } from "../components/mark";

export const metadata: Metadata = {
  title: "Verify email · VirungaPay",
  description: "Confirm your VirungaPay email so you can sign in.",
};

type Outcome = { ok: true } | { ok: false; message: string };

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  return (
    <Frame>
      <Suspense fallback={<Card title="Checking your link" body="This takes a moment." />}>
        <Verified searchParams={searchParams} />
      </Suspense>
    </Frame>
  );
}

async function Verified({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
  const outcome = await verify(token);
  return (
    <Card
      title={outcome.ok ? "Email verified" : "Link not accepted"}
      body={
        outcome.ok
          ? "This email is confirmed. Sign in to open your operator account."
          : outcome.message
      }
    />
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-[#F6F1E7] text-[#1C2416] lg:flex-row">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#1F4D3A] px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-0 lg:w-1/2 lg:px-14 lg:py-10">
        <Link href="/" className="relative z-10 flex items-center gap-2 font-mono text-lg text-white">
          <Mark tone="cream" />
          VirungaPay
        </Link>
        <div className="relative z-10 max-w-md py-10">
          <h1 className="font-mono text-4xl leading-[1.05] font-medium sm:text-5xl">Verify your email.</h1>
          <p className="relative mt-8 pt-6 text-base font-semibold">
            <span className="caret absolute top-0 left-0" />
            Once this address is confirmed, you can sign in and send an itinerary.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/80">East Africa</p>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-auto bg-white px-6 py-6 sm:px-10 lg:w-1/2 lg:px-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-[#1C2416] hover:text-[#1F4D3A]">
            Back home
          </Link>
          <Link href="/login" className="font-mono text-sm font-bold text-[#1F4D3A]">
            Login
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">{children}</div>
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-2 border-[#1C2416] bg-white p-8 text-center shadow-[6px_6px_0_#E2B15A]">
      <h2 className="font-mono text-3xl font-medium text-[#1C2416]">{title}</h2>
      <p className="mt-4 text-sm">{body}</p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-12 items-center border-2 border-[#1C2416] bg-[#E2B15A] px-8 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
      >
        Login
      </Link>
    </div>
  );
}

async function verify(token: string): Promise<Outcome> {
  if (!token) return { ok: false, message: "This verification link is missing a token." };
  const api = process.env.API_URL ?? "http://localhost:8080";
  try {
    const response = await fetch(`${api}/v1/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (response.ok) return { ok: true };
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, message: body?.error?.message ?? "This verification link is invalid or expired." };
  } catch {
    return { ok: false, message: "Could not reach VirungaPay. Check that the API is running." };
  }
}
