import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

/**
 * Returns the design tokens for the current colour scheme.
 *
 * Both `light` and `dark` palettes share the exact same key set —
 * derived from the patient web's CSS variables — so consumers can
 * read any token without scheme-aware branching.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
