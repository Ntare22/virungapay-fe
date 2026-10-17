"use client";

import { useEffect, useState } from "react";
import { loadPayPage, payItinerary, type Itinerary } from "../lib/api";
import { Mark } from "./mark";

export function PayScreen({ token }: { token: string }) {
  const [item, setItem] = useState<Itinerary | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPayPage(token)
      .then((loaded) => {
        if (!cancelled) setItem(loaded);
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
  }, [token]);

  async function onPay() {
    setPending(true);
    setNotice("");
    try {
      setItem(await payItinerary(token));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F1E7] px-4 py-10 text-[#1C2416]">
      <article className="mx-auto max-w-2xl border-2 border-[#1C2416] bg-white p-6">
        <Processor />
        {!ready ? <p className="mt-6 text-sm text-[#6c757d]">Loading the itinerary.</p> : null}
        {item ? (
          <>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#1F4D3A]">{item.invoice_number}</p>
            <h1 className="mt-2 text-3xl font-semibold">{item.title}</h1>
            <p className="mt-2 text-sm text-[#6c757d]">{item.business_name}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6c757d]">Billed to</dt>
                <dd className="font-semibold">{item.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6c757d]">Received by</dt>
                <dd className="font-semibold">{item.business_name}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm">
              {item.starts_on} to {item.ends_on} · {item.party_size} travellers
            </p>
            <p className="mt-4 whitespace-pre-wrap">{item.summary}</p>
            <ol className="mt-6 space-y-3">
              {item.days.map((day) => (
                <li key={day.day_number}>
                  <p className="font-semibold">
                    Day {day.day_number}. {day.title}
                  </p>
                  <p className="text-sm">{day.body}</p>
                </li>
              ))}
            </ol>
            {item.inclusions.length > 0 ? <List title="Included" lines={item.inclusions} /> : null}
            {item.exclusions.length > 0 ? <List title="Not included" lines={item.exclusions} /> : null}
            {item.notes.length > 0 ? <List title="Notes" lines={item.notes} /> : null}
            <p className="mt-6 text-2xl font-semibold">
              {item.currency} {item.amount_due}
            </p>
            {item.status === "paid" ? (
              <p className="mt-4 font-semibold">Payment received. This is a simulated card payment. The receipt is on its way to your email.</p>
            ) : (
              <button type="button" disabled={pending} onClick={onPay} className="mt-4 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase disabled:opacity-60">
                {pending ? "Please wait" : `Pay ${item.currency} ${item.amount_due}`}
              </button>
            )}
          </>
        ) : null}
        {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      </article>
    </main>
  );
}

function Processor() {
  return (
    <header className="flex items-start justify-between gap-4 border-b-2 border-[#1C2416] pb-4">
      <div className="flex items-start gap-3">
        <Mark className="h-10 w-12" />
        <div>
          <p className="font-mono text-lg leading-none">VirungaPay</p>
          <p className="mt-1 text-sm text-[#6c757d]">Payment processor</p>
        </div>
      </div>
      <div className="text-right text-sm">
        <p>hello@virungapay.demo</p>
        <p className="text-[#6c757d]">East Africa</p>
      </div>
    </header>
  );
}

function List({ title, lines }: { title: string; lines: string[] }) {
  return (
    <section className="mt-5">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
