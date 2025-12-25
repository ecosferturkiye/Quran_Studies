import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import { colors, typography, spacing } from "../../../src/theme";
import { surahs } from "../../../src/data/surahs";
import { fetchVersesByChapter, Verse } from "../../../src/services/quranService";
import { Ionicons } from "@expo/vector-icons";

type TefsirSource = "studyquran" | "kuranyolu" | "hayrat";

function ToggleButton({
  label,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toggleButton,
        { borderWidth: 1, borderColor: activeColor },
        isActive && { backgroundColor: activeColor },
        pressed && styles.toggleButtonPressed,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.toggleText,
          { color: isActive ? "#fff" : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Single verse display for Study Quran
function StudyQuranVerseCard({
  verse,
  theme,
}: {
  verse: Verse;
  theme: any;
}) {
  const commentaryColor = "#8B5CF6";

  return (
    <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumber, { backgroundColor: commentaryColor }]}>
          <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
        </View>
      </View>

      <Text style={[styles.arabicText, { color: theme.text }]} selectable>
        {verse.textArabic}
      </Text>

      {verse.transliteration && (
        <Text style={[styles.transliterationText, { color: commentaryColor }]}>
          {verse.transliteration}
        </Text>
      )}

      {verse.translationStudyQuran && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: commentaryColor }]}>
            Translation
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]} selectable>
            {verse.translationStudyQuran}
          </Text>
        </View>
      )}

      {verse.commentaryStudyQuran ? (
        <View style={[styles.commentarySection, { borderLeftColor: commentaryColor }]}>
          <View style={styles.commentaryHeader}>
            <Ionicons name="chatbox-ellipses-outline" size={14} color={commentaryColor} />
            <Text style={[styles.commentaryLabel, { color: commentaryColor }]}>
              Study Quran Commentary
            </Text>
          </View>
          <Text style={[styles.commentaryText, { color: theme.textSecondary }]} selectable>
            {verse.commentaryStudyQuran}
          </Text>
        </View>
      ) : (
        <View style={[styles.noCommentary, { borderLeftColor: theme.border }]}>
          <Text style={[styles.noCommentaryText, { color: theme.textSecondary }]}>
            Bu ayet için Study Quran tefsiri mevcut değil.
          </Text>
        </View>
      )}
    </View>
  );
}

// Single verse display for Hayrat (Risale-i Nur based commentary)
function HayratVerseCard({
  verse,
  theme,
}: {
  verse: Verse;
  theme: any;
}) {
  const commentaryColor = "#D97706"; // Amber/orange for Hayrat

  return (
    <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumber, { backgroundColor: commentaryColor }]}>
          <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
        </View>
      </View>

      <Text style={[styles.arabicText, { color: theme.text }]} selectable>
        {verse.textArabic}
      </Text>

      {verse.translationHayrat && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: commentaryColor }]}>
            Hayrat Meali
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]} selectable>
            {verse.translationHayrat}
          </Text>
        </View>
      )}

      {verse.commentaryHayrat ? (
        <View style={[styles.commentarySection, { borderLeftColor: commentaryColor, backgroundColor: "rgba(217, 119, 6, 0.05)" }]}>
          <View style={styles.commentaryHeader}>
            <Ionicons name="library-outline" size={14} color={commentaryColor} />
            <Text style={[styles.commentaryLabel, { color: commentaryColor }]}>
              Risale-i Nur Külliyatı
            </Text>
          </View>
          <Text style={[styles.commentaryText, { color: theme.textSecondary }]} selectable>
            {verse.commentaryHayrat}
          </Text>
        </View>
      ) : (
        <View style={[styles.noCommentary, { borderLeftColor: theme.border }]}>
          <Text style={[styles.noCommentaryText, { color: theme.textSecondary }]}>
            Bu ayet için Risale-i Nur tefsiri mevcut değil.
          </Text>
        </View>
      )}
    </View>
  );
}

