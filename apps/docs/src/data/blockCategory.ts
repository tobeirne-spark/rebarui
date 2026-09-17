import type { Construct } from "@rebar-ui/placement";
import type { CatalogCategory } from "./constructCatalog.types";

const DIAGRAM_BLOCKS: readonly Construct["type"][] = [
  "scatter-chart",
  "line-chart",
  "stacked-bar-chart",
  "stats-table",
];

const DIAGRAM_SET = new Set(DIAGRAM_BLOCKS);

/** Most blocks are general web UI patterns; charts and data-viz blocks are "diagram". */
export function blockCategory(type: Construct["type"]): CatalogCategory {
  if (DIAGRAM_SET.has(type)) return "diagram";
  return "web";
}
