import type { Metadata } from "next";
import { ProfileScreen } from "../components/profile-screen";

export const metadata: Metadata = {
  title: "Profile · VirungaPay",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
