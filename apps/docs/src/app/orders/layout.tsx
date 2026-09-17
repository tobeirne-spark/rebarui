import type { ReactNode } from "react";
import { TierLayout } from "@/components/TierLayout";

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return <TierLayout tier="order">{children}</TierLayout>;
}
