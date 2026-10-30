import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/storage";
import { verifyFirebaseIdToken } from "@/lib/storage/firebase-app";
import type { SessionUpdate } from "@/lib/storage/types";
import {
  getQuestionsByIds,
  SCIENCE_SUBJECTS,
  HUMANITIES_SUBJECTS,
  getCategory,
  getGrade,
  buildSubjectGuidance,
  scienceCareers,
  humanitiesCareers,
  mixedCareers,
} from "@/lib/questions";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { questionId, answer, answers, elapsedSeconds, finalize } = body as {
      questionId?: unknown;
      answer?: unknown;
      answers?: unknown;
      elapsedSeconds?: unknown;
      finalize?: boolean;
    };
    if (
      elapsedSeconds !== undefined &&
      (!Number.isSafeInteger(elapsedSeconds) || (elapsedSeconds as number) < 0)
    ) {
      return NextResponse.json({ error: "Elapsed quiz time must be a non-negative number of seconds" }, { status: 400 });
    }

    const idToken = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!idToken) {
      return NextResponse.json({ error: "Sign in to update this quiz" }, { status: 401 });
    }
    const authUid = await verifyFirebaseIdToken(idToken);
    const store = await getStore();
    const session = await store.getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const student = await store.getStudent(session.studentId);
    if (!student || student.authUid !== authUid) {
      return NextResponse.json({ error: "You do not have access to this quiz" }, { status: 403 });
    }

    const paper = getQuestionsByIds(session.questionIds ?? []);
    const currentAnswers: Record<string, number> = { ...(session.answers ?? {}) };

    if (answers !== undefined) {
      if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
        return NextResponse.json({ error: "Answers must be an object" }, { status: 400 });
      }
      for (const [id, value] of Object.entries(answers)) {
        const question = paper.find((item) => String(item.id) === id);
        if (
          !question ||
          typeof value !== "number" ||
          !question.options.some((option) => option.value === value)
        ) {
          return NextResponse.json({ error: "An answer does not match this quiz" }, { status: 400 });
        }
        currentAnswers[id] = value;
      }
    }

    if ((questionId === undefined) !== (answer === undefined)) {
      return NextResponse.json({ error: "Both questionId and answer are required" }, { status: 400 });
    }
    if (questionId !== undefined && answer !== undefined) {
      const question =
        typeof questionId === "number" && Number.isInteger(questionId)
          ? paper.find((item) => item.id === questionId)
          : undefined;
      if (
        !question ||
        typeof answer !== "number" ||
        !question.options.some((option) => option.value === answer)
      ) {
        return NextResponse.json({ error: "That answer does not match this quiz" }, { status: 400 });
      }
      currentAnswers[String(questionId)] = answer;
    }

    // Only grade the questions actually served to THIS student.

    let scienceScore = 0;
    let scienceMax = 0;
    let humanitiesScore = 0;
    let humanitiesMax = 0;
    let totalEarned = 0;
    const subjectEarned: Record<string, number> = {};
    const subjectMax: Record<string, number> = {};
    const maxScore = 4;

    for (const question of paper) {
      const isScience = SCIENCE_SUBJECTS.includes(question.subject);
      const isHumanities = HUMANITIES_SUBJECTS.includes(question.subject);
      const given = currentAnswers[String(question.id)];
      const earned = given ?? 0;
      totalEarned += earned;
      subjectEarned[question.subject] = (subjectEarned[question.subject] ?? 0) + earned;
      subjectMax[question.subject] = (subjectMax[question.subject] ?? 0) + maxScore;

      if (isScience) {
        scienceMax += maxScore;
        scienceScore += earned;
      } else if (isHumanities) {
        humanitiesMax += maxScore;
        humanitiesScore += earned;
      }
    }

    const sciPct = scienceMax > 0 ? Math.round((scienceScore / scienceMax) * 100) : 0;
    const humPct = humanitiesMax > 0 ? Math.round((humanitiesScore / humanitiesMax) * 100) : 0;
    const totalScore = paper.length > 0 ? Math.round((totalEarned / (paper.length * maxScore)) * 100) : 0;
    const answeredCount = Object.keys(currentAnswers).filter((id) =>
      paper.some((question) => String(question.id) === id),
    ).length;
    const subjectScores = Object.fromEntries(
      Object.entries(subjectMax).map(([subject, maximum]) => [
        subject,
        Math.round(((subjectEarned[subject] ?? 0) / maximum) * 100),
      ]),
    );

    let updateData: SessionUpdate = {
      answers: currentAnswers,
      scienceScore: sciPct,
      humanitiesScore: humPct,
      answeredQuestions: answeredCount,
      ...(typeof elapsedSeconds === "number" ? { elapsedSeconds } : {}),
    };

    if (finalize) {
      const category =
        scienceMax === 0
          ? "Humanities"
          : humanitiesMax === 0
            ? "Sciences"
            : getCategory(sciPct, humPct);
      const gradeInfo = getGrade(totalScore);
      const weakestSubjects = Object.entries(subjectScores)
        .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
        .slice(0, 2)
        .map(([subject]) => subject);
      const guidance = buildSubjectGuidance(student.form, totalScore, weakestSubjects);

      let careers: string[] = [];
      if (category === "Sciences") {
        careers = scienceCareers.slice(0, 5).map((c) => c.title);
      } else if (category === "Humanities") {
        careers = humanitiesCareers.slice(0, 5).map((c) => c.title);
      } else {
        careers = mixedCareers.map((c) => c.title);
      }

      updateData = {
        ...updateData,
        completed: 1,
        completedAt: new Date(),
        category,
      };

      const existing = await store.getResultBySession(sessionId);
      if (!existing) {
        await store.createResult({
          studentId: session.studentId,
          sessionId,
          category,
          scienceScore: sciPct,
          humanitiesScore: humPct,
          totalScore,
          percentage: totalScore,
          grade: gradeInfo.grade,
          careerPaths: careers,
          studentName: student.name,
          levelOfStudy: student.form,
          secondaryName: student.school,
          selectedSubjects: session.selectedSubjects,
          subjectScores,
          guidance,
        });
      }
    }

    const updatedSession = await store.updateSession(sessionId, updateData);

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
