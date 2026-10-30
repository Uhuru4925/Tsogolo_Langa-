import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/storage";
import { TOTAL_QUESTIONS, type PaperType } from "@/lib/select-questions";
import { buildPaperForSubjects, getQuestionsByIds, isStudentSubject } from "@/lib/questions";
import { QUESTION_SUBJECTS_BY_STUDENT_SUBJECT } from "@/lib/student-subjects";
import { verifyFirebaseIdToken } from "@/lib/storage/firebase-app";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      localId,
      questionIds: offlineQuestionIds,
      seed: offlineSeed,
      elapsedSeconds: requestedElapsedSeconds,
      restartSessionId,
    } = body as {
      localId?: string;
      questionIds?: unknown;
      seed?: number;
      elapsedSeconds?: unknown;
      restartSessionId?: string;
    };

    const idToken = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!idToken) {
      return NextResponse.json({ error: "Sign in before starting a quiz" }, { status: 401 });
    }
    const authUid = await verifyFirebaseIdToken(idToken);
    const store = await getStore();
    const student = await store.getStudentByAuthUid(authUid);
    if (!student) {
      return NextResponse.json(
        { error: "Complete your student profile before starting a quiz", requiresProfile: true },
        { status: 409 },
      );
    }
    const selectedSubjects = student.selectedSubjects;
    if (
      requestedElapsedSeconds !== undefined &&
      (!Number.isSafeInteger(requestedElapsedSeconds) || (requestedElapsedSeconds as number) < 0)
    ) {
      return NextResponse.json({ error: "Elapsed quiz time must be a non-negative number of seconds" }, { status: 400 });
    }
    const elapsedSeconds =
      typeof requestedElapsedSeconds === "number" ? requestedElapsedSeconds : 0;
    if (selectedSubjects.length === 0 || !selectedSubjects.every(isStudentSubject)) {
      return NextResponse.json(
        { error: "Choose your subjects in your profile before starting a quiz", requiresProfile: true },
        { status: 409 },
      );
    }

    // Generate paper locally (no network needed)
    let usage: Record<number, number> = {};
    try {
      usage = await store.getQuestionUsage();
    } catch (error) {
      console.warn("Could not load question usage; generating a fresh paper:", error);
      usage = {};
    }

    const selectedPaperType: PaperType = "balanced";
    const seed =
      localId && Number.isSafeInteger(offlineSeed) && (offlineSeed as number) > 0
        ? (offlineSeed as number)
        : Math.floor(Math.random() * 2000000000) + 1;
    const allowedQuestionSubjects = new Set(
      selectedSubjects.flatMap(
        (subject) => QUESTION_SUBJECTS_BY_STUDENT_SUBJECT[subject],
      ),
    );
    const offlineQuestions = Array.isArray(offlineQuestionIds)
      ? [...new Set(offlineQuestionIds.filter((id): id is number => Number.isInteger(id)))]
      : [];
    const resolvedOfflineQuestions = localId ? getQuestionsByIds(offlineQuestions) : [];
    if (
      localId &&
      (resolvedOfflineQuestions.length !== offlineQuestions.length ||
        resolvedOfflineQuestions.some((question) => !allowedQuestionSubjects.has(question.subject)))
    ) {
      return NextResponse.json({ error: "The saved quiz questions do not match your selected subjects" }, { status: 400 });
    }
    const questionIds =
      localId && resolvedOfflineQuestions.length > 0
        ? offlineQuestions
        : buildPaperForSubjects(seed, usage, selectedSubjects);
    if (questionIds.length === 0) {
      return NextResponse.json({ error: "No practice questions are available for those subjects yet" }, { status: 422 });
    }

    const localSessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session = {
      id: localSessionId,
      studentId: "pending",
      scienceScore: 0,
      humanitiesScore: 0,
      totalQuestions: questionIds.length || TOTAL_QUESTIONS,
      answeredQuestions: 0,
      category: null,
      answers: {},
      questionIds,
      selectedSubjects,
      paperType: selectedPaperType,
      seed,
      completed: 0,
      elapsedSeconds,
      createdAt: new Date(),
      completedAt: null,
    };

    // Restart the learner's existing unfinished quiz rather than creating a second one.
    if (restartSessionId !== undefined) {
      if (typeof restartSessionId !== "string" || !restartSessionId) {
        return NextResponse.json({ error: "Invalid quiz session to restart" }, { status: 400 });
      }
      const existingSession = await store.getSession(restartSessionId);
      if (!existingSession || existingSession.studentId !== student.id) {
        return NextResponse.json({ error: "Saved quiz session was not found" }, { status: 404 });
      }
      if (existingSession.completed === 1) {
        return NextResponse.json({ error: "A completed quiz cannot be restarted" }, { status: 409 });
      }
      const restartedSession = await store.updateSession(restartSessionId, {
        questionIds,
        selectedSubjects,
        totalQuestions: questionIds.length,
        seed,
        answers: {},
        scienceScore: 0,
        humanitiesScore: 0,
        answeredQuestions: 0,
        completed: 0,
        elapsedSeconds: 0,
        completedAt: null,
        category: null,
      });
      if (!restartedSession) {
        return NextResponse.json({ error: "Could not restart the saved quiz" }, { status: 500 });
      }
      try {
        await store.recordQuestionUsage(questionIds);
      } catch (error) {
        console.warn("Could not record question usage:", error);
      }
      return NextResponse.json({ student, session: restartedSession, backend: store.kind });
    }

    // If online, create on server immediately
    if (typeof fetch !== "undefined") {
      try {
        const serverSession = await store.createSession({
          studentId: student.id,
          totalQuestions: session.totalQuestions,
          questionIds,
          paperType: selectedPaperType,
          seed,
          selectedSubjects,
          elapsedSeconds: localId ? elapsedSeconds : 0,
        });
        
        // Record usage
        try {
          await store.recordQuestionUsage(questionIds);
        } catch (error) {
          console.warn("Could not record question usage:", error);
        }
        
        return NextResponse.json({ 
          student, 
          session: { ...serverSession, localId: localId ?? localSessionId },
          backend: store.kind 
        });
      } catch (error) {
        console.error("Server create failed, falling back to offline:", error);
      }
    }

    return NextResponse.json({ 
      student,
      session,
      offline: true 
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const idToken = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!idToken) {
      return NextResponse.json({ error: "Sign in to load this quiz" }, { status: 401 });
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

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
