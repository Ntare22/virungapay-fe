"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Mark } from "./mark";

const nav = [
  { href: "#flow", label: "How It Works" },
  { href: "#wallets", label: "Wallets" },
  { href: "#splits", label: "Splits" },
  { href: "#faq", label: "FAQ" },
];

const steps = [
  {
    title: "The Operator Sends The Itinerary",
    text: "Dates, stays, the driver, and the guide go in one itinerary. The tourist opens it and sees what they are paying for.",
  },
  {
    title: "The Tourist Pays By Card",
    text: "They pay the deposit in USD. The money lands in a VirungaPass wallet, tied to that itinerary.",
  },
  {
    title: "The Operator Pays The Team",
    text: "The same money shows up in the operator’s VirungaTrip wallet. From there they pay the lodge, driver, and guide.",
  },
];

const tripCards = [
  {
    label: "Itinerary",
    title: "Sent To The Tourist",
    rows: [
      ["Trip", "4-Day Gorilla Trek"],
      ["Includes", "Lodge, Driver, Guide"],
      ["Next", "Tourist Pays"],
    ],
    note: "They Pay From This Itinerary",
  },
  {
    label: "VirungaPass",
    title: "Card Payment",
    rows: [
      ["From", "Tourist · Card"],
      ["Currency", "USD 1,240.00"],
      ["Wallet", "VirungaPass"],
    ],
    note: "USD",
  },
  {
    label: "VirungaTrip",
    title: "Operator Wallet",
    rows: [
      ["To", "Operator"],
      ["Holds", "The Tour Deposit"],
      ["Next", "Pay The Team"],
    ],
    note: "One Balance, Many People",
  },
  {
    label: "Payments",
    title: "Down The Chain",
    rows: [
      ["Lodge", "Stay"],
      ["Driver", "Transport"],
      ["Fuel", "Diesel"],
      ["Guide", "Day Rate"],
    ],
    note: "Paid From The Trip",
  },
  {
    label: "Park Fees",
    title: "Still Paid In Cash",
    rows: [
      ["Stays", "Cash"],
      ["Noted", "With A Receipt"],
      ["Shown", "On The Trip"],
    ],
    note: "Receipt Attached",
  },
];

const quotes = [
  {
    quote:
      "The deposit arrives before the group lands. I split the lodge and the driver from the same wallet instead of chasing mobile-money threads.",
    name: "Amina N.",
    role: "Tour Operator",
  },
  {
    quote:
      "Park gates still take cash. I note the payment, attach the receipt, and the trip still shows where the money went.",
    name: "Peter O.",
    role: "Driver",
  },
  {
    quote:
      "Guests scan the badge at the end of the walk. The tip shows up next to my day rate.",
    name: "Grace K.",
    role: "Guide",
  },
];

