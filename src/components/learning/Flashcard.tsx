import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import * as Speech from "expo-speech";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../theme";
import type { VocabularyWord, Phrase, UserRating, SupportedLanguage } from "../../types";

// Arabic to Latin transliteration map
const ARABIC_TO_LATIN: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ء': "'",
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h',
  'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z',
  'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd', 'ط': 't',
  'ظ': 'z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h',
  'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h',
  'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
  'ْ': '', 'ّ': '', 'ٰ': 'a', 'ٓ': '',
  ' ': ' ', 'ال': 'al-',
};

function transliterate(arabic: string): string {
  let result = '';
  for (let i = 0; i < arabic.length; i++) {
    const char = arabic[i];
    result += ARABIC_TO_LATIN[char] || char;
  }
  return result;
}

// Text-to-speech function - works on web, Electron, and React Native
async function speakArabic(text: string): Promise<boolean> {
  try {
    // For React Native (iOS/Android), use expo-speech
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Speech.stop();
      await Speech.speak(text, {
        language: 'ar-SA',
        rate: 0.7,
        pitch: 1.0,
      });
      return true;
    }

    // For web/Electron, use Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      return true;
    }
  } catch (error) {
    console.log('TTS not available:', error);
  }
  return false;
}

interface FlashcardProps {
  item: VocabularyWord | Phrase;
  language: SupportedLanguage;
  onRate: (rating: UserRating) => void;
  intervalPreviews?: Record<UserRating, string>;
  showTransliteration?: boolean;
}

const RATING_COLORS: Record<UserRating, string> = {
  again: colors.error,
  hard: colors.warning,
  good: colors.success,
  easy: colors.info,
};

const RATING_LABELS: Record<UserRating, string> = {
  again: "Tekrar",
  hard: "Zor",
  good: "Iyi",
  easy: "Kolay",
};

export function Flashcard({ item, language, onRate, intervalPreviews, showTransliteration = false }: FlashcardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const rotation = useSharedValue(0);

  const theme = isDark
    ? {
        cardBg: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        border: colors.neutral[700],
        primary: colors.primary[400],
      }
    : {
        cardBg: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        border: colors.neutral[200],
        primary: colors.primary[500],
      };

  const handleFlip = () => {
    const newValue = isFlipped ? 0 : 180;
    rotation.value = withTiming(newValue, {
      duration: 400,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = useCallback(async () => {
    setIsSpeaking(true);
    try {
      await speakArabic(item.arabic);
    } catch (error) {
      console.log('Speech error:', error);
    }
    setTimeout(() => setIsSpeaking(false), 1500);
  }, [item.arabic]);

  const transliterationText = transliterate(item.arabic);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: "hidden" as const,
    };
  });

  const translation = item.translations[language] || item.translations.en;

  return (
    <View style={styles.container}>
      <Pressable onPress={handleFlip} style={styles.cardContainer}>
        {/* Front - Arabic */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
            frontAnimatedStyle,
          ]}
        >
          <Pressable
            style={[styles.speakButton, { backgroundColor: theme.primary + '20' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleSpeak();
            }}
            accessibilityLabel="Sesli oku"
          >
            <Ionicons
              name={isSpeaking ? "volume-high" : "volume-medium-outline"}
              size={28}
              color={theme.primary}
            />
          </Pressable>
          <Text style={[styles.arabicText, { color: theme.text }]}>
            {item.arabic}
          </Text>
          {showTransliteration && (
            <Text style={[styles.transliterationText, { color: theme.primary }]}>
              {transliterationText}
            </Text>
          )}
          <Text style={[styles.hintText, { color: theme.textSecondary }]}>
            Cevirmek icin dokun
          </Text>
        </Animated.View>

        {/* Back - Translation */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
            backAnimatedStyle,
          ]}
        >
          <Pressable
            style={[styles.speakButton, { backgroundColor: theme.primary + '20' }]}
            onPress={(e) => {
              e.stopPropagation();
              handleSpeak();
            }}
            accessibilityLabel="Sesli oku"
          >
            <Ionicons
              name={isSpeaking ? "volume-high" : "volume-medium-outline"}
              size={24}
              color={theme.primary}
            />
          </Pressable>
          <Text style={[styles.arabicTextSmall, { color: theme.textSecondary }]}>
            {item.arabic}
          </Text>
          {showTransliteration && (
            <Text style={[styles.transliterationTextSmall, { color: theme.primary }]}>
              {transliterationText}
            </Text>
          )}
          <Text style={[styles.translationText, { color: theme.text }]}>
            {translation}
          </Text>
          <Text style={[styles.frequencyText, { color: theme.textSecondary }]}>
            Frekans: {item.frequency}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && (
        <View style={styles.ratingContainer}>
          {(["again", "hard", "good", "easy"] as UserRating[]).map((rating) => (
            <Pressable
              key={rating}
              style={[
                styles.ratingButton,
                { backgroundColor: RATING_COLORS[rating] },
              ]}
              onPress={() => onRate(rating)}
            >
              <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              {intervalPreviews && (
                <Text style={styles.ratingInterval}>
                  {intervalPreviews[rating]}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  cardContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    maxHeight: 400,
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBack: {
    position: "absolute",
  },
  arabicText: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 72,
  },
  arabicTextSmall: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  translationText: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  frequencyText: {
    fontSize: 14,
    marginTop: spacing.lg,
  },
  hintText: {
    fontSize: 14,
    marginTop: spacing.xl,
  },
  speakButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  transliterationText: {
    fontSize: 18,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center",
  },
  transliterationTextSmall: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  ratingLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  ratingInterval: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
  },
});
