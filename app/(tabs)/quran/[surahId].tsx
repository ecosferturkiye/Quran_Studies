import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { colors, typography, spacing } from "../../../src/theme";
import { surahs } from "../../../src/data/surahs";
import { fetchVersesByChapter, Verse } from "../../../src/services/quranService";
import { useAudioPlayer, useWordHighlight } from "../../../src/hooks";
import { Magnifier, WordHighlightVerse } from "../../../src/components/Magnifier";
import { WordData } from "../../../src/services/wordTimingService";
import { Ionicons } from "@expo/vector-icons";

interface ThemeColors {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
}

// Single verse card - used when Diyanet grouping is not needed
function VerseCard({
  verse,
  theme,
  showTransliteration,
  showDiyanet,
  showElmalili,
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
  theme: ThemeColors;
  showTransliteration: boolean;
  showDiyanet: boolean;
  showElmalili: boolean;
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
        isCurrentVerse && styles.verseCardActive,
        isCurrentVerse && { borderColor: theme.primary },
      ]}
      accessible={true}
      accessibilityLabel={`Ayet ${verse.verseNumber}`}
    >
      <View style={styles.verseHeader}>
        <View style={styles.verseHeaderLeft}>
          <View style={[styles.verseNumber, { backgroundColor: theme.primary }]}>
            <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: theme.primary + "20" },
              pressed && styles.playButtonPressed,
            ]}
            onPress={onPlayPress}
            accessibilityRole="button"
            accessibilityLabel={isCurrentVerse && isPlaying ? "Duraklat" : "Oynat"}
            hitSlop={10}
          >
            <Ionicons
              name={isCurrentVerse && isPlaying ? "pause" : "play"}
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </View>
        <Text style={[styles.verseMeta, { color: theme.textSecondary }]}>
          Sayfa {verse.pageNumber} • Cüz {verse.juzNumber}
        </Text>
      </View>

      {showWordHighlight ? (
        <WordHighlightVerse
          words={words}
          currentWordIndex={currentWordIndex ?? -1}
          theme={theme}
        />
      ) : (
        <Text style={[styles.arabicText, { color: theme.text }]} selectable>
          {verse.textArabic}
        </Text>
      )}

      {showTransliteration && verse.transliteration && (
        <Text style={[styles.transliterationText, { color: theme.primary }]}>
          {verse.transliteration}
        </Text>
      )}

      {showDiyanet && verse.translationTurkishDiyanet && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Diyanet Meali
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]} selectable>
            {verse.translationTurkishDiyanet}
          </Text>
        </View>
      )}

      {showElmalili && verse.translationTurkishElmalili && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Elmalılı Hamdi Yazır
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]} selectable>
            {verse.translationTurkishElmalili}
          </Text>
        </View>
      )}

      {showHaleem && verse.translationHaleem && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Abdel Haleem
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
            {verse.translationHaleem}
          </Text>
        </View>
      )}

      {showClearQuran && verse.translationClearQuran && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Clear Quran
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
            {verse.translationClearQuran}
          </Text>
        </View>
      )}

      {showStudyQuran && verse.translationStudyQuran && (
        <View style={styles.translationSection}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Study Quran
          </Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
            {verse.translationStudyQuran}
          </Text>
        </View>
      )}
    </View>
  );
}

