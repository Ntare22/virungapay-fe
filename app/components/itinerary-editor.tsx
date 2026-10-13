"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { getItinerary, listInquiries, listPackages, readSession, saveItinerary, sendItinerary, type Inquiry, type Itinerary, type TripPackage } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { DayEditor, Lines } from "./packages-screen";

const blank: Itinerary = {
  id: "",
  customer_name: "",
  customer_email: "",
  starts_on: "",
  ends_on: "",
  party_size: 1,
  title: "",
  summary: "",
  currency: "USD",
  amount_due: "",
  status: "draft",
  days: [],
  inclusions: [],
  exclusions: [],
  notes: [],
};

export function ItineraryEditor({ itineraryId, packageId, inquiryId }: { itineraryId?: string; packageId?: string; inquiryId?: string }) {
  const router = useRouter();
  const [item, setItem] = useState<Itinerary>({ ...blank, package_id: packageId, inquiry_id: inquiryId });
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const locked = item.status === "sent" || item.status === "paid";

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
    Promise.all([listPackages(), listInquiries(), itineraryId ? getItinerary(itineraryId) : Promise.resolve(null)])
      .then(([packageList, inquiryList, existing]) => {
        if (cancelled) return;
        setPackages(packageList.packages);
        setInquiries(inquiryList.inquiries);
        if (existing) {
          setItem(existing);
          return;
        }
        const pkg = packageList.packages.find((row) => row.id === packageId);
        const inquiry = inquiryList.inquiries.find((row) => row.id === inquiryId);
        setItem({
          ...blank,
          package_id: pkg?.id,
          inquiry_id: inquiry?.id,
          title: pkg?.title ?? "",
          summary: inquiry?.notes || pkg?.summary || "",
          days: pkg?.days ?? [],
          inclusions: pkg?.inclusions ?? [],
          exclusions: pkg?.exclusions ?? [],
          notes: pkg?.notes ?? [],
          customer_name: inquiry?.customer_name ?? "",
          customer_email: inquiry?.customer_email ?? "",
          starts_on: inquiry?.starts_on ?? "",
          ends_on: inquiry?.ends_on ?? "",
          party_size: inquiry?.party_size ?? 1,
        });
      })
      .catch((error) => {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [inquiryId, itineraryId, packageId, router]);

  function applyPackage(id: string) {
    const pkg = packages.find((row) => row.id === id);
    if (!pkg) {
      setItem({ ...item, package_id: undefined });
      return;
    }
    setItem({
      ...item,
      package_id: pkg.id,
      title: pkg.title,
      summary: item.summary || pkg.summary,
      days: pkg.days,
      inclusions: pkg.inclusions,
      exclusions: pkg.exclusions,
      notes: pkg.notes,
    });
  }

  function applyInquiry(id: string) {
    const inquiry = inquiries.find((row) => row.id === id);
    if (!inquiry) {
      setItem({ ...item, inquiry_id: undefined });
      return;
    }
    setItem({
      ...item,
      inquiry_id: inquiry.id,
      customer_name: inquiry.customer_name,
      customer_email: inquiry.customer_email,
      starts_on: inquiry.starts_on,
      ends_on: inquiry.ends_on,
      party_size: inquiry.party_size,
      summary: item.summary || inquiry.notes,
    });
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    try {
      const saved = await saveItinerary(item);
      setItem(saved);
      router.replace(`/itineraries/${saved.id}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onSend() {
    if (!item.id) return;
    setPending(true);
    setNotice("");
    try {
      const saved = await saveItinerary(item);
      const sent = await sendItinerary(saved.id);
      setItem(sent);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardShell title={item.title || "Itinerary"} active="Itineraries">
      <Link href="/itineraries" className="mb-4 inline-block text-sm font-semibold text-[#2A2AFF]">
        Back to itineraries
      </Link>
      {item.invoice_number ? <p className="mb-4 text-sm font-semibold">Invoice {item.invoice_number}</p> : null}
      <form onSubmit={onSave} className="bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Start from a package
            <select value={item.package_id ?? ""} onChange={(event) => applyPackage(event.target.value)} disabled={locked} className="mt-1 h-11 w-full border-2 border-[#1B2129] bg-white px-3">
              <option value="">Blank</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Customer inquiry
            <select value={item.inquiry_id ?? ""} onChange={(event) => applyInquiry(event.target.value)} disabled={locked} className="mt-1 h-11 w-full border-2 border-[#1B2129] bg-white px-3">
              <option value="">None</option>
              {inquiries.map((inquiry) => (
                <option key={inquiry.id} value={inquiry.id}>
                  {inquiry.customer_name}
                </option>
              ))}
            </select>
          </label>
          <input value={item.title} disabled={locked} onChange={(event) => setItem({ ...item, title: event.target.value })} placeholder="Title" className="h-11 border-2 border-[#1B2129] px-3" />
          <input value={item.customer_name} disabled={locked} onChange={(event) => setItem({ ...item, customer_name: event.target.value })} placeholder="Customer name" className="h-11 border-2 border-[#1B2129] px-3" />
          <input value={item.customer_email} disabled={locked} onChange={(event) => setItem({ ...item, customer_email: event.target.value })} placeholder="Customer email" className="h-11 border-2 border-[#1B2129] px-3" />
          <input type="number" min={1} value={item.party_size} disabled={locked} onChange={(event) => setItem({ ...item, party_size: Number(event.target.value) })} className="h-11 border-2 border-[#1B2129] px-3" />
          <input type="date" value={item.starts_on} disabled={locked} onChange={(event) => setItem({ ...item, starts_on: event.target.value })} className="h-11 border-2 border-[#1B2129] px-3" />
          <input type="date" value={item.ends_on} disabled={locked} onChange={(event) => setItem({ ...item, ends_on: event.target.value })} className="h-11 border-2 border-[#1B2129] px-3" />
        </div>
        <textarea value={item.summary} disabled={locked} onChange={(event) => setItem({ ...item, summary: event.target.value })} placeholder="Summary" className="mt-3 min-h-24 w-full border-2 border-[#1B2129] px-3 py-2" />
        <DayEditor days={item.days} onChange={(days) => setItem({ ...item, days })} disabled={locked} />
        <Lines label="Inclusions" value={item.inclusions} onChange={(inclusions) => setItem({ ...item, inclusions })} disabled={locked} />
        <Lines label="Exclusions" value={item.exclusions} onChange={(exclusions) => setItem({ ...item, exclusions })} disabled={locked} />
        <Lines label="Notes" value={item.notes} onChange={(notes) => setItem({ ...item, notes })} disabled={locked} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Currency
            <select value={item.currency || "USD"} disabled={locked} onChange={(event) => setItem({ ...item, currency: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1B2129] bg-white px-3">
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
          <label className="text-sm">
            Amount due
            <input value={item.amount_due} disabled={locked} onChange={(event) => setItem({ ...item, amount_due: event.target.value })} placeholder="Amount" className="mt-1 h-11 w-full border-2 border-[#1B2129] px-3" />
          </label>
        </div>
        {locked ? null : (
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="h-11 border-2 border-[#1B2129] bg-white px-4 text-sm font-bold uppercase disabled:opacity-60">
              Save draft
            </button>
            <button type="button" disabled={pending || !item.id} onClick={onSend} className="h-11 border-2 border-[#1B2129] bg-[#4BFF2A] px-4 text-sm font-bold uppercase disabled:opacity-60">
              {pending ? "Please wait" : "Send"}
            </button>
          </div>
        )}
        {locked ? <p className="mt-4 text-sm font-semibold uppercase">{item.status}</p> : null}
      </form>
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
