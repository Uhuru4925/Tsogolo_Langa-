/**
 * Storage-agnostic data contracts.
 *
 * The app talks only to this interface, so the underlying database
 * (Firebase Firestore or PostgreSQL) can be swapped without touching
 * any route handler or page.
 */

export interface StudentRecord {
  id: string;
  name: string;
  school: string | null;
  form: string | null;
  selectedSubjects: string[];
  authUid: string | null;
  createdAt: Date;
}

export interface SessionRecord {
  id: string;
  studentId: string;
  scienceScore: number;
  humanitiesScore: number;
  totalQuestions: number;
  answeredQuestions: number;
  elapsedSeconds: number;
  category: string | null;
  answers: Record<string, number>;
  questionIds: number[];
  selectedSubjects: string[];
  paperType: string | null;
  seed: number;
  completed: number;
  createdAt: Date;
  completedAt: Date | null;
}

export interface InProgressQuizRecord {
  id: string;
  answeredQuestions: number;
  totalQuestions: number;
  createdAt: Date;
}

export interface ResultRecord {
  id: string;
  studentId: string;
  sessionId: string;
  category: string;
  scienceScore: number;
  humanitiesScore: number;
  totalScore: number;
  percentage: number;
  grade: string;
  careerPaths: string[];
  studentName: string;
  levelOfStudy: string | null;
  secondaryName: string | null;
  selectedSubjects: string[];
  subjectScores: Record<string, number>;
  guidance: string[];
  createdAt: Date;
}

export interface LeaderboardRow {
  id: string;
  studentName: string;
  school: string | null;
  form: string | null;
  category: string;
  scienceScore: number;
  humanitiesScore: number;
  totalScore: number;
  grade: string;
  createdAt: Date;
}

export interface LeaderboardPosition {
  rank: number;
  score: number;
  totalResults: number;
}

export interface StudyPlanRecord {
  id: string;
  studentId: string;
  sessionId: string;
  subjects: string[];
  prioritySubjects: string[];
  weeks: number;
  hoursPerWeek: number;
  examDate: string | null;
  /** Task ids the student has ticked off. */
  completedTasks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUpdate {
  answers?: Record<string, number>;
  questionIds?: number[];
  selectedSubjects?: string[];
  totalQuestions?: number;
  seed?: number;
  scienceScore?: number;
  humanitiesScore?: number;
  answeredQuestions?: number;
  elapsedSeconds?: number;
  completed?: number;
  completedAt?: Date | null;
  category?: string | null;
}

export interface DataStore {
  /** Human readable name of the active backend, e.g. "Firebase Firestore". */
  readonly name: string;
  /** Machine name: "firestore" | "postgres". */
  readonly kind: "firestore" | "postgres";

  ping(): Promise<boolean>;

  createStudent(input: {
    name: string;
    school: string | null;
    form: string | null;
    selectedSubjects: string[];
    authUid: string;
  }): Promise<StudentRecord>;

  getStudent(id: string): Promise<StudentRecord | null>;

  getStudentByAuthUid(authUid: string): Promise<StudentRecord | null>;

  updateStudent(
    id: string,
    input: Pick<StudentRecord, "name" | "school" | "form" | "selectedSubjects">,
  ): Promise<StudentRecord | null>;

  createSession(input: {
    studentId: string;
    totalQuestions: number;
    questionIds: number[];
    paperType: string;
    seed: number;
    selectedSubjects: string[];
    elapsedSeconds?: number;
  }): Promise<SessionRecord>;

  getSession(id: string): Promise<SessionRecord | null>;

  getInProgressSessionsByAuthUid(authUid: string): Promise<InProgressQuizRecord[]>;

  updateSession(id: string, patch: SessionUpdate): Promise<SessionRecord | null>;

  createResult(input: Omit<ResultRecord, "id" | "createdAt">): Promise<ResultRecord>;

  getResultBySession(sessionId: string): Promise<ResultRecord | null>;

  getResultsByAuthUid(authUid: string): Promise<ResultRecord[]>;

  getLeaderboard(limit: number): Promise<LeaderboardRow[]>;

  getLeaderboardPosition(authUid: string): Promise<LeaderboardPosition | null>;

  /** How many times each question has been served, used to rotate papers. */
  createStudyPlan(input: {
    studentId: string;
    sessionId: string;
    subjects: string[];
    prioritySubjects: string[];
    weeks: number;
    hoursPerWeek: number;
    examDate: string | null;
  }): Promise<StudyPlanRecord>;

  getStudyPlanBySession(sessionId: string): Promise<StudyPlanRecord | null>;

  toggleStudyTask(planId: string, taskId: string, done: boolean): Promise<StudyPlanRecord | null>;

  getQuestionUsage(): Promise<Record<number, number>>;

  recordQuestionUsage(questionIds: number[]): Promise<void>;
}
