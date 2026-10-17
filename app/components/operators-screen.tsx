"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import {
  addBureau,
  approveBusiness,
  disableBusiness,
  listBureaus,
  listBusinesses,
  openWallet,
  readAdminSession,
  readSession,
  setDefaultWallet,
  type Business,
} from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { internationalPhone, PhoneField, type CountryCode } from "./phone-field";

const pageSize = 8;

export function OperatorsScreen({ bureau = false }: { bureau?: boolean }) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState("");

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
    const load = bureau ? listBureaus : listBusinesses;
    load()
      .then((list) => {
        if (!cancelled) setBusinesses(list.businesses);
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
  }, [bureau, router]);

  const pages = Math.max(1, Math.ceil(businesses.length / pageSize));
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  const rows = businesses.slice(start, start + pageSize);

  function replace(business: Business) {
    setBusinesses((list) => list.map((item) => (item.id === business.id ? business : item)));
  }

  async function run(id: string, action: () => Promise<Business>) {
    setBusyId(id);
    setNotice("");
    try {
      replace(await action());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <DashboardShell title={bureau ? "Forex bureaus" : "Tour operators"} active={bureau ? "Forex bureaus" : "Tour operators"} audience="admin">
      {bureau ? (
        <AddBureau
          onCreated={(created) => {
            setBusinesses((list) => [created, ...list.filter((item) => item.id !== created.id)]);
            setPage(0);
            setNotice("");
          }}
        />
      ) : null}
      {!ready ? <p className="text-sm text-[#6c757d]">{bureau ? "Loading forex bureaus." : "Loading tour operators."}</p> : null}
      {ready ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
                <tr>
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Country</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Wallets</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((business) => (
                  <OperatorRow key={business.id} business={business} busy={busyId === business.id} onRun={run} />
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-5 py-6 text-[#6c757d]" colSpan={6}>
                      {bureau ? "No forex bureaus yet." : "No tour operators yet."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-[#e5e7eb] px-5 py-3 text-sm">
            <p className="text-[#6c757d]">
              {businesses.length === 0 ? (bureau ? "0 bureaus" : "0 operators") : `${start + 1}–${start + rows.length} of ${businesses.length}`}
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
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

function AddBureau({ onCreated }: { onCreated: (business: Business) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("UG");
  const [owner, setOwner] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("+256");
  const [phone, setPhone] = useState("");
  const phoneId = useId();
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  function close() {
    if (pending) return;
    setOpen(false);
    setNotice("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !owner.trim() || !email.includes("@")) {
      setNotice("Enter the bureau name, the owner, and an email.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      onCreated(await addBureau({ name: name.trim(), country, owner: owner.trim(), email: email.trim(), phone: internationalPhone(countryCode, phone) }));
      setName("");
      setOwner("");
      setEmail("");
      setPhone("");
      setOpen(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setOpen(true)} className="h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase">
          Add forex bureau
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1C2416]/40 p-4" onMouseDown={close}>
          <form
            onSubmit={onSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-lg border-2 border-[#1C2416] bg-white p-6 shadow-[6px_6px_0_#E2B15A]"
            noValidate
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-bureau-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="add-bureau-title" className="text-lg font-medium">
                  Add a forex bureau
                </h2>
                <p className="mt-1 text-sm text-[#6c757d]">The owner gets an email to set a password. The bureau stays pending until you approve it.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
                ×
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold">
                Bureau name
                <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none" />
              </label>
              <label className="block text-sm font-semibold">
                Country
                <select value={country} onChange={(event) => setCountry(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] bg-white px-3">
                  <option value="UG">Uganda</option>
                  <option value="KE">Kenya</option>
                  <option value="TZ">Tanzania</option>
                  <option value="RW">Rwanda</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                Owner
                <input value={owner} onChange={(event) => setOwner(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none" />
              </label>
              <label className="block text-sm font-semibold">
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none" />
              </label>
              <div className="block text-sm font-semibold">
                Phone
                <div className="mt-2">
                  <PhoneField id={phoneId} code={countryCode} onCode={setCountryCode} number={phone} onNumber={setPhone} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={pending} className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase disabled:opacity-60">
              {pending ? "Please wait" : "Add bureau"}
            </button>
            {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
          </form>
        </div>
      ) : null}
    </>
  );
}

function OperatorRow({
  business,
  busy,
  onRun,
}: {
  business: Business;
  busy: boolean;
  onRun: (id: string, action: () => Promise<Business>) => void;
}) {
  const approved = business.status === "approved";
  const hasUsd = business.wallets.some((wallet) => wallet.currency === "USD");
  const other = business.wallets.find((wallet) => !wallet.is_default);

  return (
    <tr className="border-b border-[#e5e7eb]">
      <td className="px-5 py-3 font-medium">{business.name}</td>
      <td className="px-5 py-3">
        <div>{business.owner_name}</div>
        <div className="text-xs text-[#98a6ad]">{business.owner_email}</div>
      </td>
      <td className="px-5 py-3">
        {business.country}
        {business.association_member_of ? ` · ${business.association_member_of}` : ""}
      </td>
      <td className="px-5 py-3 font-semibold uppercase">{business.status === "disabled" ? "Stopped" : business.status}</td>
      <td className="px-5 py-3">
        {business.wallets.length === 0 ? "—" : business.wallets.map((wallet) => (wallet.is_default ? `${wallet.currency} default` : wallet.currency)).join(" · ")}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-2">
          {approved ? (
            <>
              {other ? (
                <ActionButton
                  label={`Make ${other.currency} default`}
                  busy={busy}
                  onClick={() => onRun(business.id, () => setDefaultWallet(business.id, other.id))}
                >
                  <StarIcon />
                </ActionButton>
              ) : null}
              {hasUsd ? null : (
                <ActionButton label="Open USD" busy={busy} onClick={() => onRun(business.id, () => openWallet(business.id, "USD"))}>
                  <PlusIcon />
                </ActionButton>
              )}
              <ActionButton label="Disable" busy={busy} onClick={() => onRun(business.id, () => disableBusiness(business.id))}>
                <BanIcon />
              </ActionButton>
            </>
          ) : (
            <ActionButton label="Approve" busy={busy} tone="approve" onClick={() => onRun(business.id, () => approveBusiness(business.id))}>
              <CheckIcon />
            </ActionButton>
          )}
        </div>
      </td>
    </tr>
  );
}

function ActionButton({
  label,
  busy,
  tone = "plain",
  onClick,
  children,
}: {
  label: string;
  busy: boolean;
  tone?: "plain" | "approve";
  onClick: () => void;
  children: ReactNode;
}) {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={busy}
        aria-label={label}
        onClick={onClick}
        onMouseEnter={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setTip({ x: box.left + box.width / 2, y: box.top });
        }}
        onMouseLeave={() => setTip(null)}
        onFocus={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setTip({ x: box.left + box.width / 2, y: box.top });
        }}
        onBlur={() => setTip(null)}
        className={
          tone === "approve"
            ? "grid size-9 place-items-center border-2 border-[#1C2416] bg-[#E2B15A] text-[#1C2416] disabled:opacity-40"
            : "grid size-9 place-items-center text-[#1F4D3A] hover:bg-[#f4f6f8] disabled:opacity-40"
        }
      >
        {children}
      </button>
      {tip ? (
        <span
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full border-2 border-[#1C2416] bg-[#1C2416] px-2 py-1 text-xs font-semibold whitespace-nowrap text-white"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          {label}
        </span>
      ) : null}
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.5l2.4 5 5.6.8-4 4 1 5.5L12 16.2 6.9 18.8l1-5.5-4-4 5.6-.8z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M7 17L17 7" />
    </svg>
  );
}
