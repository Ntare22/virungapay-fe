"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, readAdminSession, readSession, saveTariff, staffTariff, todayTariff, type Tariff } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";

export function TariffScreen({ audience }: { audience: "operator" | "admin" }) {
  const router = useRouter();
  const staff = audience === "admin";
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (staff) {
      if (readSession()?.audience === "operator") {
        router.replace("/tariffs");
        return;
      }
      if (!readAdminSession()) {
        router.replace("/admin/login");
        return;
      }
    } else {
      const saved = readSession();
      if (!saved) {
        router.replace("/login");
        return;
      }
      if (saved.audience === "admin") {
        router.replace("/admin/tariffs");
        return;
      }
    }
    let cancelled = false;
    const load = staff ? staffTariff() : todayTariff();
    load
      .then((current) => {
        if (!cancelled) setTariffs(current.tariffs ?? []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === "tariff_not_set") return;
        setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [router, staff]);

  return (
    <DashboardShell title="Tariffs" active="Tariffs" audience={audience}>
      {!ready ? <p className="text-sm text-[#6c757d]">Loading the exchange rate.</p> : null}
      {ready ? <TariffBoard tariffs={tariffs} staff={staff} onSaved={(saved) => setTariffs((current) => upsertTariff(current, saved))} /> : null}
      {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
    </DashboardShell>
  );
}

const pairs = ["USD/UGX"];

function TariffBoard({
  tariffs,
  staff,
  onSaved,
}: {
  tariffs: Tariff[];
  staff: boolean;
  onSaved: (tariff: Tariff) => void;
}) {
  const [pair, setPair] = useState(pairs[0]);
  const [quotation, setQuotation] = useState("");
  const [markup, setMarkup] = useState("0");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const basis = Number(markup);
    if (!quotation.trim() || !Number.isFinite(basis) || basis < 0 || !Number.isInteger(basis)) {
      setNotice("Enter today’s quotation and a whole-number markup.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      onSaved(await saveTariff(pair, quotation.trim(), basis));
      setQuotation("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="grid gap-4">
        {staff ? (
          <p className="text-sm text-[#6c757d]">
            A basis point is 0.01%. 100 basis points is 1%. The customer rate is the quotation plus that markup, and it stays in place until a new rate is saved.
          </p>
        ) : null}
        {pairs.map((name) => {
          const tariff = tariffs.find((item) => item.pair === name);
          return (
            <article key={name} className="bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-[#98a6ad]">{name}</p>
              <p className="mt-1 text-3xl font-semibold">{tariff ? trimRate(tariff.customer_rate) : "—"}</p>
              <p className="mt-4 text-sm text-[#6c757d]">
                {tariff
                  ? staff
                    ? `Quotation ${trimRate(tariff.integrator_rate)} plus ${tariff.markup_bps} basis points. Set on ${setOn(tariff.quote_on)}.`
                    : `Last Updated ${setOn(tariff.quote_on)}`
                  : staff
                    ? "No exchange rate has been set."
                    : "No Rate Has Been Set"}
              </p>
            </article>
          );
        })}
      </div>
      {staff ? (
        <form onSubmit={onSubmit} className="h-fit bg-white p-6 shadow-sm" noValidate>
          <h2 className="text-lg font-medium">Set today’s tariff</h2>
          <label className="mt-4 block text-sm font-semibold" htmlFor="pair">
            Pair
          </label>
          <select
            id="pair"
            value={pair}
            onChange={(event) => setPair(event.target.value)}
            className="mt-2 h-12 w-full border-2 border-[#1C2416] bg-white px-3 outline-none"
          >
            {pairs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <label className="mt-4 block text-sm font-semibold" htmlFor="quotation">
            Quotation
          </label>
          <input
            id="quotation"
            inputMode="decimal"
            value={quotation}
            onChange={(event) => setQuotation(event.target.value)}
            className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none"
          />
          <label className="mt-4 block text-sm font-semibold" htmlFor="markup">
            Markup in basis points
          </label>
          <input
            id="markup"
            inputMode="numeric"
            value={markup}
            onChange={(event) => setMarkup(event.target.value)}
            className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 outline-none"
          />
          <p className="mt-2 text-sm text-[#6c757d]">50 basis points adds 0.5% to the quotation. 100 adds 1%.</p>
          <button
            type="submit"
            disabled={pending}
            className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase disabled:opacity-60"
          >
            {pending ? "Please wait" : "Save tariff"}
          </button>
          {notice ? <p className="mt-3 text-sm">{notice}</p> : null}
        </form>
      ) : null}
    </section>
  );
}

function upsertTariff(current: Tariff[], saved: Tariff) {
  const next = current.filter((item) => item.pair !== saved.pair);
  next.push(saved);
  return pairs.map((name) => next.find((item) => item.pair === name)).filter((item): item is Tariff => Boolean(item));
}

function setOn(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function trimRate(value: string) {
  return value.replace(/\.?0+$/, "");
}
