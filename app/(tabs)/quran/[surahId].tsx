import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useMemo } from "react";
import { colors, typography, spacing } from "../../../src/theme";
import { surahs } from "../../../src/data/surahs";
import { fetchVersesByChapter, Verse } from "../../../src/services/quranService";
import { useAudioPlayer, useWordHighlight } from "../../../src/hooks";
import { Magnifier, WordHighlightVerse } from "../../../src/components/Magnifier";
import { WordData } from "../../../src/services/wordTimingService";

function PlayIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>▶</Text>
  );
}

function PauseIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>⏸</Text>
  );
}

function StopIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color }}>⏹</Text>
  );
}

function VerseCard({
  verse,
  theme,
  showDiyanet,
  showElmalili,
  showEnglish,
  showHaleem,
  showClearQuran,
  showStudyQuran,
  isPlaying,
  isCurrentVerse,
  onPlayPress,
  words,
  currentWordIndex,
}: {
  verse: Verse;
  theme: any;
  showDiyanet: boolean;
  showElmalili: boolean;
  showEnglish: boolean;
  showHaleem: boolean;
  showClearQuran: boolean;
  showStudyQuran: boolean;
  isPlaying: boolean;
  isCurrentVerse: boolean;
  onPlayPress: () => void;
  words?: WordData[];
  currentWordIndex?: number;
}) {
  const showWordHighlight = isCurrentVerse && isPlaying && words && words.length > 0;

  return (
    <View
      style={[
        styles.verseCard,
        { backgroundColor: theme.cardBackground },
        isCurrentVerse && { borderColor: theme.primary, borderWidth: 2 },
      ]}
    >
      <View style={styles.verseHeader}>
        <View style={styles.verseHeaderLeft}>
          <View style={[styles.verseNumber, { backgroundColor: theme.primary }]}>
            <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
          </View>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: theme.primary + "20" }]}
            onPress={onPlayPress}
          >
            {isCurrentVerse && isPlaying ? (
              <PauseIcon color={theme.primary} size={16} />
            ) : (
              <PlayIcon color={theme.primary} size={16} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.verseMeta, { color: theme.textSecondary }]}>
          Sayfa {verse.pageNumber} - Cuz {verse.juzNumber}
        </Text>
      </View>

      {/* Show word-by-word highlight when playing, otherwise show normal text */}
      {showWordHighlight ? (
        <WordHighlightVerse
          words={words}
          currentWordIndex={currentWordIndex ?? -1}
          theme={theme}
        />
      ) : (
        <Text style={[styles.arabicText, { color: theme.text }]}>
          {verse.textArabic}
        </Text>
      )}

      {showDiyanet && verse.translationTurkishDiyanet && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Diyanet Meali
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]}>
            {verse.translationTurkishDiyanet}
          </Text>
        </View>
      )}

      {showElmalili && verse.translationTurkishElmalili && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Elmalili Hamdi Yazir
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]}>
            {verse.translationTurkishElmalili}
          </Text>
        </View>
      )}

      {showEnglish && verse.translationEnglish && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            English
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]}>
            {verse.translationEnglish}
          </Text>
        </View>
      )}

      {showHaleem && verse.translationHaleem && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Abdel Haleem
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]}>
            {verse.translationHaleem}
          </Text>
        </View>
      )}

      {showClearQuran && verse.translationClearQuran && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Clear Quran
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]}>
            {verse.translationClearQuran}
          </Text>
        </View>
      )}

      {showStudyQuran && verse.translationStudyQuran && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Study Quran
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]}>
            {verse.translationStudyQuran}
          </Text>
        </View>
      )}
    </View>
  );
}

