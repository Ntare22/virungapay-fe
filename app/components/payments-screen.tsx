"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listOperatorPayments, readSession, type OperatorPayment } from "../lib/api";
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

export function PaymentsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<OperatorPayment[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

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
      {!ready ? <p className="text-sm text-[#6c757d]">Loading payments.</p> : null}
      {ready ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Other party</th>
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
