import { SYLLABUS_BY_SUBJECT, type SyllabusTopic } from "./syllabus";
import type { IconName } from "@/lib/icon-names";

export interface PlanTask {
  id: string;
  subject: string;
  icon: IconName;
  topic: string;
  hint: string;
  weight: SyllabusTopic["weight"];
  minutes: number;
  /** "study" = learn it, "practice" = past paper drilling, "review" = recap. */
  kind: "study" | "practice" | "review";
}

export interface PlanWeek {
  week: number;
  label: string;
  focus: string;
  tasks: PlanTask[];
  totalMinutes: number;
}

export interface StudyPlanBlueprint {
  subjects: string[];
  weeks: PlanWeek[];
  hoursPerWeek: number;
  totalTasks: number;
  sessionsPerWeek: number;
  generatedAt: Date;
}

export interface PlanInput {
  subjects: string[];
  weeks: number;
  hoursPerWeek: number;
  /** Subjects the student scored weakest in get more time. */
  prioritySubjects?: string[];
}

const WEIGHT_ORDER: Record<SyllabusTopic["weight"], number> = { core: 0, high: 1, medium: 2 };

export function clampPlanInput(input: PlanInput): Required<PlanInput> {
  return {
    subjects: input.subjects.slice(0, 6),
    weeks: Math.min(Math.max(Math.round(input.weeks) || 6, 2), 24),
    hoursPerWeek: Math.min(Math.max(Math.round(input.hoursPerWeek) || 6, 2), 30),
    prioritySubjects: input.prioritySubjects ?? [],
  };
}

/**
 * Builds a week-by-week revision timetable.
 *
 * Core topics come first, priority subjects get roughly double the slots,
 * and the final week is always a mixed past-paper review.
 */
