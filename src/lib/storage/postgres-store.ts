import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { questionUsage, quizSessions, results, students, studyPlans } from "@/db/schema";
import type {
  DataStore,
  InProgressQuizRecord,
  LeaderboardPosition,
  LeaderboardRow,
  ResultRecord,
  SessionRecord,
  SessionUpdate,
  StudentRecord,
  StudyPlanRecord,
} from "./types";

/** Fallback store used until Firebase credentials are supplied. */
export class PostgresStore implements DataStore {
  readonly name = "PostgreSQL (fallback)";
  readonly kind = "postgres" as const;

  async ping(): Promise<boolean> {
    try {
      await db.execute(sql`select 1`);
      return true;
    } catch (error) {
      console.error("PostgreSQL health check failed:", error);
      return false;
    }
  }

  async createStudent(input: {
    name: string;
    school: string | null;
    form: string | null;
    selectedSubjects: string[];
    authUid: string;
  }): Promise<StudentRecord> {
    const existing = await this.getStudentByAuthUid(input.authUid);
    if (existing) {
      const updated = await this.updateStudent(existing.id, input);
      if (updated) return updated;
    }
    const [row] = await db.insert(students).values(input).returning();
    return {
      id: String(row.id),
      name: row.name,
      school: row.school,
      form: row.form,
      selectedSubjects: row.selectedSubjects,
      authUid: row.authUid,
      createdAt: row.createdAt,
    };
  }

