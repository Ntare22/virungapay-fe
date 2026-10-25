"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Mark } from "./mark";

const phoneApp = process.env.NEXT_PUBLIC_PWA_URL ?? "http://localhost:3001";

export function AcceptInvite({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState(token ? "" : "This invite link is missing a token.");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setNotice("Use a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setNotice("Passwords do not match.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const response = await fetch("/v1/auth/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setNotice(body?.error?.message || "This invite link is invalid or expired.");
        setPending(false);
        return;
      }
      setReady(true);
    } catch {
      setNotice("Could not reach VirungaPay. Check that the API is running.");
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
        <div className="relative z-10 max-w-md py-10">
          <h1 className="font-mono text-4xl leading-[1.05] font-medium sm:text-5xl">Accept Your Invite</h1>
          <p className="relative mt-8 pt-6 text-base font-semibold">
            <span className="caret absolute top-0 left-0" />
            Choose A Password, then sign in on the VirungaPay phone app.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/80">East Africa</p>
      </section>
      <section className="flex min-h-0 flex-1 flex-col overflow-auto bg-white px-6 py-6 sm:px-10 lg:w-1/2 lg:px-14">
        <header className="flex items-center justify-between">
          <Link href="/" className="font-mono text-sm text-[#1C2416]">
            Back Home
          </Link>
          <Link href="/login" className="font-mono text-sm font-bold text-[#1F4D3A]">
            Login
          </Link>
        </header>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          {ready ? (
            <div className="border-2 border-[#1C2416] bg-white p-8 text-center shadow-[6px_6px_0_#E2B15A]">
              <h2 className="font-mono text-3xl font-medium">Account Ready</h2>
              <p className="mt-4 text-sm">Your password is set. Sign in on the VirungaPay phone app.</p>
              <a
                href={phoneApp}
                className="mt-6 inline-flex h-12 items-center border-2 border-[#1C2416] bg-[#E2B15A] px-8 text-sm font-bold uppercase text-[#1C2416]"
              >
                Open The Phone App
              </a>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="border-2 border-[#1C2416] bg-white p-8 shadow-[6px_6px_0_#E2B15A]" noValidate>
              <h2 className="font-mono text-3xl font-medium">Choose A Password</h2>
              <p className="mt-3 text-sm">This invite confirms your email and opens your account.</p>
              <label className="mt-6 block text-sm font-semibold" htmlFor="invite-password">
                Password
                <input
                  id="invite-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 text-base font-normal outline-none"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold" htmlFor="invite-confirm">
                Confirm Password
                <input
                  id="invite-confirm"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full border-2 border-[#1C2416] px-3 text-base font-normal outline-none"
                />
              </label>
              {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
              <button type="submit" disabled={pending || !token} className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] px-6 text-sm font-bold uppercase disabled:opacity-60">
                {pending ? "Please Wait" : "Accept Invite"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
