import type { Metadata } from "next";
import { LoginScreen } from "../../components/login-screen";

export const metadata: Metadata = {
  title: "Staff sign in · VirungaPay",
};

export default function AdminLoginPage() {
  return <LoginScreen audience="admin" />;
}
