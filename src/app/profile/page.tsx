"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, LoaderCircle, Pencil, UserRound } from "lucide-react";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";
import { getAllSessions } from "@/lib/offline/db";

type StudentProfile = {
  name: string;
  school: string | null;
  form: string | null;
  selectedSubjects: string[];
};

type QuizResult = {
  id: string;
  sessionId: string;
  totalScore: number;
  grade: string;
  category: string;
  createdAt: string;
};

type QuizToResume = {
  id: string;
  answeredQuestions: number;
  totalQuestions: number;
  createdAt: string | number;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [inProgressQuizzes, setInProgressQuizzes] = useState<QuizToResume[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [ready, setReady] = useState(() => Boolean(getFirebaseClientConfigError()));
  const [error, setError] = useState(() => getFirebaseClientConfigError() ?? "");

  useEffect(() => {
    if (configError) return;
    let cancelled = false;
    let unsubscribe = () => {};
    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser);
          setReady(true);
          if (!nextUser || nextUser.isAnonymous) {
            router.replace(`/login?next=${encodeURIComponent("/profile")}`);
            return;
          }
          setProfileLoaded(false);
          void nextUser.getIdToken().then(async (token) => {
            const response = await fetch("/api/profile", {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });
            const data = (await response.json()) as {
              profile: StudentProfile | null;
              history?: QuizResult[];
              inProgressSessions?: QuizToResume[];
              error?: string;
            };
            if (!response.ok) throw new Error(data.error || "Could not load your profile.");
            if (!cancelled) {
              setProfile(data.profile);
              setHistory(data.history ?? []);
              const savedServerQuizzes = data.inProgressSessions ?? [];
              void getAllSessions()
                .then((localSessions) => {
                  if (cancelled) return;
                  const resumableLocals = localSessions
                    .filter((session) => !session.completed)
                    .map((session) => ({
                      id: session.id,
                      serverSessionId: session.serverSessionId,
                      answeredQuestions: Object.keys(session.answers).length,
                      totalQuestions: session.questionIds.length,
                      createdAt: session.createdAt,
                    }));
                  const localServerIds = new Set(
                    resumableLocals
                      .map((session) => session.serverSessionId)
                      .filter((id): id is string => Boolean(id)),
                  );
                  const combined = [
                    ...savedServerQuizzes.filter((session) => !localServerIds.has(session.id)),
                    ...resumableLocals.map((session) => ({
                      id: session.serverSessionId ?? session.id,
                      answeredQuestions: session.answeredQuestions,
                      totalQuestions: session.totalQuestions,
                      createdAt: session.createdAt,
                    })),
                  ];
                  const unique = new Map(combined.map((session) => [session.id, session]));
                  setInProgressQuizzes(
                    [...unique.values()].sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                    ),
                  );
                })
                .catch((localError: unknown) => {
                  console.error("Could not load locally saved quizzes:", localError);
                  if (!cancelled) setInProgressQuizzes(savedServerQuizzes);
                });
              setProfileLoaded(true);
            }
          }).catch((loadError: unknown) => {
            console.error("Could not load student profile:", loadError);
            if (!cancelled) {
              setError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
              setProfileLoaded(true);
            }
          });
        });
      })
      .catch((authError: unknown) => {
        console.error("Could not initialize Firebase Authentication:", authError);
        setError("Firebase Authentication is unavailable.");
        setReady(true);
      });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configError, router]);

  if (!ready || (user && !profileLoaded && !error)) {
    return <main className="flex min-h-screen items-center justify-center text-slate-600"><LoaderCircle aria-label="Loading profile" className="h-7 w-7 animate-spin" /></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1a3c6e]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Home
        </Link>
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <header className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] p-8 text-white">
            <div className="flex items-center gap-3">
              <UserRound aria-hidden="true" className="h-8 w-8" />
              <div><h1 className="text-2xl font-extrabold">My profile</h1><p className="text-sm text-white/75">{user?.email}</p></div>
            </div>
          </header>
          {error ? (
            <p role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
          ) : profile ? (
            <div className="space-y-6 p-6 sm:p-8">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Name</dt><dd className="mt-1 font-semibold text-slate-800">{profile.name}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">School</dt><dd className="mt-1 font-semibold text-slate-800">{profile.school || "Not set"}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Level of study</dt><dd className="mt-1 font-semibold text-slate-800">{profile.form || "Not set"}</dd></div>
              </dl>
              <div>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Subjects being taken</h2>
                {profile.selectedSubjects.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {profile.selectedSubjects.map((subject) => <li key={subject} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[#1a3c6e]">{subject}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-500">No subjects selected yet.</p>}
              </div>
              <Link
                href="/profile/subjects?edit=1"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a3c6e] px-5 py-3 font-bold text-white transition hover:bg-[#15305a]"
              >
                <Pencil aria-hidden="true" className="h-4 w-4" /> Edit profile and subjects
              </Link>
              <section className="border-t border-slate-100 pt-6">
                <h2 className="mb-3 text-lg font-bold text-slate-800">Quizzes in progress</h2>
                {inProgressQuizzes.length ? (
                  <ol className="divide-y divide-slate-100">
                    {inProgressQuizzes.map((quiz) => (
                      <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">Saved quiz</p>
                          <p className="text-xs text-slate-500">
                            {quiz.answeredQuestions} of {quiz.totalQuestions} questions answered ·{" "}
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/quiz/${quiz.id}`}
                          className="rounded-lg bg-[#1a3c6e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#15305a]"
                        >
                          Continue quiz
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">Saved quizzes you have not submitted will appear here.</p>
                )}
              </section>
              <section className="border-t border-slate-100 pt-6">
                <h2 className="mb-3 text-lg font-bold text-slate-800">Quiz history</h2>
                {history.length ? (
                  <ol className="divide-y divide-slate-100">
                    {history.map((attempt) => (
                      <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            Grade {attempt.grade} · {attempt.totalScore}%
                          </p>
                          <p className="text-xs text-slate-500">
                            {attempt.category} · {new Date(attempt.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/results/${attempt.sessionId}`}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-[#1a3c6e] hover:bg-blue-50"
                        >
                          View result
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-slate-500">Your completed quiz results will appear here.</p>
                )}
              </section>
            </div>
          ) : (
            <div className="space-y-4 p-8 text-center">
              <p className="text-slate-600">Finish setting up your student profile and subjects.</p>
              <Link href="/profile/subjects" className="inline-flex rounded-xl bg-[#1a3c6e] px-5 py-3 font-bold text-white">Set up profile</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
