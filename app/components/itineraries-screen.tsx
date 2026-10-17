"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listItineraries, readSession, type Itinerary } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

export function ItinerariesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Itinerary[]>([]);
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);

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
    listItineraries()
      .then((list) => {
        if (!cancelled) setRows(list.itineraries);
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

  return (
    <DashboardShell title="Itineraries" active="Itineraries">
      <div className="mb-4 flex flex-wrap gap-3">
        <Link href="/itineraries/packages" className="border-2 border-[#1C2416] bg-white px-4 py-2 text-sm font-semibold">
          Packages
        </Link>
        <Link href="/itineraries/inquiries" className="border-2 border-[#1C2416] bg-white px-4 py-2 text-sm font-semibold">
          Inquiries
        </Link>
        <Link href="/itineraries/new" className="border-2 border-[#1C2416] bg-[#E2B15A] px-4 py-2 text-sm font-bold uppercase">
          New itinerary
        </Link>
      </div>
      {!ready ? <p className="text-sm text-[#6c757d]">Loading itineraries.</p> : null}
      {ready ? (
        <article className="overflow-hidden bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
              <tr>
                <th className="px-5 py-3 font-medium">Itinerary</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Invoice</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#e5e7eb]">
                  <td className="px-5 py-3">
                    <Link href={`/itineraries/${row.id}`} className="font-medium text-[#1F4D3A]">
                      {row.title}
                    </Link>
                    <div className="text-xs text-[#98a6ad]">
                      {row.starts_on} to {row.ends_on}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div>{row.customer_name}</div>
                    <div className="text-xs text-[#98a6ad]">{row.customer_email}</div>
                  </td>
                  <td className="px-5 py-3">{row.invoice_number || "—"}</td>
                  <td className="px-5 py-3">{row.currency ? `${row.currency} ${row.amount_due}` : "—"}</td>
                  <td className="px-5 py-3 font-semibold uppercase">{row.status}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-[#6c757d]" colSpan={5}>
                    No itineraries yet. Start from a package, an inquiry, or a blank plan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      ) : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
