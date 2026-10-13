"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { listOperatorPayments, moveWallets, myCompany, readSession, renameWallet, requestEurWallet, todayTariff, type Company, type OperatorPayment, type Tariff, type Wallet } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const currencyOrder = ["USD", "EUR", "UGX"];

function ordered(wallets: Wallet[]) {
  return [...wallets].sort((left, right) => currencyOrder.indexOf(left.currency) - currencyOrder.indexOf(right.currency));
}

export function OperatorWalletsScreen() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [payments, setPayments] = useState<OperatorPayment[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [operator, setOperator] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [move, setMove] = useState<{ fromId: string; toId: string } | null>(null);

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      router.replace("/login");
      return;
    }
    if (saved.audience === "admin") {
      router.replace("/admin/wallets");
      return;
    }
    setOperator(saved.session.user.role === "operator_owner");
    let cancelled = false;
    Promise.all([myCompany(), todayTariff().catch(() => ({ tariffs: [] as Tariff[] })), listOperatorPayments().catch(() => ({ payments: [] as OperatorPayment[] }))])
      .then(([loaded, rates, activity]) => {
        if (cancelled) return;
        setCompany(loaded);
        setTariffs(rates.tariffs ?? []);
        setPayments(activity.payments ?? []);
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

  const wallets = ordered(company?.wallets ?? []);
  const approved = company?.status === "approved";
  const slots = exchangeSlots(wallets);
  const canRequestEur = operator && approved && !wallets.some((wallet) => wallet.currency === "EUR");

  async function requestEur() {
    setRequesting(true);
    setNotice("");
    try {
      setCompany(await requestEurWallet());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <DashboardShell title="Wallets" active="Wallets">
      {!ready ? <p className="text-sm text-[#6c757d]">Loading wallets.</p> : null}
      {ready && slots.length > 0 ? (
        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
          {slots.map((slot) =>
            slot.kind === "wallet" ? (
              <WalletCard
                key={slot.wallet.id}
                wallet={slot.wallet}
                onRenamed={(next) =>
                  setCompany((current) =>
                    current
                      ? { ...current, wallets: current.wallets.map((item) => (item.id === next.id ? { ...item, name: next.name, username: next.username } : item)) }
                      : current,
                  )
                }
              />
            ) : (
              <ExchangeButton
                key={slot.pair}
                pair={slot.pair}
                rate={tariffs.find((item) => item.pair === slot.pair)?.customer_rate}
                disabled={!approved}
                onOpen={() => setMove({ fromId: slot.fromId, toId: slot.toId })}
              />
            ),
          )}
        </div>
      ) : null}
      {canRequestEur ? (
        <button
          type="button"
          onClick={requestEur}
          disabled={requesting}
          className="mt-4 h-12 border-2 border-[#1B2129] bg-[#4BFF2A] px-4 text-sm font-bold uppercase disabled:opacity-60"
        >
          {requesting ? "Please wait" : "Request EUR wallet"}
        </button>
      ) : null}
      {ready && wallets.length === 0 && !notice ? <p className="text-sm text-[#6c757d]">No wallets yet.</p> : null}
      {move && approved ? (
        <MoveModal
          key={`${move.fromId}-${move.toId}`}
          wallets={wallets}
          tariffs={tariffs}
          fromId={move.fromId}
          toId={move.toId}
          onClose={() => setMove(null)}
          onMoved={(next) => {
            setCompany(next);
            setNotice("");
            setMove(null);
            listOperatorPayments()
              .then((activity) => setPayments(activity.payments ?? []))
              .catch(() => undefined);
          }}
        />
      ) : null}
      {ready && company && !approved ? <p className="mt-4 text-sm">Approve the company before moving money between wallets.</p> : null}
      {ready && company ? <Movement payments={payments} /> : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

const movementKinds: Record<string, string> = {
  collection: "Payment in",
  withdraw: "Withdrawal",
  p2p: "Tip",
  conversion: "Exchange",
};

function Movement({ payments }: { payments: OperatorPayment[] }) {
  const rows = movementRows(payments);
  return (
    <article className="mt-6 overflow-hidden bg-white shadow-sm">
      <div className="border-b border-[#e5e7eb] px-5 py-4">
        <h2 className="text-base font-medium">Movement</h2>
        <p className="mt-1 text-sm text-[#6c757d]">Money that has come into these wallets, left them, or moved from one wallet to another.</p>
      </div>
      <table className="min-w-full text-sm">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
          <tr>
            <th className="px-5 py-3 font-medium">When</th>
            <th className="px-5 py-3 font-medium">What</th>
            <th className="px-5 py-3 font-medium">Between</th>
            <th className="px-5 py-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#e5e7eb]">
              <td className="px-5 py-3 whitespace-nowrap">{when(row.at)}</td>
              <td className="px-5 py-3">{row.what}</td>
              <td className="px-5 py-3">{row.between}</td>
              <td className="px-5 py-3 font-semibold">{row.amount}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="px-5 py-6 text-[#6c757d]" colSpan={4}>
                No money has moved through these wallets yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </article>
  );
}

function movementRows(payments: OperatorPayment[]) {
  const used = new Set<string>();
  const rows: { id: string; at: string; what: string; between: string; amount: string }[] = [];
  for (const out of payments) {
    if (out.kind !== "conversion" || out.direction !== "out" || used.has(out.id)) continue;
    const arrived = payments.find((row) => {
      if (row.kind !== "conversion" || row.direction !== "in" || used.has(row.id) || row.currency === out.currency) return false;
      return Math.abs(new Date(row.created_at).getTime() - new Date(out.created_at).getTime()) < 5000;
    });
    used.add(out.id);
    if (arrived) used.add(arrived.id);
    rows.push({
      id: out.id,
      at: out.created_at,
      what: "Exchange",
      between: arrived ? `${out.currency} wallet to ${arrived.currency} wallet` : `${out.currency} wallet`,
      amount: arrived ? `${out.currency} ${out.amount} → ${arrived.currency} ${arrived.amount}` : `${out.currency} ${out.amount}`,
    });
  }
  for (const row of payments) {
    if (used.has(row.id)) continue;
    const into = row.direction !== "out";
    rows.push({
      id: row.id,
      at: row.created_at,
      what: movementKinds[row.kind] ?? row.kind,
      between: into ? `${row.counterparty || "Someone"} to ${row.currency} wallet` : `${row.currency} wallet to ${row.counterparty || "someone"}`,
      amount: `${into ? "In" : "Out"} ${row.currency} ${row.amount}`,
    });
  }
  return rows.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function WalletCard({ wallet, onRenamed }: { wallet: Wallet; onRenamed: (wallet: Wallet) => void }) {
  const [open, setOpen] = useState(false);
  const label = wallet.name?.trim() || `${wallet.currency} wallet`;
  return (
    <article className="min-w-0 flex-1 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium">{label}</p>
        <button type="button" onClick={() => setOpen(true)} className="shrink-0 text-sm font-bold uppercase text-[#2A2AFF]">
          Edit
        </button>
      </div>
      <p className="mt-1 text-sm text-[#6c757d]">{wallet.currency}</p>
      <p className="mt-1 break-all font-mono text-sm text-[#2A2AFF]">@{wallet.username || "no username"}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {wallet.currency} {wallet.balance || "0.00"}
      </p>
      {open ? (
        <UsernameModal
          wallet={wallet}
          onClose={() => setOpen(false)}
          onSaved={(saved) => {
            onRenamed(saved);
            setOpen(false);
          }}
        />
      ) : null}
    </article>
  );
}

function UsernameModal({
  wallet,
  onClose,
  onSaved,
}: {
  wallet: Wallet;
  onClose: () => void;
  onSaved: (wallet: Wallet) => void;
}) {
  const [name, setName] = useState(wallet.name || "");
  const [username, setUsername] = useState(wallet.username || "");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim()) {
      setNotice("Enter a username.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      onSaved(await renameWallet(wallet.id, { name: name.trim(), username: username.trim() }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      setPending(false);
    }
  }

  function close() {
    if (pending) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1B2129]/40 p-4" onMouseDown={close}>
      <form
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg border-2 border-[#1B2129] bg-white p-6 shadow-[6px_6px_0_#4BFF2A]"
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-username-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-username-title" className="text-lg font-medium">Edit username</h2>
            <p className="mt-1 text-sm text-[#6c757d]">Senders find this wallet by the username.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
            ×
          </button>
        </div>
        <label className="mt-4 block text-sm font-semibold" htmlFor={`wallet-name-${wallet.id}`}>
          Wallet name
          <input
            id={`wallet-name-${wallet.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
            className="mt-2 h-12 w-full border-2 border-[#1B2129] px-3 font-normal outline-none"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold" htmlFor={`wallet-username-${wallet.id}`}>
          Username
          <input
            id={`wallet-username-${wallet.id}`}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={30}
            autoCapitalize="none"
            spellCheck={false}
            className="mt-2 h-12 w-full border-2 border-[#1B2129] px-3 font-mono font-normal outline-none"
          />
        </label>
        {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
        <button type="submit" disabled={pending} className="mt-6 h-12 border-2 border-[#1B2129] bg-[#4BFF2A] px-6 text-sm font-bold uppercase disabled:opacity-60">
          {pending ? "Saving" : "Save"}
        </button>
      </form>
    </div>
  );
}

function ExchangeButton({ pair, rate, disabled, onOpen }: { pair: string; rate?: string; disabled: boolean; onOpen: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2 md:px-1">
      <Arrow direction="right" />
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-label={`Exchange at ${pair}`}
        className="border-2 border-[#1B2129] bg-white px-4 py-3 text-center shadow-[4px_4px_0_#4BFF2A] disabled:opacity-60"
      >
        <span className="block text-xs font-bold uppercase">{pair}</span>
        <span className="mt-1 block text-lg font-semibold">{rate ? showRate(rate) : "No rate"}</span>
      </button>
      <Arrow direction="left" />
    </div>
  );
}

function Arrow({ direction }: { direction: "left" | "right" }) {
  const points = direction === "right" ? "4,8 28,20 4,32" : "32,8 8,20 32,32";
  return (
    <svg viewBox="0 0 36 40" className="h-8 w-7 shrink-0" aria-hidden="true">
      <polygon points={points} fill="#2A2AFF" />
    </svg>
  );
}

function MoveModal({
  wallets,
  tariffs,
  fromId: initialFrom,
  toId: initialTo,
  onClose,
  onMoved,
}: {
  wallets: Wallet[];
  tariffs: Tariff[];
  fromId: string;
  toId: string;
  onClose: () => void;
  onMoved: (company: Company) => void;
}) {
  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(initialTo);
  const [amount, setAmount] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const from = wallets.find((wallet) => wallet.id === fromId);
  const to = wallets.find((wallet) => wallet.id === toId);
  const pair = ratePair(from?.currency, to?.currency);
  const tariff = tariffs.find((item) => item.pair === pair);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!amount.trim() || fromId === toId) {
      setNotice("Choose two wallets and enter an amount.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      onMoved(await moveWallets(fromId, toId, amount.trim()));
      setAmount("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  function close() {
    if (pending) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1B2129]/40 p-4" onMouseDown={close}>
    <form
      onSubmit={onSubmit}
      onMouseDown={(event) => event.stopPropagation()}
      className="w-full max-w-lg border-2 border-[#1B2129] bg-white p-6 shadow-[6px_6px_0_#4BFF2A]"
      noValidate
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-money-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="move-money-title" className="text-lg font-medium">Move money</h2>
          <p className="mt-2 text-sm text-[#6c757d]">
            {tariff ? `Using ${tariff.pair} at ${showRate(tariff.customer_rate)}.` : "USD and EUR each move to or from UGX."}
          </p>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
          ×
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          From
          <select value={fromId} onChange={(event) => setFromId(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1B2129] bg-white px-3">
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.currency}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          To
          <select value={toId} onChange={(event) => setToId(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1B2129] bg-white px-3">
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.currency}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold" htmlFor="move-amount">
        Amount in {from?.currency || "the source wallet"}
      </label>
      <input
        id="move-amount"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="mt-2 h-12 w-full border-2 border-[#1B2129] px-3 outline-none"
      />
      <button type="submit" disabled={pending} className="mt-6 h-12 border-2 border-[#1B2129] bg-[#4BFF2A] px-6 text-sm font-bold uppercase disabled:opacity-60">
        {pending ? "Please wait" : "Move"}
      </button>
      {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
    </form>
    </div>
  );
}

function exchangeSlots(wallets: Wallet[]) {
  const ugx = wallets.find((wallet) => wallet.currency === "UGX");
  const usd = wallets.find((wallet) => wallet.currency === "USD");
  const eur = wallets.find((wallet) => wallet.currency === "EUR");
  const slots: Array<{ kind: "wallet"; wallet: Wallet } | { kind: "rate"; pair: string; fromId: string; toId: string }> = [];
  function pushWallet(wallet?: Wallet) {
    if (!wallet || slots.some((slot) => slot.kind === "wallet" && slot.wallet.id === wallet.id)) return;
    slots.push({ kind: "wallet", wallet });
  }
  if (usd && ugx) {
    pushWallet(usd);
    slots.push({ kind: "rate", pair: "USD/UGX", fromId: usd.id, toId: ugx.id });
    pushWallet(ugx);
  }
  if (eur && ugx) {
    pushWallet(ugx);
    slots.push({ kind: "rate", pair: "EUR/UGX", fromId: eur.id, toId: ugx.id });
    pushWallet(eur);
  }
  if (slots.length === 0) {
    for (const wallet of wallets) pushWallet(wallet);
  }
  return slots;
}

function showRate(rate: string) {
  const trimmed = rate.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return trimmed || rate;
}

function ratePair(from?: string, to?: string) {
  if (!from || !to) return "";
  if ((from === "USD" && to === "UGX") || (from === "UGX" && to === "USD")) return "USD/UGX";
  if ((from === "EUR" && to === "UGX") || (from === "UGX" && to === "EUR")) return "EUR/UGX";
  return "";
}
