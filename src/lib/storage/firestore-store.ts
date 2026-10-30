import type {
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import { COLLECTIONS, getFirestore } from "./firebase-app";
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

type CurrentLeaderboardRow = LeaderboardRow & { studentId: string };

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const maybe = value as Timestamp;
  if (typeof maybe?.toDate === "function") return maybe.toDate();
  return new Date(value as string);
}

function toDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return toDate(value);
}

function mapResultRecord(id: string, data: DocumentData): ResultRecord {
  return {
    id,
    studentId: data.studentId as string,
    sessionId: data.sessionId as string,
    category: data.category as string,
    scienceScore: (data.scienceScore as number) ?? 0,
    humanitiesScore: (data.humanitiesScore as number) ?? 0,
    totalScore: (data.totalScore as number) ?? 0,
    percentage: (data.percentage as number) ?? 0,
    grade: (data.grade as string) ?? "F",
    careerPaths: (data.careerPaths as string[]) ?? [],
    studentName: (data.studentName as string) ?? "",
    levelOfStudy: (data.levelOfStudy as string) ?? null,
    secondaryName: (data.secondaryName as string) ?? null,
    selectedSubjects: (data.selectedSubjects as string[]) ?? [],
    subjectScores: (data.subjectScores as Record<string, number>) ?? {},
    guidance: (data.guidance as string[]) ?? [],
    createdAt: toDate(data.createdAt),
  };
}

export class FirestoreStore implements DataStore {
  readonly name = "Firebase Firestore";
  readonly kind = "firestore" as const;

  constructor(private readonly db: Firestore) {}

  static async create(): Promise<FirestoreStore | null> {
    const db = await getFirestore();
    return db ? new FirestoreStore(db) : null;
  }

