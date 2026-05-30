import { useEffect, useRef, useState } from "react";
import { Mail, X } from "lucide-react";
import { MacroLibrary } from "@/components/tools/MacroLibrary";

/**
 * Sticky email-macros popout. Rendered INSIDE <main> (below the
 * contraindications popout) so it stays within the content column. Toggle with
 * the FAB, Ctrl/⌘+M, Escape, or an outside click.
 */
export function MacroLibraryFab() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onPointerDown = (e: MouseEvent) => {
      if (!open) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="pointer-events-none sticky bottom-20 z-40 flex justify-start pl-4">
      <div ref={wrapRef} className="pointer-events-auto relative max-w-[calc(100vw-1rem)]">
        {open ? (
          <div
            className="absolute bottom-full left-0 mb-3 flex h-[min(calc(100dvh-7rem),40rem)] w-[min(42rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-label="Email macros library"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-primary/5 px-3.5 py-3">
              <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
                <Mail className="h-4 w-4 text-violet-600" />
                Email Macros Library
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close macros popout"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <MacroLibrary embedded />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title="Email Macros (Ctrl+M)"
          aria-label="Email macros library"
          aria-expanded={open}
          data-testid="button-macros"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-violet-700 to-violet-500 text-white shadow-lg shadow-violet-600/40 transition-transform hover:scale-105"
        >
          <Mail className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
