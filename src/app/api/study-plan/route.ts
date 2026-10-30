import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/storage";
import { clampPlanInput } from "@/lib/study/planner";
import { SYLLABUS_BY_SUBJECT } from "@/lib/study/syllabus";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, subjects, prioritySubjects, weeks, hoursPerWeek, examDate } = body as {
      sessionId?: string;
      subjects?: string[];
      prioritySubjects?: string[];
      weeks?: number;
      hoursPerWeek?: number;
      examDate?: string | null;
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const valid = (subjects ?? []).filter((subject) => SYLLABUS_BY_SUBJECT.has(subject));
    if (valid.length === 0) {
      return NextResponse.json({ error: "Choose at least one subject" }, { status: 400 });
    }

    const store = await getStore();
    const session = await store.getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const clamped = clampPlanInput({
      subjects: valid,
      weeks: weeks ?? 6,
      hoursPerWeek: hoursPerWeek ?? 6,
      prioritySubjects: (prioritySubjects ?? []).filter((s) => valid.includes(s)),
    });

    const plan = await store.createStudyPlan({
      studentId: session.studentId,
      sessionId,
      subjects: clamped.subjects,
      prioritySubjects: clamped.prioritySubjects,
      weeks: clamped.weeks,
      hoursPerWeek: clamped.hoursPerWeek,
      examDate: examDate ?? null,
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error creating study plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { planId, taskId, done } = (await req.json()) as {
      planId?: string;
      taskId?: string;
      done?: boolean;
    };

    if (!planId || !taskId) {
      return NextResponse.json({ error: "planId and taskId are required" }, { status: 400 });
    }

    const store = await getStore();
    const plan = await store.toggleStudyTask(planId, taskId, Boolean(done));

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error updating study task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
