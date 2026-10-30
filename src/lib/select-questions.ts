import {
  HUMANITIES_SUBJECTS,
  SCIENCE_SUBJECTS,
  cognitiveLevelOf,
  getQuestionsByIds,
  questionBank,
  type CognitiveLevel,
  type Difficulty,
  type Question,
} from "./question-bank";
import {
  QUESTION_SUBJECTS_BY_STUDENT_SUBJECT,
  isStudentSubject,
} from "./student-subjects";

/** Deterministic pseudo-random generator so a paper can be rebuilt from its seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const PHASES: Difficulty[] = ["Easy", "Medium", "Hard"];

export type PaperType =
  | "balanced"
  | "sciences"
  | "humanities"
  | "math"
  | "computer"
  | "technical"
  | "language"
  | "home-economics"
  | "bible-knowledge";

/** 30 questions: 10 per phase, split 5 Sciences-stream + 5 Humanities-stream for balanced papers. */
export const QUESTIONS_PER_PHASE_PER_STREAM = 5;
export const TOTAL_QUESTIONS = PHASES.length * QUESTIONS_PER_PHASE_PER_STREAM * 2;

/**
 * Builds a unique paper for a student.
 *
 * - No question can appear twice in the same paper.
 * - `usage` (how many times each question has already been served) is used so the
 *   least-used questions are handed out first. Two students sitting back to back
 *   therefore receive substantially different papers.
 * - A random tie-break keeps papers from becoming predictable.
 */
export function buildPaper(
  seed: number,
  usage: Record<number, number> = {},
  paperType: PaperType = "balanced",
): number[] {
  const random = mulberry32(seed);

  const rankedPool = (pool: Question[]) =>
    shuffle(pool, random).sort((a, b) => (usage[a.id] ?? 0) - (usage[b.id] ?? 0));

  // ── Balanced paper: the original behaviour ──
  if (paperType === "balanced") {
    const chosen: number[] = [];

    for (const phase of PHASES) {
      for (const subjects of [SCIENCE_SUBJECTS, HUMANITIES_SUBJECTS]) {
        const pool = questionBank.filter(
          (question) => question.difficulty === phase && subjects.includes(question.subject),
        );

        const ranked = rankedPool(pool);
        const picked: Question[] = [];
        const subjectCount = new Map<string, number>();
        const maxPerSubject = Math.ceil(QUESTIONS_PER_PHASE_PER_STREAM / subjects.length) + 1;

        for (const question of ranked) {
          if (picked.length >= QUESTIONS_PER_PHASE_PER_STREAM) break;
          const used = subjectCount.get(question.subject) ?? 0;
          if (used >= maxPerSubject) continue;
          picked.push(question);
          subjectCount.set(question.subject, used + 1);
        }

        for (const question of ranked) {
          if (picked.length >= QUESTIONS_PER_PHASE_PER_STREAM) break;
          if (!picked.includes(question)) picked.push(question);
        }

        chosen.push(...picked.map((question) => question.id));
      }
    }

    const unique = [...new Set(chosen)];
    const order = new Map(PHASES.map((phase, index) => [phase, index]));
    return unique.sort((a, b) => {
      const qa = questionBank.find((q) => q.id === a);
      const qb = questionBank.find((q) => q.id === b);
      if (!qa || !qb) return 0;
      const diff = (order.get(qa.difficulty) ?? 0) - (order.get(qb.difficulty) ?? 0);
      return diff !== 0 ? diff : a - b;
    });
  }

  // ── Student-chosen focused papers ──
  const subjectMap: Record<Exclude<PaperType, "balanced" | "sciences" | "humanities">, Question["subject"]> = {
    math: "Math",
    computer: "Computer Studies",
    technical: "Technical Arts",
    language: "Language",
    "home-economics": "Home Economics",
    "bible-knowledge": "Bible Knowledge",
  };

  const streamSubjects: Record<"sciences" | "humanities", Question["subject"][]> = {
    sciences: SCIENCE_SUBJECTS,
    humanities: HUMANITIES_SUBJECTS,
  };

  const chosen: number[] = [];
  const perPhase = TOTAL_QUESTIONS // 30 total
    / PHASES.length; // 10 per phase

  for (const phase of PHASES) {
    let pool: Question[] = [];

    if (paperType === "sciences" || paperType === "humanities") {
      const allowed = streamSubjects[paperType];
      pool = questionBank.filter(
        (question) => question.difficulty === phase && allowed.includes(question.subject),
      );
    } else {
      const targetSubject = subjectMap[paperType];
      pool = questionBank.filter(
        (question) => question.difficulty === phase && question.subject === targetSubject,
      );

      // If a single subject runs short in a phase, backfill from closely-related subjects.
      if (pool.length < perPhase) {
        const fallbackSubjects: Record<Question["subject"], Question["subject"][]> = {
          Science: ["Science", "Math"],
          Math: ["Math", "Science"],
          "Computer Studies": ["Computer Studies", "Math", "Science"],
          "Technical Arts": ["Technical Arts", "Math"],
          Humanities: ["Humanities", "Language"],
          Language: ["Language", "Humanities"],
          "Home Economics": ["Home Economics", "Science", "Humanities"],
          "Bible Knowledge": ["Bible Knowledge", "Humanities", "Language"],
        };
        const allowed = fallbackSubjects[targetSubject];
        pool = questionBank.filter(
          (question) => question.difficulty === phase && allowed.includes(question.subject),
        );
      }
    }

    const ranked = rankedPool(pool);
    const picked = ranked.slice(0, Math.min(perPhase, ranked.length));
    chosen.push(...picked.map((question) => question.id));
  }

  const unique = [...new Set(chosen)];
  const order = new Map(PHASES.map((phase, index) => [phase, index]));
  return unique.sort((a, b) => {
    const qa = questionBank.find((q) => q.id === a);
    const qb = questionBank.find((q) => q.id === b);
    if (!qa || !qb) return 0;
    const diff = (order.get(qa.difficulty) ?? 0) - (order.get(qb.difficulty) ?? 0);
    return diff !== 0 ? diff : a - b;
  });
}

