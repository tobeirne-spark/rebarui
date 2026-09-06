import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import clsx from "clsx";
import { renderBionicChildren, useAmbientBionic } from "../bionic";
import type { BionicOptions } from "../bionic";

export interface SectionNavItem {
  id: string;
  label: string;
}

export interface SectionNavProps extends Omit<ComponentPropsWithoutRef<"nav">, "className"> {
  sections: SectionNavItem[];
  searchPlaceholder?: string;
  className?: string;
  /** Force bionic reading on/off for each section's label, overriding the ambient
   * data-rebar-bionic setting. */
  bionic?: boolean;
  bionicOptions?: BionicOptions;
}

/** Below this heading count, search chrome is hidden even on a long page — see ref/HEURISTICS.md #11 (IA as pyramid): a short in-page index doesn't need to be searched, it needs to be read. */
const SEARCH_THRESHOLD = 12;

/** How long a manual scroll of this rail is respected before it auto-recenters on the active
 * section again — see ref/HEURISTICS.md #44 (a beacon point stays visible, or returns after a
 * pause). */
const RECENTER_DELAY_MS = 5000;

/** Must match `.rebar-section-nav-mist`'s `height` in style.css — the beacon-follow effect keeps
 * this much clearance between the active item and each edge, so a freshly-scrolled-to item never
 * lands directly under the mist gradient (readable, but faded, right when it most needs to be
 * legible). */
const MIST_HEIGHT_PX = 28;

/** Fallback bottom clearance for the dynamic max-height calc below, if `--rebar-space-xl` can't
 * be read from the page (no computed styles available, e.g. during a non-DOM render). Read live
 * from the real custom property at runtime so a theme that changes the token doesn't silently
 * drift out of sync with this rail's own sizing. */
const FALLBACK_BOTTOM_GAP_PX = 32;

/** Safety net clearing `isFollowScrollRef` if the browser never fires `scrollend` (older Safari) —
 * comfortably longer than a `behavior: "smooth"` scroll over this rail's own height ever takes. */
const FOLLOW_SCROLL_SAFETY_MS = 500;

/** Beacon-pointer sizing (ref/HEURISTICS.md #46) — a small dot at rest, stretching into a bar
 * while a scroll that could be moving the beacon is actively happening, the length scaling with
 * how fast that scroll is moving (a light tap scrolls barely stretch it; a fast scroll pulls it
 * out further), then easing back to a dot once scrolling settles. */
const BEACON_POINTER_IDLE_SIZE_PX = 6;
const BEACON_POINTER_MIN_STRETCH_PX = 16;
const BEACON_POINTER_MAX_STRETCH_PX = 40;
const BEACON_POINTER_VELOCITY_SCALE = 0.6;
/** How long a burst of scroll events must go quiet before the pointer eases back down to its
 * resting dot — long enough to bridge the gaps between events during a smooth continuous scroll,
 * short enough that stopping reads as "stopped" almost immediately. */
const BEACON_POINTER_IDLE_MS = 150;

