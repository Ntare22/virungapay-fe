import type { Metadata } from "next";
import { SignupScreen } from "../components/signup-screen";

export const metadata: Metadata = {
  title: "Sign up · VirungaPay",
  description: "Create a tourism operator account. Tourists pay itineraries by card in USD.",
};

export default function SignupPage() {
  return <SignupScreen />;
}
