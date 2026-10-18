"use client";

import { useState, type FormEvent } from "react";
import { Mark } from "./mark";

export function ComingSoon() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [joined, setJoined] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setNotice("Enter the email where we should write to you.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const response = await fetch("/v1/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setNotice(body?.error?.message || "We could not save your place. Try again.");
        return;
      }
      setJoined(true);
    } catch {
      setNotice("We could not save your place. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#1F4D3A] px-4 py-16 text-[#F6F1E7]">
      <section className="w-full max-w-lg">
        <Mark tone="cream" className="h-12 w-14" />
        <h1 className="mt-8 font-mono text-5xl font-medium tracking-tight sm:text-6xl">Coming soon</h1>
        <p className="mt-6 max-w-md text-lg leading-8">
          Tour operators will send the itinerary. Tourists will pay by card in USD. Join the waitlist and we will write when VirungaPay opens.
        </p>
        {joined ? (
          <p role="status" className="mt-8 border-2 border-[#F6F1E7] px-4 py-4 text-sm font-bold uppercase tracking-wide">
            You&apos;re on the list.
          </p>
        ) : (
          <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="waitlist-email">
              Email
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="h-12 min-w-0 flex-1 border-2 border-[#F6F1E7] bg-white px-3 text-[#1C2416] outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase tracking-wide text-[#1C2416] disabled:opacity-60"
            >
              {pending ? "Joining" : "Join the waitlist"}
            </button>
          </form>
        )}
        <p role="status" className="mt-3 min-h-5 text-sm">
          {notice}
        </p>
      </section>
    </main>
  );
}
