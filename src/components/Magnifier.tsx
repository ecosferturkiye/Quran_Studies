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
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
  },
  arabicWord: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  translation: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  rootContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  rootLabel: {
    fontSize: 12,
  },
  rootText: {
    fontSize: 16,
    fontWeight: "600",
  },
  levelIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  levelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  verseContainer: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  word: {
    fontSize: 24,
    lineHeight: 44,
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentWord: {
    fontWeight: "700",
  },
});
