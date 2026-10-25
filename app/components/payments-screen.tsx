"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { downloadStatement, listOperatorPayments, myCompany, readSession, type OperatorPayment, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const kinds: Record<string, string> = {
  collection: "Collection",
  withdraw: "Withdrawal",
  p2p: "Tip",
  send: "Send",
  conversion: "Exchange",
};

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function PaymentsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<OperatorPayment[]>([]);
  const [notice, setNotice] = useState("");
  const [statementNotice, setStatementNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  function openStatement() {
    setStatementNotice("");
    setPending(true);
    myCompany()
      .then((company) => {
        const list = (company.wallets ?? []).filter((wallet) => wallet.currency === "USD" || wallet.currency === "UGX");
        setWallets(list);
        if (list.length === 0) setStatementNotice("No wallet is ready for a statement.");
        else setChoosing(true);
      })
      .catch((error: unknown) => setStatementNotice(error instanceof Error ? error.message : "Something went wrong. Try again."))
      .finally(() => setPending(false));
  }

  function download(wallet: Wallet) {
    setPending(true);
    setStatementNotice("");
    const label = wallet.name?.trim() || `${wallet.currency} wallet`;
    downloadStatement(wallet.id, `${label} statement.pdf`)
      .then(() => setChoosing(false))
      .catch((error: unknown) => setStatementNotice(error instanceof Error ? error.message : "Something went wrong. Try again."))
      .finally(() => setPending(false));
  }

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      router.replace("/login");
      return;
    }
    if (saved.audience === "admin") {
      router.replace("/admin");
      return;
    }
    let cancelled = false;
    listOperatorPayments()
      .then((list) => {
        if (!cancelled) setRows(list.payments);
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
    <DashboardShell title="Payments" active="Payments">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={pending}
          onClick={openStatement}
          className="h-10 border-2 border-[#1C2416] bg-[#E2B15A] px-3 text-xs font-bold uppercase disabled:opacity-60"
        >
          {pending ? "Generating" : "Generate Statement"}
        </button>
      </div>
      {statementNotice && !choosing ? <p className="mb-4 text-sm">{statementNotice}</p> : null}
      {choosing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1C2416]/40 p-4" onMouseDown={() => !pending && setChoosing(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="statement-wallet-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-lg border-2 border-[#1C2416] bg-white p-6 shadow-[6px_6px_0_#E2B15A]"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="statement-wallet-title" className="text-lg font-medium">Choose A Wallet</h2>
              <button type="button" onClick={() => !pending && setChoosing(false)} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
                ×
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  disabled={pending}
                  onClick={() => download(wallet)}
                  className="border-2 border-[#1C2416] bg-white p-3 text-left disabled:opacity-60"
                >
                  <span className="block font-bold">{wallet.name?.trim() || `${wallet.currency} wallet`}</span>
                  <span className="mt-1 block font-mono text-sm">{wallet.currency} {wallet.balance}</span>
                </button>
              ))}
            </div>
            {statementNotice ? <p className="mt-3 text-sm">{statementNotice}</p> : null}
          </div>
        </div>
      ) : null}
      {!ready ? <p className="text-sm text-[#6c757d]">Loading payments.</p> : null}
      {ready ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Other Party</th>
                <th className="px-5 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3">{when(row.created_at)}</td>
                  <td className="px-5 py-3">{kinds[row.kind] ?? row.kind}</td>
                  <td className="px-5 py-3">{row.invoice_number || "—"}</td>
                  <td className="px-5 py-3">{row.counterparty || "—"}</td>
                  <td className="px-5 py-3 font-semibold">
                    {row.direction === "out" ? "Out" : "In"} {row.currency} {row.amount}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !notice ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={5}>
                    No payments in or out of your wallets yet.
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
