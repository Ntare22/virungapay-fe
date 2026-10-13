"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { registerOperator } from "../lib/api";

const countryCodes = [
  { code: "+256", flag: "🇺🇬" },
  { code: "+254", flag: "🇰🇪" },
  { code: "+255", flag: "🇹🇿" },
  { code: "+250", flag: "🇷🇼" },
  // { code: "+257", flag: "🇧🇮" },
  // { code: "+243", flag: "🇨🇩" },
  // { code: "+211", flag: "🇸🇸" },
] as const;

const points = [
  "Send itineraries tourists can pay",
  "Take card payments in USD or EUR",
  "Pay the lodge, driver, fuel supplier, and guide",
];

export function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState<(typeof countryCodes)[number]["code"]>("+256");
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
    const localPhone = phone.trim().replace(/^0+/, "");
    setPending(true);
    setNotice("");
    try {
      const result = await registerOperator({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: localPhone ? `${countryCode}${localPhone}` : "",
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
    <div className="fixed inset-0 flex flex-col bg-[#F8F8FF] text-[#28313D] lg:flex-row">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#2A2AFF] px-6 py-8 text-white sm:px-10 lg:flex lg:min-h-0 lg:w-1/2 lg:px-14 lg:py-10">
        <Link href="/" className="relative z-10 flex items-center gap-2 font-mono text-lg text-white">
          <Mark />
          VirungaPay
        </Link>
        <div className="relative z-10 max-w-md py-10">
          <h1 className="font-mono text-4xl leading-[1.05] font-medium sm:text-5xl">
            Open an operator account.
          </h1>
          <p className="relative mt-8 pt-6 text-base font-semibold">
            <span className="caret absolute top-0 left-0" />
            For tour operators in East Africa. Send the itinerary, then let the tourist pay in USD or EUR.
          </p>
          <ul className="mt-8 space-y-3 font-bold">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center border-2 border-[#1B2129] bg-[#4BFF2A] text-sm text-[#1B2129]">
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
          <Link href="/" className="font-mono text-sm text-[#1B2129] hover:text-[#2A2AFF]">
            Back home
          </Link>
          <Link href="/login" className="font-mono text-sm font-bold text-[#2A2AFF]">
            Login
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">
          {createdEmail ? (
            <div className="border-2 border-[#1B2129] bg-white p-8 text-center shadow-[6px_6px_0_#4BFF2A]">
              <h2 className="font-mono text-3xl font-medium text-[#1B2129]">Welcome</h2>
              <p className="mt-4 text-sm">
                We sent an email to {createdEmail}. Verify it before you sign in.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-12 items-center border-2 border-[#1B2129] bg-[#4BFF2A] px-8 text-sm font-bold uppercase text-[#1B2129] shadow-[3px_3px_0_#4BFF2A] hover:shadow-[6px_6px_0_#1B2129]"
              >
                Login
              </Link>
            </div>
          ) : (
            <>
          <h2 className="text-center font-mono text-4xl font-medium text-[#1B2129] sm:text-5xl">Sign up</h2>
          <p className="mt-3 text-center text-sm">Tourism operators</p>
          <p className="mt-2 text-center font-mono text-xs tracking-[0.14em] text-[#2A2AFF] uppercase">
            USD · EUR
          </p>

          <form className="mt-8 flex flex-col" onSubmit={onSubmit} noValidate>
            <div className="flex gap-2">
              <label htmlFor={firstNameId} className="sr-only">
                First name
              </label>
              <input
                id={firstNameId}
                name="firstName"
                autoComplete="given-name"
                placeholder="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="h-12 min-w-0 flex-1 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
              />
              <label htmlFor={lastNameId} className="sr-only">
                Last name
              </label>
              <input
                id={lastNameId}
                name="lastName"
                autoComplete="family-name"
                placeholder="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="h-12 min-w-0 flex-1 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
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
              className="mt-3 h-12 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
            />
            <div className="mt-3 flex gap-2">
              <label htmlFor="country-code" className="sr-only">
                Country code
              </label>
              <select
                id="country-code"
                name="countryCode"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value as (typeof countryCodes)[number]["code"])}
                className="h-12 border-2 border-[#1B2129] bg-white px-2 font-mono text-sm outline-none"
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <label htmlFor={phoneId} className="sr-only">
                Phone
              </label>
              <input
                id={phoneId}
                name="phone"
                type="tel"
                autoComplete="tel-national"
                placeholder="Phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="h-12 min-w-0 flex-1 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
              />
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
              className="mt-3 h-12 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
            />
            <label htmlFor={confirmPasswordId} className="sr-only">
              Confirm password
            </label>
            <input
              id={confirmPasswordId}
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-3 h-12 border-2 border-[#1B2129] px-3 text-[15px] outline-none placeholder:text-[#28313D]/45"
            />

            <button
              type="submit"
              disabled={pending}
              className="mt-6 h-12 border-2 border-[#1B2129] bg-[#4BFF2A] text-sm font-bold uppercase text-[#1B2129] shadow-[3px_3px_0_#4BFF2A] hover:shadow-[6px_6px_0_#1B2129] disabled:opacity-60"
            >
              {pending ? "Please wait" : "Create account"}
            </button>

            <p role="status" className="mt-3 min-h-5 text-center text-[13px]">
              {notice}
            </p>

            <p className="mt-2 text-center text-[13px]">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-[#2A2AFF]">
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

function Mark() {
  return (
    <span className="grid size-9 place-items-center border-2 border-[#1B2129] bg-[#4BFF2A] font-mono text-xs font-bold text-[#1B2129] shadow-[3px_3px_0_#1B2129]">
      VP
    </span>
  );
}
