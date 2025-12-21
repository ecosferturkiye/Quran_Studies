// SM-2 Spaced Repetition Algorithm Implementation
import type {
  CardProgress,
  LearningCategory,
  MasteryLevel,
  ReviewQuality,
  UserRating,
} from "../../types";

/**
 * Initializes a new card progress entry
 */
export function initializeCardProgress(
  id: string,
  category: LearningCategory
): CardProgress {
  return {
    id,
    category,
    repetitions: 0,
    easeFactor: 2.5, // Starting ease factor
    interval: 0,
    nextReviewDate: new Date().toISOString(),
    lastReviewDate: new Date().toISOString(),
    masteryLevel: "new",
  };
}

/**
 * Maps user-friendly rating to SM-2 quality score
 */
export function mapUserRatingToQuality(rating: UserRating): ReviewQuality {
  switch (rating) {
    case "again":
      return 1; // Complete blackout, need to relearn
    case "hard":
      return 3; // Correct with difficulty
    case "good":
      return 4; // Correct after hesitation
    case "easy":
      return 5; // Perfect recall
  }
}

/**
 * Determines mastery level based on repetitions and interval
 */
function calculateMasteryLevel(
  repetitions: number,
  interval: number
): MasteryLevel {
  if (repetitions === 0) {
    return "new";
  } else if (repetitions < 3) {
    return "learning";
  } else if (interval < 21) {
    return "reviewing";
  } else {
    return "mastered";
  }
}

/**
 * Calculates the next review date and updates card progress
 * using the SM-2 algorithm
 */
export function calculateNextReview(
  card: CardProgress,
  quality: ReviewQuality
): CardProgress {
  let { repetitions, easeFactor, interval } = card;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1; // First review: 1 day
    } else if (repetitions === 1) {
      interval = 6; // Second review: 6 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset progress
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (minimum 1.3 to prevent too-easy cards)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  // Determine mastery level
  const masteryLevel = calculateMasteryLevel(repetitions, interval);

  return {
    ...card,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
    interval,
    nextReviewDate: nextDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
    masteryLevel,
  };
}

/**
 * Gets cards that are due for review
 */
export function getCardsForReview(
  cards: CardProgress[],
  limit: number = 20
): CardProgress[] {
  const now = new Date();

  return cards
    .filter((card) => new Date(card.nextReviewDate) <= now)
    .sort((a, b) => {
      // Priority: new cards first, then by how overdue they are
      const priority: Record<MasteryLevel, number> = {
        new: 0,
        learning: 1,
        reviewing: 2,
        mastered: 3,
      };

      if (priority[a.masteryLevel] !== priority[b.masteryLevel]) {
        return priority[a.masteryLevel] - priority[b.masteryLevel];
      }

      // Sort by overdue time
      return (
        new Date(a.nextReviewDate).getTime() -
        new Date(b.nextReviewDate).getTime()
      );
    })
    .slice(0, limit);
}

/**
 * Calculates statistics for a set of cards
 */
export function calculateStats(cards: CardProgress[]) {
  const total = cards.length;
  const mastered = cards.filter((c) => c.masteryLevel === "mastered").length;
  const learning = cards.filter((c) => c.masteryLevel === "learning").length;
  const reviewing = cards.filter((c) => c.masteryLevel === "reviewing").length;
  const newCards = cards.filter((c) => c.masteryLevel === "new").length;

  const dueNow = cards.filter(
    (c) => new Date(c.nextReviewDate) <= new Date()
  ).length;

  return {
    total,
    mastered,
    learning,
    reviewing,
    new: newCards,
    dueNow,
    masteryPercentage: total > 0 ? Math.round((mastered / total) * 100) : 0,
  };
}

/**
 * Estimates the next interval for a given rating (for UI preview)
 */
export function estimateNextInterval(
  card: CardProgress,
  rating: UserRating
): string {
  const quality = mapUserRatingToQuality(rating);
  const updated = calculateNextReview({ ...card }, quality);

  if (updated.interval === 0 || updated.interval === 1) {
    return "1 day";
  } else if (updated.interval < 7) {
    return `${updated.interval} days`;
  } else if (updated.interval < 30) {
    const weeks = Math.round(updated.interval / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else {
    const months = Math.round(updated.interval / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  }
}