const faqs = [
  {
    q: "How Does A Tourist Pay?",
    a: "The operator sends an itinerary. The tourist opens it and pays the deposit by card in USD.",
  },
  {
    q: "Where Does The Money Go?",
    a: "The payment lands in a VirungaPass wallet. The operator then sees it in a VirungaTrip wallet and pays the people on the trip.",
  },
  {
    q: "Who Can The Operator Pay?",
    a: "Lodges, Drivers, And Guides, From The VirungaTrip Balance.",
  },
  {
    q: "What About Park Fees?",
    a: "Park fees mostly stay in cash. They are written down with a receipt, so the trip still shows where that money went.",
  },
  {
    q: "How Do Guide/Driver Tips Work?",
    a: "A guide carries a QR badge. A guest scans it and the tip is recorded against that guide.",
  },
  {
    q: "How Does VirungaPay Earn?",
    a: "From changing USD for the trip, and a small fee on each payment. Part of that fee pays for health cover for AUTO and UHOA members.",
  },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [card, setCard] = useState(0);
  const [quote, setQuote] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [notice, setNotice] = useState("");

  const visibleCards = [0, 1, 2].map(
    (offset) => tripCards[(card + offset) % tripCards.length],
  );
  const activeQuote = quotes[quote];

  function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "").trim();
    if (!email.includes("@") || message.length < 8) {
      setNotice("Add a valid email and a short message.");
      return;
    }
    setNotice("Thanks. This demo keeps your note on the page and does not send it.");
    event.currentTarget.reset();
  }

  return (
    <div className="bg-white text-[#1C2416]">
      <header className="sticky top-0 z-40 border-b-2 border-[#1C2416] bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-6 px-4 lg:h-[88px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-lg font-medium text-[#1C2416]">
            <Mark />
            VirungaPay
          </Link>
          <nav className="ml-auto hidden items-center gap-8 font-mono text-sm text-[#1C2416] lg:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-[#1F4D3A]">
                {item.label}
              </a>
            ))}
          </nav>
          <Link
            href="/login"
            className="ml-auto hidden h-12 items-center border-2 border-[#1C2416] bg-[#E2B15A] px-5 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416] lg:ml-0 lg:inline-flex"
          >
            Login
          </Link>
          <button
            type="button"
            className="ml-auto font-mono text-sm text-[#1F4D3A] lg:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen ? (
          <div className="absolute inset-x-0 top-full border-b-2 border-[#1C2416] bg-white px-4 py-2 shadow-[0_8px_0_rgba(28,36,22,0.08)] lg:hidden">
            <div className="flex flex-col font-mono text-sm">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="border-b border-[#1C2416]/15 py-3"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link href="/login" className="py-3 text-[#1F4D3A]" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden bg-[#1F4D3A] text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:py-24">
            <div>
              <h1 className="max-w-xl font-mono text-2xl leading-tight font-medium sm:text-4xl">
                <span className="block">Send Itineraries.</span>
                <span className="block">Accept Card Payments.</span>
                <span className="block">Split Vendor Payouts Instantly.</span>
              </h1>
              <p className="relative mt-8 max-w-xl pt-6 text-base font-normal leading-relaxed sm:text-lg">
                <span className="caret absolute top-0 left-0" />
                The all-in-one payment gateway for East African Tour Operators and DMCs. Turn your itineraries into direct-payment links, accept international credit cards directly into your USD wallet, and instantly split local vendor payments to VirungaPay mobile wallets.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center border-2 border-[#1C2416] bg-[#E2B15A] px-8 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
                >
                  Try The Demo
                </Link>
                <a
                  href="#flow"
                  className="inline-flex h-12 items-center justify-center border-2 border-white px-8 text-sm font-bold uppercase"
                >
                  See The Flow
                </a>
              </div>
            </div>
            <FlowCard />
          </div>
        </section>

        <section id="flow" className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:px-6 lg:py-24">
          <div>
            <h2 className="font-mono text-3xl leading-tight font-medium text-[#1C2416] sm:text-4xl">
              Built For East Africa’s Tourism Chain
            </h2>
            <p className="relative mt-6 max-w-md pt-6 text-base">
              <span className="caret absolute top-0 left-0" />
              Send the itinerary, receive the payment, then pay everyone on the trip from one place.
            </p>
            <ul className="mt-8 flex flex-col gap-6">
              {steps.map((step) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-16 shrink-0 place-items-center rounded-full border-2 border-[#1C2416] text-[#1F4D3A]">
                    <ChainIcon />
                  </span>
                  <div>
                    <h3 className="font-mono text-lg text-[#1C2416]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6">{step.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#wallets"
                className="inline-flex h-12 items-center justify-center border-2 border-[#1C2416] bg-white px-6 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
              >
                View Wallets
              </a>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -bottom-6 -left-6 hidden h-40 w-40 rotate-12 border-2 border-[#E2B15A] lg:block" />
            <div className="relative border-2 border-[#1C2416] bg-[#F6F1E7] p-6 shadow-[8px_8px_0_#1F4D3A]">
              <p className="font-mono text-xs tracking-[0.2em] text-[#1F4D3A] uppercase">One Trip</p>
              <ol className="mt-6 space-y-4">
                {[
                  ["01", "Itinerary", "Operator Sends It To The Tourist"],
                  ["02", "Card Payment", "USD Into VirungaPass"],
                  ["03", "Trip Wallet", "Operator Sees It In VirungaTrip"],
                  ["04", "Team Payments", "Lodge, Driver, Fuel, Guide"],
                  ["05", "Park Fee", "Cash, With A Receipt"],
                  ["06", "Guide/Driver Tip", "Guest Scans The QR Badge"],
                ].map(([n, title, text]) => (
                  <li key={n} className="grid grid-cols-[auto_1fr] gap-4 border-b border-[#1C2416]/15 pb-4 last:border-0">
                    <span className="font-mono text-[#1F4D3A]">{n}</span>
                    <div>
                      <p className="font-mono text-[#1C2416]">{title}</p>
                      <p className="text-sm">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="wallets" className="bg-[#1F4D3A] py-16 text-white lg:py-24">
          <div className="mx-auto max-w-6xl px-4 lg:px-6">
            <h2 className="text-center font-mono text-3xl font-medium sm:text-4xl">
              From Itinerary To Payment
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-white/85">
              The tourist pays from the itinerary. The operator pays the team. Park fees stay in cash, with a receipt. Guide or Driver tips come through a QR badge.
            </p>
            <div className="relative mt-12">
              <button
                type="button"
                aria-label="Previous Trip Card"
                onClick={() => setCard((current) => (current === 0 ? tripCards.length - 1 : current - 1))}
                className="absolute top-1/2 left-0 z-10 hidden -translate-y-1/2 text-3xl hover:text-[#E2B15A] sm:block"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next Trip Card"
                onClick={() => setCard((current) => (current + 1) % tripCards.length)}
                className="absolute top-1/2 right-0 z-10 hidden -translate-y-1/2 text-3xl hover:text-[#E2B15A] sm:block"
              >
                ›
              </button>
              <div className="grid gap-4 sm:grid-cols-3 sm:px-12">
                {visibleCards.map((item) => (
                  <article key={item.label} className="border-2 border-[#1C2416] bg-white p-5 text-[#1C2416] shadow-[6px_6px_0_#E2B15A]">
                    <p className="font-mono text-xs tracking-[0.16em] text-[#1F4D3A] uppercase">{item.label}</p>
                    <h3 className="mt-2 font-mono text-xl">{item.title}</h3>
                    <dl className="mt-4 space-y-2 text-sm">
                      {item.rows.map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 border-b border-[#1C2416]/10 pb-2">
                          <dt className="text-[#1C2416]/70">{key}</dt>
                          <dd className="text-right font-semibold">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 text-sm font-bold text-[#1F4D3A]">{item.note}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="splits" className="bg-[#F6F1E7] py-16 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center lg:px-6">
            <h2 className="font-mono text-3xl leading-tight font-medium text-[#1C2416] sm:text-5xl">
              Operators, Guides, And Drivers On{" "}
              <span className="bg-[#E2B15A] px-1">One Trip</span>
            </h2>
            <ul className="mt-8 flex flex-col items-center gap-3 font-bold text-[#1C2416] sm:flex-row sm:justify-center sm:gap-10">
              {["Itinerary The Tourist Can Pay", "USD Card Payments", "Park Fees Noted With A Receipt"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#1F4D3A]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mx-auto mt-8 inline-flex h-12 items-center border-2 border-[#1C2416] bg-[#E2B15A] px-8 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-mono text-3xl font-medium text-[#1C2416] sm:text-4xl">What The Chain Says</h2>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous Quote"
                onClick={() => setQuote((current) => (current === 0 ? quotes.length - 1 : current - 1))}
                className="grid size-11 place-items-center border-2 border-[#1C2416] hover:bg-[#F6F1E7]"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next Quote"
                onClick={() => setQuote((current) => (current + 1) % quotes.length)}
                className="grid size-11 place-items-center border-2 border-[#1C2416] hover:bg-[#F6F1E7]"
              >
                ›
              </button>
            </div>
          </div>
          <blockquote className="mt-8 border-2 border-[#1C2416] p-6 shadow-[8px_8px_0_#1F4D3A] sm:p-10">
            <p className="text-lg leading-8">{activeQuote.quote}</p>
            <footer className="mt-6 font-mono text-[#1C2416]">
              {activeQuote.name}
              <span className="mt-1 block text-sm font-sans font-normal text-[#1C2416]">{activeQuote.role}</span>
            </footer>
          </blockquote>
        </section>

        <section id="faq" className="border-t-2 border-[#1C2416] bg-[#F6F1E7]">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:px-6 lg:py-24">
            <div>
              <h2 className="font-mono text-3xl font-medium text-[#1C2416]">Ask Us Any</h2>
              <p className="relative mt-6 max-w-md pt-6">
                <span className="caret absolute top-0 left-0" />
                Questions about itineraries, card payments, park fees, or the guide badge.
              </p>
              <form className="mt-8 flex flex-col gap-3" onSubmit={onAsk}>
                <label className="sr-only" htmlFor="ask-name">
                  Name
                </label>
                <input
                  id="ask-name"
                  name="name"
                  placeholder="Name"
                  className="h-12 border-2 border-[#1C2416] bg-white px-3 outline-none"
                />
                <label className="sr-only" htmlFor="ask-email">
                  Email
                </label>
                <input
                  id="ask-email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="h-12 border-2 border-[#1C2416] bg-white px-3 outline-none"
                />
                <label className="sr-only" htmlFor="ask-message">
                  Message
                </label>
                <textarea
                  id="ask-message"
                  name="message"
                  placeholder="Message"
                  rows={4}
                  className="border-2 border-[#1C2416] bg-white px-3 py-3 outline-none"
                />
                <button
                  type="submit"
                  className="h-12 border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
                >
                  Send
                </button>
                <p role="status" className="min-h-5 text-sm">
                  {notice}
                </p>
              </form>
            </div>
            <div className="border-2 border-[#1C2416] bg-white">
              {faqs.map((item, index) => {
                const open = openFaq === index;
                return (
                  <div key={item.q} className="border-b-2 border-[#1C2416] last:border-b-0">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? -1 : index)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-mono text-[#1C2416]"
                    >
                      {item.q}
                      <span className="text-[#1F4D3A]">{open ? "–" : "+"}</span>
                    </button>
                    {open ? <p className="px-5 pb-5 text-sm leading-6">{item.a}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-[#1C2416]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row lg:items-start lg:justify-between lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-mono text-2xl text-[#1C2416]">
            <Mark />
            VirungaPay
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-[#1F4D3A]">
                {item.label}
              </a>
            ))}
            <Link href="/login" className="hover:text-[#1F4D3A]">
              Login
            </Link>
          </nav>
          <div className="text-sm">
            <p>hello@virungapay.demo</p>
            <p className="mt-1">East Africa</p>
          </div>
        </div>
        <p className="border-t border-[#1C2416]/15 px-4 py-4 text-center text-xs text-[#1C2416]/70">
          This week’s build is a demo.
        </p>
      </footer>
    </div>
  );
}

function ChainIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 7h6a3 3 0 0 1 0 6H9M15 17H9a3 3 0 0 1 0-6h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FlowCard() {
  return (
    <div className="border-2 border-[#1C2416] bg-white p-5 text-[#1C2416] shadow-[10px_10px_0_#E2B15A]">
      <div className="flex items-center justify-between border-b-2 border-[#1C2416] pb-3">
        <p className="font-mono text-sm">Gorilla Trek · 4 Days</p>
        <p className="text-xs font-bold text-[#1F4D3A]">DEMO</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-2 border-[#1C2416] p-3">
          <p className="text-xs uppercase">VirungaPass</p>
          <p className="mt-1 font-mono text-2xl">USD 1,240</p>
          <p className="text-xs">Paid From The Itinerary</p>
        </div>
        <div className="border-2 border-[#1C2416] bg-[#F6F1E7] p-3">
          <p className="text-xs uppercase">VirungaTrip</p>
          <p className="mt-1 font-mono text-2xl">Ready</p>
          <p className="text-xs">Operator Wallet</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {[
          ["Lodge", "Stay"],
          ["Driver", "Transport"],
          ["Fuel", "Diesel"],
          ["Guide", "Day Rate + QR Tip"],
          ["Park", "Cash · Receipt"],
        ].map(([name, detail]) => (
          <li key={name} className="flex items-center justify-between border-b border-[#1C2416]/10 pb-2">
            <span className="font-semibold">{name}</span>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
