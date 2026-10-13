import type { Metadata } from "next";
import { TariffScreen } from "../../components/tariff-screen";

export const metadata: Metadata = {
  title: "Tariffs · VirungaPay",
};

export default function AdminTariffsPage() {
  return <TariffScreen audience="admin" />;
}
