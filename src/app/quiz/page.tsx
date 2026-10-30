"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle, UserRound, Play, Clock3 } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { addToQueue, getAllSessions, getSession as getLocalSession, saveSession } from "@/lib/offline/db";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";
import { buildPaperForSubjects } from "@/lib/questions";

type StudentProfile = {
  name: string;
  school: string | null;
  form: string | null;
  selectedSubjects: string[];
};

type SessionResponse = {
  session?: { id: string; questionIds: number[]; seed: number };
  offline?: boolean;
  error?: string;
  requiresProfile?: boolean;
};

type ResumeQuiz = {
  id: string;
  serverSessionId?: string;
  answeredQuestions: number;
  totalQuestions: number;
  createdAt: string | number | Date;
};

function createQuizSeed() {
  return Math.floor(Math.random() * 2_000_000_000) + 1;
}

function createLocalQuizId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCurrentTimestamp() {
  return Date.now();
}

export default function QuizStartPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [resumeQuizzes, setResumeQuizzes] = useState<ResumeQuiz[]>([]);
  const [authReady, setAuthReady] = useState(() => Boolean(getFirebaseClientConfigError()));
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");

  useEffect(() => {
    if (configError) return;
    let cancelled = false;
    let unsubscribe = () => {};
    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(
          auth,
          (nextUser) => {
            setUser(nextUser);
            setAuthReady(true);
            if (!nextUser || nextUser.isAnonymous) {
              setProfile(null);
              setProfileReady(true);
              return;
            }

            setProfileReady(false);
            void (async () => {
              try {
                const token = await nextUser.getIdToken();
                const response = await fetch("/api/profile", {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: "no-store",
                });
                const data = (await response.json()) as {
                  profile: StudentProfile | null;
                  inProgressSessions?: ResumeQuiz[];
                  error?: string;
                };
                if (!response.ok) throw new Error(data.error || "Could not load your profile.");
                if (!data.profile || data.profile.selectedSubjects.length === 0) {
                  router.replace("/profile/subjects?next=%2Fquiz");
                  return;
                }
                setProfile(data.profile);
                const serverQuizzes = data.inProgressSessions ?? [];
                try {
                  const localSessions = await getAllSessions();
                  const matchingLocalQuizzes = localSessions
                    .filter(
                      (session) =>
                        !session.completed &&
                        session.student.name.trim().toLocaleLowerCase() ===
                          data.profile?.name.trim().toLocaleLowerCase(),
                    )
                    .map((session) => ({
                      id: session.id,
                      serverSessionId: session.serverSessionId,
                      answeredQuestions: Object.keys(session.answers).length,
                      totalQuestions: session.questionIds.length,
                      createdAt: session.createdAt,
                    }))
                    .filter(
                      (session) =>
                        !session.serverSessionId ||
                        !serverQuizzes.some((server) => server.id === session.serverSessionId),
                    );
                  const uniqueQuizzes = new Map(
                    [...serverQuizzes, ...matchingLocalQuizzes].map((session) => [
                      session.id,
                      session,
                    ]),
                  );
                  setResumeQuizzes(
                    [...uniqueQuizzes.values()].sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    ).slice(0, 1),
                  );
                } catch (localError) {
                  console.error("Could not load local quiz progress:", localError);
                  setResumeQuizzes(serverQuizzes);
                }
                setError("");
              } catch (loadError) {
                console.error("Could not load student profile:", loadError);
                setError(
                  loadError instanceof Error
                    ? loadError.message
                    : "Could not load your student profile.",
                );
              } finally {
                setProfileReady(true);
              }
            })();
          },
          (authError) => {
            console.error("Could not load Firebase sign-in state:", authError);
            setError("Could not load your sign-in. Please refresh and try again.");
            setAuthReady(true);
          },
        );
      })
      .catch((authError: unknown) => {
        console.error("Firebase Authentication is unavailable:", authError);
        setError(
          authError instanceof Error
            ? authError.message
            : "Firebase Authentication is not configured.",
        );
        setAuthReady(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configError, router]);

  async function handleStart(restartSavedQuiz = false) {
    if (!user || user.isAnonymous || !profile) return;
    if (
      restartSavedQuiz &&
      !window.confirm("Restart this quiz? Your current saved answers will be replaced.")
    ) {
      return;
    }
    setError("");
    setLoading(true);

    const saveOffline = async (id: string, questionIds: number[], seed: number) => {
      await saveSession({
        id,
        student: {
          name: profile.name,
          school: profile.school,
          form: profile.form,
          selectedSubjects: profile.selectedSubjects,
        },
        questionIds,
        selectedSubjects: profile.selectedSubjects,
        paperType: "balanced",
        seed,
        answers: {},
        elapsedSeconds: 0,
        completed: false,
        createdAt: Date.now(),
        synced: false,
      });
      await addToQueue({
        type: "create-session",
        payload: {
          name: profile.name,
          school: profile.school,
          form: profile.form,
          selectedSubjects: profile.selectedSubjects,
          localId: id,
          questionIds,
          paperType: "balanced",
          seed,
          elapsedSeconds: 0,
        },
      });
    };

    try {
      let data: SessionResponse | null = null;
      const savedQuiz = restartSavedQuiz ? latestSavedQuiz : undefined;
      const localSavedQuiz =
        savedQuiz?.id.startsWith("local-") && !savedQuiz.serverSessionId
          ? await getLocalSession(savedQuiz.id)
          : null;

      if (localSavedQuiz) {
        const seed = createQuizSeed();
        const questionIds = buildPaperForSubjects(seed, {}, profile.selectedSubjects);
        localSavedQuiz.questionIds = questionIds;
        localSavedQuiz.selectedSubjects = profile.selectedSubjects;
        localSavedQuiz.student.selectedSubjects = profile.selectedSubjects;
        localSavedQuiz.paperType = "balanced";
        localSavedQuiz.seed = seed;
        localSavedQuiz.answers = {};
        localSavedQuiz.elapsedSeconds = 0;
        localSavedQuiz.completed = false;
        localSavedQuiz.createdAt = getCurrentTimestamp();
        await saveSession(localSavedQuiz);
        await addToQueue({
          type: "create-session",
          payload: {
            name: profile.name,
            school: profile.school,
            form: profile.form,
            selectedSubjects: profile.selectedSubjects,
            localId: localSavedQuiz.id,
            questionIds,
            paperType: "balanced",
            seed,
            elapsedSeconds: 0,
          },
        });
        await addToQueue({
          type: "update-session",
          payload: {
            sessionId: localSavedQuiz.id,
            patch: { answers: {}, elapsedSeconds: 0 },
          },
        });
        router.push(`/quiz/${localSavedQuiz.id}`);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            savedQuiz
              ? { restartSessionId: savedQuiz.serverSessionId ?? savedQuiz.id }
              : {},
          ),
        });
        const responseData = (await response.json()) as SessionResponse;
        if (response.status === 409 && responseData?.requiresProfile) {
          router.push("/profile/subjects?next=%2Fquiz");
          return;
        }
        if (response.status === 401) {
          router.push("/login?next=%2Fquiz");
          return;
        }
        if (!response.ok && response.status < 500) {
          throw new Error(responseData?.error || "Could not create quiz session.");
        }
        if (response.ok) data = responseData;
        else console.error("Quiz session API failed; creating a local session:", responseData?.error);
      } catch (requestError) {
        if (requestError instanceof Error && !(requestError instanceof TypeError)) throw requestError;
        if (savedQuiz) {
          throw new Error("Could not restart your saved quiz while offline. Please reconnect and try again.");
        }
        console.warn("Quiz session API is unavailable; creating a local session:", requestError);
      }

      if (data?.session) {
        if (data.offline) {
          await saveOffline(data.session.id, data.session.questionIds, data.session.seed);
        }
        router.push(`/quiz/${data.session.id}`);
        return;
      }

      const localId = createLocalQuizId();
      const seed = createQuizSeed();
      await saveOffline(
        localId,
        buildPaperForSubjects(seed, {}, profile.selectedSubjects),
        seed,
      );
      router.push(`/quiz/${localId}`);
    } catch (startError) {
      console.error("Could not start quiz:", startError);
      setError(
        startError instanceof Error
          ? `Could not start the quiz: ${startError.message}`
          : "Could not start the quiz. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const checking = !authReady || (!!user && !user.isAnonymous && !profileReady);
  const signUpHref = "/login?mode=signup&next=%2Fquiz";
  const latestSavedQuiz = resumeQuizzes[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a3c6e] via-[#1e5799] to-[#0f7c2a] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to Home
        </Link>
        <section className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <header className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
              <AppIcon name="quiz" className="h-8 w-8 brightness-0 opacity-80" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Your subject-based quiz</h1>
            <p className="mt-2 text-sm text-white/75">
              Your saved profile subjects will decide which question areas appear.
            </p>
          </header>

          {checking ? (
            <div className="flex items-center justify-center gap-3 p-10 text-slate-600">
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Checking your account and profile…
            </div>
          ) : !user ? (
            <div className="space-y-5 p-8 text-center">
              <h2 className="text-xl font-bold text-slate-800">Sign in to take a quiz</h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-600">
                Create an account and choose your subjects first. Your progress and results will be saved to your learner profile.
              </p>
              {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
              <Link href="/login?next=%2Fquiz" className="inline-flex items-center gap-2 rounded-xl bg-[#1a3c6e] px-6 py-3 font-bold text-white hover:bg-[#15305a]">
                Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <p className="text-sm text-slate-500">
                New here? <Link href={signUpHref} className="font-bold text-[#1a3c6e] underline">Create an account</Link>
              </p>
            </div>
          ) : user.isAnonymous ? (
            <div className="space-y-5 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                <UserRound aria-hidden="true" className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Create an account to take a quiz</h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-600">
                You are signed in as a guest. Guest accounts cannot start or save exams. Create a permanent account, select your subjects, then come back to take a quiz.
              </p>
              <Link href={signUpHref} className="inline-flex items-center gap-2 rounded-xl bg-[#1a3c6e] px-6 py-3 font-bold text-white hover:bg-[#15305a]">
                Create an account <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <p><Link href="/login?next=%2Fquiz" className="text-sm font-semibold text-slate-500 underline">Sign in with an existing account</Link></p>
            </div>
          ) : profile ? (
            <div className="space-y-6 p-8">
              {latestSavedQuiz && (
                <section className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 font-bold text-slate-800">
                        <Clock3 aria-hidden="true" className="h-5 w-5 text-[#1a3c6e]" />
                        Pick up where you left off
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        Saved progress: {latestSavedQuiz.answeredQuestions} of{" "}
                        {latestSavedQuiz.totalQuestions} questions answered
                      </p>
                    </div>
                    <Link
                      href={`/quiz/${latestSavedQuiz.id}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1a3c6e] px-5 py-3 font-bold text-white transition hover:bg-[#15305a]"
                    >
                      <Play aria-hidden="true" className="h-4 w-4" /> Continue quiz
                    </Link>
                  </div>
                </section>
              )}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <BookOpen aria-hidden="true" className="mt-0.5 h-5 w-5 text-[#1a3c6e]" />
                  <div>
                    <h2 className="font-bold text-slate-800">Ready for your paper, {profile.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {profile.form} · {profile.school || "School not set"}
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {profile.selectedSubjects.map((subject) => (
                        <li key={subject} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1a3c6e]">{subject}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                The paper draws from question areas available for your selected subjects. Some subjects currently share broader question-bank areas.
              </p>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button
                type="button"
                onClick={() => handleStart(Boolean(latestSavedQuiz))}
                disabled={loading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold transition disabled:cursor-wait disabled:opacity-60 ${
                  latestSavedQuiz
                    ? "border-2 border-slate-200 bg-white text-slate-700 hover:border-[#1a3c6e] hover:text-[#1a3c6e]"
                    : "bg-[#1a3c6e] text-white hover:bg-[#15305a]"
                }`}
              >
                {loading ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <ArrowRight aria-hidden="true" className="h-5 w-5" />}
                {loading ? "Preparing your quiz…" : latestSavedQuiz ? "Restart saved quiz" : "Start my quiz"}
              </button>
              <div className="flex justify-between gap-4 text-sm">
                <Link href="/profile" className="font-semibold text-[#1a3c6e] underline">View or edit my profile</Link>
                <Link href="/leaderboard" className="font-semibold text-[#1a3c6e] underline">View leaderboard</Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-600">
              {error || "We could not load your learner profile."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
