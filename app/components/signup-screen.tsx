"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { registerOperator } from "../lib/api";
import { Mark } from "./mark";
import { internationalPhone, PhoneField, type CountryCode } from "./phone-field";

const points = [
  "Send Itineraries Tourists Can Pay",
  "Take Card Payments In USD",
  "Pay The Lodge, Driver, And Guide",
];

export function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("+256");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const [pending, setPending] = useState(false);
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setNotice("Enter a first name and a last name.");
      return;
    }
    if (!email.trim().includes("@")) {
      setNotice("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setNotice("Use a password of at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setNotice("Passwords do not match.");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const result = await registerOperator({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: internationalPhone(countryCode, phone),
        password,
      });
      setCreatedEmail(result.user.email);
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
        <div className="relative z-10 max-w-md py-10">
          <h1 className="font-mono text-4xl leading-[1.05] font-medium sm:text-5xl">
            Open An Operator Account.
          </h1>
          <p className="relative mt-8 pt-6 text-base font-semibold">
            <span className="caret absolute top-0 left-0" />
            For tour operators in East Africa. Send the itinerary, then let the tourist pay in USD.
          </p>
          <ul className="mt-8 space-y-3 font-bold">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center border-2 border-[#1C2416] bg-[#E2B15A] text-sm text-[#1C2416]">
                  ✓
                </span>
                {point}
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
          <Link href="/login" className="font-mono text-sm font-bold text-[#1F4D3A]">
            Login
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          {createdEmail ? (
            <div className="border-2 border-[#1C2416] bg-white p-8 text-center shadow-[6px_6px_0_#E2B15A]">
              <h2 className="font-mono text-3xl font-medium text-[#1C2416]">Welcome</h2>
              <p className="mt-4 text-sm">
                We sent an email to {createdEmail}. Verify it before you sign in.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-12 items-center border-2 border-[#1C2416] bg-[#E2B15A] px-8 text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416]"
              >
                Login
              </Link>
            </div>
          ) : (
            <>
          <h2 className="text-center font-mono text-4xl font-medium text-[#1C2416] sm:text-5xl">Sign Up</h2>
          <p className="mt-3 text-center text-sm">Tourism Operators</p>
          <p className="mt-2 text-center font-mono text-xs tracking-[0.14em] text-[#1F4D3A] uppercase">
            USD · UGX
          </p>

          <form className="mt-8 flex flex-col" onSubmit={onSubmit} noValidate>
            <div className="flex gap-2">
              <label htmlFor={firstNameId} className="sr-only">
                First Name
              </label>
              <input
                id={firstNameId}
                name="firstName"
                autoComplete="given-name"
                placeholder="First Name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="h-12 min-w-0 flex-1 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
              />
              <label htmlFor={lastNameId} className="sr-only">
                Last Name
              </label>
              <input
                id={lastNameId}
                name="lastName"
                autoComplete="family-name"
                placeholder="Last Name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="h-12 min-w-0 flex-1 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
              />
            </div>
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
              className="mt-3 h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
            />
            <div className="mt-3">
              <PhoneField id={phoneId} code={countryCode} onCode={setCountryCode} number={phone} onNumber={setPhone} />
            </div>
            <label htmlFor={passwordId} className="sr-only">
              Password
            </label>
            <input
              id={passwordId}
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-3 h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
            />
            <label htmlFor={confirmPasswordId} className="sr-only">
              Confirm Password
            </label>
            <input
              id={confirmPasswordId}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-3 h-12 border-2 border-[#1C2416] px-3 text-[15px] outline-none placeholder:text-[#1C2416]/45"
            />

            <button
              type="submit"
              disabled={pending}
              className="mt-6 h-12 border-2 border-[#1C2416] bg-[#E2B15A] text-sm font-bold uppercase text-[#1C2416] shadow-[3px_3px_0_#E2B15A] hover:shadow-[6px_6px_0_#1C2416] disabled:opacity-60"
            >
              {pending ? "Please Wait" : "Create Account"}
            </button>

            <p role="status" className="mt-3 min-h-5 text-center text-[13px]">
              {notice}
            </p>

            <p className="mt-2 text-center text-[13px]">
              Already Have An Account?{" "}
              <Link href="/login" className="font-bold text-[#1F4D3A]">
                Login
              </Link>
            </p>
          </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

