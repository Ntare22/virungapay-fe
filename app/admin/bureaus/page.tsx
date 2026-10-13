import type { Metadata } from "next";
import { OperatorsScreen } from "../../components/operators-screen";

export const metadata: Metadata = { title: "Forex bureaus · VirungaPay" };

export default function BureausPage() {
  return <OperatorsScreen bureau />;
}
