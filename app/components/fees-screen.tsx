"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listFees, readAdminSession, readSession, saveFee, type FeeSchedule } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

const kinds = [
  { id: "collection", label: "Collection" },
  { id: "withdraw", label: "Withdrawal" },
  { id: "p2p", label: "Tip" },
];

type FeeMode = "percent" | "fixed" | "both";

function feeKey(fee: FeeSchedule) {
  return `${fee.kind}-${fee.currency}`;
}

function modeOf(fee: FeeSchedule): FeeMode {
  const flat = Number(fee.flat);
  const hasFlat = Number.isFinite(flat) && flat > 0;
  const hasPercent = fee.markup_bps > 0;
  if (hasFlat && hasPercent) return "both";
  if (hasFlat) return "fixed";
  return "percent";
}

export function FeesScreen() {
  const router = useRouter();
  const [fees, setFees] = useState<FeeSchedule[]>([]);
  const [modes, setModes] = useState<Record<string, FeeMode>>({});
  const [notice, setNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (readSession()?.audience === "operator") {
      router.replace("/tariffs");
      return;
    }
    if (!readAdminSession()) {
      router.replace("/admin/login");
      return;
    }
    let cancelled = false;
    listFees()
      .then((list) => {
        if (cancelled) return;
        setFees(list.fees);
        setModes(Object.fromEntries(list.fees.map((fee) => [feeKey(fee), modeOf(fee)])));
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

  function update(kind: string, currency: string, patch: Partial<FeeSchedule>) {
    setFees((current) => current.map((fee) => (fee.kind === kind && fee.currency === currency ? { ...fee, ...patch } : fee)));
  }

  async function save(fee: FeeSchedule) {
    const mode = modes[feeKey(fee)] ?? modeOf(fee);
    const payload: FeeSchedule = {
      ...fee,
      flat: mode === "percent" ? "0" : fee.flat,
      markup_bps: mode === "fixed" ? 0 : fee.markup_bps,
    };
    setBusy(feeKey(fee));
    setNotice("");
    try {
      const saved = await saveFee(payload);
      update(saved.kind, saved.currency, saved);
      setModes((current) => ({ ...current, [feeKey(saved)]: modeOf(saved) }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <DashboardShell title="Transaction fees" active="Fees" audience="admin">
      <p className="mb-4 max-w-2xl text-sm text-[#6c757d]">
        These fees are separate from the day’s exchange rate. Charge a percentage of the transaction, a fixed amount, or both. A basis point is 0.01%.
      </p>
      {!ready ? <p className="text-sm text-[#6c757d]">Loading fee schedules.</p> : null}
      {ready
        ? kinds.map((kind) => (
            <article key={kind.id} className="mb-4 overflow-hidden bg-white shadow-sm">
              <div className="border-b border-[#e5e7eb] px-5 py-4">
                <h2 className="text-base font-medium">{kind.label}</h2>
              </div>
              <table className="min-w-full text-sm">
                <thead className="border-b border-[#e5e7eb] bg-[#f8f9fa] text-left text-[#6c757d]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Currency</th>
                    <th className="px-5 py-3 font-medium">Charge</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fees
                    .filter((fee) => fee.kind === kind.id)
                    .map((fee) => {
                      const mode = modes[feeKey(fee)] ?? modeOf(fee);
                      return (
                        <tr key={fee.currency} className="border-b border-[#e5e7eb]">
                          <td className="px-5 py-3 font-semibold">{fee.currency}</td>
                          <td className="px-5 py-3">
                            <select
                              value={mode}
                              onChange={(event) => setModes((current) => ({ ...current, [feeKey(fee)]: event.target.value as FeeMode }))}
                              className="h-10 border-2 border-[#1B2129] bg-white px-2"
                            >
                              <option value="percent">Percentage</option>
                              <option value="fixed">Fixed amount</option>
                              <option value="both">Fixed plus percentage</option>
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {mode !== "fixed" ? (
                                <label className="flex items-center gap-2">
                                  <input
                                    value={fee.markup_bps}
                                    onChange={(event) => update(fee.kind, fee.currency, { markup_bps: Number(event.target.value) })}
                                    className="h-10 w-24 border-2 border-[#1B2129] px-2"
                                    aria-label={`${fee.currency} basis points`}
                                  />
                                  <span className="text-[#6c757d]">basis points</span>
                                </label>
                              ) : null}
                              {mode !== "percent" ? (
                                <label className="flex items-center gap-2">
                                  <input
                                    value={fee.flat}
                                    onChange={(event) => update(fee.kind, fee.currency, { flat: event.target.value })}
                                    className="h-10 w-28 border-2 border-[#1B2129] px-2"
                                    aria-label={`${fee.currency} fixed amount`}
                                  />
                                  <span className="text-[#6c757d]">{fee.currency}</span>
                                </label>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              disabled={busy === feeKey(fee)}
                              onClick={() => save(fee)}
                              className="font-semibold text-[#2A2AFF] disabled:opacity-40"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </article>
          ))
        : null}
      {notice ? <p className="text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}
