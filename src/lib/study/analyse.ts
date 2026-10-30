import { getQuestionsByIds, type Subject } from "@/lib/question-bank";
import type { IconName } from "@/lib/icon-names";
import { SYLLABUS, type SubjectSyllabus } from "./syllabus";

export type Strength = "strong" | "steady" | "developing" | "priority";

export interface SubjectBreakdown {
  quizSubject: Subject;
  label: string;
  icon: IconName;
  correct: number;
  attempted: number;
  total: number;
  percentage: number;
  strength: Strength;
  /** MSCE subjects judged by this quiz category. */
  msceSubjects: SubjectSyllabus[];
  advice: string;
}

const SUBJECT_META: Record<Subject, { label: string; icon: IconName }> = {
  Science: { label: "Sciences", icon: "science" },
  Math: { label: "Mathematics", icon: "study" },
  "Computer Studies": { label: "Computer Studies", icon: "computer" },
  "Technical Arts": { label: "Technical Arts", icon: "construction" },
  Humanities: { label: "Humanities", icon: "books" },
  Language: { label: "Languages", icon: "communication" },
  "Home Economics": { label: "Home Economics", icon: "food" },
  "Bible Knowledge": { label: "Bible Knowledge", icon: "library" },
};

export function strengthFor(percentage: number): Strength {
  if (percentage >= 75) return "strong";
  if (percentage >= 55) return "steady";
  if (percentage >= 35) return "developing";
  return "priority";
}

export const STRENGTH_META: Record<
  Strength,
  { label: string; tone: string; badge: string; bar: string }
> = {
  strong: {
    label: "Strong",
    tone: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bar: "bg-emerald-500",
  },
  steady: {
    label: "Steady",
    tone: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    bar: "bg-blue-500",
  },
  developing: {
    label: "Developing",
    tone: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    bar: "bg-amber-500",
  },
  priority: {
    label: "Needs work",
    tone: "text-red-700",
    badge: "bg-red-100 text-red-800 border-red-200",
    bar: "bg-red-500",
  },
};

function adviceFor(label: string, strength: Strength): string {
  switch (strength) {
    case "strong":
      return `${label} is clearly a strength. Keep it warm with one short revision session a week and aim for a distinction rather than just a credit.`;
    case "steady":
      return `${label} is solid but not yet safe. Targeted practice on the weaker topics could lift this into distinction territory.`;
    case "developing":
      return `${label} needs regular attention. Work through the core topics first - they carry the most marks in the MSCE paper.`;
    case "priority":
      return `${label} is your biggest opportunity. Start with the core topics and past paper questions; this is where extra hours will gain you the most marks.`;
  }
}

/**
 * Turns a completed session into a per-subject picture, so the student can see
 * exactly which subjects to plan study time around.
 */
export function analyseSession(
  questionIds: number[],
  answers: Record<string, number>,
): SubjectBreakdown[] {
  const paper = getQuestionsByIds(questionIds);
  const buckets = new Map<Subject, { correct: number; attempted: number; total: number }>();

  for (const question of paper) {
    const bucket = buckets.get(question.subject) ?? { correct: 0, attempted: 0, total: 0 };
    bucket.total += 1;
    const given = answers[String(question.id)];
    if (given !== undefined) {
      bucket.attempted += 1;
      // A value of 4 is awarded only for the correct option.
      if (given === 4) bucket.correct += 1;
    }
    buckets.set(question.subject, bucket);
  }

  const rows: SubjectBreakdown[] = [];
  for (const [quizSubject, bucket] of buckets) {
    const meta = SUBJECT_META[quizSubject];
    const percentage = bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : 0;
    const strength = strengthFor(percentage);
    rows.push({
      quizSubject,
      label: meta.label,
      icon: meta.icon,
      correct: bucket.correct,
      attempted: bucket.attempted,
      total: bucket.total,
      percentage,
      strength,
      msceSubjects: SYLLABUS.filter((item) => item.quizSubject === quizSubject),
      advice: adviceFor(meta.label, strength),
    });
  }

  // Weakest first - that is where planning matters most.
  return rows.sort((a, b) => a.percentage - b.percentage);
}

/** Suggests which MSCE subjects the student should put on their study plan. */
export function suggestedFocusSubjects(breakdown: SubjectBreakdown[]): string[] {
  const suggestions: string[] = ["English", "Mathematics"];

  for (const row of breakdown) {
    if (row.strength === "priority" || row.strength === "developing") {
      const first = row.msceSubjects[0];
      if (first && !suggestions.includes(first.subject)) {
        suggestions.push(first.subject);
      }
    }
  }

  // Fill up to four with the student's stronger areas so the plan stays balanced.
  for (const row of [...breakdown].reverse()) {
    if (suggestions.length >= 4) break;
    const first = row.msceSubjects[0];
    if (first && !suggestions.includes(first.subject)) suggestions.push(first.subject);
  }

  return suggestions.slice(0, 4);
}
