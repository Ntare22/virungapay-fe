"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listBusinesses, listBureaus, listPersonWallets, readAdminSession, readSession, type Business, type PersonWallet, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { WalletQrSheet, type QrSheet } from "./wallet-qr-sheet";

const pageSize = 8;

type WalletRow = {
  wallet: Wallet;
  business: Business | null;
  person: PersonWallet | null;
};

export function WalletsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<WalletRow[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0);
  const [qr, setQr] = useState<QrSheet | null>(null);

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
    Promise.all([
      listBusinesses(),
      listBureaus().catch(() => ({ businesses: [] as Business[] })),
      listPersonWallets().catch((error: unknown) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Tourist wallets could not be loaded.");
        return { wallets: [] as PersonWallet[] };
      }),
    ])
      .then(([operatorsList, bureausList, people]) => {
        if (cancelled) return;
        const businesses = [...operatorsList.businesses, ...bureausList.businesses];
        const businessRows = businesses.flatMap((business) => business.wallets.map((wallet) => ({ wallet, business, person: null })));
        const personRows = (people.wallets ?? []).map((person) => ({
          wallet: { id: person.id, name: person.name, username: person.username, currency: person.currency, balance: person.balance, is_default: false },
          business: null,
          person,
        }));
        setRows([...personRows, ...businessRows]);
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
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Currency</th>
                <th className="px-5 py-3 font-medium">Balance</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Business Status</th>
                <th className="px-5 py-3 font-medium">Code</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(({ wallet, business, person }) => {
                const username = wallet.username?.trim() ?? "";
                return (
                <tr key={wallet.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3 font-medium">{person ? holderLabel(person.holder_role) : business?.name}</td>
                  <td className="px-5 py-3">
                    <div>{person ? person.holder_name : business?.owner_name}</div>
                    <div className="text-xs text-[#98a6ad]">{person ? person.holder_email : business?.owner_email}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[#1F4D3A]">{username ? `@${username}` : "—"}</td>
                  <td className="px-5 py-3 font-semibold">{wallet.currency}</td>
                  <td className="px-5 py-3">{wallet.balance || "0.00"}</td>
                  <td className="px-5 py-3">{person ? walletRole(person) : wallet.is_default ? "Default · Receives Payments" : "Open"}</td>
                  <td className="px-5 py-3 font-semibold uppercase">
                    {person ? person.holder_status : business?.status === "disabled" ? "Stopped" : business?.status}
                  </td>
                  <td className="px-5 py-3">
                    {wallet.currency === "UGX" && username ? (
                      <button
                        type="button"
                        aria-label={`QR code for @${username}`}
                        onClick={() => setQr({
                          title: person ? person.holder_name : business?.name || wallet.name || "Wallet",
                          username,
                          currency: wallet.currency,
                        })}
                        className="grid size-9 place-items-center border-2 border-[#1C2416] bg-white text-[#1C2416]"
                      >
                        <QrIcon />
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
                );
              })}
              {visible.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={8}>
                    No wallets yet. Approving a business opens a UGX wallet. A tourist signup opens a VirungaPass wallet.
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
              className="h-9 border-2 border-[#1C2416] px-3 font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="h-9 border-2 border-[#1C2416] px-3 font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </article>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      {qr ? <WalletQrSheet wallet={qr} onClose={() => setQr(null)} /> : null}
    </DashboardShell>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v4h-2v-4z"
      />
    </svg>
  );
}

function holderLabel(role: string) {
  if (role === "tourist") return "Tourist";
  if (role === "guide") return "Guide";
  if (role === "driver") return "Driver";
  return role;
}

function walletRole(person: PersonWallet) {
  if (person.kind === "virungapass") return "VirungaPass";
  return "Personal";
}
