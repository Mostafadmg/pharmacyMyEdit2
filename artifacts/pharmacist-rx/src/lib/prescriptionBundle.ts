import type { RxItem } from "@/lib/consultationPrescriptionItems";
import type { PrescribableOption } from "@/lib/prescribableCatalog";

export type BundleLine = {
  /** Stable key for React lists */
  id: string;
  catalogId: string;
  quantity: number;
};

export function formatGbpFromPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatLinePriceLabel(
  option: PrescribableOption,
  quantity: number,
): string {
  const unit = option.priceGbpPence;
  if (unit == null) return option.priceLabel;
  const total = unit * quantity;
  if (quantity <= 1) return option.priceLabel;
  return `${formatGbpFromPence(total)} (${quantity} × ${formatGbpFromPence(unit)})`;
}

export function bundleTotalPence(
  lines: BundleLine[],
  options: PrescribableOption[],
): number | null {
  let total = 0;
  let hasPrice = false;
  for (const line of lines) {
    if (line.quantity < 1) continue;
    const option = options.find((o) => o.catalogId === line.catalogId);
    if (!option?.priceGbpPence) continue;
    hasPrice = true;
    total += option.priceGbpPence * line.quantity;
  }
  return hasPrice ? total : null;
}

export function bundleLinesToRxItems(
  lines: BundleLine[],
  options: PrescribableOption[],
): RxItem[] {
  return lines
    .filter((l) => l.quantity >= 1)
    .map((line) => {
      const option = options.find((o) => o.catalogId === line.catalogId);
      if (!option) return null;
      return {
        name: option.name,
        strength: option.strength,
        form: option.form,
        quantity: String(line.quantity),
        sig: option.sig,
        duration: option.duration,
      };
    })
    .filter((it): it is RxItem => it != null);
}

function itemsMatchRx(a: RxItem, b: PrescribableOption): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return norm(a.name) === norm(b.name) && norm(a.strength) === norm(b.strength);
}

export function findOptionForRxItem(
  item: RxItem,
  options: PrescribableOption[],
): PrescribableOption | undefined {
  return options.find((o) => itemsMatchRx(item, o));
}

export function rxItemsToBundleLines(
  items: RxItem[],
  options: PrescribableOption[],
  defaultCatalogId: string,
): BundleLine[] {
  const valid = items.filter((it) => it.name.trim());
  if (valid.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        catalogId: defaultCatalogId,
        quantity: 1,
      },
    ];
  }
  return valid.map((item) => {
    const match = findOptionForRxItem(item, options);
    const qty = Math.max(1, Number.parseInt(String(item.quantity), 10) || 1);
    return {
      id: crypto.randomUUID(),
      catalogId: match?.catalogId ?? defaultCatalogId,
      quantity: qty,
    };
  });
}

export function formatBundleTriggerSummary(
  items: RxItem[],
  options: PrescribableOption[],
): { title: string; subtitle: string } {
  const lines = rxItemsToBundleLines(
    items,
    options,
    options[0]?.catalogId ?? "",
  );
  const parts = lines
    .filter((l) => l.quantity >= 1)
    .map((line) => {
      const opt = options.find((o) => o.catalogId === line.catalogId);
      if (!opt) return null;
      const qtyPrefix = line.quantity > 1 ? `${line.quantity}× ` : "";
      return `${qtyPrefix}${opt.name} ${opt.strength}`;
    })
    .filter(Boolean) as string[];

  const totalPence = bundleTotalPence(lines, options);
  const uniqueNames = new Set(
    lines
      .map((l) => options.find((o) => o.catalogId === l.catalogId)?.name)
      .filter(Boolean),
  );

  const title =
    parts.length === 0
      ? "Prescribed medication"
      : parts.length === 1
        ? parts[0]!
        : uniqueNames.size === 1
          ? `${[...uniqueNames][0]} bundle`
          : parts.join(" + ");

  const subtitle =
    totalPence != null
      ? `${formatGbpFromPence(totalPence)} total`
      : parts.length > 1
        ? parts.join(" · ")
        : options.find((o) => o.catalogId === lines[0]?.catalogId)?.priceLabel ??
          "";

  return { title, subtitle };
}

export function bundleLinesEqual(
  a: BundleLine[],
  b: BundleLine[],
  options: PrescribableOption[],
): boolean {
  const toKey = (lines: BundleLine[]) =>
    bundleLinesToRxItems(lines, options)
      .map((it) => `${it.name}|${it.strength}|${it.quantity}`)
      .sort()
      .join(";");
  return toKey(a) === toKey(b);
}

export function newBundleLine(
  catalogId: string,
  quantity = 1,
): BundleLine {
  return { id: crypto.randomUUID(), catalogId, quantity };
}

/** Weight-loss quick presets (catalog IDs). */
export const WL_BUNDLE_PRESETS: Array<{
  label: string;
  lines: Array<{ catalogId: string; quantity: number }>;
}> = [
  {
    label: "3× same strength",
    lines: [], // filled at runtime from first line
  },
  {
    label: "1× 2.5 mg + 2× 5 mg",
    lines: [
      { catalogId: "mounjaro-2_5", quantity: 1 },
      { catalogId: "mounjaro-5", quantity: 2 },
    ],
  },
  {
    label: "3× 5 mg",
    lines: [{ catalogId: "mounjaro-5", quantity: 3 }],
  },
];
