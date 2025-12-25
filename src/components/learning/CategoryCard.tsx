import { View, Text, StyleSheet, Pressable, useColorScheme } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, typography, spacing } from "../../theme";
import type { LearningCategory } from "../../types";

interface CategoryCardProps {
  category: LearningCategory;
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  onPress: () => void;
}

const CATEGORY_INFO: Record<
  LearningCategory,
  { title: string; subtitle: string; color: string }
> = {
  words: {
    title: "Kelimeler",
    subtitle: "En sık kullanılan 305 kelime",
    color: colors.primary[500],
  },
  twogram: {
    title: "İkili İfadeler",
    subtitle: "200 yaygın ikili kalıp",
    color: colors.secondary[500],
  },
  threegram: {
    title: "Üçlü İfadeler",
    subtitle: "200 yaygın üçlü kalıp",
    color: colors.info,
  },
};

function BookIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5.5A2.5 2.5 0 016.5 3H20v14H6.5A2.5 2.5 0 004 19.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CategoryCard({
  category,
  totalCards,
  masteredCards,
  dueCards,
  onPress,
}: CategoryCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const info = CATEGORY_INFO[category];
  const progress = totalCards > 0 ? (masteredCards / totalCards) * 100 : 0;

  const theme = isDark
    ? {
        cardBg: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        progressBg: colors.neutral[700],
      }
    : {
        cardBg: colors.neutral[50],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        progressBg: colors.neutral[200],
      };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.cardBg, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: info.color + "20" }]}>
          <BookIcon color={info.color} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]}>{info.title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {info.subtitle}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: theme.progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: info.color },
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: info.color }]}>{masteredCards}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Öğrenildi
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: theme.text }]}>{totalCards}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam</Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              { color: dueCards > 0 ? colors.warning : theme.textSecondary },
            ]}
          >
            {dueCards}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
            Bekleyen
          </Text>
        </View>
      </View>

      {/* Start Button */}
      <Pressable
        style={[styles.startButton, { backgroundColor: info.color }]}
        onPress={onPress}
      >
        <Text style={styles.startButtonText}>
          {dueCards > 0 ? `${dueCards} Kart Çalış` : "Çalış"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.bodySmall.fontSize,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.h4.fontSize,
    fontWeight: "600",
  },
  statLabel: {
    fontSize: typography.labelSmall.fontSize,
    marginTop: 2,
  },
  startButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.fontSize,
  },
});
