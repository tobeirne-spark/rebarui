import type { ReactNode } from "react";
import { ArchetypesShell } from "@/components/ArchetypesShell";

export default function ArchetypesLayout({ children }: { children: ReactNode }) {
  return <ArchetypesShell>{children}</ArchetypesShell>;
}
