// App Color Palette

export const colors = {
  // Primary Colors - Islamic Green
  primary: {
    50: "#E8F5E9",
    100: "#C8E6C9",
    200: "#A5D6A7",
    300: "#81C784",
    400: "#66BB6A",
    500: "#4CAF50", // Main primary
    600: "#43A047",
    700: "#388E3C",
    800: "#2E7D32",
    900: "#1B5E20",
  },

  // Secondary Colors - Gold/Amber
  secondary: {
    50: "#FFF8E1",
    100: "#FFECB3",
    200: "#FFE082",
    300: "#FFD54F",
    400: "#FFCA28",
    500: "#FFC107", // Main secondary
    600: "#FFB300",
    700: "#FFA000",
    800: "#FF8F00",
    900: "#FF6F00",
  },

  // Neutral Colors
  neutral: {
    0: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
    1000: "#000000",
  },

  // Semantic Colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Arabic Text Colors
  arabic: {
    text: "#1A1A1A",
    textLight: "#333333",
  },
};

export const lightTheme = {
  background: colors.neutral[0],
  backgroundSecondary: colors.neutral[50],
  surface: colors.neutral[0],
  surfaceVariant: colors.neutral[100],
  text: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textTertiary: colors.neutral[500],
  border: colors.neutral[200],
  divider: colors.neutral[200],
  primary: colors.primary[500],
  primaryVariant: colors.primary[700],
  secondary: colors.secondary[500],
  onPrimary: colors.neutral[0],
  onSecondary: colors.neutral[900],
  arabicText: colors.arabic.text,
  cardBackground: colors.neutral[0],
  tabBarBackground: colors.neutral[0],
  tabBarActive: colors.primary[500],
  tabBarInactive: colors.neutral[500],
};

export const darkTheme = {
  background: colors.neutral[900],
  backgroundSecondary: colors.neutral[800],
  surface: colors.neutral[800],
  surfaceVariant: colors.neutral[700],
  text: colors.neutral[50],
  textSecondary: colors.neutral[400],
  textTertiary: colors.neutral[500],
  border: colors.neutral[700],
  divider: colors.neutral[700],
  primary: colors.primary[400],
  primaryVariant: colors.primary[300],
  secondary: colors.secondary[400],
  onPrimary: colors.neutral[900],
  onSecondary: colors.neutral[900],
  arabicText: colors.neutral[50],
  cardBackground: colors.neutral[800],
  tabBarBackground: colors.neutral[900],
  tabBarActive: colors.primary[400],
  tabBarInactive: colors.neutral[500],
};

export type Theme = typeof lightTheme;
