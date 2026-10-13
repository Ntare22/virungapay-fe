"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listBusinesses, listBureaus, readAdminSession, readSession, type Business, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const pageSize = 8;

type WalletRow = {
  wallet: Wallet;
  business: Business;
};

export function WalletsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0);

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
    Promise.all([listBusinesses(), listBureaus().catch(() => ({ businesses: [] as Business[] }))])
      .then(([operatorsList, bureausList]) => {
        if (cancelled) return;
        const businesses = [...operatorsList.businesses, ...bureausList.businesses];
        setRows(businesses.flatMap((business) => business.wallets.map((wallet) => ({ wallet, business }))));
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

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  const visible = rows.slice(start, start + pageSize);

  return (
    <DashboardShell title="Wallets" active="Wallets" audience="admin">
      {!ready ? <p className="text-sm text-[#6c757d]">Loading wallets.</p> : null}
      <article className="overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Owner</th>
                <th className="px-5 py-3 font-medium">Currency</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Business status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ wallet, business }) => (
                <tr key={wallet.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3 font-medium">{business.name}</td>
                  <td className="px-5 py-3">
                    <div>{business.owner_name}</div>
                    <div className="text-xs text-[#98a6ad]">{business.owner_email}</div>
                  </td>
                  <td className="px-5 py-3 font-semibold">{wallet.currency}</td>
                  <td className="px-5 py-3">{wallet.balance || "0.00"}</td>
                  <td className="px-5 py-3">{wallet.is_default ? "Default · receives payments" : "Open"}</td>
                  <td className="px-5 py-3 font-semibold uppercase">
                    {business.status === "disabled" ? "Stopped" : business.status}
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={6}>
                    No wallets yet. Approving a business opens a UGX wallet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t border-[#e5e7eb] px-5 py-3 text-sm">
          <p className="text-[#6c757d]">
            {rows.length === 0 ? "0 wallets" : `${start + 1}–${start + visible.length} of ${rows.length}`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="h-9 border-2 border-[#1B2129] px-3 font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="h-9 border-2 border-[#1B2129] px-3 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </article>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
