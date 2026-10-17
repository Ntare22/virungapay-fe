"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "./mark";

export type Audience = "operator" | "admin";

export type NavItem = {
  label: string;
  href?: string;
};

const operatorNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tariffs", href: "/tariffs" },
  { label: "Itineraries", href: "/itineraries" },
  { label: "Wallets", href: "/wallets" },
  { label: "Payments", href: "/payments" },
  { label: "Guides", href: "/guides" },
  { label: "Profile", href: "/profile" },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Tour operators", href: "/admin/operators" },
  { label: "Wallets", href: "/admin/wallets" },
  { label: "Platform wallets", href: "/admin/platform" },
  { label: "Tariffs", href: "/admin/tariffs" },
  { label: "Fees", href: "/admin/fees" },
  { label: "Transactions", href: "/admin/transactions" },
  { label: "Forex bureaus", href: "/admin/bureaus" },
  { label: "Profile", href: "/profile" },
];

export function navItems(audience: Audience) {
  return audience === "admin" ? adminNav : operatorNav;
}

export function SideNav({
  audience,
  active,
  open,
  expanded,
  onNavigate,
  onToggle,
}: {
  audience: Audience;
  active: string;
  open: boolean;
  expanded: boolean;
  onNavigate: () => void;
  onToggle: () => void;
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#e5e7eb] bg-white transition-all lg:translate-x-0 ${
        expanded ? "w-64" : "w-20"
      } ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className={`flex h-16 items-center border-b border-[#e5e7eb] ${expanded ? "gap-2 px-4" : "justify-center"}`}>
        <Link href="/" aria-label="VirungaPay" className={`group relative flex items-center gap-2 ${expanded ? "min-w-0 flex-1" : ""}`}>
          <Mark className="h-8 w-10" />
          {expanded ? <span className="truncate font-mono text-lg text-[#1C2416]">VirungaPay</span> : <Tip label="VirungaPay" />}
        </Link>
        {expanded ? (
          <button
            type="button"
            aria-label="Collapse menu"
            onClick={onToggle}
            className="grid size-9 shrink-0 place-items-center rounded text-[#6c757d] hover:bg-[#f4f6f8] hover:text-[#1C2416]"
          >
            <Chevron left />
          </button>
        ) : null}
      </div>
      <nav className={`mt-3 flex flex-col gap-1 ${expanded ? "px-3" : "items-center px-2"}`}>
        {expanded ? null : (
          <span className="group relative">
            <button
              type="button"
              aria-label="Expand menu"
              onClick={onToggle}
              className="grid size-11 place-items-center rounded text-[#6c757d] hover:bg-[#f4f6f8] hover:text-[#1C2416]"
            >
              <Chevron />
            </button>
            <Tip label="Expand menu" />
          </span>
        )}
        {navItems(audience).map((item) => {
          const tone = item.label === active ? "bg-[#f4f6f8] font-semibold text-[#1F4D3A]" : "text-[#6c757d] hover:bg-[#f4f6f8] hover:text-[#1C2416]";
          const className = expanded
            ? `flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm ${tone}`
            : `grid size-11 place-items-center rounded ${tone}`;
          const icon = <NavIcon name={item.label} />;
          return (
            <span key={item.label} className={`group relative ${expanded ? "w-full" : ""}`}>
              {item.href ? (
                <Link href={item.href} aria-label={item.label} className={className} onClick={onNavigate}>
                  {icon}
                  {expanded ? item.label : null}
                </Link>
              ) : (
                <span aria-label={item.label} className={className}>
                  {icon}
                  {expanded ? item.label : null}
                </span>
              )}
              {expanded ? null : <Tip label={item.label} />}
            </span>
          );
        })}
      </nav>
    </aside>
  );
}

function Chevron({ left = false }: { left?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {left ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

function Tip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 border-2 border-[#1C2416] bg-[#1C2416] px-2 py-1 text-xs font-semibold whitespace-nowrap text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
      {label}
    </span>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    Dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </>
    ),
    Tariffs: (
      <>
        <path d="M4 16l5-5 3 3 8-8" />
        <path d="M14 6h6v6" />
      </>
    ),
    Itineraries: (
      <>
        <path d="M8 4h8v16H8z" />
        <path d="M11 8h4M11 12h4M11 16h4" />
      </>
    ),
    Wallets: (
      <>
        <rect x="3" y="6" width="18" height="13" rx="1" />
        <path d="M3 10h18" />
        <path d="M16 15h3" />
      </>
    ),
    "Platform wallets": (
      <>
        <rect x="3" y="4" width="18" height="6" />
        <rect x="5" y="12" width="14" height="8" />
      </>
    ),
    Payments: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M3 10h18" />
      </>
    ),
    Guides: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 19c1.2-3 3.2-4.5 6-4.5S16.8 16 18 19" />
      </>
    ),
    "Tour operators": (
      <>
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16" cy="9" r="2" />
        <path d="M4 18c.8-2.5 2.4-3.8 5-3.8s4.2 1.3 5 3.8" />
        <path d="M14 14.4c1.2-.4 2.3-.3 3.4.4 1 .6 1.7 1.6 2.1 3.2" />
      </>
    ),
    Profile: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c1.4-3.2 3.6-4.8 7-4.8s5.6 1.6 7 4.8" />
      </>
    ),
    Transactions: (
      <>
        <path d="M4 6h16M4 12h16M4 18h10" />
      </>
    ),
    Fees: (
      <>
        <rect x="4" y="6" width="16" height="12" />
        <path d="M4 10h16M8 14h4" />
      </>
    ),
    "Forex bureaus": (
      <>
        <path d="M4 18V8l8-4 8 4v10" />
        <path d="M9 18v-5h6v5" />
      </>
    ),
  };

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