// Grouped verse card - shows multiple verses together when they share a Diyanet translation
function GroupedDiyanetVerseCard({
  verses,
  allVerses,
  startVerse,
  endVerse,
  theme,
  showTransliteration,
  showElmalili,
  showHaleem,
  showClearQuran,
  showStudyQuran,
  isPlaying,
  currentVerseKey,
  onPlayPress,
  getWordsForVerse,
  currentVerseWords,
  currentWordIndex,
}: {
  verses: Verse[];
  allVerses: Verse[];
  startVerse: number;
  endVerse: number;
  theme: ThemeColors;
  showTransliteration: boolean;
  showElmalili: boolean;
  showHaleem: boolean;
  showClearQuran: boolean;
  showStudyQuran: boolean;
  isPlaying: boolean;
  currentVerseKey: string | null;
  onPlayPress: (verseKey: string) => void;
  getWordsForVerse: (verseNumber: number) => WordData[];
  currentVerseWords?: WordData[];
  currentWordIndex?: number;
}) {
  // Get all verses in the range
  const groupedVerses = allVerses.filter(
    (v) => v.verseNumber >= startVerse && v.verseNumber <= endVerse
  );

  if (groupedVerses.length === 0) return null;

  const firstVerse = groupedVerses[0];
  const rangeLabel = startVerse === endVerse
    ? `${startVerse}`
    : `${startVerse}-${endVerse}`;

  return (
    <View
      style={[styles.verseCard, { backgroundColor: theme.cardBackground }]}
      accessible={true}
      accessibilityLabel={`Ayet ${rangeLabel}`}
    >
      {/* Header with verse range */}
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumber, { backgroundColor: theme.primary }]}>
          <Text style={[styles.verseNumberText, { fontSize: 11 }]}>{rangeLabel}</Text>
        </View>
        <Text style={[styles.verseMeta, { color: theme.textSecondary }]}>
          Sayfa {firstVerse.pageNumber} • Cüz {firstVerse.juzNumber}
        </Text>
      </View>

      {/* Arabic texts for each verse in range */}
      {groupedVerses.map((verse) => {
        const isCurrentVerse = currentVerseKey === verse.verseKey;
        const words = isCurrentVerse ? currentVerseWords : getWordsForVerse(verse.verseNumber);
        const showWordHighlight = isCurrentVerse && isPlaying && words && words.length > 0;

        return (
          <View key={verse.id} style={styles.groupedVerseItem}>
            <View style={styles.groupedVerseHeader}>
              <View style={[styles.smallVerseNumber, { backgroundColor: theme.primary + "30" }]}>
                <Text style={[styles.smallVerseNumberText, { color: theme.primary }]}>
                  {verse.verseNumber}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.smallPlayButton,
                  { backgroundColor: theme.primary + "20" },
                  pressed && styles.playButtonPressed,
                ]}
                onPress={() => onPlayPress(verse.verseKey)}
                accessibilityRole="button"
                accessibilityLabel={isCurrentVerse && isPlaying ? "Duraklat" : "Oynat"}
                hitSlop={10}
              >
                <Ionicons
                  name={isCurrentVerse && isPlaying ? "pause" : "play"}
                  size={16}
                  color={theme.primary}
                />
              </Pressable>
            </View>

            {showWordHighlight ? (
              <WordHighlightVerse
                words={words}
                currentWordIndex={currentWordIndex ?? -1}
                theme={theme}
              />
            ) : (
              <Text style={[styles.arabicText, { color: theme.text }]} selectable>
                {verse.textArabic}
              </Text>
            )}

            {showTransliteration && verse.transliteration && (
              <Text style={[styles.transliterationText, { color: theme.primary }]}>
                {verse.transliteration}
              </Text>
            )}

            {/* Show other translations per verse */}
            {showElmalili && verse.translationTurkishElmalili && (
              <View style={styles.translationSection}>
                <Text style={[styles.translationLabel, { color: theme.primary }]}>
                  Elmalılı Hamdi Yazır
                </Text>
                <Text style={[styles.translationText, { color: theme.text }]} selectable>
                  {verse.translationTurkishElmalili}
                </Text>
              </View>
            )}

            {showHaleem && verse.translationHaleem && (
              <View style={styles.translationSection}>
                <Text style={[styles.translationLabel, { color: theme.primary }]}>
                  Abdel Haleem
                </Text>
                <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
                  {verse.translationHaleem}
                </Text>
              </View>
            )}

            {showClearQuran && verse.translationClearQuran && (
              <View style={styles.translationSection}>
                <Text style={[styles.translationLabel, { color: theme.primary }]}>
                  Clear Quran
                </Text>
                <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
                  {verse.translationClearQuran}
                </Text>
              </View>
            )}

            {showStudyQuran && verse.translationStudyQuran && (
              <View style={styles.translationSection}>
                <Text style={[styles.translationLabel, { color: theme.primary }]}>
                  Study Quran
                </Text>
                <Text style={[styles.translationText, { color: theme.textSecondary }]} selectable>
                  {verse.translationStudyQuran}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Combined Diyanet translation - shown once at the end */}
      {firstVerse.translationTurkishDiyanet && (
        <View style={[styles.translationSection, styles.combinedTranslation]}>
          <Text style={[styles.translationLabel, { color: theme.primary }]}>
            Diyanet Meali (Ayet {rangeLabel})
          </Text>
          <Text style={[styles.translationText, { color: theme.text }]} selectable>
            {firstVerse.translationTurkishDiyanet}
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
  theme: ThemeColors;
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
        <View style={styles.audioBarLeft}>
          <Ionicons name="musical-notes" size={22} color={theme.primary} />
          <Text style={[styles.audioBarText, { color: theme.text }]}>
            {isLoading ? "Yükleniyor..." : `Ayet ${currentVerseKey?.split(":")[1]}`}
          </Text>
        </View>

        <View style={styles.audioControls}>
          <Pressable
            style={({ pressed }) => [
              styles.audioControlButton,
              !hasPrevious && styles.audioControlDisabled,
              pressed && hasPrevious && styles.audioControlPressed,
            ]}
            onPress={onPrevious}
            disabled={!hasPrevious}
            accessibilityLabel="Önceki ayet"
            hitSlop={10}
          >
            <Ionicons
              name="play-skip-back"
              size={24}
              color={hasPrevious ? theme.primary : theme.textSecondary}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.audioMainButton,
              { backgroundColor: theme.primary },
              pressed && styles.audioMainButtonPressed,
            ]}
            onPress={onTogglePlayPause}
            disabled={isLoading}
            accessibilityLabel={isPlaying ? "Duraklat" : "Oynat"}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#fff"
              />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.audioControlButton,
              !hasNext && styles.audioControlDisabled,
              pressed && hasNext && styles.audioControlPressed,
            ]}
            onPress={onNext}
            disabled={!hasNext}
            accessibilityLabel="Sonraki ayet"
            hitSlop={10}
          >
            <Ionicons
              name="play-skip-forward"
              size={24}
              color={hasNext ? theme.primary : theme.textSecondary}
            />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.audioControlButton,
              pressed && styles.audioControlPressed,
            ]}
            onPress={onStop}
            accessibilityLabel="Durdur"
            hitSlop={10}
          >
            <Ionicons name="stop" size={24} color={theme.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Toggle button component for cleaner code
function ToggleButton({
  label,
  isActive,
  onPress,
  activeColor,
  inactiveColor,
  borderColor,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  borderColor?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.toggleButton,
        borderColor && { borderWidth: 1, borderColor },
        isActive && { backgroundColor: activeColor },
        pressed && styles.toggleButtonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: isActive }}
      accessibilityLabel={`${label} çevirisi ${isActive ? "açık" : "kapalı"}`}
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

export default function SurahDetailScreen() {
  const { surahId } = useLocalSearchParams<{ surahId: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [showDiyanet, setShowDiyanet] = useState(true);
  const [showElmalili, setShowElmalili] = useState(false);
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

  const theme: ThemeColors = isDark
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
        setError("Ayetler yüklenemedi. Lütfen tekrar deneyin.");
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
          Sure bulunamadı
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
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>
            Sureler
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.toggleScrollView}
        contentContainerStyle={styles.toggleContainer}
      >
        <ToggleButton
          label="TL"
          isActive={showTransliteration}
          onPress={() => setShowTransliteration(!showTransliteration)}
          activeColor="#10B981"
          inactiveColor={theme.textSecondary}
          borderColor="#10B981"
        />
        <ToggleButton
          label="DİB"
          isActive={showDiyanet}
          onPress={() => setShowDiyanet(!showDiyanet)}
          activeColor={theme.primary}
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label="EHY"
          isActive={showElmalili}
          onPress={() => setShowElmalili(!showElmalili)}
          activeColor={theme.primary}
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label="AH"
          isActive={showHaleem}
          onPress={() => setShowHaleem(!showHaleem)}
          activeColor={theme.primary}
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label="CQ"
          isActive={showClearQuran}
          onPress={() => setShowClearQuran(!showClearQuran)}
          activeColor={theme.primary}
          inactiveColor={theme.textSecondary}
        />
        <ToggleButton
          label="SQ"
          isActive={showStudyQuran}
          onPress={() => setShowStudyQuran(!showStudyQuran)}
          activeColor={theme.primary}
          inactiveColor={theme.textSecondary}
        />
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        style={styles.scrollView}
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

          {!loading && verses.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.playAllButton,
                { backgroundColor: theme.primary },
                pressed && styles.playAllButtonPressed,
              ]}
              onPress={handlePlayAll}
              accessibilityRole="button"
              accessibilityLabel="Sureyi dinle"
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.playAllText}>Sureyi Dinle</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Ayetler yükleniyor...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={56} color={theme.textSecondary} />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primary },
                pressed && styles.retryButtonPressed,
              ]}
              onPress={() => {
                setLoading(true);
                fetchVersesByChapter(surah.id)
                  .then(setVerses)
                  .catch(() => setError("Tekrar deneyin"))
                  .finally(() => setLoading(false));
              }}
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </Pressable>
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

            {/* Render verses - grouped by Diyanet ranges when showDiyanet is enabled */}
            {showDiyanet ? (
              // When Diyanet is shown, group verses that share the same translation
              (() => {
                const rendered = new Set<string>();
                return verses.map((verse) => {
                  const rangeKey = verse.diyanetRangeKey;

                  // If verse is part of a range and already rendered, skip
                  if (rangeKey && rendered.has(rangeKey)) {
                    return null;
                  }

                  // Mark range as rendered
                  if (rangeKey) {
                    rendered.add(rangeKey);
                    // Render grouped card
                    return (
                      <GroupedDiyanetVerseCard
                        key={rangeKey}
                        verses={verses}
                        allVerses={verses}
                        startVerse={verse.diyanetStartVerse!}
                        endVerse={verse.diyanetEndVerse!}
                        theme={theme}
                        showTransliteration={showTransliteration}
                        showElmalili={showElmalili}
                        showHaleem={showHaleem}
                        showClearQuran={showClearQuran}
                        showStudyQuran={showStudyQuran}
                        isPlaying={isPlaying}
                        currentVerseKey={currentVerseKey}
                        onPlayPress={handlePlayVerse}
                        getWordsForVerse={getWordsForVerse}
                        currentVerseWords={currentVerseWords}
                        currentWordIndex={currentWordIndex}
                      />
                    );
                  }

                  // Verse not in a range - render normally
                  const isCurrentVerse = currentVerseKey === verse.verseKey;
                  const verseWords = isCurrentVerse ? currentVerseWords : getWordsForVerse(verse.verseNumber);

                  return (
                    <VerseCard
                      key={verse.id}
                      verse={verse}
                      theme={theme}
                      showTransliteration={showTransliteration}
                      showDiyanet={showDiyanet}
                      showElmalili={showElmalili}
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
                });
              })()
            ) : (
              // When Diyanet is not shown, render verses individually
              verses.map((verse) => {
                const isCurrentVerse = currentVerseKey === verse.verseKey;
                const verseWords = isCurrentVerse ? currentVerseWords : getWordsForVerse(verse.verseNumber);

                return (
                  <VerseCard
                    key={verse.id}
                    verse={verse}
                    theme={theme}
                    showTransliteration={showTransliteration}
                    showDiyanet={showDiyanet}
                    showElmalili={showElmalili}
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
              })
            )}
          </>
        )}

        <View style={styles.navigation}>
          {prevSurah ? (
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: theme.cardBackground },
                pressed && styles.navButtonPressed,
              ]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/quran/[surahId]",
                  params: { surahId: prevSurah.id.toString() },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Önceki sure: ${prevSurah.nameTurkish}`}
            >
              <Ionicons name="chevron-back" size={22} color={theme.primary} />
              <Text style={[styles.navButtonText, { color: theme.primary }]} numberOfLines={1}>
                {prevSurah.nameTurkish}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.navPlaceholder} />
          )}

          {nextSurah ? (
            <Pressable
              style={({ pressed }) => [
                styles.navButton,
                { backgroundColor: theme.cardBackground },
                pressed && styles.navButtonPressed,
              ]}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/quran/[surahId]",
                  params: { surahId: nextSurah.id.toString() },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Sonraki sure: ${nextSurah.nameTurkish}`}
            >
              <Text style={[styles.navButtonText, { color: theme.primary }]} numberOfLines={1}>
                {nextSurah.nameTurkish}
              </Text>
              <Ionicons name="chevron-forward" size={22} color={theme.primary} />
            </Pressable>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  backText: {
    fontSize: 18,
    fontWeight: "600",
  },
  toggleScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.sm,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    minWidth: 56,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 200,
  },
  surahHeader: {
    alignItems: "center",
    padding: spacing["2xl"],
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  surahNumber: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  surahNumberText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  surahNameArabic: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  surahNameTurkish: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  surahMeta: {
    fontSize: 15,
    marginBottom: spacing.lg,
    fontWeight: "500",
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 24,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  playAllButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  playAllText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    padding: spacing["2xl"],
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 17,
    fontWeight: "500",
  },
  errorContainer: {
    padding: spacing["2xl"],
    alignItems: "center",
  },
  errorText: {
    fontSize: 17,
    textAlign: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bismillahCard: {
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  bismillahText: {
    fontSize: 28,
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: 0.5,
  },
  verseCard: {
    padding: spacing.xl,
    borderRadius: 16,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  verseCardActive: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  verseNumberText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  verseMeta: {
    fontSize: 14,
    fontWeight: "500",
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 56,
    textAlign: "right",
    marginBottom: spacing.lg,
    fontFamily: "System",
    letterSpacing: 0.5,
  },
  transliterationText: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: "right",
    marginBottom: spacing.md,
    fontStyle: "italic",
    opacity: 0.9,
  },
  translationSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.15)",
  },
  translationLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  translationText: {
    fontSize: 17,
    lineHeight: 28,
    letterSpacing: 0.1,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing["2xl"],
    gap: spacing.lg,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    gap: 6,
    maxWidth: "48%",
  },
  navButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
    borderTopColor: "rgba(128, 128, 128, 0.15)",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "transparent",
  },
  audioBar: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.15)",
  },
  audioBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  audioBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  audioBarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  audioControlButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
  },
  audioControlPressed: {
    opacity: 0.8,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
  },
  audioControlDisabled: {
    opacity: 0.35,
  },
  audioMainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  audioMainButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  // Grouped Diyanet verse styles
  groupedVerseItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  groupedVerseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  smallVerseNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  smallVerseNumberText: {
    fontSize: 13,
    fontWeight: "700",
  },
  smallPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  combinedTranslation: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 2,
    borderTopColor: "rgba(76, 175, 80, 0.3)",
  },
});
