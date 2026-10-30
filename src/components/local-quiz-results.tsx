"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { getSession as getLocalSession, type LocalSession } from "@/lib/offline/db";
import {
  getCategory,
  getGrade,
  getQuestionsByIds,
  getStudyGuidance,
  SCIENCE_SUBJECTS,
  HUMANITIES_SUBJECTS,
} from "@/lib/questions";
import { StudentAvatar } from "@/components/student-avatar";

export function LocalQuizResults({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLocalSession(sessionId)
      .then((local) => {
        if (!cancelled) setSession(local);
      })
      .catch((error: unknown) => {
        console.error("Could not load local quiz results:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center text-slate-600">Loading your results…</main>;
  }

  if (!session?.completed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-semibold text-slate-700">These quiz results are not available.</p>
        <Link href="/quiz" className="rounded-xl bg-[#1a3c6e] px-5 py-3 font-semibold text-white">
          Start a new quiz
        </Link>
      </main>
    );
  }

  const questions = getQuestionsByIds(session.questionIds);
  const percentageFor = (subjects: string[]) => {
    const stream = questions.filter((question) => subjects.includes(question.subject));
    const maxScore = stream.length * 4;
    const score = stream.reduce((sum, question) => sum + (session.answers[String(question.id)] ?? 0), 0);
    return maxScore ? Math.round((score / maxScore) * 100) : 0;
  };
  const scienceScore = percentageFor(SCIENCE_SUBJECTS);
  const humanitiesScore = percentageFor(HUMANITIES_SUBJECTS);
  const totalScore =
    questions.length > 0
      ? Math.round(
          (questions.reduce(
            (sum, question) => sum + (session.answers[String(question.id)] ?? 0),
            0,
          ) /
            (questions.length * 4)) *
            100,
        )
      : 0;
  const hasScience = questions.some((question) => SCIENCE_SUBJECTS.includes(question.subject));
  const hasHumanities = questions.some((question) => HUMANITIES_SUBJECTS.includes(question.subject));
  const category =
    !hasScience ? "Humanities" : !hasHumanities ? "Sciences" : getCategory(scienceScore, humanitiesScore);
  const grade = getGrade(totalScore);
  const guidance = getStudyGuidance(session.student.form, totalScore);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#1a3c6e]/15 bg-white px-4 py-2 text-sm font-semibold text-[#1a3c6e] shadow-sm transition hover:bg-blue-50"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to Home
        </Link>
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] px-6 py-10 text-center text-white">
          <StudentAvatar fallbackName={session.student.name} />
          <p className="text-sm font-semibold text-white/75">Quiz complete</p>
          <h1 className="mt-2 text-3xl font-extrabold">Your career guidance results</h1>
          <p className="mt-2 text-white/80">{category} · Grade {grade.grade} · {totalScore}%</p>
          <p className="mt-2 text-sm text-white/70">
            {session.student.name}
            {session.student.school ? ` · ${session.student.school}` : ""}
            {session.student.form ? ` · ${session.student.form}` : ""}
          </p>
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            {session.serverSessionId
              ? "Your quiz is saved to your Firebase account."
              : "These results are saved on this device and are waiting to sync to Firebase. Reconnect and sync your saved quiz; if it stays pending, ask the site administrator to configure Firebase server credentials."}
          </p>
          {session.serverSessionId && (
            <Link
              href={`/results/${session.serverSessionId}`}
              className="block rounded-xl bg-emerald-700 px-5 py-3 text-center font-semibold text-white hover:bg-emerald-800"
            >
              Open Firebase-saved results
            </Link>
          )}
          {[
            { label: "Sciences", score: scienceScore, color: "bg-blue-600" },
            { label: "Humanities", score: humanitiesScore, color: "bg-emerald-600" },
          ].map(({ label, score, color }) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm font-semibold text-slate-700">
                <span>{label}</span>
                <span>{score}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
          <section>
            <h2 className="mb-3 font-bold text-slate-800">Guidance for {session.student.form || "your next step"}</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-slate-700">
              {guidance.map((tip) => <li key={tip}>• {tip}</li>)}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 font-bold text-slate-800">Subjects selected</h2>
            <div className="flex flex-wrap gap-2">
              {(session.selectedSubjects ?? []).map((subject) => (
                <span key={subject} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1a3c6e]">
                  {subject}
                </span>
              ))}
            </div>
          </section>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link href="/quiz" className="flex-1 rounded-xl bg-[#1a3c6e] px-5 py-3 text-center font-semibold text-white hover:bg-[#15305a]">
              Take another quiz
            </Link>
            <Link href="/leaderboard" className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-center font-semibold text-slate-700 hover:border-slate-300">
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
