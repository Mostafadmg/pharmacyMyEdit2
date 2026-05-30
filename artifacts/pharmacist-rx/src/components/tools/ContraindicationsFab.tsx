import { useEffect, useRef, useState } from "react";

import { TriangleAlert, X } from "lucide-react";

import { ContraindicationsReference } from "@/components/tools/ContraindicationsReference";



/**

 * Sticky contraindications reference popout. Rendered INSIDE the scrollable

 * <main> so it stays within the content column (never over the sidebars), and

 * follows the page as the prescriber scrolls. Toggle with the FAB, Ctrl/⌘+K,

 * Escape, or an outside click.

 */

export function ContraindicationsFab() {

  const [open, setOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    const onKey = (e: KeyboardEvent) => {

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {

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

    <div className="pointer-events-none sticky bottom-36 z-40 flex justify-start pl-4">

      <div ref={wrapRef} className="pointer-events-auto relative max-w-[calc(100vw-1rem)]">

        {open ? (

          <div

            className="absolute bottom-full left-0 mb-3 flex w-[min(48rem,calc(100vw-2rem))] max-h-[min(calc(100dvh-9rem),44rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"

            role="dialog"

            aria-label="Contraindications reference"

          >

            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-primary/5 px-3.5 py-3">

              <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">

                <TriangleAlert className="h-4 w-4 text-red-600" />

                Contraindications Reference

              </div>

              <button

                type="button"

                onClick={() => setOpen(false)}

                aria-label="Close contraindications popout"

                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"

              >

                <X className="h-4 w-4" />

              </button>

            </div>

            <ContraindicationsReference embedded />

          </div>

        ) : null}



        <button

          type="button"

          onClick={() => setOpen((v) => !v)}

          title="Contraindications Reference (Ctrl+K)"

          aria-label="Contraindications reference"

          aria-expanded={open}

          data-testid="button-contraindications"

          className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-red-600 to-red-500 text-white shadow-lg shadow-rose-600/40 transition-transform hover:scale-105"

        >

          <TriangleAlert className="h-6 w-6" />

        </button>

      </div>

    </div>

  );

}

