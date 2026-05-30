import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { ContraindicationsDialog } from "@/components/tools/ContraindicationsDialog";

/**
 * Sticky contraindications launcher. Opens a centered modal (same size as the
 * Messages tab macro composer). Toggle with the FAB or Ctrl/⌘+K.
 */
export function ContraindicationsFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="pointer-events-none sticky bottom-36 z-40 flex justify-start pl-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Contraindications Reference (Ctrl+K)"
          aria-label="Contraindications reference"
          aria-expanded={open}
          data-testid="button-contraindications"
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-red-600 to-red-500 text-white shadow-lg shadow-rose-600/40 transition-transform hover:scale-105"
        >
          <TriangleAlert className="h-6 w-6" />
        </button>
      </div>

      <ContraindicationsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
