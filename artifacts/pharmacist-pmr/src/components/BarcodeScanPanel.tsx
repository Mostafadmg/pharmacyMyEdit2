import { useCallback, useState } from "react";
import { Barcode, CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import {
  MEDICATION_CATALOG,
  lookupProductByGtin,
  productMatchesPrescriptionItem,
  type ProductLookup,
} from "@/lib/medicationCatalog";
import {
  formatExpiryDisplay,
  isExpired,
  parseGs1Barcode,
} from "@/lib/gs1Barcode";
import type { PrescriptionItem } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export type ScanResult = {
  barcode: string;
  gtin: string;
  entry: ProductLookup;
  itemIndex: number;
  batch?: string;
  expiry?: string;
  serial?: string;
};

export function BarcodeScanPanel({
  items,
  verifiedIndexes,
  verifiedScans,
  onVerified,
  disabled,
}: {
  items: PrescriptionItem[];
  verifiedIndexes: Set<number>;
  verifiedScans?: Map<number, ScanResult>;
  onVerified: (result: ScanResult) => void;
  disabled?: boolean;
}) {
  const [manualCode, setManualCode] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lastScan, setLastScan] = useState<{
    barcode: string;
    ok: boolean;
    message: string;
  } | null>(null);
  const [armed, setArmed] = useState(true);

  const processBarcode = useCallback(
    async (barcode: string) => {
      const raw = barcode.trim();
      if (!raw || lookingUp) return;

      const parsed = parseGs1Barcode(raw);
      if (!parsed) {
        setLastScan({
          barcode: raw,
          ok: false,
          message: "Could not read barcode — check scan or enter GTIN manually.",
        });
        return;
      }

      setLookingUp(true);
      try {
        const { product, error } = await lookupProductByGtin(parsed.gtin);
        if (!product) {
          setLastScan({
            barcode: raw,
            ok: false,
            message: error ?? "Unknown barcode — not in medicines catalogue.",
          });
          return;
        }

        if (product.discontinued) {
          setLastScan({
            barcode: raw,
            ok: false,
            message: `${product.name} is discontinued in dm+d — check pack before dispensing.`,
          });
          return;
        }

        if (parsed.expiry && isExpired(parsed.expiry)) {
          setLastScan({
            barcode: raw,
            ok: false,
            message: `Pack expired ${formatExpiryDisplay(parsed.expiry)} — do not dispense.`,
          });
          return;
        }

        const matchIndex = items.findIndex(
          (item, idx) =>
            !verifiedIndexes.has(idx) &&
            productMatchesPrescriptionItem(product, item),
        );

        if (matchIndex < 0) {
          const label = product.strength
            ? `${product.name} ${product.strength}`
            : product.name;
          setLastScan({
            barcode: raw,
            ok: false,
            message: `Scanned ${label} — no matching unverified line on this Rx.`,
          });
          return;
        }

        const packBits = [
          parsed.batch ? `Batch ${parsed.batch}` : null,
          parsed.expiry ? `Exp ${formatExpiryDisplay(parsed.expiry)}` : null,
        ].filter(Boolean);

        onVerified({
          barcode: raw,
          gtin: parsed.gtin,
          entry: product,
          itemIndex: matchIndex,
          batch: parsed.batch,
          expiry: parsed.expiry,
          serial: parsed.serial,
        });

        const productLabel = product.strength
          ? `${product.name} ${product.strength} ${product.form}`.trim()
          : product.name;

        setLastScan({
          barcode: raw,
          ok: true,
          message: [
            `Verified ${productLabel}`,
            packBits.length > 0 ? packBits.join(" · ") : null,
            product.source === "dmd" ? "dm+d" : "demo catalogue",
          ]
            .filter(Boolean)
            .join(" — "),
        });
        setManualCode("");
      } finally {
        setLookingUp(false);
      }
    },
    [items, lookingUp, onVerified, verifiedIndexes],
  );

  useBarcodeScanner({
    enabled: armed && !disabled && !lookingUp,
    onScan: (code) => {
      void processBarcode(code);
    },
  });

  const allVerified =
    items.length > 0 && items.every((_, idx) => verifiedIndexes.has(idx));

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="pmr-label-caps flex items-center gap-2">
            <ScanLine className="h-4 w-4" />
            Scan medication
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Scan each pack barcode (linear GTIN or 2D Data Matrix) to verify
            before dispensing. USB scanners work automatically.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={armed ? "default" : "outline"}
          onClick={() => setArmed((v) => !v)}
          disabled={disabled}
        >
          {armed ? "Scanner armed" : "Scanner paused"}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void processBarcode(manualCode.trim());
              }
            }}
            placeholder="Type or scan barcode…"
            className="pl-9 font-mono"
            disabled={disabled || lookingUp}
            data-testid="input-barcode-manual"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void processBarcode(manualCode.trim())}
          disabled={disabled || lookingUp || !manualCode.trim()}
        >
          {lookingUp ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Looking up…
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </div>

      {lastScan && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
            lastScan.ok
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-rose-50 text-rose-900 border border-rose-200",
          )}
        >
          {lastScan.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-mono text-xs opacity-80">{lastScan.barcode}</div>
            <div>{lastScan.message}</div>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((item, idx) => {
          const verified = verifiedIndexes.has(idx);
          const scan = verifiedScans?.get(idx);
          return (
            <li
              key={idx}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                verified
                  ? "border-emerald-300 bg-emerald-50/80"
                  : "border-border bg-muted/20",
              )}
            >
              {verified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <ScanLine className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {item.name} {item.strength} {item.form}
                </div>
                <div className="text-xs text-muted-foreground">
                  Qty {item.quantity}
                  {scan?.batch ? ` · Batch ${scan.batch}` : null}
                  {scan?.expiry
                    ? ` · Exp ${formatExpiryDisplay(scan.expiry)}`
                    : null}
                </div>
              </div>
              <span
                className={cn(
                  "text-xs font-medium shrink-0",
                  verified ? "text-emerald-700" : "text-muted-foreground",
                )}
              >
                {verified ? "Verified" : "Awaiting scan"}
              </span>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">No items on prescription.</li>
        )}
      </ul>

      {allVerified && (
        <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          All items verified — safe to dispense and print labels.
        </div>
      )}

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium">Demo barcodes (testing)</summary>
        <ul className="mt-2 space-y-1 font-mono">
          {MEDICATION_CATALOG.slice(0, 4).map((entry) => (
            <li key={entry.barcode}>
              {entry.barcode} — {entry.name} {entry.strength}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
