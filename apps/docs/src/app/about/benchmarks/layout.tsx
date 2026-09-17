import type { ReactNode } from "react";
import { BenchmarksShell } from "@/components/BenchmarksShell";

export default function BenchmarksLayout({ children }: { children: ReactNode }) {
  return <BenchmarksShell>{children}</BenchmarksShell>;
}
