import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { PlanBuilder } from "@/components/plan-builder";
import { PlanTracker } from "@/components/plan-tracker";
import { SubjectPracticeCard } from "@/components/subject-practice-card";
import { getStore } from "@/lib/storage";
import { STRENGTH_META, analyseSession, suggestedFocusSubjects } from "@/lib/study/analyse";
import { buildStudyPlan, weeklyTimetable } from "@/lib/study/planner";
import { SYLLABUS, SYLLABUS_BY_SUBJECT } from "@/lib/study/syllabus";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My study plan",
  description:
    "A personalised MSCE revision timetable built from your quiz results, showing exactly which topics to study each week.",
};

export default async function StudyPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ rebuild?: string }>;
}) {
  const { sessionId } = await params;
  const rebuild = (await searchParams).rebuild === "1";
  const store = await getStore();

  const session = await store.getSession(sessionId);
  if (!session || !session.completed) notFound();

  const student = await store.getStudent(session.studentId);
  const breakdown = analyseSession(session.questionIds, session.answers);
  const suggested = suggestedFocusSubjects(breakdown);

  // Subjects the student scored weakest in become "priority" (double study time).
  const weakQuizSubjects = breakdown
    .filter((row) => row.strength === "priority" || row.strength === "developing")
    .map((row) => row.quizSubject);
  const prioritySubjects = SYLLABUS.filter((item) =>
    weakQuizSubjects.includes(item.quizSubject),
  ).map((item) => item.subject);

  const existingPlan = await store.getStudyPlanBySession(sessionId);

  const options = SYLLABUS.map((item) => ({
    subject: item.subject,
    icon: item.icon,
    why: item.why,
    recommended: suggested.includes(item.subject),
    priority: prioritySubjects.includes(item.subject) && suggested.includes(item.subject),
  })).sort((a, b) => Number(b.recommended) - Number(a.recommended));

  const plan = existingPlan
    ? buildStudyPlan({
        subjects: existingPlan.subjects,
        weeks: existingPlan.weeks,
        hoursPerWeek: existingPlan.hoursPerWeek,
        prioritySubjects: existingPlan.prioritySubjects,
      })
    : null;

  const timetable = existingPlan
    ? weeklyTimetable(existingPlan.hoursPerWeek, existingPlan.subjects)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link
            href={`/results/${sessionId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#1a3c6e]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#0f7c2a]" />
            <span className="text-sm font-bold text-slate-800">Study Plan</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a3c6e] to-[#0f7c2a] px-4 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Personalised revision plan
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">
            {student?.name ? `${student.name}'s study plan` : "Your study plan"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80">
            Built from your quiz answers. It shows which subjects need the most work, then turns
            the MSCE syllabus into a week-by-week timetable you can tick off.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
{/* Subject breakdown */}
        <section>
          <h2 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-800">
            <GraduationCap className="h-5 w-5 text-[#1a3c6e]" />
            How you performed in each subject
          </h2>
          <p className="mb-5 text-sm text-slate-600">
            Based on the questions you actually answered. Weakest areas are listed first. Tap{" "}
            <span className="font-semibold text-[#1a3c6e]">Practise this subject</span> under any
            card to drill fresh questions right now.
          </p>

          <div className="space-y-3">
            {breakdown.map((row) => {
              const meta = STRENGTH_META[row.strength];
              return (
                <SubjectPracticeCard
                  key={row.quizSubject}
                  quizSubject={row.quizSubject}
                  label={row.label}
                  icon={row.icon}
                  percentage={row.percentage}
                  correct={row.correct}
                  total={row.total}
                  strengthLabel={meta.label}
                  badgeClass={meta.badge}
                  toneClass={meta.tone}
                  barClass={meta.bar}
                  advice={row.advice}
                  msceSubjects={row.msceSubjects.map((item) => item.subject)}
                />
              );
            })}
          </div>
        </section>

        {/* Retake CTA */}
        <section className="rounded-2xl border-2 border-dashed border-[#0f7c2a]/30 bg-[#0f7c2a]/5 p-6 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-[#0f7c2a]" />
          <h2 className="mt-2 text-lg font-bold text-slate-800">Ready to test yourself again?</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Practise the subjects above until you feel confident, then sit the full assessment
            again. Every attempt gives you a brand-new, non-repeating set of 30 questions — so a
            retake is always a fair, fresh test of how far you have come.
          </p>
          <Link
            href="/quiz"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f7c2a] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0c6522]"
          >
            <Sparkles className="h-4 w-4" />
            Retake the full quiz
          </Link>
        </section>

        {/* Builder or plan */}
        {!existingPlan || !plan || rebuild ? (
          <section>
            <PlanBuilder
              sessionId={sessionId}
              options={options}
              defaultSelected={existingPlan?.subjects.length ? existingPlan.subjects : suggested}
              defaultPriority={prioritySubjects}
            />
          </section>
        ) : (
          <>
            <section>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                    <CalendarDays className="h-5 w-5 text-[#0f7c2a]" />
                    Your {existingPlan.weeks}-week timetable
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {existingPlan.hoursPerWeek} hours a week across{" "}
                    {existingPlan.subjects.join(", ")}. Tap a week to open it.
                  </p>
                </div>
                <Link
                  href={`/plan/${sessionId}?rebuild=1`}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-[#1a3c6e] hover:text-[#1a3c6e]"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Rebuild plan
                </Link>
              </div>

              <PlanTracker
                planId={existingPlan.id}
                weeks={plan.weeks}
                initialCompleted={existingPlan.completedTasks}
              />
            </section>

            {/* Weekly routine */}
            <section>
              <h2 className="mb-1 text-xl font-bold text-slate-800">Suggested weekly routine</h2>
              <p className="mb-4 text-sm text-slate-600">
                Copy this into the front of your exercise book and stick to it.
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {timetable.map((row, index) => (
                  <div
                    key={`${row.day}-${index}`}
                    className={`grid grid-cols-[100px_1fr_auto] items-center gap-3 px-4 py-3 text-sm ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <span className="font-semibold text-slate-700">{row.day}</span>
                    <span className="text-slate-500">{row.slot}</span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        row.subject === "Rest"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-[#1a3c6e]/10 text-[#1a3c6e]"
                      }`}
                    >
                      {row.subject}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Exam tips for chosen subjects */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-800">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Exam technique for your subjects
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {existingPlan.subjects.map((subject) => {
                  const syllabus = SYLLABUS_BY_SUBJECT.get(subject);
                  if (!syllabus) return null;
                  return (
                    <div key={subject} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="font-bold text-slate-800">{subject}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{syllabus.papers}</p>
                      <ul className="mt-3 space-y-2">
                        {syllabus.examTips.map((tip) => (
                          <li key={tip} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                            <span className="text-[#0f7c2a]">▸</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* Study habits */}
        <section className="rounded-3xl bg-gradient-to-br from-[#1a3c6e] to-[#1e5799] p-6 text-white">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <Lightbulb aria-hidden="true" className="h-5 w-5" />
            Study habits that actually work
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Study in 45-minute blocks",
                body: "Work for 45 minutes, rest for 10. Your concentration drops sharply after an hour.",
              },
              {
                title: "Write, do not just read",
                body: "Close the book and write what you remember. Recalling beats re-reading every time.",
              },
              {
                title: "Do past papers early",
                body: "Do not wait until you 'finish' the syllabus. Past papers teach you how marks are awarded.",
              },
              {
                title: "Teach a friend",
                body: "If you can explain a topic clearly to someone else, you truly understand it.",
              },
              {
                title: "Start with the hard subject",
                body: "Tackle your weakest subject first, when your mind is freshest.",
              },
              {
                title: "Mark your own work",
                body: "Always mark honestly and write a short note on every mistake you make.",
              },
            ].map((tip) => (
              <div key={tip.title} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-yellow-200">{tip.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/80">{tip.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/quiz"
            className="flex-1 rounded-xl bg-[#1a3c6e] px-6 py-3.5 text-center font-bold text-white transition hover:bg-[#16325c]"
          >
            Retake the full quiz
          </Link>
          <Link
            href="/papers"
            className="flex-1 rounded-xl bg-[#0f7c2a] px-6 py-3.5 text-center font-bold text-white transition hover:bg-[#0c6522]"
          >
            Download practice papers
          </Link>
          <Link
            href={`/results/${sessionId}`}
            className="flex-1 rounded-xl border-2 border-slate-300 px-6 py-3.5 text-center font-bold text-slate-700 transition hover:border-[#1a3c6e]"
          >
            Back to my results
          </Link>
        </div>
      </main>
    </div>
  );
}
