// Typography Configuration

export const fontFamilies = {
  // Arabic fonts for Quran text
  arabic: "Amiri",
  arabicBold: "Amiri-Bold",

  // UI fonts
  regular: "System",
  medium: "System",
  semiBold: "System",
  bold: "System",
};

export const fontSizes = {
  // Arabic text sizes
  arabic: {
    small: 24,
    medium: 28,
    large: 34,
  },

  // UI text sizes
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 30,
  "5xl": 36,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  arabic: 2.0, // Arabic text needs more line height
};

export const fontWeights = {
  regular: "400" as const,
  medium: "500" as const,
  semiBold: "600" as const,
  bold: "700" as const,
};

export const typography = {
  // Headings
  h1: {
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
  },
  h2: {
    fontSize: fontSizes["3xl"],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
  },
  h3: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semiBold,
    lineHeight: lineHeights.normal,
  },

  // Body text
  body: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
  },

  // Labels
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },
  labelSmall: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.tight,
  },

  // Arabic Quran text
  quran: {
    fontSize: fontSizes.arabic.medium,
    fontFamily: fontFamilies.arabic,
    lineHeight: lineHeights.arabic,
  },
  quranSmall: {
    fontSize: fontSizes.arabic.small,
    fontFamily: fontFamilies.arabic,
    lineHeight: lineHeights.arabic,
  },
  quranLarge: {
    fontSize: fontSizes.arabic.large,
    fontFamily: fontFamilies.arabic,
    lineHeight: lineHeights.arabic,
  },

  // Flashcard Arabic
  flashcardArabic: {
    fontSize: 32,
    fontFamily: fontFamilies.arabic,
    lineHeight: lineHeights.arabic,
  },
};
