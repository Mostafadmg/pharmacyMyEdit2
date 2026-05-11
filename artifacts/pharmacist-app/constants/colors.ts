/**
 * Mobile design tokens — kept in lockstep with the patient-web theme
 * (`artifacts/pharmacy/src/index.css`). Values are exact HSL→hex
 * conversions of the web CSS variables so the two clients render the
 * same brand.
 *
 *   web --background        hsl(210 40% 98%)   → #F8FAFC
 *   web --foreground        hsl(217 50% 10%)   → #0D1726
 *   web --border            hsl(210 30% 88%)   → #D7E0EA
 *   web --primary           hsl(177 71% 29%)   → #157E79  (teal)
 *   web --secondary         hsl(221 65% 19%)   → #112550  (deep navy)
 *   web --muted             hsl(210 30% 94%)   → #EBF0F4
 *   web --muted-foreground  hsl(217 20% 47%)   → #607290
 *   web --accent            hsl(38 95% 54%)    → #F9A71A  (amber)
 *   web --destructive       hsl(0 84% 60%)     → #EF4343
 *   web --radius            1rem               → 16
 *
 * Status hues (urgent / pending / approved / rejected / referred /
 * moreInfo) are intentionally kept stable across light/dark so badges
 * stay readable on both schemes — they mirror the Tailwind utility
 * colours used by the web pharmacist dashboard badges.
 */
const colors = {
  light: {
    text: "#0D1726",
    tint: "#157E79",
    background: "#F8FAFC",
    foreground: "#0D1726",
    card: "#FFFFFF",
    cardForeground: "#0D1726",
    primary: "#157E79",
    primaryForeground: "#FFFFFF",
    secondary: "#112550",
    secondaryForeground: "#FFFFFF",
    muted: "#EBF0F4",
    mutedForeground: "#607290",
    accent: "#F9A71A",
    accentForeground: "#0D1726",
    destructive: "#EF4343",
    destructiveForeground: "#FFFFFF",
    border: "#D7E0EA",
    input: "#D7E0EA",
    success: "#16A34A",
    warning: "#D97706",
    urgent: "#EF4343",
    pending: "#D97706",
    approved: "#16A34A",
    rejected: "#607290",
    referred: "#7C3AED",
    moreInfo: "#2563EB",
  },
  dark: {
    text: "#F1F5F9",
    tint: "#1B9D96",
    background: "#0F1A2E",
    foreground: "#F1F5F9",
    card: "#0F1A2E",
    cardForeground: "#F1F5F9",
    primary: "#1B9D96",
    primaryForeground: "#FFFFFF",
    secondary: "#2752B4",
    secondaryForeground: "#FFFFFF",
    muted: "#1E2A44",
    mutedForeground: "#94A3B8",
    accent: "#F9A71A",
    accentForeground: "#0F1A2E",
    destructive: "#7F1D1D",
    destructiveForeground: "#F1F5F9",
    border: "#1E2A44",
    input: "#1E2A44",
    success: "#22C55E",
    warning: "#F59E0B",
    urgent: "#F87171",
    pending: "#F59E0B",
    approved: "#22C55E",
    rejected: "#94A3B8",
    referred: "#A78BFA",
    moreInfo: "#60A5FA",
  },
  radius: 16,
};

export default colors;
