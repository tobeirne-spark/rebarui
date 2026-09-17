import { WEB_CATALOG } from "./constructCatalog.web";
import { MOBILE_CATALOG } from "./constructCatalog.mobile";
import { DIAGRAM_CATALOG } from "./constructCatalog.diagrams";

export type { CatalogCategory, CatalogConstruct } from "./constructCatalog.types";

export const CATALOG_CONSTRUCTS = [...WEB_CATALOG, ...MOBILE_CATALOG, ...DIAGRAM_CATALOG];

export const CATALOG_BY_SLUG = new Map(CATALOG_CONSTRUCTS.map((c) => [c.slug, c]));
