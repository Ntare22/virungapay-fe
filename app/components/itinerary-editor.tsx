"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { assignItinerary, getItinerary, listInquiries, listPackages, listTourists, readSession, saveItinerary, sendItinerary, type Inquiry, type Itinerary, type TouristAccount, type TripPackage } from "../lib/api";
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
  const [tourists, setTourists] = useState<TouristAccount[]>([]);
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
    Promise.all([listPackages(), listInquiries(), listTourists().catch(() => ({ tourists: [] as TouristAccount[] })), itineraryId ? getItinerary(itineraryId) : Promise.resolve(null)])
      .then(([packageList, inquiryList, touristList, existing]) => {
        if (cancelled) return;
        setPackages(packageList.packages);
        setInquiries(inquiryList.inquiries);
        setTourists(touristList.tourists ?? []);
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
      <Link href="/itineraries" className="mb-4 inline-block text-sm font-semibold text-[#1F4D3A]">
        Back To Itineraries
      </Link>
      {item.invoice_number ? <p className="mb-4 text-sm font-semibold">Invoice {item.invoice_number}</p> : null}
      <form onSubmit={onSave} className="bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Start From A Package
            <select value={item.package_id ?? ""} onChange={(event) => applyPackage(event.target.value)} disabled={locked} className="mt-1 h-11 w-full border-2 border-[#1C2416] bg-white px-3">
              <option value="">Blank</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Customer Inquiry
            <select value={item.inquiry_id ?? ""} onChange={(event) => applyInquiry(event.target.value)} disabled={locked} className="mt-1 h-11 w-full border-2 border-[#1C2416] bg-white px-3">
              <option value="">None</option>
              {inquiries.map((inquiry) => (
                <option key={inquiry.id} value={inquiry.id}>
                  {inquiry.customer_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Title
            <input value={item.title} disabled={locked} onChange={(event) => setItem({ ...item, title: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
          <label className="text-sm">
            Customer Name
            <input value={item.customer_name} disabled={locked} onChange={(event) => setItem({ ...item, customer_name: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
          <label className="text-sm">
            Customer Email
            <input type="email" value={item.customer_email} disabled={locked} onChange={(event) => setItem({ ...item, customer_email: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
          <label className="text-sm">
            Travellers
            <input type="number" min={1} value={item.party_size} disabled={locked} onChange={(event) => setItem({ ...item, party_size: Number(event.target.value) })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
          <label className="text-sm">
            Starts
            <input type="date" value={item.starts_on} disabled={locked} onChange={(event) => setItem({ ...item, starts_on: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
          <label className="text-sm">
            Ends
            <input type="date" value={item.ends_on} disabled={locked} onChange={(event) => setItem({ ...item, ends_on: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Summary
          <textarea value={item.summary} disabled={locked} onChange={(event) => setItem({ ...item, summary: event.target.value })} className="mt-1 min-h-24 w-full border-2 border-[#1C2416] px-3 py-2" />
        </label>
        <DayEditor days={item.days} onChange={(days) => setItem({ ...item, days })} disabled={locked} />
        <Lines label="Inclusions" value={item.inclusions} onChange={(inclusions) => setItem({ ...item, inclusions })} disabled={locked} />
        <Lines label="Exclusions" value={item.exclusions} onChange={(exclusions) => setItem({ ...item, exclusions })} disabled={locked} />
        <Lines label="Notes" value={item.notes} onChange={(notes) => setItem({ ...item, notes })} disabled={locked} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Currency
            <select value={item.currency || "USD"} disabled={locked} onChange={(event) => setItem({ ...item, currency: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] bg-white px-3">
              <option>USD</option>
            </select>
          </label>
          <label className="text-sm">
            Amount Due
            <input value={item.amount_due} disabled={locked} onChange={(event) => setItem({ ...item, amount_due: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1C2416] px-3" />
          </label>
        </div>
        {locked ? null : (
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="h-11 border-2 border-[#1C2416] bg-white px-4 text-sm font-bold uppercase disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" disabled={pending || !item.id} onClick={onSend} className="h-11 border-2 border-[#1C2416] bg-[#E2B15A] px-4 text-sm font-bold uppercase disabled:opacity-60">
              {pending ? "Please Wait" : "Send"}
            </button>
          </div>
        )}
        {locked ? <p className="mt-4 text-sm font-semibold uppercase">{item.status}</p> : null}
      </form>
      {item.status === "paid" ? (
        <section className="mt-4 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Assign To A Tourist</h2>
          <p className="mt-1 text-sm text-[#6c757d]">The trip is paid. Choose their account and it shows on their Home. If they sign up later with {item.customer_email}, it is assigned on its own.</p>
          <label className="mt-4 block text-sm">
            Tourist Account
            <select
              value={item.tourist_user_id ?? ""}
              onChange={(event) => setItem({ ...item, tourist_user_id: event.target.value })}
              className="mt-1 h-11 w-full border-2 border-[#1C2416] bg-white px-3"
            >
              <option value="">{tourists.length === 0 ? "No Tourist Accounts Yet" : "Choose A Tourist"}</option>
              {tourists.map((tourist) => (
                <option key={tourist.id} value={tourist.id}>
                  {tourist.name} · {tourist.email}{tourist.username ? ` · @${tourist.username}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={pending || !item.tourist_user_id}
            onClick={() => {
              if (!item.id || !item.tourist_user_id) return;
              setPending(true);
              setNotice("");
              assignItinerary(item.id, item.tourist_user_id)
                .then((saved) => setItem(saved))
                .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Something went wrong. Try again."))
                .finally(() => setPending(false));
            }}
            className="mt-4 h-11 border-2 border-[#1C2416] bg-[#E2B15A] px-4 text-sm font-bold uppercase disabled:opacity-60"
          >
            {pending ? "Please Wait" : "Assign"}
          </button>
        </section>
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