export function buildPaperForSubjects(
  seed: number,
  usage: Record<number, number>,
  selectedSubjects: string[],
): number[] {
  const allowedSubjects = new Set(
    selectedSubjects
      .filter(isStudentSubject)
      .flatMap((subject) => QUESTION_SUBJECTS_BY_STUDENT_SUBJECT[subject]),
  );
  if (allowedSubjects.size === 0) return [];

  const random = mulberry32(seed);
  const chosen: number[] = [];
  for (const phase of PHASES) {
    const ranked = shuffle(
      questionBank.filter(
        (question) =>
          question.difficulty === phase && allowedSubjects.has(question.subject),
      ),
      random,
    ).sort((a, b) => (usage[a.id] ?? 0) - (usage[b.id] ?? 0));
    chosen.push(...ranked.slice(0, TOTAL_QUESTIONS / PHASES.length).map((question) => question.id));
  }

  return chosen;
}

/** Shuffles the answer options of a question so the correct letter moves around. */
export function shuffleOptions(question: Question, seed: number): Question {
  const random = mulberry32(seed * 7919 + question.id);
  const shuffled = shuffle(question.options, random).map((option, index) => ({
    ...option,
    label: ["A", "B", "C", "D"][index],
  }));
  return { ...question, options: shuffled };
}

/**
 * Reports how many Recall / Apply / Analyse questions are in a built paper,
 * so students and teachers can see the paper genuinely tests higher-order
 * thinking, not just memorisation.
 */
export function paperCognitiveBreakdown(
  questionIds: number[],
): Record<CognitiveLevel, number> {
  const counts: Record<CognitiveLevel, number> = { recall: 0, application: 0, analysis: 0 };
  for (const question of getQuestionsByIds(questionIds)) {
    counts[cognitiveLevelOf(question)] += 1;
  }
  return counts;
}
