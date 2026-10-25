"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { inviteCrew, listCrew, readSession, type CrewMember } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { internationalPhone, PhoneField, type CountryCode } from "./phone-field";
import { LogoLoader } from "./logo-loader";

const roles: Record<string, string> = { guide: "Guide", driver: "Driver" };

export function GuidesScreen() {
  const router = useRouter();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);

  function load() {
    return listCrew()
      .then((body) => setCrew(body.crew ?? []))
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Something went wrong. Try again."));
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
    listCrew()
      .then((body) => {
        if (!cancelled) setCrew(body.crew ?? []);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Something went wrong. Try again.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <DashboardShell title="Guides And Drivers" active="Guides">
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setOpen(true)} className="h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase">
          Add Account
        </button>
      </div>
      {open ? (
        <AddAccount
          onClose={() => setOpen(false)}
          onAdded={(message) => {
            setOpen(false);
            setNotice(message);
            void load();
          }}
        />
      ) : null}
      {notice ? <p className="mb-4 text-sm">{notice}</p> : null}
      {loadError ? <p className="mb-4 text-sm">{loadError}</p> : null}
      {!ready ? <LogoLoader label="Loading guides and drivers" /> : null}
      {ready && !loadError ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Username</th>
                <th className="px-5 py-3 font-medium">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {crew.map((person) => (
                <tr key={person.user_id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3 font-medium">{person.name || "—"}</td>
                  <td className="px-5 py-3">{roles[person.role] ?? person.role}</td>
                  <td className="px-5 py-3">{person.email}</td>
                  <td className="px-5 py-3 font-mono text-[#1F4D3A]">{person.username ? `@${person.username}` : "—"}</td>
                  <td className="px-5 py-3 font-semibold">{person.wallet_currency || "UGX"} {person.wallet_balance || "0.00"}</td>
                </tr>
              ))}
              {crew.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={5}>
                    No guides or drivers yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      ) : null}
    </DashboardShell>
  );
}

function AddAccount({ onClose, onAdded }: { onClose: () => void; onAdded: (message: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("+256");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"guide" | "driver">("guide");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const phoneId = useId();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@")) {
      setNotice("Enter a name and a valid email.");
      return;
    }
    setPending(true);
    setNotice("");
    inviteCrew({ name: name.trim(), email: email.trim(), phone: internationalPhone(countryCode, phone), role })
      .then(() => onAdded(`${roles[role]} added. They have a UGX wallet.`))
      .catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
        setPending(false);
      });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1C2416]/40 p-4" onMouseDown={() => !pending && onClose()}>
      <form
        onSubmit={onSubmit}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-lg border-2 border-[#1C2416] bg-white p-6 shadow-[6px_6px_0_#E2B15A]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-account-title" className="text-lg font-medium">Add An Account</h2>
            <p className="mt-1 text-sm text-[#6c757d]">A new guide or driver gets a UGX wallet straight away, so they can receive money for the trip.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
            ×
          </button>
        </div>
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-semibold">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 font-normal outline-none" />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 font-normal outline-none" />
          </label>
          <div className="block text-sm font-semibold">
            Phone
            <div className="mt-2">
              <PhoneField id={phoneId} code={countryCode} onCode={setCountryCode} number={phone} onNumber={setPhone} />
            </div>
          </div>
          <label className="block text-sm font-semibold">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value as "guide" | "driver")} className="mt-2 h-12 w-full border-2 border-[#1C2416] bg-white px-3 font-normal">
              <option value="guide">Guide</option>
              <option value="driver">Driver</option>
            </select>
          </label>
        </div>
        {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
        <button type="submit" disabled={pending} className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase disabled:opacity-60">
          {pending ? "Adding" : "Add Account"}
        </button>
      </form>
    </div>
  );
}
