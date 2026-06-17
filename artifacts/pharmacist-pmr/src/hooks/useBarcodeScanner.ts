import { useCallback, useEffect, useRef, useState } from "react";

type UseBarcodeScannerOptions = {
  enabled?: boolean;
  /** Max ms between keystrokes before buffer resets (scanner sends chars fast). */
  maxGapMs?: number;
  onScan: (barcode: string) => void;
};

/**
 * Captures USB barcode scanner input (keyboard wedge).
 * Scanners type digits quickly then send Enter.
 */
export function useBarcodeScanner({
  enabled = true,
  maxGapMs = 80,
  onScan,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const onScanRef = useRef(onScan);
  const [listening, setListening] = useState(enabled);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    setListening(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!listening) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyAtRef.current > maxGapMs) {
        bufferRef.current = "";
      }
      lastKeyAtRef.current = now;

      if (event.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (code.length >= 4) {
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [listening, maxGapMs]);

  const pause = useCallback(() => setListening(false), []);
  const resume = useCallback(() => setListening(true), []);

  return { listening, pause, resume };
}
