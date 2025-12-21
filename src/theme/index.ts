// Theme exports
export * from "./colors";
export * from "./typography";
export * from "./spacing";

import { lightTheme, darkTheme, type Theme } from "./colors";
import { typography } from "./typography";
import { spacing, borderRadius, shadows, layout } from "./spacing";

export const theme = {
  light: {
    colors: lightTheme,
    typography,
    spacing,
    borderRadius,
    shadows,
    layout,
  },
  dark: {
    colors: darkTheme,
    typography,
    spacing,
    borderRadius,
    shadows,
    layout,
  },
};

export type AppTheme = typeof theme.light;
