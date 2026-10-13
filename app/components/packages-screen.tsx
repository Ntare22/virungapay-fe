"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { listPackages, readSession, savePackage, type TripDay, type TripPackage } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const empty: TripPackage = {
  id: "",
  title: "",
  summary: "",
  status: "draft",
  days: [],
  inclusions: [],
  exclusions: [],
  notes: [],
};

export function PackagesScreen({ packageId }: { packageId?: string }) {
  const router = useRouter();
  const [packages, setPackages] = useState<TripPackage[]>([]);
  const [current, setCurrent] = useState<TripPackage>(empty);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [ready, setReady] = useState(false);
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
    listPackages()
      .then((list) => {
        if (cancelled) return;
        setPackages(list.packages);
        if (packageId) {
          const found = list.packages.find((pkg) => pkg.id === packageId);
          if (found) setCurrent(found);
        }
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
  }, [packageId, router]);

  function close() {
    if (pending) return;
    setOpen(false);
    setFormNotice("");
    setCurrent(empty);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormNotice("");
    try {
      const saved = await savePackage(current);
      setPackages((list) => [saved, ...list.filter((pkg) => pkg.id !== saved.id)]);
      if (packageId) {
        router.push("/itineraries/packages");
        return;
      }
      setCurrent(empty);
      setOpen(false);
    } catch (error) {
      setFormNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardShell title="Packages" active="Itineraries">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/itineraries" className="text-sm font-semibold text-[#2A2AFF]">
          Back to itineraries
        </Link>
        {packageId ? null : (
          <button type="button" onClick={() => setOpen(true)} className="h-12 border-2 border-[#1B2129] bg-[#4BFF2A] px-5 text-sm font-bold uppercase">
            New package
          </button>
        )}
      </div>
      {!packageId && ready ? (
        <article className="mb-4 overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">Package</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3">
                    <Link href={`/itineraries/packages/${pkg.id}`} className="font-medium text-[#2A2AFF]">
                      {pkg.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 uppercase">
                    {pkg.status}
                    <div>
                      <Link href={`/itineraries/new?package=${pkg.id}`} className="font-semibold normal-case text-[#2A2AFF]">
                        Use for an itinerary
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {packages.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={2}>
                    No packages yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      ) : null}
      {packageId || open ? (
        <div className={packageId ? undefined : "fixed inset-0 z-50 grid place-items-center bg-[#1B2129]/40 p-4"} onMouseDown={packageId ? undefined : close}>
          <form
            onSubmit={onSubmit}
            onMouseDown={(event) => event.stopPropagation()}
            className={packageId ? "bg-white p-5 shadow-sm" : "max-h-[90vh] w-[70vw] overflow-y-auto border-2 border-[#1B2129] bg-white p-6 shadow-[6px_6px_0_#4BFF2A]"}
            noValidate
            role={packageId ? undefined : "dialog"}
            aria-modal={packageId ? undefined : true}
            aria-labelledby="package-form-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="package-form-title" className="text-base font-medium">
                  {packageId ? "Edit package" : "New package"}
                </h2>
                <p className="mt-1 text-sm text-[#6c757d]">Days, inclusions, and notes have no price. You set the amount when you send an itinerary.</p>
              </div>
              {packageId ? null : (
                <button type="button" onClick={close} aria-label="Close" className="grid size-9 shrink-0 place-items-center text-xl leading-none">
                  ×
                </button>
              )}
            </div>
            <label className="mt-4 block text-sm">
              Title
              <input value={current.title} onChange={(event) => setCurrent({ ...current, title: event.target.value })} className="mt-1 h-11 w-full border-2 border-[#1B2129] px-3" />
            </label>
            <label className="mt-3 block text-sm">
              Summary
              <textarea value={current.summary} onChange={(event) => setCurrent({ ...current, summary: event.target.value })} className="mt-1 min-h-24 w-full border-2 border-[#1B2129] px-3 py-2" />
            </label>
            <label className="mt-3 block text-sm">
              Status
              <select value={current.status} onChange={(event) => setCurrent({ ...current, status: event.target.value as TripPackage["status"] })} className="mt-1 h-11 w-full border-2 border-[#1B2129] bg-white px-3">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <DayEditor days={current.days} onChange={(days) => setCurrent({ ...current, days })} />
            <Lines label="Inclusions" value={current.inclusions} onChange={(inclusions) => setCurrent({ ...current, inclusions })} />
            <Lines label="Exclusions" value={current.exclusions} onChange={(exclusions) => setCurrent({ ...current, exclusions })} />
            <Lines label="Notes" value={current.notes} onChange={(notes) => setCurrent({ ...current, notes })} />
            <button type="submit" disabled={pending} className="mt-4 h-11 border-2 border-[#1B2129] bg-[#4BFF2A] px-4 text-sm font-bold uppercase disabled:opacity-60">
              {pending ? "Please wait" : "Save package"}
            </button>
            {formNotice ? <p className="mt-3 text-sm">{formNotice}</p> : null}
          </form>
        </div>
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

export function DayEditor({ days, onChange, disabled = false }: { days: TripDay[]; onChange: (days: TripDay[]) => void; disabled?: boolean }) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-medium">Days</legend>
      {days.map((day, index) => (
        <div key={index} className="mt-3 grid gap-2 border-2 border-[#1B2129] p-3">
          <input
            value={day.title}
            placeholder={`Day ${index + 1} title`}
            onChange={(event) => onChange(days.map((item, itemIndex) => (itemIndex === index ? { ...item, title: event.target.value, day_number: index + 1 } : item)))}
            className="h-11 border-2 border-[#1B2129] px-3"
            readOnly={disabled}
          />
          <textarea
            value={day.body}
            placeholder="What happens this day"
            readOnly={disabled}
            onChange={(event) => onChange(days.map((item, itemIndex) => (itemIndex === index ? { ...item, body: event.target.value } : item)))}
            className="min-h-20 border-2 border-[#1B2129] px-3 py-2"
          />
          {disabled ? null : (
            <button type="button" onClick={() => onChange(days.filter((_, itemIndex) => itemIndex !== index))} className="text-left text-sm font-semibold text-[#2A2AFF]">
              Remove day
            </button>
          )}
        </div>
      ))}
      {disabled ? null : (
        <button type="button" onClick={() => onChange([...days, { day_number: days.length + 1, title: "", body: "" }])} className="mt-3 text-sm font-semibold text-[#2A2AFF]">
          Add day
        </button>
      )}
    </fieldset>
  );
}

export function Lines({ label, value, onChange, disabled = false }: { label: string; value: string[]; onChange: (value: string[]) => void; disabled?: boolean }) {
  return (
    <label className="mt-3 block text-sm">
      {label}
      <textarea
        value={value.join("\n")}
        onChange={(event) => onChange(event.target.value.split("\n"))}
        placeholder="One item on each line"
        className="mt-1 min-h-24 w-full border-2 border-[#1B2129] px-3 py-2"
        readOnly={disabled}
      />
    </label>
  );
}
