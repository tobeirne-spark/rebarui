import type { ReactNode } from "react";
import { TierLayout } from "@/components/TierLayout";

export default function OpinionsLayout({ children }: { children: ReactNode }) {
  return <TierLayout tier="opinion">{children}</TierLayout>;
}
