import type { CatalogConstruct } from "./constructCatalog.types";

// See constructCatalog.web.ts for sourcing methodology. General mobile ports of web constructs
// (mobile Button, Switch, Card, etc.) are deliberately excluded — they appeared constantly across
// the surveyed libraries but add no new interaction pattern beyond what rebar-ui already has.
//
// Every entry originally catalogued here has shipped as a real `packages/core` construct:
// Action Sheet, Bottom Sheet, Tab Bar, Pull-to-Refresh, Picker Wheel, and Swipe Actions — see
// /opinions/action-sheet, /opinions/bottom-sheet, /orders/mobile-tab-bar,
// /opinions/pull-to-refresh, /opinions/picker-wheel, and /opinions/swipe-actions.
export const MOBILE_CATALOG: CatalogConstruct[] = [];
