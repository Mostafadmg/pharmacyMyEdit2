import colors from "@/constants/colors";
import { useResolvedScheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current colour scheme, honouring the
 * user's manual override (system / light / dark) from ThemeContext when
 * available, falling back to the device scheme otherwise.
 */
export function useColors() {
  const scheme = useResolvedScheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