// Grouped verses display for Kur'an Yolu (shows all verses in range together)
function KuranYoluVerseCard({
  verses,
  startVerse,
  endVerse,
  theme,
}: {
  verses: Verse[];
  startVerse: number;
  endVerse: number;
  theme: any;
}) {
  const commentaryColor = "#059669";
  const groupedVerses = verses.filter(
    (v) => v.verseNumber >= startVerse && v.verseNumber <= endVerse
  );
  const firstVerse = groupedVerses[0];
  const isGrouped = startVerse !== endVerse;

  return (
    <View style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}>
      {/* Header showing verse range */}
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumber, { backgroundColor: commentaryColor, minWidth: isGrouped ? 50 : 32 }]}>
          <Text style={styles.verseNumberText}>
            {isGrouped ? `${startVerse}-${endVerse}` : startVerse}
          </Text>
        </View>
        {isGrouped && (
          <Text style={[styles.groupLabel, { color: commentaryColor }]}>
            ({groupedVerses.length} ayet)
          </Text>
        )}
      </View>

      {/* All verses in the group */}
      {groupedVerses.map((verse, index) => (
        <View key={verse.id} style={index > 0 ? styles.groupedVerseItem : undefined}>
          {/* Verse number badge for grouped verses */}
          {isGrouped && (
            <View style={[styles.smallVerseBadge, { backgroundColor: commentaryColor + "20" }]}>
              <Text style={[styles.smallVerseNumber, { color: commentaryColor }]}>
                {verse.verseNumber}
              </Text>
            </View>
          )}

          {/* Arabic Text */}
          <Text style={[styles.arabicText, { color: theme.text }]} selectable>
            {verse.textArabic}
          </Text>

          {/* Translation (Diyanet Meal) */}
          <Text style={[styles.mealText, { color: theme.textSecondary }]} selectable>
            {verse.translationTurkishDiyanet}
          </Text>
        </View>
      ))}

      {/* Commentary (shown once for all grouped verses) */}
      {firstVerse?.commentaryKuranYolu ? (
        <View style={[styles.commentarySection, { borderLeftColor: commentaryColor }]}>
          <View style={styles.commentaryHeader}>
            <Ionicons name="book-outline" size={14} color={commentaryColor} />
            <Text style={[styles.commentaryLabel, { color: commentaryColor }]}>
              Kur'an Yolu Tefsiri
              {isGrouped && ` (${startVerse}-${endVerse}. ayetler)`}
            </Text>
          </View>
          <Text style={[styles.commentaryText, { color: theme.textSecondary }]} selectable>
            {firstVerse.commentaryKuranYolu}
          </Text>
        </View>
      ) : (
        <View style={[styles.noCommentary, { borderLeftColor: theme.border }]}>
          <Text style={[styles.noCommentaryText, { color: theme.textSecondary }]}>
            Bu ayet için Kur'an Yolu tefsiri henüz yüklenmedi.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TefsirDetailScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tefsirSource, setTefsirSource] = useState<TefsirSource>("studyquran");

  const surah = surahs.find((s) => s.id === parseInt(surahId || "1"));

  const getPrimaryColor = () => {
    switch (tefsirSource) {
      case "studyquran": return "#8B5CF6";
      case "kuranyolu": return "#059669";
      case "hayrat": return "#D97706";
    }
  };

  const theme = isDark
    ? {
        background: colors.neutral[900],
        cardBackground: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        primary: getPrimaryColor(),
        border: colors.neutral[700],
      }
    : {
        background: colors.neutral[50],
        cardBackground: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        primary: getPrimaryColor(),
        border: colors.neutral[200],
      };

  useEffect(() => {
    async function loadVerses() {
      if (!surah) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchVersesByChapter(surah.id);
        setVerses(data);
      } catch (err) {
        setError("Ayetler yüklenemedi. Lütfen tekrar deneyin.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [surah?.id]);

  if (!surah) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.text }]}>
          Sure bulunamadı
        </Text>
      </SafeAreaView>
    );
  }

  const prevSurah = surah.id > 1 ? surahs[surah.id - 2] : null;
  const nextSurah = surah.id < 114 ? surahs[surah.id] : null;

  // Count available commentaries
  const studyQuranCount = verses.filter(v => v.commentaryStudyQuran).length;
  const kuranYoluCount = verses.filter(v => v.commentaryKuranYolu).length;
  const hayratCount = verses.filter(v => v.commentaryHayrat).length;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Tefsir</Text>
        </TouchableOpacity>
      </View>

      {/* Tefsir Source Toggle */}
      <View style={styles.toggleContainer}>
        <ToggleButton
          label={`Study Q. (${studyQuranCount})`}
          isActive={tefsirSource === "studyquran"}
          onPress={() => setTefsirSource("studyquran")}
          activeColor="#8B5CF6"
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label={`Kur'an Y. (${kuranYoluCount})`}
          isActive={tefsirSource === "kuranyolu"}
          onPress={() => setTefsirSource("kuranyolu")}
          activeColor="#059669"
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label={`Hayrat (${hayratCount})`}
          isActive={tefsirSource === "hayrat"}
          onPress={() => setTefsirSource("hayrat")}
          activeColor="#D97706"
          inactiveColor={theme.textSecondary}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.surahHeader, { backgroundColor: theme.cardBackground }]}
        >
          <View style={[styles.surahNumber, { backgroundColor: theme.primary }]}>
            <Text style={styles.surahNumberText}>{surah.id}</Text>
          </View>
          <Text style={[styles.surahNameArabic, { color: theme.text }]}>
            {surah.nameArabic}
          </Text>
          <Text style={[styles.surahNameTurkish, { color: theme.text }]}>
            {surah.nameTurkish}
          </Text>
          <Text style={[styles.surahMeta, { color: theme.textSecondary }]}>
            {tefsirSource === "studyquran"
              ? "The Study Quran - Seyyed Hossein Nasr"
              : tefsirSource === "kuranyolu"
              ? "Kur'an Yolu Tefsiri - Diyanet İşleri Başkanlığı"
              : "Hayrat Neşriyat - Risale-i Nur Külliyatı"}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Tefsir yükleniyor...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setLoading(true);
                fetchVersesByChapter(surah.id)
                  .then(setVerses)
                  .catch(() => setError("Tekrar deneyin"))
                  .finally(() => setLoading(false));
              }}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Bismillah for surahs other than Fatiha and Tawbah */}
            {surah.id !== 1 && surah.id !== 9 && (
              <View
                style={[
                  styles.bismillahCard,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <Text style={[styles.bismillahText, { color: theme.text }]}>
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </Text>
              </View>
            )}

            {tefsirSource === "studyquran" ? (
              // Study Quran: render each verse individually
              verses.map((verse) => (
                <StudyQuranVerseCard
                  key={verse.id}
                  verse={verse}
                  theme={theme}
                />
              ))
            ) : tefsirSource === "hayrat" ? (
              // Hayrat: render each verse individually with Risale-i Nur commentary
              verses.map((verse) => (
                <HayratVerseCard
                  key={verse.id}
                  verse={verse}
                  theme={theme}
                />
              ))
            ) : (
              // Kur'an Yolu: group verses by tefsir range
              (() => {
                const rendered = new Set<string>();
                return verses.map((verse) => {
                  const rangeKey = verse.kuranYoluRangeKey;
                  const startVerse = verse.kuranYoluStartVerse || verse.verseNumber;
                  const endVerse = verse.kuranYoluEndVerse || verse.verseNumber;

                  // Skip if already rendered as part of a group
                  if (rangeKey && rendered.has(rangeKey)) {
                    return null;
                  }

                  // Mark as rendered
                  if (rangeKey) {
                    rendered.add(rangeKey);
                  }

                  return (
                    <KuranYoluVerseCard
                      key={rangeKey || verse.id}
                      verses={verses}
                      startVerse={startVerse}
                      endVerse={endVerse}
                      theme={theme}
                    />
                  );
                });
              })()
            )}
          </>
        )}

        <View style={styles.navigation}>
          {prevSurah ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.cardBackground }]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/tefsir/[surahId]",
                  params: { surahId: prevSurah.id.toString() },
                })
              }
            >
              <Ionicons name="chevron-back" size={18} color={theme.primary} />
              <Text style={[styles.navButtonText, { color: theme.primary }]} numberOfLines={1}>
                {prevSurah.nameTurkish}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navPlaceholder} />
          )}

          {nextSurah ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.cardBackground }]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/tefsir/[surahId]",
                  params: { surahId: nextSurah.id.toString() },
                })
              }
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]} numberOfLines={1}>
                {nextSurah.nameTurkish}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navPlaceholder} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 17,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonPressed: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  surahHeader: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  surahNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  surahNumberText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  surahNameArabic: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  surahNameTurkish: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  surahMeta: {
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.xs,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bismillahCard: {
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  bismillahText: {
    fontSize: 24,
    textAlign: "center",
  },
  verseCard: {
    padding: spacing.lg,
    borderRadius: 14,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  verseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  verseNumberText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: "right",
    marginBottom: spacing.sm,
    fontFamily: "System",
  },
  transliterationText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "right",
    marginBottom: spacing.md,
    fontStyle: "italic",
  },
  translationSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
  },
  commentarySection: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    backgroundColor: "rgba(139, 92, 246, 0.05)",
  },
  commentaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  commentaryLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentaryText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "justify",
  },
  noCommentary: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 3,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
  },
  noCommentaryText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: spacing.sm,
  },
  groupedVerseItem: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.15)",
  },
  smallVerseBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: spacing.xs,
  },
  smallVerseNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  mealText: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    gap: 4,
    maxWidth: "48%",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navPlaceholder: {
    flex: 1,
  },
});