/**
 * An in-page content index — the right-hand counterpart to `NavIndex` (which indexes *other*
 * pages; this indexes headings on the *current* one). Tracks which heading is currently in view
 * via `IntersectionObserver` and highlights it; filters by a search box once the list is long
 * enough to need one (same threshold convention as `NavIndex`).
 *
 * Sticky and independently scrollable by default, with its scrollbar hidden (still fully
 * scrollable by wheel, touch, or keyboard — `scrollbar-width: none` / `::-webkit-scrollbar` just
 * suppress the visible track) — a long index (see this project's own `/docs/heuristics`, 46
 * entries) would otherwise either force the whole page to scroll to reach its tail or render a
 * visible scrollbar competing with the page's own content for attention. Hidden below
 * `--rebar-breakpoint-lg` (1024px) — there's no room for a side rail once the main content column
 * has claimed the viewport, and a hidden nav beats a cramped one.
 *
 * A hidden scrollbar means there's no chrome at all signaling "there's more below" — see
 * ref/HEURISTICS.md #43: a soft fade-to-transparent "mist" renders at whichever edge (top,
 * bottom, or both) still has unscrolled content, tracking real scroll position rather than
 * rendering unconditionally. Reaching the true end of the list is what makes the bottom mist
 * disappear — there's no separate "end of list" label needed.
 *
 * The highlighted link is this rail's "beacon" — see ref/HEURISTICS.md #44: on a page long enough
 * that the rail itself scrolls, the active link can scroll out of the rail's own visible area
 * even while its section is still on screen, leaving no visible answer to "where am I in this
 * list." This component scrolls itself to keep the beacon in view as it changes, except while a
 * person is mid-scroll of the rail by their own hand — that scroll wins until they've been idle
 * on it for `RECENTER_DELAY_MS` (5s), after which the rail recenters on the beacon again.
 *
 * See ref/HEURISTICS.md #46: while the beacon sits out of view for any reason (mid-manual-scroll-
 * pause, or just the brief moment before a follow-scroll finishes), a small marker docked to the
 * rail's right edge, at whichever edge it's past, hints at the direction to look — a resting dot
 * while nothing's actively scrolling, stretching into a bar (longer the faster the triggering
 * scroll is moving) while a scroll that could be moving the beacon is in progress, then easing
 * back down to a dot once that settles — rather than leaving the beacon's absence as the only
 * clue. And the follow/recenter scroll itself eases smoothly to its new position
 * (`behavior: "smooth"`) instead of snapping there in one frame, which reads as the beacon being
 * followed rather than the list jumping.
 */
