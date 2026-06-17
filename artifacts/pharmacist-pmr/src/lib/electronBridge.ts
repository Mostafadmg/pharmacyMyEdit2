export type EdmPmrPrinter = {
  name: string;
  displayName: string;
  isDefault: boolean;
};

export type EdmPmrBridge = {
  isDesktop: boolean;
  platform: string;
  getVersion: () => Promise<string>;
  listPrinters: () => Promise<EdmPmrPrinter[]>;
  printLabels: (
    html: string,
    options?: { silent?: boolean; deviceName?: string },
  ) => Promise<{ ok: boolean }>;
};

declare global {
  interface Window {
    edmPmr?: EdmPmrBridge;
  }
}

export function isDesktopApp(): boolean {
  return Boolean(window.edmPmr?.isDesktop);
}

export function getDesktopBridge(): EdmPmrBridge | null {
  return window.edmPmr ?? null;
}
