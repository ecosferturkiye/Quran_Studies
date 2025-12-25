import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { WordData, getWordLevelColor } from "../services/wordTimingService";

interface MagnifierProps {
  word: WordData | null;
  language: "tr" | "en" | "ur" | "hi" | "id" | "bn" | "ru";
  level?: number;
  theme: {
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

export function Magnifier({ word, language, level = 0, theme }: MagnifierProps) {
  if (!word) {
    return null;
  }

  const levelColor = level > 0 ? getWordLevelColor(word, level) : null;
  const translation = word.translations[language] || word.translations.en;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Arabic Word */}
        <Text
          style={[
            styles.arabicWord,
            { color: levelColor || theme.primary },
          ]}
        >
          {word.arabic}
        </Text>

        {/* Translation */}
        <Text style={[styles.translation, { color: theme.text }]}>
          {translation}
        </Text>

        {/* Root info (if available and level 4) */}
        {word.rootArabic && level === 4 && (
          <View style={styles.rootContainer}>
            <Text style={[styles.rootLabel, { color: theme.textSecondary }]}>
              Kok:
            </Text>
            <Text style={[styles.rootText, { color: theme.primary }]}>
              {word.rootArabic}
            </Text>
          </View>
        )}
      </View>

      {/* Level indicator */}
      {levelColor && (
        <View style={[styles.levelIndicator, { backgroundColor: levelColor }]}>
          <Text style={styles.levelText}>L{level}</Text>
        </View>
      )}
    </View>
  );
}

interface WordHighlightProps {
  words: WordData[];
  currentWordIndex: number;
  level?: number;
  theme: {
    text: string;
    primary: string;
  };
}

export function WordHighlightVerse({
  words,
  currentWordIndex,
  level = 0,
  theme,
}: WordHighlightProps) {
  return (
    <View style={styles.verseContainer}>
      {words.map((word, index) => {
        const isCurrentWord = index === currentWordIndex;
        const levelColor = level > 0 ? getWordLevelColor(word, level) : null;

        return (
          <Text
            key={index}
            style={[
              styles.word,
              { color: levelColor || theme.text },
              isCurrentWord && styles.currentWord,
              isCurrentWord && { backgroundColor: theme.primary + "30" },
            ]}
          >
            {word.arabic}{" "}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingVertical: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  arabicWord: {
    fontSize: 42,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  translation: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
  },
  rootContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  rootLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  rootText: {
    fontSize: 18,
    fontWeight: "700",
  },
  levelIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  levelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  verseContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  word: {
    fontSize: 26,
    lineHeight: 52,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 6,
  },
  currentWord: {
    fontWeight: "700",
  },
});
