import type { ReactNode } from "react";

const currencies = ["USD", "EUR", "UGX"] as const;

const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fills: Record<string, string> = {
  USD: "#2A2AFF",
  EUR: "#4BFF2A",
  UGX: "#1B2129",
};

export type MoneyPoint = {
  at: string;
  currency: string;
  amount: number;
};

export function moneyText(totals: Record<string, number>) {
  const parts = currencies.filter((currency) => totals[currency]).map((currency) => `${currency} ${totals[currency].toFixed(2)}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function moneyLines(totals: Record<string, number>) {
  return currencies.map((currency) => ({ currency, amount: (totals[currency] ?? 0).toFixed(2) }));
}

export function HoverDetail({ text }: { text: string }) {
  return (
    <p className="pointer-events-none absolute top-full left-4 z-20 mt-2 hidden w-[min(18rem,calc(100%-2rem))] border-2 border-[#1B2129] bg-[#F8F8FF] p-3 text-sm font-normal text-[#1B2129] shadow-[4px_4px_0_#4BFF2A] group-hover:block">
      {text}
    </p>
  );
}

export function addMoney(totals: Record<string, number>, currency: string, amount: number) {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

function dayKey(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
}

function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function lastDays(count: number) {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let index = count - 1; index >= 0; index -= 1) {
    const day = new Date(start);
    day.setDate(start.getDate() - index);
    days.push(day);
  }
  return days;
}

function monthDays(year: number, month: number) {
  const count = new Date(year, month, 0).getDate();
  const days: Date[] = [];
  for (let day = 1; day <= count; day += 1) {
    days.push(new Date(year, month - 1, day));
  }
  return days;
}

export function MoneyChart({
  title,
  points,
  empty,
  year,
  month,
  span = "month",
  controls,
  detail,
}: {
  title: string;
  points: MoneyPoint[];
  empty: string;
  year?: number;
  month?: number;
  span?: "month" | "year";
  controls?: ReactNode;
  detail?: string;
}) {
  const groups =
    span === "year" && year
      ? shortMonths.map((label, index) => ({ key: `${year}-${String(index + 1).padStart(2, "0")}`, label }))
      : (year && month ? monthDays(year, month) : lastDays(14)).map((day) => ({ key: dayKey(day), label: String(day.getDate()) }));
  const buckets = new Map<string, Record<string, number>>();
  for (const group of groups) buckets.set(group.key, {});
  for (const point of points) {
    const date = new Date(point.at);
    const key = span === "year" ? monthKey(date) : dayKey(date);
    const bucket = buckets.get(key);
    if (!bucket || !Number.isFinite(point.amount)) continue;
    bucket[point.currency] = (bucket[point.currency] ?? 0) + point.amount;
  }
  const shown = currencies.filter((currency) => groups.some((group) => (buckets.get(group.key)?.[currency] ?? 0) > 0));
  const peak = Math.max(
    0,
    ...groups.flatMap((group) => shown.map((currency) => buckets.get(group.key)?.[currency] ?? 0)),
  );

  return (
    <article className="group relative bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-base font-medium">{title}</h2>
        {controls}
      </div>
      {detail ? <HoverDetail text={detail} /> : null}
      {peak <= 0 ? (
        <p className="mt-4 text-sm text-[#6c757d]">{empty}</p>
      ) : (
        <>
          <svg viewBox="0 0 640 200" className="mt-4 h-52 w-full" role="img" aria-label={title}>
            {groups.map((group, index) => {
              const groupWidth = 640 / groups.length;
              const barWidth = Math.min(10, Math.max(3, (groupWidth * 0.62) / Math.max(shown.length, 1)));
              const gap = shown.length > 1 ? 2 : 0;
              const totalWidth = shown.length * barWidth + Math.max(0, shown.length - 1) * gap;
              const origin = index * groupWidth + (groupWidth - totalWidth) / 2;
              return (
                <g key={group.key}>
                  {shown.map((currency, bar) => {
                    const amount = buckets.get(group.key)?.[currency] ?? 0;
                    const height = (amount / peak) * 150;
                    const x = origin + bar * (barWidth + gap);
                    const y = 160 - height;
                    return <rect key={currency} x={x} y={y} width={barWidth} height={height} fill={fills[currency]} stroke="#1B2129" strokeWidth="1" />;
                  })}
                  <text x={index * groupWidth + groupWidth / 2} y="186" textAnchor="middle" fontSize={groups.length > 16 ? "9" : "11"} fill="#6c757d">
                    {group.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm">
            {shown.map((currency) => (
              <li key={currency} className="flex items-center gap-2">
                <span className="inline-block size-3 border border-[#1B2129]" style={{ background: fills[currency] }} />
                {currency}
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
