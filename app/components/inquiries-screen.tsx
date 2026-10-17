"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createInquiry, listInquiries, readSession, type Inquiry } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

export function InquiriesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [pending, setPending] = useState(false);

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
    listInquiries()
      .then((list) => {
        if (!cancelled) setRows(list.inquiries);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  function close() {
    if (pending) return;
    setOpen(false);
    setFormNotice("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormNotice("");
    try {
      const saved = await createInquiry({
        customer_name: name,
        customer_email: email,
        starts_on: startsOn,
        ends_on: endsOn,
        party_size: Number(partySize),
        notes,
      });
      setRows((current) => [saved, ...current]);
      setName("");
      setEmail("");
      setNotes("");
      setOpen(false);
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardShell title="Inquiries" active="Itineraries">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/itineraries" className="text-sm font-semibold text-[#1F4D3A]">
          Back to itineraries
        </Link>
        <button type="button" onClick={() => setOpen(true)} className="h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase">
          Record an inquiry
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
            aria-labelledby="record-inquiry-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="record-inquiry-title" className="text-lg font-medium">
                  Record an inquiry
                </h2>
                <p className="mt-1 text-sm text-[#6c757d]">Write down what the customer asked for. The price is set later, on the itinerary.</p>
              </div>
              <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
                ×
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Customer name" aria-label="Customer name" className="h-11 border-2 border-[#1C2416] px-3" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Email" className="h-11 border-2 border-[#1C2416] px-3" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} aria-label="Starts on" className="h-11 border-2 border-[#1C2416] px-3" />
                <input type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} aria-label="Ends on" className="h-11 border-2 border-[#1C2416] px-3" />
              </div>
              <input value={partySize} onChange={(event) => setPartySize(event.target.value)} placeholder="Party size" aria-label="Party size" className="h-11 border-2 border-[#1C2416] px-3" />
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What they asked for" aria-label="What they asked for" className="min-h-24 w-full border-2 border-[#1C2416] px-3 py-2" />
            </div>
            <button type="submit" disabled={pending} className="mt-4 h-11 border-2 border-[#1C2416] bg-[#E2B15A] px-4 text-sm font-bold uppercase disabled:opacity-60">
              {pending ? "Please wait" : "Save inquiry"}
            </button>
            {formNotice ? <p className="mt-3 text-sm">{formNotice}</p> : null}
          </form>
        </div>
      ) : null}
      <article className="overflow-hidden bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Dates</th>
              <th className="px-5 py-3 font-medium">Request</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#e5e7eb]">
                <td className="px-5 py-3">
                  <div>{row.customer_name}</div>
                  <div className="text-xs text-[#98a6ad]">{row.customer_email}</div>
                </td>
                <td className="px-5 py-3">
                  {row.starts_on} to {row.ends_on}
                  <div className="text-xs text-[#98a6ad]">{row.party_size} travellers</div>
                </td>
                <td className="px-5 py-3">
                  <div>{row.notes}</div>
                  <Link href={`/itineraries/new?inquiry=${row.id}`} className="font-semibold text-[#1F4D3A]">
                    Build itinerary
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
