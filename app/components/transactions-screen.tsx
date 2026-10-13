"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listTransactions, readAdminSession, readSession, type PlatformTransaction } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const kinds: Record<string, string> = {
  collection: "Collection",
  withdraw: "Withdrawal",
  p2p: "Tip",
  conversion: "Exchange",
};

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export function TransactionsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<PlatformTransaction[]>([]);
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
    listTransactions()
      .then((list) => {
        if (!cancelled) setRows(list.transactions);
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
    <DashboardShell title="Transactions" active="Transactions" audience="admin">
      {!ready ? <p className="text-sm text-[#6c757d]">Loading transactions.</p> : null}
      {ready ? (
        <article className="overflow-x-auto bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">From</th>
                <th className="px-5 py-3 font-medium">To</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3 whitespace-nowrap">{when(row.created_at)}</td>
                  <td className="px-5 py-3">{kinds[row.kind] ?? row.kind}</td>
                  <td className="px-5 py-3">{row.invoice_number || "—"}</td>
                  <td className="px-5 py-3">{row.from_name || "—"}</td>
                  <td className="px-5 py-3">{row.to_name || "—"}</td>
                  <td className="px-5 py-3">
                    {row.currency} {row.gross}
                    {row.quote_amount ? (
                      <div className="text-xs text-[#6c757d]">
                        Received {row.quote_currency} {row.quote_amount}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    {row.currency} {row.fee}
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {row.currency} {row.net}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !notice ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={8}>
                    No transactions yet.
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
