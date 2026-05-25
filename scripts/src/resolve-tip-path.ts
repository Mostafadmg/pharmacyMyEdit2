/** Resolve catalog slug to TIP product path. */
const OUR_TO_TIP_CATEGORY: Record<string, string[]> = {
  "weight-loss": ["weight-loss"],
  "erectile-dysfunction": ["erectile-dysfunction-ed"],
  "womens-health": [
    "contraceptive-pill",
    "emergency-contraception",
    "menopause-hrt",
    "thrush",
    "cystitis-uti",
    "bacterial-vaginosis-bv",
    "period-delay",
    "period-pain",
  ],
  migraine: ["migraine"],
  asthma: ["asthma"],
  acne: ["acne"],
  skin: ["eczema-dermatitis", "skin-infections", "psoriasis", "rosacea"],
  "hair-loss": ["hair-loss"],
  allergy: ["hay-fever"],
  "travel-health": ["malaria-prevention", "travellers-diarrhoea", "altitude-sickness"],
  "sexual-health": ["genital-herpes", "chlamydia", "genital-warts"],
  "eye-care": ["dry-eye", "eye-infections"],
  "pain-relief": ["pain"],
  vitamins: ["supplements", "vitamins-minerals"],
  "cold-flu": ["cold-and-flu", "cold-sores"],
  "stop-smoking": ["stop-smoking"],
  "general-health": ["general-health", "infant-child", "supplements"],
};

export function resolveTipPath(
  catalogSlug: string,
  pathMap: Record<string, string>,
  ourCategory?: string,
): string | undefined {
  if (pathMap[catalogSlug]) return pathMap[catalogSlug];

  const catalogTokens = catalogSlug.split("-").filter((t) => t.length > 2);
  const catalogCore = catalogTokens.filter((t) => !/^\d|mg|ml|g$/.test(t));

  let bestKey: string | null = null;
  let bestScore = 0;
  for (const [key, path] of Object.entries(pathMap)) {
    let score = 0;
    if (key === catalogSlug) return path;
    if (catalogSlug.startsWith(key + "-") || key.startsWith(catalogSlug + "-")) {
      score += 10;
    }
    if (catalogSlug.includes(key) || key.includes(catalogSlug)) score += 6;
    const keyTokens = key.split("-").filter((t) => t.length > 2);
    const shared = catalogCore.filter((t) => keyTokens.includes(t));
    score += shared.length * 3;
    if (
      catalogCore[0] &&
      keyTokens[0] &&
      catalogCore[0] === keyTokens[0] &&
      catalogCore.at(-1) === keyTokens.at(-1)
    ) {
      score += 8;
    }
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  if (bestKey && bestScore >= 8) return pathMap[bestKey];

  if (ourCategory) {
    const tipCats = OUR_TO_TIP_CATEGORY[ourCategory] ?? [ourCategory];
    for (const cat of tipCats) {
      const direct = `/${cat}/${catalogSlug}`;
      if (pathMap[catalogSlug]) return pathMap[catalogSlug];
      const short = catalogSlug
        .replace(/-tablets?$/i, "")
        .replace(/-capsules?$/i, "")
        .replace(/-cream$/i, "")
        .replace(/-gel$/i, "")
        .replace(/-pain-relief.*$/i, "")
        .replace(/-\d+mg.*$/i, "");
      for (const variant of [
        catalogSlug,
        short,
        catalogSlug.replace(/-250mg.*$/, "-tablets"),
      ]) {
        const candidate = `/${cat}/${variant}`;
        const slug = variant;
        if (pathMap[slug]) return pathMap[slug];
      }
    }
  }

  return undefined;
}
