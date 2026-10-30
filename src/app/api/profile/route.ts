import { NextRequest, NextResponse } from "next/server";
import { getStore, StorageUnavailableError } from "@/lib/storage";
import {
  isFirebaseAuthenticationError,
  verifyFirebaseIdToken,
} from "@/lib/storage/firebase-app";
import { isStudentSubject } from "@/lib/student-subjects";

export const dynamic = "force-dynamic";

async function getAuthUid(req: NextRequest): Promise<string | null> {
  const idToken = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  return idToken ? verifyFirebaseIdToken(idToken) : null;
}

export async function GET(req: NextRequest) {
  try {
    const authUid = await getAuthUid(req);
    if (!authUid) {
      return NextResponse.json({ error: "Sign in to load your profile" }, { status: 401 });
    }

    const store = await getStore();
    const profile = await store.getStudentByAuthUid(authUid);
    const [history, inProgressSessions] = profile
      ? await Promise.all([
          store.getResultsByAuthUid(authUid),
          store.getInProgressSessionsByAuthUid(authUid),
        ])
      : [[], []];
    return NextResponse.json({ profile, history, inProgressSessions });
  } catch (error) {
    console.error("Could not load student profile:", error);
    if (isFirebaseAuthenticationError(error)) {
      return NextResponse.json(
        { error: "Your sign-in could not be verified. Sign out and sign in again." },
        { status: 401 },
      );
    }
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not load your profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUid = await getAuthUid(req);
    if (!authUid) {
      return NextResponse.json({ error: "Sign in to save your profile" }, { status: 401 });
    }

    const body = await req.json();
    const { name, school, form, selectedSubjects } = body as {
      name?: unknown;
      school?: unknown;
      form?: unknown;
      selectedSubjects?: unknown;
    };
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof school !== "string" ||
      !school.trim() ||
      typeof form !== "string" ||
      !["Form 1", "Form 2", "Form 3", "Form 4"].includes(form)
    ) {
      return NextResponse.json(
        { error: "Name, secondary school and level of study are required" },
        { status: 400 },
      );
    }
    if (
      !Array.isArray(selectedSubjects) ||
      selectedSubjects.length === 0 ||
      !selectedSubjects.every(isStudentSubject)
    ) {
      return NextResponse.json({ error: "Choose at least one valid subject" }, { status: 400 });
    }

    const store = await getStore();
    const student = await store.getStudentByAuthUid(authUid);
    const profileInput = {
      name: name.trim(),
      school: school.trim(),
      form,
      selectedSubjects,
    };
    const profile = student
      ? await store.updateStudent(student.id, profileInput)
      : await store.createStudent({ ...profileInput, authUid });

    if (!profile) {
      return NextResponse.json({ error: "Could not save your profile" }, { status: 500 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Could not save student profile:", error);
    if (isFirebaseAuthenticationError(error)) {
      return NextResponse.json(
        { error: "Your sign-in could not be verified. Sign out and sign in again." },
        { status: 401 },
      );
    }
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not save your profile" }, { status: 500 });
  }
}