function AudioPlayerBar({
  theme,
  isPlaying,
  isLoading,
  currentVerseKey,
  onTogglePlayPause,
  onStop,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: {
  theme: any;
  isPlaying: boolean;
  isLoading: boolean;
  currentVerseKey: string | null;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}) {
  if (!currentVerseKey && !isLoading) return null;

  return (
    <View style={[styles.audioBar, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.audioBarContent}>
        <Text style={[styles.audioBarText, { color: theme.text }]}>
          {isLoading ? "Yukleniyor..." : `Ayet ${currentVerseKey?.split(":")[1]}`}
        </Text>

        <View style={styles.audioControls}>
          <TouchableOpacity
            style={[styles.audioControlButton, !hasPrevious && styles.audioControlDisabled]}
            onPress={onPrevious}
            disabled={!hasPrevious}
          >
            <Text style={{ color: hasPrevious ? theme.primary : theme.textSecondary }}>
              ⏮
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.audioMainButton, { backgroundColor: theme.primary }]}
            onPress={onTogglePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : isPlaying ? (
              <PauseIcon color="#fff" size={24} />
            ) : (
              <PlayIcon color="#fff" size={24} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.audioControlButton, !hasNext && styles.audioControlDisabled]}
            onPress={onNext}
            disabled={!hasNext}
          >
            <Text style={{ color: hasNext ? theme.primary : theme.textSecondary }}>
              ⏭
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.audioControlButton} onPress={onStop}>
            <StopIcon color={theme.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SurahDetailScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDiyanet, setShowDiyanet] = useState(true);
  const [showElmalili, setShowElmalili] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [showHaleem, setShowHaleem] = useState(false);
  const [showClearQuran, setShowClearQuran] = useState(false);
  const [showStudyQuran, setShowStudyQuran] = useState(false);

  const surah = surahs.find((s) => s.id === parseInt(surahId || "1"));

  const {
    isPlaying,
    isLoading: audioLoading,
    currentVerseKey,
    progress,
    playFromVerse,
    togglePlayPause,
    stop,
    playNext,
    playPrevious,
    hasNext,
    hasPrevious,
  } = useAudioPlayer({ chapterId: surah?.id || 1 });

  // Word highlighting
  const {
    currentWord,
    currentWordIndex,
    currentVerseWords,
    getWordsForVerse,
  } = useWordHighlight({
    surahId: surah?.id || 1,
    currentVerseKey,
    playbackPositionMs: progress,
    isPlaying,
  });

  const theme = isDark
    ? {
        background: colors.neutral[900],
        cardBackground: colors.neutral[800],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        primary: colors.primary[500],
        border: colors.neutral[700],
      }
    : {
        background: colors.neutral[50],
        cardBackground: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        primary: colors.primary[500],
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
        setError("Ayetler yuklenemedi. Lutfen tekrar deneyin.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [surah?.id]);

  // Stop audio when leaving the screen
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const verseKeys = useMemo(
    () => verses.map((v) => v.verseKey),
    [verses]
  );

  const handlePlayVerse = (verseKey: string) => {
    if (currentVerseKey === verseKey && isPlaying) {
      togglePlayPause();
    } else {
      playFromVerse(verseKey, verseKeys);
    }
  };

  const handlePlayAll = () => {
    if (verseKeys.length > 0) {
      playFromVerse(verseKeys[0], verseKeys);
    }
  };

  if (!surah) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.errorText, { color: theme.text }]}>
          Sure bulunamadi
        </Text>
      </SafeAreaView>
    );
  }

  const prevSurah = surah.id > 1 ? surahs[surah.id - 2] : null;
  const nextSurah = surah.id < 114 ? surahs[surah.id] : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>
            {"<"} Geri
          </Text>
        </TouchableOpacity>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showDiyanet && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowDiyanet(!showDiyanet)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showDiyanet ? "#fff" : theme.textSecondary },
              ]}
            >
              DİB
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showElmalili && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowElmalili(!showElmalili)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showElmalili ? "#fff" : theme.textSecondary },
              ]}
            >
              EHY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showEnglish && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowEnglish(!showEnglish)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showEnglish ? "#fff" : theme.textSecondary },
              ]}
            >
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showHaleem && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowHaleem(!showHaleem)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showHaleem ? "#fff" : theme.textSecondary },
              ]}
            >
              AH
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showClearQuran && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowClearQuran(!showClearQuran)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showClearQuran ? "#fff" : theme.textSecondary },
              ]}
            >
              CQ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showStudyQuran && { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowStudyQuran(!showStudyQuran)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: showStudyQuran ? "#fff" : theme.textSecondary },
              ]}
            >
              SQ
            </Text>
          </TouchableOpacity>
        </View>
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
            {surah.ayahCount} ayet - {surah.revelationType} - Sayfa {surah.page}
          </Text>

          {/* Play All Button */}
          {!loading && verses.length > 0 && (
            <TouchableOpacity
              style={[styles.playAllButton, { backgroundColor: theme.primary }]}
              onPress={handlePlayAll}
            >
              <PlayIcon color="#fff" size={16} />
              <Text style={styles.playAllText}>Sureyi Dinle</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Ayetler yukleniyor...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
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

            {verses.map((verse) => {
              const isCurrentVerse = currentVerseKey === verse.verseKey;
              const verseWords = isCurrentVerse ? currentVerseWords : getWordsForVerse(verse.verseNumber);

              return (
                <VerseCard
                  key={verse.id}
                  verse={verse}
                  theme={theme}
                  showDiyanet={showDiyanet}
                  showElmalili={showElmalili}
                  showEnglish={showEnglish}
                  showHaleem={showHaleem}
                  showClearQuran={showClearQuran}
                  showStudyQuran={showStudyQuran}
                  isPlaying={isPlaying}
                  isCurrentVerse={isCurrentVerse}
                  onPlayPress={() => handlePlayVerse(verse.verseKey)}
                  words={verseWords}
                  currentWordIndex={isCurrentVerse ? currentWordIndex : -1}
                />
              );
            })}
          </>
        )}

        <View style={styles.navigation}>
          {prevSurah ? (
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.cardBackground }]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/quran/[surahId]",
                  params: { surahId: prevSurah.id.toString() },
                })
              }
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]}>
                {"<"} {prevSurah.nameTurkish}
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
                  pathname: "/(tabs)/quran/[surahId]",
                  params: { surahId: nextSurah.id.toString() },
                })
              }
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]}>
                {nextSurah.nameTurkish} {">"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.navPlaceholder} />
          )}
        </View>
      </ScrollView>

      {/* Bottom Container - Magnifier + Audio Player */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom }]}>
        {/* Magnifier - shows current word */}
        {isPlaying && currentWord && (
          <View style={[styles.magnifierWrapper, { backgroundColor: theme.cardBackground }]}>
            <Magnifier
              word={currentWord}
              language="tr"
              theme={theme}
            />
          </View>
        )}

        {/* Audio Player Bar */}
        <AudioPlayerBar
          theme={theme}
          isPlaying={isPlaying}
          isLoading={audioLoading}
          currentVerseKey={currentVerseKey}
          onTogglePlayPause={togglePlayPause}
          onStop={stop}
          onNext={playNext}
          onPrevious={playPrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </View>
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
    paddingVertical: spacing.md,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  toggleButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 200,
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
    marginBottom: spacing.md,
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.xs,
  },
  playAllText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
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
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  verseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  verseHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  verseMeta: {
    fontSize: 12,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    textAlign: "right",
    marginBottom: spacing.md,
    fontFamily: "System",
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
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  navButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  navPlaceholder: {
    flex: 1,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  magnifierWrapper: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  audioBar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  audioBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audioBarText: {
    fontSize: 14,
    fontWeight: "500",
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  audioControlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  audioControlDisabled: {
    opacity: 0.5,
  },
  audioMainButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
