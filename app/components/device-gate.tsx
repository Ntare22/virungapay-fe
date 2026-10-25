"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Mark } from "./mark";

const phoneApp = process.env.NEXT_PUBLIC_PWA_URL ?? "http://localhost:3001";

export function DeviceGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={children}>
      <GatedShell>{children}</GatedShell>
    </Suspense>
  );
}

function GatedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [phone, setPhone] = useState<boolean | null>(null);

  useEffect(() => {
    setPhone(isPhone());
  }, []);

  if (phone === null) return children;
  if (phone && !pathname.startsWith("/pay") && !pathname.startsWith("/invites") && !pathname.startsWith("/verify-email")) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#F6F1E7] px-4">
        <section className="w-full max-w-md border-2 border-[#1C2416] bg-white p-6 shadow-[6px_6px_0_#E2B15A]">
          <Mark />
          <h1 className="mt-4 text-2xl font-bold text-[#1C2416]">This Site Is For A Computer</h1>
          <p className="mt-3 text-sm text-[#1C2416]">
            On a phone, open the VirungaPay app to sign in, see a wallet, and withdraw.
          </p>
          <a
            href={phoneApp}
            className="mt-6 flex h-12 items-center justify-center border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase tracking-wide text-[#1C2416]"
          >
            Open The Phone App
          </a>
        </section>
      </main>
    );
  }
  return children;
}

function isPhone() {
  return /iPhone|iPod|Android.+Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
