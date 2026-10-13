import type { Metadata } from "next";
import { OperatorsScreen } from "../../components/operators-screen";

export const metadata: Metadata = {
  title: "Tour operators · VirungaPay",
};

export default function OperatorsPage() {
  return <OperatorsScreen />;
}
