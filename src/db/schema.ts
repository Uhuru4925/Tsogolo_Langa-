import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  school: varchar("school", { length: 255 }),
  form: varchar("form", { length: 10 }),
  selectedSubjects: jsonb("selected_subjects").$type<string[]>().default([]).notNull(),
  authUid: varchar("auth_uid", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quiz sessions
export const quizSessions = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  scienceScore: integer("science_score").default(0),
  humanitiesScore: integer("humanities_score").default(0),
  totalQuestions: integer("total_questions").default(0),
  answeredQuestions: integer("answered_questions").default(0),
  elapsedSeconds: integer("elapsed_seconds").default(0).notNull(),
  category: varchar("category", { length: 50 }), // 'Sciences' | 'Humanities' | 'Mixed'
  answers: jsonb("answers").$type<Record<string, number>>().default({}),
  // The unique set of question IDs generated for THIS student. No repeats.
  questionIds: jsonb("question_ids").$type<number[]>().default([]),
  selectedSubjects: jsonb("selected_subjects").$type<string[]>().default([]).notNull(),
  // Which type of paper the student chose: balanced, sciences, math, etc.
  paperType: varchar("paper_type", { length: 40 }).default("balanced"),
  // Seed used to shuffle answer options for this paper.
  seed: integer("seed").default(0),
  completed: integer("completed").default(0), // 0 = in progress, 1 = done
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Tracks how often each question has been served so papers rotate between students
export const questionUsage = pgTable("question_usage", {
  questionId: integer("question_id").primaryKey(),
  timesServed: integer("times_served").default(0).notNull(),
  lastServedAt: timestamp("last_served_at").defaultNow().notNull(),
});

// Personalised revision timetables built from a student's subject breakdown
export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  sessionId: integer("session_id").references(() => quizSessions.id),
  subjects: jsonb("subjects").$type<string[]>().default([]).notNull(),
  prioritySubjects: jsonb("priority_subjects").$type<string[]>().default([]).notNull(),
  weeks: integer("weeks").default(6).notNull(),
  hoursPerWeek: integer("hours_per_week").default(6).notNull(),
  examDate: varchar("exam_date", { length: 20 }),
  completedTasks: jsonb("completed_tasks").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leaderboard / results summary
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id),
  sessionId: integer("session_id").references(() => quizSessions.id),
  category: varchar("category", { length: 50 }).notNull(), // 'Sciences' | 'Humanities' | 'Mixed'
  scienceScore: integer("science_score").default(0),
  humanitiesScore: integer("humanities_score").default(0),
  totalScore: integer("total_score").default(0),
  percentage: integer("percentage").default(0),
  grade: varchar("grade", { length: 5 }),
  careerPaths: jsonb("career_paths").$type<string[]>().default([]),
  studentName: varchar("student_name", { length: 255 }).default("").notNull(),
  levelOfStudy: varchar("level_of_study", { length: 20 }),
  secondaryName: varchar("secondary_name", { length: 255 }),
  selectedSubjects: jsonb("selected_subjects").$type<string[]>().default([]).notNull(),
  subjectScores: jsonb("subject_scores").$type<Record<string, number>>().default({}).notNull(),
  guidance: jsonb("guidance").$type<string[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
