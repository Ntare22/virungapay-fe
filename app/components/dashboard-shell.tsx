"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { clearSession, readAdminSession, readSession } from "../lib/api";
import { SideNav, type Audience } from "./sidenav";

const NavPreferenceContext = createContext<{ expanded: boolean; toggle: () => void } | null>(null);

export function NavPreferenceProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(localStorage.getItem("virungapay.nav") === "full");
  }, []);

  function toggle() {
    setExpanded((current) => {
      const next = !current;
      localStorage.setItem("virungapay.nav", next ? "full" : "icons");
      return next;
    });
  }

  return <NavPreferenceContext.Provider value={{ expanded, toggle }}>{children}</NavPreferenceContext.Provider>;
}

function useNavPreference() {
  const preference = useContext(NavPreferenceContext);
  if (!preference) throw new Error("Nav preference is missing.");
  return preference;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function DashboardShell({
  title,
  active,
  audience = "operator",
  children,
}: {
  title: string;
  active: "Dashboard" | "Profile" | "Tariffs" | "Itineraries" | "Payments" | "Guides" | "Tour operators" | "Wallets" | "Platform wallets" | "Fees" | "Transactions" | "Forex bureaus";
  audience?: Audience;
  children: ReactNode;
}) {
  const router = useRouter();
  const { expanded, toggle } = useNavPreference();
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(audience === "admin" ? "Staff" : "Operator");

  useEffect(() => {
    const saved = audience === "admin" ? readAdminSession() : readSession()?.session;
    if (saved?.user.name) setName(saved.user.name);
  }, [audience]);

  function logout() {
    clearSession();
    router.push(audience === "admin" ? "/admin/login" : "/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#313a46]">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-[#1C2416]/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <SideNav
        audience={audience}
        active={active}
        open={menuOpen}
        expanded={expanded}
        onNavigate={() => setMenuOpen(false)}
        onToggle={toggle}
      />

      <div className={expanded ? "lg:pl-64" : "lg:pl-20"}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 sm:px-6">
          <button
            type="button"
            className="grid size-9 place-items-center text-[#313a46] lg:hidden"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <h1 className="text-lg font-medium text-[#313a46]">{title}</h1>
          <div className="ms-auto flex items-center gap-4">
            <Link
              href="/profile"
              aria-label="Profile"
              className="grid size-10 place-items-center rounded-full bg-[#1F4D3A] text-sm font-semibold text-white"
            >
              {initials(name)}
            </Link>
            <button type="button" onClick={logout} className="text-sm font-semibold text-[#1F4D3A]">
              Logout
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
