"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createCompany, listItineraries, listOperatorPayments, myCompany, readSession, type Company, type Itinerary, type OperatorPayment } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { MoneyChart, HoverDetail, addMoney, moneyText, type MoneyPoint } from "./money-chart";

const countries = [
  { code: "UG", label: "Uganda" },
  { code: "KE", label: "Kenya" },
  { code: "TZ", label: "Tanzania" },
  { code: "RW", label: "Rwanda" },
] as const;

export function DashboardScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [operator, setOperator] = useState(false);
  const [missing, setMissing] = useState(false);
  const [notice, setNotice] = useState("");

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
    setOperator(saved.session.user.role === "operator_owner");
    let cancelled = false;
    myCompany()
      .then((current) => {
        if (cancelled) return;
        setCompany(current);
        setMissing(false);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "company_not_found") {
          setMissing(true);
          return;
        }
        setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <DashboardShell title="Dashboard" active="Dashboard">
      {!ready ? <p className="text-sm text-[#6c757d]">Loading your business.</p> : null}
      {ready && missing ? (
        <SetupForm
          onCreated={(created) => {
            setCompany(created);
            setMissing(false);
          }}
        />
      ) : null}
      {ready && company ? <CompanyStats company={company} /> : null}
      {ready && company?.status === "pending" ? (
        <StatusCard title={company.name} body="VirungaPay is reviewing this business. You can receive payments after it is approved." />
      ) : null}
      {ready && company?.status === "disabled" ? (
        <StatusCard title={company.name} body="This business is stopped. It cannot receive payments until VirungaPay approves it again." />
      ) : null}
      {ready && company?.status === "approved" ? <WalletTable company={company} /> : null}
      {ready && company ? <BusinessActivity operator={operator} /> : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

function SetupForm({ onCreated }: { onCreated: (company: Company) => void }) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState<(typeof countries)[number]["code"]>("UG");
  const [association, setAssociation] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setNotice("Enter the business name.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const created = await createCompany({ name: name.trim(), country, association });
      onCreated(created);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg bg-white p-6 shadow-sm" noValidate>
      <h2 className="font-mono text-2xl text-[#1C2416]">Set up your business</h2>
      <p className="mt-2 text-sm text-[#6c757d]">VirungaPay reviews the business before a wallet can receive payments.</p>
      <label className="mt-6 block text-sm font-semibold" htmlFor="business-name">
        Business name
      </label>
      <input
        id="business-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none"
      />
      <label className="mt-4 block text-sm font-semibold" htmlFor="business-country">
        Country
      </label>
      <select
        id="business-country"
        value={country}
        onChange={(event) => setCountry(event.target.value as (typeof countries)[number]["code"])}
        className="mt-2 h-12 w-full border-2 border-[#1C2416] bg-white px-3"
      >
        {countries.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <label className="mt-4 block text-sm font-semibold" htmlFor="business-association">
        Association
      </label>
      <select
        id="business-association"
        value={association}
        onChange={(event) => setAssociation(event.target.value)}
        className="mt-2 h-12 w-full border-2 border-[#1C2416] bg-white px-3"
      >
        <option value="">None</option>
        <option value="AUTO">AUTO</option>
        <option value="UHOA">UHOA</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase text-[#1C2416] disabled:opacity-60"
      >
        {pending ? "Please wait" : "Create business"}
      </button>
      {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
    </form>
  );
}

function StatusCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="mx-auto max-w-lg border-2 border-[#1C2416] bg-white p-8 shadow-[6px_6px_0_#E2B15A]">
      <h2 className="font-mono text-2xl text-[#1C2416]">{title}</h2>
      <p className="mt-3 text-sm">{body}</p>
    </article>
  );
}

function statusLabel(status: Company["status"]) {
  if (status === "approved") return "Approved";
  if (status === "disabled") return "Stopped";
  return "Pending";
}

function CompanyStats({ company }: { company: Company }) {
  const receiving = company.wallets.find((wallet) => wallet.is_default);
  const stats = [
    { label: "Business", value: company.name, note: company.country, detail: "The company signed in on this account, and the country it is registered in." },
    { label: "Status", value: statusLabel(company.status), note: company.association_member_of ?? "No association", detail: "Whether VirungaPay has approved this business to receive payments, and which association it belongs to." },
    { label: "Wallets", value: String(company.wallets.length), note: company.wallets.map((wallet) => wallet.currency).join(" · ") || "None yet", detail: "How many currency accounts are open, and which currencies they hold." },
    {
      label: "Receives payments",
      value: company.status === "approved" ? (receiving?.currency ?? "None") : "None",
      note: company.status === "disabled" ? "Business is stopped" : receiving ? "Default wallet" : "Waiting on approval",
      detail: "The wallet tourist card payments are paid into.",
    },
  ];
  return (
    <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function inPeriod(value: string, year: number, month: number, span: "month" | "year") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) return false;
  return span === "year" || date.getMonth() + 1 === month;
}

function BusinessActivity({ operator }: { operator: boolean }) {
  const today = new Date();
  const [payments, setPayments] = useState<OperatorPayment[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [notice, setNotice] = useState("");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [span, setSpan] = useState<"month" | "year">("month");

  useEffect(() => {
    let cancelled = false;
    const trips = operator ? listItineraries().catch(() => ({ itineraries: [] as Itinerary[] })) : Promise.resolve({ itineraries: [] as Itinerary[] });
    Promise.all([listOperatorPayments(), trips])
      .then(([paymentList, tripList]) => {
        if (cancelled) return;
        setPayments(paymentList.payments ?? []);
        setItineraries(tripList.itineraries ?? []);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [operator]);

  const years = Array.from(new Set([today.getFullYear(), ...payments.map((row) => new Date(row.created_at).getFullYear()).filter((value) => !Number.isNaN(value))])).sort((left, right) => right - left);
  const period = payments.filter((row) => inPeriod(row.created_at, year, month, span));
  const moneyIn: Record<string, number> = {};
  const moneyOut: Record<string, number> = {};
  for (const row of period) {
    const amount = Number(row.amount);
    if (row.direction === "out") addMoney(moneyOut, row.currency, amount);
    else addMoney(moneyIn, row.currency, amount);
  }
  const moneyInPoints: MoneyPoint[] = period
    .filter((row) => row.direction !== "out")
    .map((row) => ({ at: row.created_at, currency: row.currency, amount: Number(row.amount) }));
  const moneyOutPoints: MoneyPoint[] = period
    .filter((row) => row.direction === "out")
    .map((row) => ({ at: row.created_at, currency: row.currency, amount: Number(row.amount) }));
  const periodLabel = span === "year" ? String(year) : `${monthNames[month - 1]} ${year}`;
  function sortControls() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select value={span} onChange={(event) => setSpan(event.target.value as "month" | "year")} aria-label="Sort by" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
          <option value="month">By month</option>
          <option value="year">By year</option>
        </select>
        {span === "month" ? (
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))} aria-label="Month" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        ) : null}
        <select value={year} onChange={(event) => setYear(Number(event.target.value))} aria-label="Year" className="h-9 border-2 border-[#1C2416] bg-white px-2 text-sm">
          {years.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>
    );
  }
  const drafts = itineraries.filter((item) => item.status === "draft").length;
  const waiting = itineraries.filter((item) => item.status === "sent").length;
  const paid = itineraries.filter((item) => item.status === "paid").length;

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Summary label="Money in" value={moneyText(moneyIn)} detail={`Money received into your wallets during ${periodLabel}. Each currency stays separate.`} />
        <Summary label="Money out" value={moneyText(moneyOut)} detail={`Money paid out of your wallets during ${periodLabel}. Each currency stays separate.`} />
        {operator ? <Summary label="Itineraries" value={`${drafts} draft · ${waiting} awaiting payment · ${paid} paid`} detail="Trip plans that are still a draft, waiting for the tourist to pay, or already paid." /> : null}
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        <MoneyChart title="Money in" detail="Each bar is money received on that day, or in that month when you sort by year." points={moneyInPoints} empty={`No money in during ${periodLabel}.`} year={year} month={month} span={span} controls={sortControls()} />
        <MoneyChart title="Money out" detail="Each bar is money paid out on that day, or in that month when you sort by year." points={moneyOutPoints} empty={`No money out during ${periodLabel}.`} year={year} month={month} span={span} controls={sortControls()} />
      </div>
      <article className="overflow-x-auto bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h2 className="text-base font-medium">Recent payments</h2>
          <Link href="/payments" className="text-sm font-semibold text-[#1F4D3A]">
            Payments
          </Link>
        </div>
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
            <tr>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Other party</th>
              <th className="px-5 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.slice(0, 8).map((row) => (
              <tr key={row.id} className="border-b border-[#e5e7eb]">
                <td className="px-5 py-3 whitespace-nowrap">{when(row.created_at)}</td>
                <td className="px-5 py-3">{kinds[row.kind] ?? row.kind}</td>
                <td className="px-5 py-3">{row.counterparty || "—"}</td>
                <td className="px-5 py-3 font-semibold">
                  {row.direction === "out" ? "Out" : "In"} {row.currency} {row.amount}
                </td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-[#6c757d]" colSpan={4}>
                  No payments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </article>
      {notice ? <p className="text-sm">{notice}</p> : null}
    </div>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="group relative bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-[#98a6ad]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      <HoverDetail text={detail} />
    </article>
  );
}

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

function WalletTable({ company }: { company: Company }) {
  return (
    <article className="overflow-hidden bg-white shadow-sm">
      <div className="border-b border-[#e5e7eb] px-5 py-4">
        <h2 className="text-base font-medium">Wallets</h2>
      </div>
      <table className="min-w-full text-sm">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
          <tr>
            <th className="px-5 py-3 font-medium">Currency</th>
            <th className="px-5 py-3 font-medium">Balance</th>
            <th className="px-5 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {company.wallets.map((wallet) => (
            <tr key={wallet.id} className="border-b border-[#e5e7eb]">
              <td className="px-5 py-3 font-semibold">{wallet.currency}</td>
              <td className="px-5 py-3">{wallet.balance || "0.00"}</td>
              <td className="px-5 py-3">{wallet.is_default ? "Default · receives payments" : "Open"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
