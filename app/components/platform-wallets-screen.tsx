"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listPlatformWallets, readAdminSession, readSession, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { LogoLoader } from "./logo-loader";

const groups = [
  { kind: "ova", label: "Provider Account", note: "Money held with the payment provider." },
  { kind: "fee_transaction", label: "Transaction Fee", note: "Fees from collections, withdrawals, and tips." },
  { kind: "fee_fx", label: "FX Fee", note: "Fees kept when a payment changes currency." },
];

const currencyOrder = ["USD", "UGX"];

export function PlatformWalletsScreen() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (readSession()?.audience === "operator") {
      router.replace("/dashboard");
      return;
    }
    if (!readAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;
    listPlatformWallets()
      .then((list) => {
        if (!cancelled) setWallets(list.wallets);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <DashboardShell title="Platform Wallets" active="Platform Wallets" audience="admin">
      {!ready ? <LogoLoader label="Loading platform wallets" /> : null}
      {ready && !notice
        ? groups.map((group) => (
            <section key={group.kind} className="mb-6">
              <h2 className="text-base font-medium">{group.label}</h2>
              <p className="mt-1 text-sm text-[#6c757d]">{group.note}</p>
              <div className="mt-3 grid gap-4 md:grid-cols-3">
                {currencyOrder.map((currency) => {
                  const wallet = wallets.find((item) => item.kind === group.kind && item.currency === currency);
                  if (!wallet) return null;
                  return <WalletCard key={wallet.id} wallet={wallet} label={group.label} />;
                })}
              </div>
            </section>
          ))
        : null}
      {ready && !notice && wallets.length === 0 ? <p className="text-sm text-[#6c757d]">No platform wallets yet.</p> : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

function WalletCard({ wallet, label }: { wallet: Wallet; label: string }) {
  return (
    <Link href={`/admin/platform/${wallet.id}`} className="block bg-white p-5 shadow-sm hover:shadow-md">
      <p className="text-sm text-[#6c757d]">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {wallet.currency} {wallet.balance || "0.00"}
      </p>
      <p className="mt-4 text-sm font-semibold text-[#1F4D3A]">View Statement</p>
    </Link>
  );
}
