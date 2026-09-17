import type { ReactNode } from "react";
import { TierLayout } from "@/components/TierLayout";

export default function SyntheticsLayout({ children }: { children: ReactNode }) {
  return <TierLayout tier="synthetic">{children}</TierLayout>;
}