  async getStudent(id: string): Promise<StudentRecord | null> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db.select().from(students).where(eq(students.id, numeric));
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name,
      school: row.school,
      form: row.form,
      selectedSubjects: row.selectedSubjects ?? [],
      authUid: row.authUid,
      createdAt: row.createdAt,
    };
  }

  async getStudentByAuthUid(authUid: string): Promise<StudentRecord | null> {
    const [row] = await db.select().from(students).where(eq(students.authUid, authUid)).limit(1);
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name,
      school: row.school,
      form: row.form,
      selectedSubjects: row.selectedSubjects ?? [],
      authUid: row.authUid,
      createdAt: row.createdAt,
    };
  }

  async updateStudent(
    id: string,
    input: Pick<StudentRecord, "name" | "school" | "form" | "selectedSubjects">,
  ): Promise<StudentRecord | null> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db
      .update(students)
      .set(input)
      .where(eq(students.id, numeric))
      .returning();
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name,
      school: row.school,
      form: row.form,
      selectedSubjects: row.selectedSubjects ?? [],
      authUid: row.authUid,
      createdAt: row.createdAt,
    };
  }

  async createSession(input: {
    studentId: string;
    totalQuestions: number;
    questionIds: number[];
    paperType: string;
    seed: number;
    selectedSubjects: string[];
    elapsedSeconds?: number;
  }): Promise<SessionRecord> {
    const [row] = await db
      .insert(quizSessions)
      .values({
        studentId: Number(input.studentId),
        totalQuestions: input.totalQuestions,
        elapsedSeconds: input.elapsedSeconds ?? 0,
        answers: {},
        questionIds: input.questionIds,
        selectedSubjects: input.selectedSubjects,
        paperType: input.paperType,
        seed: input.seed,
      })
      .returning();
    return this.mapSession(row);
  }

  async getSession(id: string): Promise<SessionRecord | null> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db.select().from(quizSessions).where(eq(quizSessions.id, numeric));
    return row ? this.mapSession(row) : null;
  }

  async getInProgressSessionsByAuthUid(authUid: string): Promise<InProgressQuizRecord[]> {
    const rows = await db
      .select({
        id: quizSessions.id,
        answeredQuestions: quizSessions.answeredQuestions,
        totalQuestions: quizSessions.totalQuestions,
        completed: quizSessions.completed,
        createdAt: quizSessions.createdAt,
      })
      .from(quizSessions)
      .innerJoin(students, eq(quizSessions.studentId, students.id))
      .where(eq(students.authUid, authUid))
      .orderBy(desc(quizSessions.createdAt));
    return rows
      .filter((row) => row.completed !== 1)
      .slice(0, 1)
      .map((row) => ({
        id: String(row.id),
        answeredQuestions: row.answeredQuestions ?? 0,
        totalQuestions: row.totalQuestions ?? 0,
        createdAt: row.createdAt,
      }));
  }

  async updateSession(id: string, patch: SessionUpdate): Promise<SessionRecord | null> {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db
      .update(quizSessions)
      .set(patch)
      .where(eq(quizSessions.id, numeric))
      .returning();
    return row ? this.mapSession(row) : null;
  }

  async createResult(input: Omit<ResultRecord, "id" | "createdAt">): Promise<ResultRecord> {
    const [row] = await db
      .insert(results)
      .values({
        studentId: Number(input.studentId),
        sessionId: Number(input.sessionId),
        category: input.category,
        scienceScore: input.scienceScore,
        humanitiesScore: input.humanitiesScore,
        totalScore: input.totalScore,
        percentage: input.percentage,
        grade: input.grade,
        careerPaths: input.careerPaths,
        studentName: input.studentName,
        levelOfStudy: input.levelOfStudy,
        secondaryName: input.secondaryName,
        selectedSubjects: input.selectedSubjects,
        subjectScores: input.subjectScores,
        guidance: input.guidance,
      })
      .returning();
    return {
      id: String(row.id),
      studentId: String(row.studentId),
      sessionId: String(row.sessionId),
      category: row.category,
      scienceScore: row.scienceScore ?? 0,
      humanitiesScore: row.humanitiesScore ?? 0,
      totalScore: row.totalScore ?? 0,
      percentage: row.percentage ?? 0,
      grade: row.grade ?? "F",
      careerPaths: row.careerPaths ?? [],
      studentName: row.studentName,
      levelOfStudy: row.levelOfStudy,
      secondaryName: row.secondaryName,
      selectedSubjects: row.selectedSubjects ?? [],
      subjectScores: row.subjectScores ?? {},
      guidance: row.guidance ?? [],
      createdAt: row.createdAt,
    };
  }

  async getResultBySession(sessionId: string): Promise<ResultRecord | null> {
    const numeric = Number(sessionId);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db.select().from(results).where(eq(results.sessionId, numeric));
    if (!row) return null;
    return {
      id: String(row.id),
      studentId: String(row.studentId),
      sessionId: String(row.sessionId),
      category: row.category,
      scienceScore: row.scienceScore ?? 0,
      humanitiesScore: row.humanitiesScore ?? 0,
      totalScore: row.totalScore ?? 0,
      percentage: row.percentage ?? 0,
      grade: row.grade ?? "F",
      careerPaths: row.careerPaths ?? [],
      studentName: row.studentName,
      levelOfStudy: row.levelOfStudy,
      secondaryName: row.secondaryName,
      selectedSubjects: row.selectedSubjects ?? [],
      subjectScores: row.subjectScores ?? {},
      guidance: row.guidance ?? [],
      createdAt: row.createdAt,
    };
  }

  async getResultsByAuthUid(authUid: string): Promise<ResultRecord[]> {
    const rows = await db
      .select({ result: results })
      .from(results)
      .innerJoin(students, eq(results.studentId, students.id))
      .where(eq(students.authUid, authUid))
      .orderBy(desc(results.createdAt));
    return rows.map(({ result: row }) => ({
      id: String(row.id),
      studentId: String(row.studentId),
      sessionId: String(row.sessionId),
      category: row.category,
      scienceScore: row.scienceScore ?? 0,
      humanitiesScore: row.humanitiesScore ?? 0,
      totalScore: row.totalScore ?? 0,
      percentage: row.percentage ?? 0,
      grade: row.grade ?? "F",
      careerPaths: row.careerPaths ?? [],
      studentName: row.studentName,
      levelOfStudy: row.levelOfStudy,
      secondaryName: row.secondaryName,
      selectedSubjects: row.selectedSubjects ?? [],
      subjectScores: row.subjectScores ?? {},
      guidance: row.guidance ?? [],
      createdAt: row.createdAt,
    }));
  }

  async getLeaderboard(limit: number): Promise<LeaderboardRow[]> {
    return (await this.getCurrentLeaderboardRows()).slice(0, limit);
  }

  private async getCurrentLeaderboardRows(): Promise<
    Array<LeaderboardRow & { studentId: string; authUid: string | null }>
  > {
    const rows = await db
      .select({
        id: results.id,
        studentId: results.studentId,
        authUid: students.authUid,
        studentName: students.name,
        school: students.school,
        form: students.form,
        category: results.category,
        scienceScore: results.scienceScore,
        humanitiesScore: results.humanitiesScore,
        totalScore: results.totalScore,
        grade: results.grade,
        createdAt: results.createdAt,
      })
      .from(results)
      .innerJoin(students, eq(results.studentId, students.id))
      .orderBy(desc(results.createdAt));

    const latestByAccount = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const studentId = String(row.studentId);
      const accountKey = row.authUid ?? `student:${studentId}`;
      if (!latestByAccount.has(accountKey)) latestByAccount.set(accountKey, row);
    }

    return [...latestByAccount.values()]
      .map((row) => ({
        id: String(row.id),
        studentId: String(row.studentId),
        authUid: row.authUid,
        studentName: row.studentName,
        school: row.school,
        form: row.form,
        category: row.category,
        scienceScore: row.scienceScore ?? 0,
        humanitiesScore: row.humanitiesScore ?? 0,
        totalScore: row.totalScore ?? 0,
        grade: row.grade ?? "F",
        createdAt: row.createdAt,
      }))
      .sort((a, b) => b.totalScore - a.totalScore || b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLeaderboardPosition(authUid: string): Promise<LeaderboardPosition | null> {
    const student = await this.getStudentByAuthUid(authUid);
    if (!student) return null;
    const rows = await this.getCurrentLeaderboardRows();
    const ownRow =
      rows.find((row) => row.authUid === authUid) ??
      rows.find((row) => row.studentId === student.id);
    if (!ownRow) return null;

    return {
      rank: rows.filter((row) => row.totalScore > ownRow.totalScore).length + 1,
      score: ownRow.totalScore,
      totalResults: rows.length,
    };
  }

  async createStudyPlan(input: {
    studentId: string;
    sessionId: string;
    subjects: string[];
    prioritySubjects: string[];
    weeks: number;
    hoursPerWeek: number;
    examDate: string | null;
  }): Promise<StudyPlanRecord> {
    const existing = await this.getStudyPlanBySession(input.sessionId);
    const now = new Date();

    if (existing) {
      const [row] = await db
        .update(studyPlans)
        .set({
          subjects: input.subjects,
          prioritySubjects: input.prioritySubjects,
          weeks: input.weeks,
          hoursPerWeek: input.hoursPerWeek,
          examDate: input.examDate,
          completedTasks: [],
          updatedAt: now,
        })
        .where(eq(studyPlans.id, Number(existing.id)))
        .returning();
      return this.mapPlan(row);
    }

    const [row] = await db
      .insert(studyPlans)
      .values({
        studentId: Number(input.studentId),
        sessionId: Number(input.sessionId),
        subjects: input.subjects,
        prioritySubjects: input.prioritySubjects,
        weeks: input.weeks,
        hoursPerWeek: input.hoursPerWeek,
        examDate: input.examDate,
        completedTasks: [],
      })
      .returning();
    return this.mapPlan(row);
  }

  async getStudyPlanBySession(sessionId: string): Promise<StudyPlanRecord | null> {
    const numeric = Number(sessionId);
    if (!Number.isFinite(numeric)) return null;
    const [row] = await db.select().from(studyPlans).where(eq(studyPlans.sessionId, numeric));
    return row ? this.mapPlan(row) : null;
  }

  async toggleStudyTask(
    planId: string,
    taskId: string,
    done: boolean,
  ): Promise<StudyPlanRecord | null> {
    const numeric = Number(planId);
    if (!Number.isFinite(numeric)) return null;
    const [current] = await db.select().from(studyPlans).where(eq(studyPlans.id, numeric));
    if (!current) return null;

    const set = new Set(current.completedTasks ?? []);
    if (done) set.add(taskId);
    else set.delete(taskId);

    const [row] = await db
      .update(studyPlans)
      .set({ completedTasks: [...set], updatedAt: new Date() })
      .where(eq(studyPlans.id, numeric))
      .returning();
    return row ? this.mapPlan(row) : null;
  }

  private mapPlan(row: typeof studyPlans.$inferSelect): StudyPlanRecord {
    return {
      id: String(row.id),
      studentId: String(row.studentId),
      sessionId: String(row.sessionId),
      subjects: row.subjects ?? [],
      prioritySubjects: row.prioritySubjects ?? [],
      weeks: row.weeks,
      hoursPerWeek: row.hoursPerWeek,
      examDate: row.examDate,
      completedTasks: row.completedTasks ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async getQuestionUsage(): Promise<Record<number, number>> {
    try {
      const rows = await db.select().from(questionUsage);
      return Object.fromEntries(rows.map((row) => [row.questionId, row.timesServed]));
    } catch {
      return {};
    }
  }

  async recordQuestionUsage(questionIds: number[]): Promise<void> {
    for (const questionId of questionIds) {
      await db
        .insert(questionUsage)
        .values({ questionId, timesServed: 1, lastServedAt: new Date() })
        .onConflictDoUpdate({
          target: questionUsage.questionId,
          set: {
            timesServed: sql`${questionUsage.timesServed} + 1`,
            lastServedAt: new Date(),
          },
        });
    }
  }

  private mapSession(row: typeof quizSessions.$inferSelect): SessionRecord {
    return {
      id: String(row.id),
      studentId: String(row.studentId),
      scienceScore: row.scienceScore ?? 0,
      humanitiesScore: row.humanitiesScore ?? 0,
      totalQuestions: row.totalQuestions ?? 0,
      answeredQuestions: row.answeredQuestions ?? 0,
      elapsedSeconds: row.elapsedSeconds ?? 0,
      category: row.category,
      answers: row.answers ?? {},
      questionIds: row.questionIds ?? [],
      selectedSubjects: row.selectedSubjects ?? [],
      paperType: row.paperType ?? "balanced",
      seed: row.seed ?? 0,
      completed: row.completed ?? 0,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
  }
}
