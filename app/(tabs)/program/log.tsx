import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "../../../src/theme";
import { useProgramStore } from "../../../src/stores/programStore";
import { surahs } from "../../../src/data/surahs";
import type { ReadingType } from "../../../src/types/program";

interface ThemeColors {
  background: string;
  text: string;
  textSecondary: string;
  card: string;
  border: string;
  inputBg: string;
}

const READING_TYPES: { key: ReadingType; label: string; icon: string }[] = [
  { key: "meal", label: "Meal", icon: "book-outline" },
  { key: "tefsir", label: "Tefsir", icon: "document-text-outline" },
];

export default function LogReadingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { addSession } = useProgramStore();

  const [readingType, setReadingType] = useState<ReadingType>("meal");
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [startVerse, setStartVerse] = useState("1");
  const [endVerse, setEndVerse] = useState("7");
  const [showSurahPicker, setShowSurahPicker] = useState(false);

  const theme: ThemeColors = isDark
    ? {
        background: colors.neutral[900],
        text: colors.neutral[50],
        textSecondary: colors.neutral[400],
        card: colors.neutral[800],
        border: colors.neutral[700],
        inputBg: colors.neutral[700],
      }
    : {
        background: colors.neutral[0],
        text: colors.neutral[900],
        textSecondary: colors.neutral[600],
        card: colors.neutral[50],
        border: colors.neutral[200],
        inputBg: colors.neutral[100],
      };

  const currentSurah = surahs.find((s) => s.id === selectedSurah);
  const maxVerse = currentSurah?.ayahCount || 7;

  const handleSurahSelect = (surahId: number) => {
    setSelectedSurah(surahId);
    const surah = surahs.find((s) => s.id === surahId);
    setStartVerse("1");
    setEndVerse(String(surah?.ayahCount || 7));
    setShowSurahPicker(false);
  };

  const handleSave = () => {
    const start = parseInt(startVerse, 10) || 1;
    const end = parseInt(endVerse, 10) || start;
    const verseCount = Math.max(1, end - start + 1);

    addSession({
      date: new Date().toISOString().split("T")[0],
      type: readingType,
      surahId: selectedSurah,
      startVerse: start,
      endVerse: end,
      verseCount,
    });

    router.back();
  };

  const verseCount = Math.max(
    0,
    (parseInt(endVerse, 10) || 0) - (parseInt(startVerse, 10) || 0) + 1
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Okuma Ekle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Reading Type Selection */}
        <Text style={[styles.label, { color: theme.text }]}>Okuma Türü</Text>
        <View style={styles.typeContainer}>
          {READING_TYPES.map((type) => (
            <Pressable
              key={type.key}
              style={[
                styles.typeButton,
                {
                  backgroundColor:
                    readingType === type.key ? colors.primary[500] : theme.card,
                  borderColor:
                    readingType === type.key ? colors.primary[500] : theme.border,
                },
              ]}
              onPress={() => setReadingType(type.key)}
            >
              <Ionicons
                name={type.icon as any}
                size={20}
                color={readingType === type.key ? "#fff" : theme.text}
              />
              <Text
                style={[
                  styles.typeLabel,
                  { color: readingType === type.key ? "#fff" : theme.text },
                ]}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Surah Selection */}
        <Text style={[styles.label, { color: theme.text }]}>Sûre</Text>
        <Pressable
          style={[
            styles.surahSelector,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setShowSurahPicker(!showSurahPicker)}
        >
          <Text style={[styles.surahNumber, { color: colors.primary[500] }]}>
            {selectedSurah}.
          </Text>
          <Text style={[styles.surahName, { color: theme.text }]}>
            {currentSurah?.nameTurkish}
          </Text>
          <Text style={[styles.surahAyah, { color: theme.textSecondary }]}>
            ({maxVerse} ayet)
          </Text>
          <Ionicons
            name={showSurahPicker ? "chevron-up" : "chevron-down"}
            size={20}
            color={theme.textSecondary}
          />
        </Pressable>

        {/* Surah Picker */}
        {showSurahPicker && (
          <View
            style={[
              styles.surahPicker,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ScrollView style={styles.surahList} nestedScrollEnabled>
              {surahs.map((surah) => (
                <Pressable
                  key={surah.id}
                  style={[
                    styles.surahItem,
                    selectedSurah === surah.id && {
                      backgroundColor: colors.primary[500] + "20",
                    },
                  ]}
                  onPress={() => handleSurahSelect(surah.id)}
                >
                  <Text style={[styles.surahItemNumber, { color: colors.primary[500] }]}>
                    {surah.id}.
                  </Text>
                  <Text style={[styles.surahItemName, { color: theme.text }]}>
                    {surah.nameTurkish}
                  </Text>
                  <Text style={[styles.surahItemAyah, { color: theme.textSecondary }]}>
                    {surah.ayahCount}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Verse Range */}
        <Text style={[styles.label, { color: theme.text }]}>Ayet Aralığı</Text>
        <View style={styles.verseRow}>
          <View style={styles.verseInputContainer}>
            <Text style={[styles.verseLabel, { color: theme.textSecondary }]}>
              Başlangıç
            </Text>
            <TextInput
              style={[
                styles.verseInput,
                { backgroundColor: theme.inputBg, color: theme.text },
              ]}
              value={startVerse}
              onChangeText={setStartVerse}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
          <Text style={[styles.verseDash, { color: theme.textSecondary }]}>-</Text>
          <View style={styles.verseInputContainer}>
            <Text style={[styles.verseLabel, { color: theme.textSecondary }]}>
              Bitiş
            </Text>
            <TextInput
              style={[
                styles.verseInput,
                { backgroundColor: theme.inputBg, color: theme.text },
              ]}
              value={endVerse}
              onChangeText={setEndVerse}
              keyboardType="number-pad"
              placeholder={String(maxVerse)}
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        {/* Quick Select Buttons */}
        <View style={styles.quickSelect}>
          <Pressable
            style={[styles.quickButton, { borderColor: theme.border }]}
            onPress={() => {
              setStartVerse("1");
              setEndVerse(String(maxVerse));
            }}
          >
            <Text style={[styles.quickButtonText, { color: theme.text }]}>
              Tüm Sûre
            </Text>
          </Pressable>
          <Pressable
            style={[styles.quickButton, { borderColor: theme.border }]}
            onPress={() => {
              const start = parseInt(startVerse, 10) || 1;
              setEndVerse(String(Math.min(start + 9, maxVerse)));
            }}
          >
            <Text style={[styles.quickButtonText, { color: theme.text }]}>
              10 Ayet
            </Text>
          </Pressable>
          <Pressable
            style={[styles.quickButton, { borderColor: theme.border }]}
            onPress={() => {
              const start = parseInt(startVerse, 10) || 1;
              setEndVerse(String(Math.min(start + 19, maxVerse)));
            }}
          >
            <Text style={[styles.quickButtonText, { color: theme.text }]}>
              20 Ayet
            </Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: theme.card }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Okuma Türü:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {READING_TYPES.find((t) => t.key === readingType)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Sûre:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {currentSurah?.nameTurkish}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Toplam:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.primary[500] }]}>
              {verseCount > 0 ? `${verseCount} ayet` : "-"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: verseCount > 0 ? colors.primary[500] : theme.border,
            },
          ]}
          onPress={handleSave}
          disabled={verseCount <= 0}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </Pressable>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  surahSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
  },
  surahNumber: {
    fontSize: 16,
    fontWeight: "600",
    width: 32,
  },
  surahName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  surahAyah: {
    fontSize: 14,
  },
  surahPicker: {
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 250,
    overflow: "hidden",
  },
  surahList: {
    padding: spacing.sm,
  },
  surahItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  surahItemNumber: {
    fontSize: 14,
    fontWeight: "600",
    width: 32,
  },
  surahItemName: {
    flex: 1,
    fontSize: 15,
  },
  surahItemAyah: {
    fontSize: 13,
  },
  verseRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
  },
  verseInputContainer: {
    flex: 1,
  },
  verseLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  verseInput: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  verseDash: {
    fontSize: 24,
    paddingBottom: spacing.md,
  },
  quickSelect: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  quickButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    padding: spacing.lg,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
