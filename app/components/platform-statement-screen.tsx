"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { platformStatement, readAdminSession, readSession, type StatementLine, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { LogoLoader } from "./logo-loader";

const labels: Record<string, string> = {
  ova: "Provider Account",
  fee_fx: "FX Fee",
  fee_transaction: "Transaction Fee",
  collection: "Collection",
  withdraw: "Withdrawal",
  p2p: "Tip",
  send: "Send",
  conversion: "Exchange",
};

export function PlatformStatementScreen({ walletId }: { walletId: string }) {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
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
    platformStatement(walletId)
      .then((statement) => {
        if (cancelled) return;
        setWallet(statement.wallet);
        setLines(statement.movements);
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
  }, [router, walletId]);

  const title = wallet ? `${labels[wallet.kind ?? ""] ?? "Wallet"} · ${wallet.currency}` : "Statement";

  return (
    <DashboardShell title={title} active="Platform Wallets" audience="admin">
      <Link href="/admin/platform" className="mb-4 inline-block text-sm font-semibold text-[#1F4D3A]">
        Back to platform wallets
      </Link>
      {!ready ? <LogoLoader label="Loading statement" /> : null}
      {wallet ? (
        <article className="mb-4 bg-white p-5 shadow-sm">
          <p className="text-sm text-[#6c757d]">{labels[wallet.kind ?? ""] ?? wallet.kind}</p>
          <p className="mt-2 text-2xl font-semibold">
            {wallet.currency} {wallet.balance || "0.00"}
          </p>
        </article>
      ) : null}
      {ready && !notice ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">In</th>
                <th className="px-5 py-3 font-medium">Out</th>
                <th className="px-5 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3">{formatWhen(line.created_at)}</td>
                  <td className="px-5 py-3">{labels[line.kind] ?? line.kind}</td>
                  <td className="px-5 py-3">{line.direction === "in" ? line.amount : ""}</td>
                  <td className="px-5 py-3">{line.direction === "out" ? line.amount : ""}</td>
                  <td className="px-5 py-3 font-semibold">{line.running_balance}</td>
                </tr>
              ))}
              {lines.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={5}>
                    No movements yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
