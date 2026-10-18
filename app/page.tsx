import type { Metadata } from "next";
import { ComingSoon } from "./components/coming-soon";
import { LandingPage } from "./components/landing-page";
import { comingSoon } from "./lib/site-mode";

export function generateMetadata(): Metadata {
  if (!comingSoon()) return {};
  return {
    title: "Coming soon · VirungaPay",
    description: "Join the VirungaPay waitlist.",
  };
}

export default function Home() {
  if (comingSoon()) return <ComingSoon />;
  return <LandingPage />;
}