export function SectionNav({
  sections,
  searchPlaceholder = "Filter sections…",
  className,
  bionic,
  bionicOptions,
  ...props
}: SectionNavProps) {
  const bionicEnabled = useAmbientBionic();
  const enabled = bionic ?? bionicEnabled;
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [query, setQuery] = useState("");
  const [showTopMist, setShowTopMist] = useState(false);
  const [showBottomMist, setShowBottomMist] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  // Which edge the beacon currently sits beyond, if either — drives the directional pointer (see
  // ref/HEURISTICS.md #46). Distinct from the mist: the mist says "more content exists past this
  // edge," this says "the specific item you're tracking is past this edge, right now."
  const [beaconDirection, setBeaconDirection] = useState<"above" | "below" | null>(null);
  // Whether a scroll that could be moving the beacon (the page, or this rail) is actively
  // happening right now — the pointer is a resting dot when this is false, a stretched bar
  // (length scaling with recent scroll speed) when true.
  const [isBeaconMotionActive, setIsBeaconMotionActive] = useState(false);
  const [beaconPointerLength, setBeaconPointerLength] = useState(BEACON_POINTER_IDLE_SIZE_PX);
  const scrollActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastWindowScrollYRef = useRef(0);
  const lastRailScrollTopRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>());
  const activeIdRef = useRef(activeId);
  // Set for the whole duration of a scroll this component triggered itself (not one a person just
  // asked for) — read by the scroll handler below, which is the only way to tell "the rail is
  // scrolling because it's following the active item" apart from "a person is scrolling this list
  // with their own wheel/trackpad/touch." Stays true across every intermediate scroll event a
  // `behavior: "smooth"` animation fires, not just the first — cleared only once that animation
  // genuinely finishes (`scrollend`, or the safety timeout below if a browser never fires it).
  const isFollowScrollRef = useRef(false);
  const followScrollSafetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const userScrolledRef = useRef(false);
  const recenterTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((section) => section.label.toLowerCase().includes(q));
  }, [sections, query]);

  const needsSearch = sections.length > SEARCH_THRESHOLD;

  const updateMist = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTopMist(el.scrollTop > 0);
    setShowBottomMist(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  };

  // Whether the beacon sits fully past the top or bottom edge of the visible rail — see
  // ref/HEURISTICS.md #46: a beacon out of view gets a directional pointer hinting where it is,
  // distinct from (and a stricter check than) the mist-clearance margin `scrollActiveIntoView`
  // keeps below. Recomputed on every scroll and every beacon change, whatever caused either.
  const updateBeaconPointer = () => {
    const container = scrollRef.current;
    const el = activeIdRef.current ? itemRefs.current.get(activeIdRef.current) : undefined;
    if (!container || !el) {
      setBeaconDirection(null);
      return;
    }
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    if (el.offsetTop + el.offsetHeight < containerTop) setBeaconDirection("above");
    else if (el.offsetTop > containerBottom) setBeaconDirection("below");
    else setBeaconDirection(null);
  };

  // See ref/HEURISTICS.md #46: stretches the pointer toward a bar proportional to how much the
  // triggering scroll just moved, then schedules it easing back to a resting dot once no further
  // scroll arrives within BEACON_POINTER_IDLE_MS. Called on every scroll regardless of whether the
  // beacon is currently out of view — harmless, since the pointer only ever renders when it is.
  const markBeaconMotion = (deltaPx: number) => {
    setIsBeaconMotionActive(true);
    setBeaconPointerLength(
      Math.min(
        BEACON_POINTER_MAX_STRETCH_PX,
        Math.max(BEACON_POINTER_MIN_STRETCH_PX, Math.abs(deltaPx) * BEACON_POINTER_VELOCITY_SCALE),
      ),
    );
    if (scrollActivityTimeoutRef.current) clearTimeout(scrollActivityTimeoutRef.current);
    scrollActivityTimeoutRef.current = setTimeout(() => setIsBeaconMotionActive(false), BEACON_POINTER_IDLE_MS);
  };

  const clearFollowScrollFlag = () => {
    isFollowScrollRef.current = false;
    if (followScrollSafetyTimeoutRef.current) clearTimeout(followScrollSafetyTimeoutRef.current);
  };

  // See ref/HEURISTICS.md #44: the active item is this rail's "beacon" — on a long enough page
  // the rail scrolls independently of the content it's tracking, so the highlighted link can
  // scroll out of the rail's own visible area even while the section it names is still on screen.
  // Only nudges the rail when the beacon is actually out of view (never recenters an already-
  // visible item), and only vertically, by the minimum amount needed — never a jump to the top.
  // Keeps MIST_HEIGHT_PX of clearance from each edge: without it, a freshly-scrolled-to item
  // lands flush against the edge, directly under that edge's own fade-to-transparent mist (#43) —
  // technically visible but faded right when it most needs to read clearly. Scrolls with
  // `behavior: "smooth"` — see ref/HEURISTICS.md #46 — rather than snapping the rail to its new
  // position in one frame, which reads as the list jumping rather than the beacon being followed.
  const scrollActiveIntoView = (id: string | undefined) => {
    const container = scrollRef.current;
    const el = id ? itemRefs.current.get(id) : undefined;
    if (!container || !el) return;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    let nextScrollTop = containerTop;
    if (elTop < containerTop + MIST_HEIGHT_PX) nextScrollTop = Math.max(0, elTop - MIST_HEIGHT_PX);
    else if (elBottom > containerBottom - MIST_HEIGHT_PX) {
      nextScrollTop = elBottom - container.clientHeight + MIST_HEIGHT_PX;
    }
    if (nextScrollTop === containerTop) return;
    isFollowScrollRef.current = true;
    if (followScrollSafetyTimeoutRef.current) clearTimeout(followScrollSafetyTimeoutRef.current);
    followScrollSafetyTimeoutRef.current = setTimeout(clearFollowScrollFlag, FOLLOW_SCROLL_SAFETY_MS);
    container.scrollTo({ top: nextScrollTop, behavior: "smooth" });
  };

  // Follow the beacon as it changes — unless a person is currently mid-manual-scroll of this
  // rail, in which case their scroll wins until they've been idle on it for RECENTER_DELAY_MS.
  useEffect(() => {
    updateBeaconPointer();
    if (userScrolledRef.current) return;
    scrollActiveIntoView(activeId);
  }, [activeId]);

  useEffect(() => {
    const el = scrollRef.current;
    el?.addEventListener("scrollend", clearFollowScrollFlag);
    return () => {
      el?.removeEventListener("scrollend", clearFollowScrollFlag);
      if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
      if (followScrollSafetyTimeoutRef.current) clearTimeout(followScrollSafetyTimeoutRef.current);
      if (scrollActivityTimeoutRef.current) clearTimeout(scrollActivityTimeoutRef.current);
    };
  }, []);

  const handleScroll = () => {
    updateMist();
    updateBeaconPointer();
    // Every intermediate frame of our own `behavior: "smooth"` follow-scroll fires a scroll event
    // too, not just one at the end — ignore all of them uniformly while that flag is set, rather
    // than treating the second frame onward as a fresh manual scroll (see `clearFollowScrollFlag`,
    // which is what actually clears this, not this handler).
    if (isFollowScrollRef.current) return;
    const container = scrollRef.current;
    if (container) {
      markBeaconMotion(container.scrollTop - lastRailScrollTopRef.current);
      lastRailScrollTopRef.current = container.scrollTop;
    }
    userScrolledRef.current = true;
    if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
    recenterTimeoutRef.current = setTimeout(() => {
      userScrolledRef.current = false;
      scrollActiveIntoView(activeIdRef.current);
    }, RECENTER_DELAY_MS);
  };

  // The list's own height changes as search filters it, so a scroll position that used to have
  // more content below it may not anymore — re-check on every render of the filtered list, not
  // just on an explicit scroll event.
  useEffect(() => {
    updateMist();
  });

  // A bare render-triggered check above only re-measures when React re-renders this component —
  // it stays blind to layout shifts nothing here caused (a web font swapping in and changing the
  // page's header height, the window resizing, a parent's own reflow), so the very first
  // measurement can be taken against a still-settling layout and read as "everything fits" when
  // it doesn't — caught live: the bottom mist was silently absent on initial load whenever a
  // sticky header above this rail hadn't finished laying out yet, and only appeared once a scroll
  // event forced a fresh measurement. A `ResizeObserver` on the scroll container re-measures
  // whenever its own box size changes (a window resize, this rail's breakpoint collapse); a
  // one-frame-delayed re-check on mount (`requestAnimationFrame`, not synchronous) catches the
  // remaining case where the container's size is already final but its *content* was still
  // settling (e.g. a web font swap growing row heights) at the moment of the first measurement.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateMist);
    observer.observe(el);
    const raf = requestAnimationFrame(updateMist);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // The CSS `max-height: calc(100vh - X)` this rail shipped with assumed it was always already
  // sticky-pinned at its own `top` offset — true once scrolled past its static position, false at
  // the top of the page, where it still sits at its normal in-flow position (further down than
  // `top` assumes, behind whatever header/padding precedes it). That gap between the assumed and
  // real position is exactly what let the box claim more height than actually fits above the
  // fold, hiding real overflow (the bottom mist bug this was caught from). Computed here instead,
  // from the container's *real* current position (`getBoundingClientRect().top`, correct whether
  // stuck or not) — recalculated on resize and on scroll, since a sticky element's real top
  // position changes continuously until it engages, then holds steady once it does.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const updateMaxHeight = () => {
      const bottomGapRaw = getComputedStyle(document.documentElement).getPropertyValue("--rebar-space-xl");
      const bottomGap = parseFloat(bottomGapRaw) || FALLBACK_BOTTOM_GAP_PX;
      const top = el.getBoundingClientRect().top;
      setMaxHeight(Math.max(window.innerHeight - top - bottomGap, 0));
    };

    // The page scrolling (not just this rail) is the far more common way the beacon changes — a
    // person reading down the page, not dragging this rail directly — so it drives the pointer's
    // stretch (ref/HEURISTICS.md #46) exactly like the rail's own manual scroll does in
    // `handleScroll`.
    const trackWindowScrollMotion = () => {
      markBeaconMotion(window.scrollY - lastWindowScrollYRef.current);
      lastWindowScrollYRef.current = window.scrollY;
    };
    const handleWindowScroll = () => {
      updateMaxHeight();
      trackWindowScrollMotion();
    };

    lastWindowScrollYRef.current = window.scrollY;
    updateMaxHeight();
    const raf = requestAnimationFrame(updateMaxHeight);
    window.addEventListener("resize", updateMaxHeight);
    window.addEventListener("scroll", handleWindowScroll, { passive: true, capture: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateMaxHeight);
      window.removeEventListener("scroll", handleWindowScroll, { capture: true });
    };
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className={clsx("rebar-section-nav", className)}
      data-rebar-component="section-nav"
      {...props}
    >
      <div className="rebar-section-nav-mist-wrapper">
        <div
          className="rebar-section-nav-mist rebar-section-nav-mist-top"
          data-rebar-part="mist-top"
          aria-hidden="true"
          style={{ opacity: showTopMist ? 1 : 0 }}
        />
        {beaconDirection === "above" ? (
          <div
            className={clsx(
              "rebar-section-nav-beacon-pointer rebar-section-nav-beacon-pointer-top",
              isBeaconMotionActive && "rebar-section-nav-beacon-pointer-active",
            )}
            data-rebar-part="beacon-pointer-top"
            aria-hidden="true"
            style={{ height: isBeaconMotionActive ? beaconPointerLength : BEACON_POINTER_IDLE_SIZE_PX }}
          />
        ) : null}
        <div
          ref={scrollRef}
          className="rebar-section-nav-scroll"
          data-rebar-part="scroll"
          onScroll={handleScroll}
          style={maxHeight !== undefined ? { maxHeight } : undefined}
        >
          {needsSearch ? (
            <input
              type="search"
              className="rebar-input rebar-section-nav-search"
              data-rebar-part="search"
              data-rebar-size="sm"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          ) : null}
          <ul className="rebar-section-nav-list" data-rebar-part="list">
            {filtered.map((section) => (
              <li key={section.id} data-rebar-part="item">
                <a
                  ref={(el) => {
                    if (el) itemRefs.current.set(section.id, el);
                    else itemRefs.current.delete(section.id);
                  }}
                  href={`#${section.id}`}
                  className={clsx(
                    "rebar-section-nav-link",
                    activeId === section.id && "rebar-section-nav-link-active",
                  )}
                  data-rebar-active={activeId === section.id || undefined}
                >
                  {renderBionicChildren(section.label, enabled, bionicOptions)}
                </a>
              </li>
            ))}
            {needsSearch && filtered.length === 0 ? (
              <li className="rebar-section-nav-empty" data-rebar-part="empty">
                No matches.
              </li>
            ) : null}
          </ul>
        </div>
        <div
          className="rebar-section-nav-mist rebar-section-nav-mist-bottom"
          data-rebar-part="mist-bottom"
          aria-hidden="true"
          style={{ opacity: showBottomMist ? 1 : 0 }}
        />
        {beaconDirection === "below" ? (
          <div
            className={clsx(
              "rebar-section-nav-beacon-pointer rebar-section-nav-beacon-pointer-bottom",
              isBeaconMotionActive && "rebar-section-nav-beacon-pointer-active",
            )}
            data-rebar-part="beacon-pointer-bottom"
            aria-hidden="true"
            style={{ height: isBeaconMotionActive ? beaconPointerLength : BEACON_POINTER_IDLE_SIZE_PX }}
          />
        ) : null}
      </div>
    </nav>
  );
}
