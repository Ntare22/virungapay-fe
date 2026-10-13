import type { Metadata } from "next";
import { LoginScreen } from "../components/login-screen";

export const metadata: Metadata = {
  title: "Sign in · VirungaPay",
};

export default function LoginPage() {
  return <LoginScreen />;
}
