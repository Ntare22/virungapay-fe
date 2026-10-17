"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listBusinesses, listTransactions, readAdminSession, readSession, type Business, type PlatformTransaction } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { MoneyChart, HoverDetail, addMoney, moneyLines, type MoneyPoint } from "./money-chart";

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

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function inPeriod(value: string, year: number, month: number, span: "month" | "year") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return false;
  return span === "year" || date.getMonth() + 1 === month;
}

export function AdminScreen() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [span, setSpan] = useState<"month" | "year">("month");

  useEffect(() => {
    const operator = readSession();
    if (operator?.audience === "operator") {
      router.replace("/dashboard");
      return;
    }
    if (!readAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    let cancelled = false;
    Promise.all([
      listBusinesses().catch((error: unknown) => {
        throw error;
      }),
      listTransactions().catch(() => ({ transactions: [] as PlatformTransaction[] })),
    ])
      .then(([businessList, transactionList]) => {
        if (cancelled) return;
        setBusinesses(businessList.businesses);
        setTransactions(transactionList.transactions ?? []);
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

  const selectedYear = year ?? 0;
  const selectedMonth = month ?? 1;
  const years = Array.from(new Set([selectedYear, ...transactions.map((row) => new Date(row.created_at).getFullYear()).filter((value) => value > 0)])).sort((left, right) => right - left);
  const period = year && month ? transactions.filter((row) => inPeriod(row.created_at, selectedYear, selectedMonth, span)) : [];
  const collections = period.filter((row) => row.kind === "collection");
  const outgoing = period.filter((row) => row.kind === "withdraw" || row.kind === "p2p");
  const moneyIn: Record<string, number> = {};
  const moneyOut: Record<string, number> = {};
  const fees: Record<string, number> = {};
  for (const row of collections) addMoney(moneyIn, row.currency, Number(row.gross));
  for (const row of outgoing) addMoney(moneyOut, row.currency, Number(row.gross));
  for (const row of period) addMoney(fees, row.currency, Number(row.fee));
  const moneyInPoints: MoneyPoint[] = collections.map((row) => ({ at: row.created_at, currency: row.currency, amount: Number(row.gross) }));
  const moneyOutPoints: MoneyPoint[] = outgoing.map((row) => ({ at: row.created_at, currency: row.currency, amount: Number(row.gross) }));
  const periodLabel = span === "year" ? String(selectedYear) : `${monthNames[selectedMonth - 1]} ${selectedYear}`;
  const counts = [
    { label: "Collections", value: String(collections.length), detail: `How many card payments were collected during ${periodLabel}.` },
    { label: "Withdrawals", value: String(period.filter((row) => row.kind === "withdraw").length), detail: `How many withdrawals were paid out during ${periodLabel}.` },
    { label: "Tips", value: String(period.filter((row) => row.kind === "p2p").length), detail: `How many tips were sent to guides or drivers during ${periodLabel}.` },
    { label: "Exchanges", value: String(period.filter((row) => row.kind === "conversion").length), detail: `How many times money was moved between wallets during ${periodLabel}.` },
  ];
  function sortControls() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select value={span} onChange={(event) => setSpan(event.target.value as "month" | "year")} aria-label="Sort by" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
          <option value="month">By month</option>
          <option value="year">By year</option>
        </select>
        {span === "month" ? (
          <select value={selectedMonth} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Month" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
        <select value={selectedYear} onChange={(event) => setYear(Number(event.target.value))} aria-label="Year" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <DashboardShell title="Dashboard" active="Dashboard" audience="admin">
      {ready ? <AdminStats businesses={businesses} /> : <p className="text-sm text-[#6c757d]">Loading the dashboard.</p>}
      {ready ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Summary label="Money in" lines={moneyLines(moneyIn)} detail={`Card payments collected into the USD and UGX wallets during ${periodLabel}.`} />
            <Summary label="Money out" lines={moneyLines(moneyOut)} detail={`Withdrawals and tips paid out of the USD and UGX wallets during ${periodLabel}.`} />
            <Summary label="VirungaPay revenue" lines={moneyLines(fees)} detail={`Revenue VirungaPay earned on payments in each wallet during ${periodLabel}.`} />
            {counts.map((item) => (
              <Summary key={item.label} label={item.label} value={item.value} detail={item.detail} />
            ))}
          </section>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <MoneyChart title="Money in" detail={`Each bar is card payments collected on that day, or in that month when you sort by year.`} points={moneyInPoints} empty={`No money in during ${periodLabel}.`} year={selectedYear} month={selectedMonth} span={span} controls={sortControls()} />
            <MoneyChart title="Money out" detail={`Each bar is withdrawals and tips paid out on that day, or in that month when you sort by year.`} points={moneyOutPoints} empty={`No money out during ${periodLabel}.`} year={selectedYear} month={selectedMonth} span={span} controls={sortControls()} />
          </div>
          <article className="mt-6 overflow-x-auto bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
              <h2 className="text-base font-medium">Recent transactions</h2>
              <Link href="/admin/transactions" className="text-sm font-semibold text-[#1F4D3A]">
                Transactions
              </Link>
            </div>
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
                <tr>
                  <th className="px-5 py-3 font-medium">When</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">To</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-b border-[#e5e7eb]">
                    <td className="px-5 py-3 whitespace-nowrap">{when(row.created_at)}</td>
                    <td className="px-5 py-3">{kinds[row.kind] ?? row.kind}</td>
                    <td className="px-5 py-3">{row.from_name || "—"}</td>
                    <td className="px-5 py-3">{row.to_name || "—"}</td>
                    <td className="px-5 py-3">
                      {row.currency} {row.gross}
                      {row.quote_amount ? ` → ${row.quote_currency} ${row.quote_amount}` : ""}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-[#6c757d]" colSpan={5}>
                      No transactions yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </article>
        </>
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

function Summary({ label, value, lines, detail }: { label: string; value?: string; lines?: { currency: string; amount: string }[]; detail: string }) {
  return (
    <article className="group relative bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#98a6ad]">{label}</p>
      {lines ? (
        <ul className="mt-3 space-y-2">
          {lines.map((line) => (
            <li key={line.currency} className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-[#6c757d]">{line.currency}</span>
              <span className="text-lg font-semibold">{line.amount}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xl font-semibold">{value}</p>
      )}
      <HoverDetail text={detail} />
    </article>
  );
}

function AdminStats({ businesses }: { businesses: Business[] }) {
  const pending = businesses.filter((business) => business.status === "pending").length;
  const approved = businesses.filter((business) => business.status === "approved").length;
  const stopped = businesses.filter((business) => business.status === "disabled").length;
  const wallets = businesses.reduce((count, business) => count + business.wallets.length, 0);
  const stats = [
    { label: "Businesses", value: String(businesses.length), note: "Tour operators", detail: "How many businesses are registered on VirungaPay." },
    { label: "Awaiting approval", value: String(pending), note: "Not receiving payments yet", detail: "Businesses waiting for approval. They cannot receive payments yet." },
    { label: "Approved", value: String(approved), note: `${wallets} wallets open`, detail: "Businesses that can receive payments, and how many wallets they have open." },
    { label: "Stopped", value: String(stopped), note: "Disabled operators", detail: "Businesses you have stopped. They cannot receive payments until you approve them again." },
  ];
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="group relative bg-white shadow-sm">
          <div className="p-5">
            <p className="text-sm font-semibold text-[#98a6ad]">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold">{stat.value}</p>
          </div>
          <div className="bg-[#f8f9fa] px-5 py-4 text-sm font-semibold text-[#1F4D3A]">{stat.note}</div>
          <HoverDetail text={stat.detail} />
        </article>
      ))}
    </section>
  );
}