export function buildStudyPlan(rawInput: PlanInput): StudyPlanBlueprint {
  const input = clampPlanInput(rawInput);
  const { subjects, weeks, hoursPerWeek, prioritySubjects } = input;

  // Build a weighted queue of topics per subject.
  const queues = new Map<string, PlanTask[]>();
  for (const subject of subjects) {
    const syllabus = SYLLABUS_BY_SUBJECT.get(subject);
    if (!syllabus) continue;
    const ordered = [...syllabus.topics].sort(
      (a, b) => WEIGHT_ORDER[a.weight] - WEIGHT_ORDER[b.weight],
    );
    queues.set(
      subject,
      ordered.map((topic, index) => ({
        id: `${subject}-${index}`,
        subject,
        icon: syllabus.icon,
        topic: topic.name,
        hint: topic.hint,
        weight: topic.weight,
        minutes: topic.weight === "core" ? 60 : topic.weight === "high" ? 45 : 30,
        kind: "study" as const,
      })),
    );
  }

  // How many slots each subject gets per week (priority subjects get more).
  const minutesPerWeek = hoursPerWeek * 60;
  const sessionMinutes = 45;
  const sessionsPerWeek = Math.max(subjects.length, Math.floor(minutesPerWeek / sessionMinutes));

  const planWeeks: PlanWeek[] = [];
  const cursor = new Map(subjects.map((subject) => [subject, 0]));

  // Work out which weeks teach new material, so the syllabus is paced across
  // the whole period instead of being finished in the first fortnight.
  const isReview = (week: number) => weeks > 3 && week % 4 === 0 && week !== weeks;
  let studyWeekCount = 0;
  for (let week = 1; week <= weeks; week++) {
    if (week !== weeks && !isReview(week)) studyWeekCount += 1;
  }
  studyWeekCount = Math.max(studyWeekCount, 1);
  let studyWeeksUsed = 0;

  for (let week = 1; week <= weeks; week++) {
    const isFinalWeek = week === weeks;
    const isReviewWeek = weeks > 3 && week % 4 === 0 && !isFinalWeek;
    const tasks: PlanTask[] = [];

    if (isFinalWeek) {
      // Last week: full past-paper simulation across every subject.
      for (const subject of subjects) {
        const syllabus = SYLLABUS_BY_SUBJECT.get(subject);
        if (!syllabus) continue;
        tasks.push({
          id: `${subject}-final-paper`,
          subject,
          icon: syllabus.icon,
          topic: `Full past paper under exam conditions`,
          hint: `Time yourself strictly, then mark it and list every mistake. ${syllabus.examTips[0]}`,
          weight: "core",
          minutes: 90,
          kind: "practice",
        });
      }
    } else if (isReviewWeek) {
      // Consolidation week: revisit what has been covered so far.
      for (const subject of subjects) {
        const syllabus = SYLLABUS_BY_SUBJECT.get(subject);
        const covered = cursor.get(subject) ?? 0;
        if (!syllabus || covered === 0) continue;
        tasks.push({
          id: `${subject}-review-${week}`,
          subject,
          icon: syllabus.icon,
          topic: `Review the ${covered} topic${covered === 1 ? "" : "s"} covered so far`,
          hint: "Re-do the questions you got wrong. Teach one topic aloud to a friend.",
          weight: "core",
          minutes: 60,
          kind: "review",
        });
        tasks.push({
          id: `${subject}-review-drill-${week}`,
          subject,
          icon: syllabus.icon,
          topic: "Past paper drill on covered topics",
          hint: syllabus.examTips[1] ?? syllabus.examTips[0],
          weight: "high",
          minutes: 45,
          kind: "practice",
        });
      }
    } else {
      // Normal study week: pace each subject's remaining topics over the
      // remaining study weeks, giving priority subjects a slightly bigger share.
      const studyWeeksLeft = Math.max(1, studyWeekCount - studyWeeksUsed);
      let minutesLeft = minutesPerWeek;

      for (const subject of subjects) {
        const syllabus = SYLLABUS_BY_SUBJECT.get(subject);
        const queue = queues.get(subject) ?? [];
        let position = cursor.get(subject) ?? 0;
        const remaining = queue.length - position;

        if (remaining > 0) {
          // Strict even pacing so the syllabus lasts the whole period.
          let share = Math.ceil(remaining / studyWeeksLeft);
          // Only accelerate a priority subject when there is surplus to spare.
          if (prioritySubjects.includes(subject) && remaining > studyWeeksLeft) share += 1;
          share = Math.max(1, Math.min(share, remaining));

          for (let slot = 0; slot < share; slot++) {
            if (position >= queue.length) break;
            const task = queue[position];
            // Respect the weekly hour budget, but always give each subject one slot.
            if (minutesLeft - task.minutes < 0 && slot > 0) break;
            tasks.push({ ...task, id: `${task.id}-w${week}` });
            minutesLeft -= task.minutes;
            position += 1;
          }
          cursor.set(subject, position);
        } else if (syllabus) {
          // Syllabus finished for this subject - keep the slot but switch to drilling.
          tasks.push({
            id: `${subject}-extra-drill-${week}`,
            subject,
            icon: syllabus.icon,
            topic: "Timed past paper practice",
            hint: syllabus.examTips[week % syllabus.examTips.length],
            weight: "high",
            minutes: 60,
            kind: "practice",
          });
          minutesLeft -= 60;
        }
      }

      studyWeeksUsed += 1;

      // Every study week ends with one practice session on the priority subject.
      const drillSubject = prioritySubjects[0] ?? subjects[0];
      const drillSyllabus = drillSubject ? SYLLABUS_BY_SUBJECT.get(drillSubject) : undefined;
      if (drillSyllabus) {
        tasks.push({
          id: `${drillSubject}-drill-${week}`,
          subject: drillSubject,
          icon: drillSyllabus.icon,
          topic: "Past paper questions on this week's topics",
          hint: drillSyllabus.examTips[week % drillSyllabus.examTips.length],
          weight: "high",
          minutes: 45,
          kind: "practice",
        });
      }
    }

    const totalMinutes = tasks.reduce((sum, task) => sum + task.minutes, 0);

    planWeeks.push({
      week,
      label: `Week ${week}`,
      focus: isFinalWeek
        ? "Final revision and full past papers"
        : isReviewWeek
          ? "Consolidation and correction"
          : tasks.length > 0
            ? `New topics in ${[...new Set(tasks.map((task) => task.subject))].join(", ")}`
            : "Free revision",
      tasks,
      totalMinutes,
    });
  }

  return {
    subjects,
    weeks: planWeeks,
    hoursPerWeek,
    totalTasks: planWeeks.reduce((sum, week) => sum + week.tasks.length, 0),
    sessionsPerWeek,
    generatedAt: new Date(),
  };
}
