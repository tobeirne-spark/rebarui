import type { ReactNode } from "react";
import { TierLayout } from "@/components/TierLayout";

export default function ImitationsLayout({ children }: { children: ReactNode }) {
  return <TierLayout tier="imitation">{children}</TierLayout>;
}
