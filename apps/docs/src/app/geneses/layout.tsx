import { TierLayout } from "@/components/TierLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geneses",
  description: "Starter projects grounded in the rebar-ui framework",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TierLayout tier="genesis">{children}</TierLayout>;
}
