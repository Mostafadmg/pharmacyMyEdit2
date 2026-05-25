import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Align with scroll-padding-inline (1.5rem) on the scroll container. */
const CHIP_SCROLL_START_INSET_PX = 24;
const CHIP_SCROLL_END_INSET_PX = 24;
const CHIP_PEEK_PAD_PX = 16;

type CategoryChip = { category: string; count: number };

type ShopCategoryBarProps = {
  categories: CategoryChip[];
  activeCategory: string;
  onSelect: (category: string) => void;
  categoryLabels: Record<string, string>;
};

export default function ShopCategoryBar({
  categories,
  activeCategory,
  onSelect,
  categoryLabels,
}: ShopCategoryBarProps) {
  const categoryIds = useMemo(
    () => ["all", ...categories.map((c) => c.category)],
    [categories],
  );

  const contRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevCategoryRef = useRef(activeCategory);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const updateScrollAffordance = useCallback(() => {
    const el = contRef.current;
    if (!el) return;
    setShowPrev(el.scrollLeft > 4);
    setShowNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const tabOffsetLeft = useCallback((id: string) => {
    const node = btnRefs.current[id];
    if (!node) return 0;
    const outer = node.parentElement ?? node;
    return outer.offsetLeft;
  }, []);

  const tabOffsetRight = useCallback((id: string) => {
    const node = btnRefs.current[id];
    if (!node) return 0;
    const outer = node.parentElement ?? node;
    return outer.offsetLeft + outer.offsetWidth;
  }, []);

  const scrollCategoryIntoView = useCallback(
    (categoryId: string, previousCategoryId: string) => {
      const btn = btnRefs.current[categoryId];
      const el = contRef.current;
      if (!btn || !el) return;

      const wrap = btn.parentElement as HTMLElement | null;
      const target = wrap ?? btn;
      const startInset = CHIP_SCROLL_START_INSET_PX;
      const endInset = CHIP_SCROLL_END_INSET_PX;
      const peekPad = CHIP_PEEK_PAD_PX;
      const tabIndex = categoryIds.indexOf(categoryId);
      if (tabIndex < 0) return;
      const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);

      const tabLeft = target.offsetLeft;
      const tabRight = tabLeft + target.offsetWidth;
      const viewLeft = el.scrollLeft;
      const visibleLeft = tabLeft - viewLeft;
      const visibleRight = tabRight - viewLeft;

      const prevIndex = categoryIds.indexOf(previousCategoryId);
      const tabChanged = categoryId !== previousCategoryId;
      const indexDelta = tabIndex - prevIndex;
      const stepNav =
        tabChanged && Math.abs(indexDelta) >= 1 && Math.abs(indexDelta) <= 2;

      const minScroll = Math.max(0, tabRight + endInset - el.clientWidth);
      const maxScroll = Math.max(0, tabLeft - startInset);
      const clampScroll = (value: number) =>
        Math.max(0, Math.min(value, maxLeft));

      const clampForActive = (value: number) => {
        if (minScroll <= maxScroll) {
          return clampScroll(Math.max(minScroll, Math.min(value, maxScroll)));
        }
        return clampScroll(
          tabLeft + target.offsetWidth / 2 - el.clientWidth / 2,
        );
      };

      const alignStart = () => tabLeft - startInset;
      const alignEnd = () => tabRight + endInset - el.clientWidth;

      const snapLeadingTabsToStart = () => {
        if (tabIndex > 1) return null;
        const rightEdge = tabOffsetRight(categoryId);
        if (rightEdge + endInset <= el.clientWidth) return 0;
        return clampForActive(Math.max(0, tabLeft - startInset));
      };

      let nextLeft = el.scrollLeft;

      const leadingSnap = tabChanged ? snapLeadingTabsToStart() : null;
      if (leadingSnap !== null) {
        nextLeft = leadingSnap;
      } else if (tabChanged && tabIndex === categoryIds.length - 1) {
        nextLeft = clampForActive(minScroll);
      } else if (stepNav && indexDelta > 0 && tabIndex > 1) {
        const ahead = Math.min(categoryIds.length - 1, tabIndex + 2);
        const aheadId = categoryIds[ahead];
        const aheadRight = tabOffsetRight(aheadId) + peekPad;
        const peekRight = aheadRight - el.clientWidth;
        nextLeft = clampForActive(Math.max(alignStart(), peekRight));
      } else if (stepNav && indexDelta < 0 && tabIndex > 1) {
        const behind = Math.max(0, tabIndex - 2);
        const behindId = categoryIds[behind];
        const behindLeft = tabOffsetLeft(behindId) - startInset;
        nextLeft = clampForActive(behindLeft);
      } else if (tabChanged) {
        if (visibleLeft < startInset) {
          nextLeft = clampForActive(alignStart());
        } else if (el.clientWidth - visibleRight < endInset) {
          nextLeft = clampForActive(alignEnd());
        } else {
          nextLeft = clampForActive(
            tabLeft - (el.clientWidth - target.offsetWidth) / 2,
          );
        }
      } else if (visibleLeft < startInset) {
        nextLeft = clampForActive(alignStart());
      } else if (el.clientWidth - visibleRight < endInset) {
        nextLeft = clampForActive(alignEnd());
      } else {
        nextLeft = clampForActive(nextLeft);
      }

      el.scrollTo({
        left: clampScroll(nextLeft),
        behavior: "smooth",
      });
      window.setTimeout(updateScrollAffordance, 320);
    },
    [categoryIds, tabOffsetLeft, tabOffsetRight, updateScrollAffordance],
  );

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    updateScrollAffordance();
    el.addEventListener("scroll", updateScrollAffordance, { passive: true });
    const onLayoutChange = () => {
      updateScrollAffordance();
      requestAnimationFrame(() =>
        scrollCategoryIntoView(activeCategory, activeCategory),
      );
    };
    const ro = new ResizeObserver(onLayoutChange);
    ro.observe(el);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", onLayoutChange);
    return () => {
      el.removeEventListener("scroll", updateScrollAffordance);
      ro.disconnect();
      window.removeEventListener("resize", onLayoutChange);
    };
  }, [
    activeCategory,
    categories.length,
    scrollCategoryIntoView,
    updateScrollAffordance,
  ]);

  useEffect(() => {
    const previousCategoryId = prevCategoryRef.current;
    prevCategoryRef.current = activeCategory;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollCategoryIntoView(activeCategory, previousCategoryId);
      });
    });
    const t = window.setTimeout(updateScrollAffordance, 80);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
  }, [activeCategory, scrollCategoryIntoView, updateScrollAffordance]);

  const scrollByChips = (direction: -1 | 1) => {
    const el = contRef.current;
    if (!el || categoryIds.length < 2) return;

    const first = btnRefs.current[categoryIds[0]];
    const second = btnRefs.current[categoryIds[1]];
    let step = Math.max(200, Math.round(el.clientWidth * 0.55));
    if (first && second) {
      const a = first.parentElement ?? first;
      const b = second.parentElement ?? second;
      step = Math.max(step, Math.abs(b.offsetLeft + b.offsetWidth - a.offsetLeft));
      step = Math.min(step * 2, Math.round(el.clientWidth * 0.9));
    }

    el.scrollBy({ left: step * direction, behavior: "smooth" });
    window.setTimeout(updateScrollAffordance, 320);
  };

  const navBtnClass = (enabled: boolean) =>
    cn(
      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#0E3D2D]/25 bg-white text-[#0E3D2D] shadow-sm transition-opacity hover:border-[#0E3D2D]/50 hover:bg-[#0E3D2D]/5",
      enabled ? "opacity-100" : "pointer-events-none opacity-0",
    );

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all",
      active
        ? "border-[#0E3D2D] bg-[#0E3D2D] text-white shadow-sm"
        : "border-border bg-white text-foreground hover:border-[#0E3D2D]/40 hover:text-[#0E3D2D]",
    );

  const countClass = (active: boolean) =>
    cn(
      "rounded-full px-1.5 py-0.5 text-xs",
      active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
    );

  return (
    <div className="shop-category-track" data-testid="shop-category-bar">
      <button
        type="button"
        aria-label="Scroll categories left"
        disabled={!showPrev}
        onClick={() => scrollByChips(-1)}
        className={navBtnClass(showPrev)}
        data-testid="btn-category-scroll-prev"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div
        ref={contRef}
        className="shop-category-scroll"
        role="tablist"
        aria-label="Product categories"
        onWheel={(e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).scrollBy({
              left: e.deltaY,
              behavior: "auto",
            });
            updateScrollAffordance();
          }
        }}
      >
        <div
          ref={innerRef}
          className="inline-flex min-w-full items-center gap-2 py-0.5 ps-3 pe-3"
        >
          <span className="relative shrink-0 scroll-mx-6">
            <button
              type="button"
              ref={(r) => {
                btnRefs.current.all = r;
              }}
              onClick={() => onSelect("all")}
              className={chipClass(activeCategory === "all")}
              data-testid="btn-category-all"
              role="tab"
              aria-selected={activeCategory === "all"}
            >
              All products
            </button>
          </span>
          {categories.map((c) => {
            const active = activeCategory === c.category;
            return (
              <span
                key={c.category}
                className="relative shrink-0 scroll-mx-6"
              >
                <button
                  type="button"
                  ref={(r) => {
                    btnRefs.current[c.category] = r;
                  }}
                  onClick={() => onSelect(c.category)}
                  className={chipClass(active)}
                  data-testid={`btn-category-${c.category}`}
                  role="tab"
                  aria-selected={active}
                >
                  {categoryLabels[c.category] ?? c.category}
                  <span className={countClass(active)}>{c.count}</span>
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Scroll categories right"
        disabled={!showNext}
        onClick={() => scrollByChips(1)}
        className={navBtnClass(showNext)}
        data-testid="btn-category-scroll-next"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
