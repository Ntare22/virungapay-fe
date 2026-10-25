"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, readSession, type PublicUser } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import type { Audience } from "./sidenav";

const roles: Record<string, string> = {
  operator_owner: "Operator",
  operator_staff: "Operator Staff",
  tourist: "Tourist",
  guide: "Guide",
  driver: "Driver",
  va_superadmin: "Staff",
  va_ops: "Staff",
  va_finance: "Staff",
  auto_admin: "AUTO Admin",
  uhoa_admin: "UHOA Admin",
};

export function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = readSession();
    if (!saved) {
      router.replace("/login");
      return;
    }
    setAudience(saved.audience);
    setUser(saved.session.user);
    currentUser()
      .then(setUser)
      .catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : "Could not refresh this profile.");
      });
  }, [router]);

  if (!audience) return null;

  return (
    <DashboardShell title="Profile" active="Profile" audience={audience}>
      <article className="max-w-xl bg-white p-6 shadow-sm">
        <h2 className="font-mono text-2xl text-[#1C2416]">{user?.name ?? "Profile"}</h2>
        <dl className="mt-6 grid gap-4 text-sm">
          <div>
            <dt className="text-[#98a6ad]">Email</dt>
            <dd className="mt-1 font-medium">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[#98a6ad]">Phone</dt>
            <dd className="mt-1 font-medium">{user?.phone || "Not Added"}</dd>
          </div>
          <div>
            <dt className="text-[#98a6ad]">Role</dt>
            <dd className="mt-1 font-medium">{user ? (roles[user.role] ?? user.role) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[#98a6ad]">Verification</dt>
            <dd className="mt-1 font-medium">{user?.email_verified ? "Verified" : "Not Verified Yet"}</dd>
          </div>
        </dl>
        {notice ? <p className="mt-4 text-sm">{notice}</p> : null}
      </article>
    </DashboardShell>
  );
}
