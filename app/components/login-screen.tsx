"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { adminForgotPassword, adminLogin, forgotPassword, login, saveSession } from "../lib/api";
import { Mark } from "./mark";

const languages = [
  { code: "EN", label: "English" },
  { code: "FR", label: "Français" },
  { code: "SW", label: "Kiswahili" },
] as const;

const points = [
  {
    title: "Build & Send",
    text: "Draft Your Safari Or Tour Itinerary And Send It Directly To Your Tourist Client Or Partner DMC Through VirungaPay.",
  },
  {
    title: "Client Pays Instantly",
    text: "The Tourist Views The Itinerary And Pays Securely Using Their International Credit Or Debit Card.",
  },
  {
    title: "Automatic Reconciliation & Payout",
    text: "Your USD Wallet Is Credited, And Your Pre-Configured Back-End Splits Instantly Dispatch UGX To Your Local Drivers' Mobile Money Accounts.",
  },
];

export function LoginScreen({ audience = "operator" }: { audience?: "operator" | "admin" }) {
  const staff = audience === "admin";
  const [language, setLanguage] = useState<(typeof languages)[number]["code"]>("EN");
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@") || password.length < 8) {
      setNotice("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const signedIn = staff
        ? { session: await adminLogin(trimmed, password), audience: "admin" as const }
        : await login(trimmed, password);
      saveSession(signedIn.session, signedIn.audience);
      router.push(signedIn.audience === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setNotice("Enter a valid email.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const result = staff ? await adminForgotPassword(trimmed) : await forgotPassword(trimmed);
      setNotice(result.message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#F6F1E7] text-[#1C2416] lg:flex-row">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#1F4D3A] px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-0 lg:w-1/2 lg:px-14 lg:py-10">
        <Link href="/" className="relative z-10 flex items-center gap-2 font-mono text-lg text-white">
          <Mark tone="cream" />
          VirungaPay
        </Link>
        <div className="relative z-10 max-w-lg py-10">
          <h1 className="font-mono text-4xl leading-[1.05] font-medium sm:text-5xl">VirungaTrip Wallet</h1>
          <ul className="mt-8 space-y-5">
            {points.map((point) => (
              <li key={point.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center border-2 border-[#1C2416] bg-[#E2B15A] text-sm text-[#1C2416]">
                  ✓
                </span>
                <span>
                  <span className="block font-bold">{point.title}</span>
                  <span className="mt-1 block text-sm font-normal leading-relaxed">{point.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-sm text-white/80">East Africa</p>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-auto bg-white px-6 py-6 sm:px-10 lg:w-1/2 lg:px-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-[#1C2416] hover:text-[#1F4D3A]">
            Back Home
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 border-2 border-[#1C2416] bg-white px-3 py-1.5 font-mono text-sm text-[#1C2416] shadow-[3px_3px_0_#E2B15A]"
            >
              {language}
              <Chevron />
            </button>
            {menuOpen ? (
              <ul
                role="listbox"
                aria-label="Language"
                className="absolute right-0 z-10 mt-2 w-44 border-2 border-[#1C2416] bg-white shadow-[3px_3px_0_#1F4D3A]"
              >
                {languages.map((item) => (
                  <li key={item.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={language === item.code}
                      onClick={() => {
                        setLanguage(item.code);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#F6F1E7]"
                    >
                      {item.label}
                      <span className="font-mono text-xs text-[#1C2416]/60">{item.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          <h2 className="text-center font-mono text-4xl font-medium text-[#1C2416] sm:text-5xl">
            {resetting ? "Reset Password" : "Login"}
          </h2>
          <p className="mt-3 text-center text-sm">
            {resetting ? "We’ll Email You A Reset Link" : staff ? "VirungaPay Staff" : "Operators, Guides, And Drivers"}
          </p>
          <p className="mt-2 text-center font-mono text-xs tracking-[0.14em] text-[#1F4D3A] uppercase">
            USD · UGX
          </p>

          {resetting ? (
            <form className="mt-8 flex flex-col" onSubmit={onForgot} noValidate>
              <label htmlFor={emailId} className="sr-only">
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
              />
              <button
                type="submit"
                disabled={pending}
                className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416] disabled:opacity-60"
              >
                {pending ? "Please Wait" : "Send Link"}
              </button>
              <p role="status" className="mt-3 min-h-5 text-center text-[13px]">
                {notice}
              </p>
              <p className="mt-2 text-center text-[13px]">
                <button
                  type="button"
                  onClick={() => {
                    setResetting(false);
                    setNotice("");
                  }}
                  className="font-bold text-[#1F4D3A]"
                >
                  Back To Login
                </button>
              </p>
            </form>
          ) : (
          <form className="mt-8 flex flex-col" onSubmit={onSubmit} noValidate>
            <label htmlFor={emailId} className="sr-only">
              Email
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
            />
            <label htmlFor={passwordId} className="sr-only">
              Password
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-3 h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setResetting(true);
                  setNotice("");
                }}
                className="text-[13px] font-bold text-[#1F4D3A]"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416] disabled:opacity-60"
            >
              {pending ? "Please Wait" : "Go"}
            </button>

            <p role="status" className="mt-3 min-h-5 text-center text-[13px]">
              {notice}
            </p>

            {staff ? (
              <p className="mt-2 text-center text-[13px]">
                <Link href="/login" className="font-bold text-[#1F4D3A]">
                  Operator Login
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-center text-[13px]">
                Don&apos;t Have An Account?{" "}
                <Link href="/signup" className="font-bold text-[#1F4D3A]">
                  Sign Up
                </Link>
              </p>
            )}
          </form>
          )}
        </div>

        <div className="flex justify-center gap-3 pb-2">
          <SocialLink label="Telegram">
            <TelegramIcon />
          </SocialLink>
          <SocialLink label="LinkedIn">
            <LinkedInIcon />
          </SocialLink>
          <SocialLink label="Facebook">
            <FacebookIcon />
          </SocialLink>
          <SocialLink label="Instagram">
            <InstagramIcon />
          </SocialLink>
        </div>
      </section>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6.5 8 10.5 12 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SocialLink({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-9 place-items-center border-2 border-[#1C2416] text-[#1C2416] hover:bg-[#F6F1E7]"
    >
      {children}
    </button>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M14.9 2.3 12.7 13c-.16.72-.6.9-1.22.56l-3.36-2.48-1.62 1.56c-.18.18-.33.33-.68.33l.24-3.44 6.26-5.66c.27-.24-.06-.38-.42-.14L3.9 8.9.56 7.86c-.72-.22-.74-.72.16-1.06L13.8 1.4c.6-.22 1.12.14 1.1.9Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V24h-4V8.5zM8.5 8.5h3.8v2.1h.06c.53-1 1.84-2.1 3.78-2.1 4.04 0 4.78 2.66 4.78 6.1V24h-4v-7.7c0-1.84-.04-4.2-2.56-4.2-2.56 0-2.96 2-2.96 4.06V24h-4V8.5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M15.1 8.5H13V7.1c0-.6.4-.7.7-.7H15V4h-2.1C10.4 4 10 5.9 10 7v1.5H8.5V11H10v9h3v-9h2l.1-2.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.4 7.1a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
    </svg>
  );
}