  async ping(): Promise<boolean> {
    try {
      await this.db.collection(COLLECTIONS.counters).doc("health").set(
        { checkedAt: new Date() },
        { merge: true },
      );
      return true;
    } catch {
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
    const ref = this.db.collection(COLLECTIONS.students).doc(input.authUid);
    const existing = await ref.get();
    const createdAt = existing.exists
      ? toDate(existing.data()?.createdAt)
      : new Date();
    await ref.set({
      name: input.name,
      school: input.school,
      form: input.form,
      secondaryName: input.school,
      levelOfStudy: input.form,
      selectedSubjects: input.selectedSubjects,
      authUid: input.authUid,
      createdAt,
      updatedAt: new Date(),
    }, { merge: true });
    return { id: ref.id, ...input, createdAt };
  }

  async getStudent(id: string): Promise<StudentRecord | null> {
    const snap = await this.db.collection(COLLECTIONS.students).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() ?? {};
    return {
      id: snap.id,
      name: (data.name as string) ?? "Student",
      school: (data.school as string) ?? null,
      form: (data.form as string) ?? null,
      selectedSubjects: (data.selectedSubjects as string[]) ?? [],
      authUid: (data.authUid as string) ?? null,
      createdAt: toDate(data.createdAt),
    };
  }

  getStudentByAuthUid(authUid: string): Promise<StudentRecord | null> {
    return this.getStudent(authUid);
  }

  async updateStudent(
    id: string,
    input: Pick<StudentRecord, "name" | "school" | "form" | "selectedSubjects">,
  ): Promise<StudentRecord | null> {
    const ref = this.db.collection(COLLECTIONS.students).doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return null;
    await ref.set({
      name: input.name,
      school: input.school,
      form: input.form,
      secondaryName: input.school,
      levelOfStudy: input.form,
      selectedSubjects: input.selectedSubjects,
      updatedAt: new Date(),
    }, { merge: true });
    return this.getStudent(id);
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
    const createdAt = new Date();
    const payload = {
      studentId: input.studentId,
      scienceScore: 0,
      humanitiesScore: 0,
      totalQuestions: input.totalQuestions,
      answeredQuestions: 0,
      elapsedSeconds: input.elapsedSeconds ?? 0,
      category: null,
      answers: {},
      questionIds: input.questionIds,
      selectedSubjects: input.selectedSubjects,
      paperType: input.paperType,
      seed: input.seed,
      completed: 0,
      createdAt,
      completedAt: null,
    };
    const ref = await this.db.collection(COLLECTIONS.sessions).add(payload);
    return { id: ref.id, ...payload };
  }

  async getSession(id: string): Promise<SessionRecord | null> {
    const snap = await this.db.collection(COLLECTIONS.sessions).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() ?? {};
    return {
      id: snap.id,
      studentId: (data.studentId as string) ?? "",
      scienceScore: (data.scienceScore as number) ?? 0,
      humanitiesScore: (data.humanitiesScore as number) ?? 0,
      totalQuestions: (data.totalQuestions as number) ?? 0,
      answeredQuestions: (data.answeredQuestions as number) ?? 0,
      elapsedSeconds: (data.elapsedSeconds as number) ?? 0,
      category: (data.category as string) ?? null,
      answers: (data.answers as Record<string, number>) ?? {},
      questionIds: (data.questionIds as number[]) ?? [],
      selectedSubjects: (data.selectedSubjects as string[]) ?? [],
      paperType: (data.paperType as string) ?? "balanced",
      seed: (data.seed as number) ?? 0,
      completed: (data.completed as number) ?? 0,
      createdAt: toDate(data.createdAt),
      completedAt: toDateOrNull(data.completedAt),
    };
  }

  async getInProgressSessionsByAuthUid(authUid: string): Promise<InProgressQuizRecord[]> {
    const student = await this.getStudentByAuthUid(authUid);
    if (!student) return [];
    const snapshot = await this.db
      .collection(COLLECTIONS.sessions)
      .where("studentId", "==", student.id)
      .get();
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          answeredQuestions: (data.answeredQuestions as number) ?? 0,
          totalQuestions: (data.totalQuestions as number) ?? 0,
          createdAt: toDate(data.createdAt),
          completed: (data.completed as number) ?? 0,
        };
      })
      .filter((session) => session.completed !== 1)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 1)
      .map(({ completed: _completed, ...session }) => session);
  }

  async updateSession(id: string, patch: SessionUpdate): Promise<SessionRecord | null> {
    const ref = this.db.collection(COLLECTIONS.sessions).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    await ref.set({ ...patch }, { merge: true });
    return this.getSession(id);
  }

  async createResult(input: Omit<ResultRecord, "id" | "createdAt">): Promise<ResultRecord> {
    const createdAt = new Date();
    const ref = await this.db.collection(COLLECTIONS.results).add({ ...input, createdAt });
    return { id: ref.id, ...input, createdAt };
  }

  async getResultBySession(sessionId: string): Promise<ResultRecord | null> {
    const snap = await this.db
      .collection(COLLECTIONS.results)
      .where("sessionId", "==", sessionId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return mapResultRecord(doc.id, doc.data());
  }

  async getResultsByAuthUid(authUid: string): Promise<ResultRecord[]> {
    const student = await this.getStudentByAuthUid(authUid);
    if (!student) return [];
    const snapshot = await this.db
      .collection(COLLECTIONS.results)
      .where("studentId", "==", student.id)
      .get();
    return snapshot.docs
      .map((doc) => mapResultRecord(doc.id, doc.data()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLeaderboard(limit: number): Promise<LeaderboardRow[]> {
    return (await this.getCurrentLeaderboardRows()).slice(0, limit);
  }

  private async getCurrentLeaderboardRows(): Promise<CurrentLeaderboardRow[]> {
    const snapshot = await this.db
      .collection(COLLECTIONS.results)
      .orderBy("createdAt", "desc")
      .get();
    const latestResults = new Map<string, QueryDocumentSnapshot<DocumentData>>();
    for (const doc of snapshot.docs) {
      const studentId = doc.data().studentId as string;
      if (studentId && !latestResults.has(studentId)) latestResults.set(studentId, doc);
    }

    const studentIds = [...latestResults.keys()];
    const students = new Map<string, StudentRecord>();
    await Promise.all(
      studentIds.map(async (studentId) => {
        const student = await this.getStudent(studentId);
        if (student) students.set(studentId, student);
      }),
    );

    const rows = [...latestResults.entries()].map(([studentId, doc]) => {
      const data = doc.data();
      const student = students.get(studentId);
      return {
        id: doc.id,
        studentId,
        studentName: student?.name ?? "Student",
        school: student?.school ?? null,
        form: student?.form ?? null,
        category: (data.category as string) ?? "Mixed",
        scienceScore: (data.scienceScore as number) ?? 0,
        humanitiesScore: (data.humanitiesScore as number) ?? 0,
        totalScore: (data.totalScore as number) ?? 0,
        grade: (data.grade as string) ?? "F",
        createdAt: toDate(data.createdAt),
      };
    });
    return rows.sort(
      (a, b) => b.totalScore - a.totalScore || b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async getLeaderboardPosition(authUid: string): Promise<LeaderboardPosition | null> {
    const student = await this.getStudentByAuthUid(authUid);
    if (!student) return null;

    const rows = await this.getCurrentLeaderboardRows();
    const ownRow = rows.find((row) => row.studentId === student.id);
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
    const now = new Date();
    const existing = await this.getStudyPlanBySession(input.sessionId);

    if (existing) {
      await this.db.collection(COLLECTIONS.studyPlans).doc(existing.id).set(
        { ...input, completedTasks: [], updatedAt: now },
        { merge: true },
      );
      return { ...existing, ...input, completedTasks: [], updatedAt: now };
    }

    const payload = { ...input, completedTasks: [] as string[], createdAt: now, updatedAt: now };
    const ref = await this.db.collection(COLLECTIONS.studyPlans).add(payload);
    return { id: ref.id, ...payload };
  }

  async getStudyPlanBySession(sessionId: string): Promise<StudyPlanRecord | null> {
    const snap = await this.db
      .collection(COLLECTIONS.studyPlans)
      .where("sessionId", "==", sessionId)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      studentId: (data.studentId as string) ?? "",
      sessionId: (data.sessionId as string) ?? sessionId,
      subjects: (data.subjects as string[]) ?? [],
      prioritySubjects: (data.prioritySubjects as string[]) ?? [],
      weeks: (data.weeks as number) ?? 6,
      hoursPerWeek: (data.hoursPerWeek as number) ?? 6,
      examDate: (data.examDate as string) ?? null,
      completedTasks: (data.completedTasks as string[]) ?? [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  }

  async toggleStudyTask(
    planId: string,
    taskId: string,
    done: boolean,
  ): Promise<StudyPlanRecord | null> {
    const { FieldValue } = await import("firebase-admin/firestore");
    const ref = this.db.collection(COLLECTIONS.studyPlans).doc(planId);
    const snap = await ref.get();
    if (!snap.exists) return null;

    await ref.set(
      {
        completedTasks: done ? FieldValue.arrayUnion(taskId) : FieldValue.arrayRemove(taskId),
        updatedAt: new Date(),
      },
      { merge: true },
    );

    const updated = await ref.get();
    const data = updated.data() ?? {};
    return {
      id: updated.id,
      studentId: (data.studentId as string) ?? "",
      sessionId: (data.sessionId as string) ?? "",
      subjects: (data.subjects as string[]) ?? [],
      prioritySubjects: (data.prioritySubjects as string[]) ?? [],
      weeks: (data.weeks as number) ?? 6,
      hoursPerWeek: (data.hoursPerWeek as number) ?? 6,
      examDate: (data.examDate as string) ?? null,
      completedTasks: (data.completedTasks as string[]) ?? [],
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  }

  async getQuestionUsage(): Promise<Record<number, number>> {
    const snap = await this.db.collection(COLLECTIONS.questionUsage).get();
    const usage: Record<number, number> = {};
    snap.docs.forEach((doc) => {
      usage[Number(doc.id)] = (doc.data().timesServed as number) ?? 0;
    });
    return usage;
  }

  async recordQuestionUsage(questionIds: number[]): Promise<void> {
    const { FieldValue } = await import("firebase-admin/firestore");
    const batch = this.db.batch();
    for (const questionId of questionIds) {
      const ref = this.db.collection(COLLECTIONS.questionUsage).doc(String(questionId));
      batch.set(
        ref,
        { timesServed: FieldValue.increment(1), lastServedAt: new Date() },
        { merge: true },
      );
    }
    await batch.commit();
  }
}
