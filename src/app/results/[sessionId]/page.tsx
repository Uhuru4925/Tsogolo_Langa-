import { getStore } from "@/lib/storage";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  scienceCareers,
  humanitiesCareers,
  mixedCareers,
  getGrade,
  getStudyGuidance,
  type CareerPath,
} from "@/lib/questions";
import { ArrowLeft, CalendarDays, Lightbulb, Trophy, Star, ChevronRight, RotateCcw, Share2 } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icon-names";
import { LocalQuizResults } from "@/components/local-quiz-results";
import { StudentAvatar } from "@/components/student-avatar";

export const dynamic = "force-dynamic";

async function getResultData(sessionId: string) {
  const store = await getStore();

  const session = await store.getSession(sessionId);
  if (!session || !session.completed) return null;

  const student = await store.getStudent(session.studentId);
  const result = await store.getResultBySession(sessionId);

  return { session, student, result };
}

interface SubjectFocus {
  subject: string;
  icon: IconName;
  tip: string;
}

const SCIENCE_SUBJECTS: SubjectFocus[] = [
  { subject: "Mathematics", icon: "study", tip: "Essential for all science careers" },
  { subject: "Biology", icon: "biology", tip: "Required for medicine & health" },
  { subject: "Chemistry", icon: "biology", tip: "Key for pharmacy & engineering" },
  { subject: "Physics", icon: "science", tip: "Foundation for engineering & ICT" },
  { subject: "Additional Mathematics", icon: "study", tip: "Boosts university entry score" },
  { subject: "Computer Studies", icon: "computer", tip: "Growing demand in Malawi tech sector" },
];

const HUMANITIES_SUBJECTS: SubjectFocus[] = [
  { subject: "English", icon: "communication", tip: "Essential — required for all universities" },
  { subject: "History", icon: "books", tip: "Foundation for law & social sciences" },
  { subject: "Geography", icon: "chart", tip: "Key for planning & development" },
  { subject: "Social & Dev Studies", icon: "person", tip: "Vital for NGO & government work" },
  { subject: "Chichewa", icon: "communication", tip: "Important for communication in Malawi" },
  { subject: "Bible Knowledge", icon: "library", tip: "Opens doors in education & church ministry" },
];

const MIXED_SUBJECTS: SubjectFocus[] = [
  { subject: "Mathematics", icon: "study", tip: "Required across all careers" },
  { subject: "English", icon: "communication", tip: "Compulsory for university entry" },
  { subject: "Biology or Geography", icon: "chart", tip: "Great for interdisciplinary fields" },
  { subject: "Economics / Commerce", icon: "leaderboard", tip: "Opens business & finance paths" },
  { subject: "History", icon: "books", tip: "Strengthens your analytical thinking" },
  { subject: "Computer Studies", icon: "computer", tip: "Future-proof skill for any career" },
];

function ScoreBar({
  label,
  icon,
  score,
  color,
}: {
  label: string;
  icon: IconName;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
          <AppIcon name={icon} className="h-4 w-4 brightness-0 opacity-60" />
          {label}
        </span>
        <span className={`text-sm font-bold ${color}`}>{score}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            color.includes("blue") ? "bg-blue-500" : "bg-amber-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function CareerCard({ career }: { career: CareerPath }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3">
        <AppIcon name={career.icon} className="h-8 w-8 shrink-0 brightness-0 opacity-60" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 text-sm mb-1">{career.title}</h3>
          <p className="text-slate-500 text-xs leading-relaxed mb-2">{career.description}</p>
          {career.university && (
            <div className="flex items-center gap-1 text-xs text-[#1a3c6e] font-semibold">
              <AppIcon name="school" className="h-4 w-4 brightness-0 opacity-60" />
              {career.university}
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {career.subjects.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  if (sessionId.startsWith("local-")) {
    return <LocalQuizResults sessionId={sessionId} />;
  }
  const data = await getResultData(sessionId);

  if (!data) {
    notFound();
  }

  const { session, student, result } = data;
  const category = result?.category || "Mixed";
  const sciScore = result?.scienceScore ?? 0;
  const humScore = result?.humanitiesScore ?? 0;
  const totalScore = result?.totalScore ?? 0;
  const grade = result?.grade ?? "F";
  const gradeInfo = getGrade(totalScore);
  const guidance = result?.guidance?.length
    ? result.guidance
    : getStudyGuidance(student?.form ?? null, totalScore);
  const selectedSubjects = result?.selectedSubjects?.length
    ? result.selectedSubjects
    : session.selectedSubjects;

  let careers: CareerPath[] = [];
  const categoryBg = "from-[#1a3c6e] to-[#1e5799]";
  let categoryLabel = "Sciences";
  let categoryDesc =
    "You have a strong aptitude for Science subjects! You excel at analytical thinking, problem-solving, and understanding the natural world.";

  if (category === "Sciences") {
    careers = scienceCareers;
    categoryLabel = "Sciences";
  } else if (category === "Humanities") {
    careers = humanitiesCareers;
    categoryLabel = "Humanities";
    categoryDesc =
      "You have a strong aptitude for Humanities! You excel at critical thinking, communication, and understanding people and societies.";
  } else {
    careers = mixedCareers;
    categoryLabel = "Sciences & Humanities";
    categoryDesc =
      "You are well-rounded across both Sciences and Humanities! Your versatility opens doors to many exciting interdisciplinary careers.";
  }

  const gradeColors: Record<string, string> = {
    A: "text-emerald-600 bg-emerald-50 border-emerald-200",
    B: "text-blue-600 bg-blue-50 border-blue-200",
    C: "text-indigo-600 bg-indigo-50 border-indigo-200",
    D: "text-amber-600 bg-amber-50 border-amber-200",
    F: "text-red-600 bg-red-50 border-red-200",
  };

  const gradeMotivation: Record<string, string> = {
    A: "Exceptional performance! You are among the best. With this level of aptitude, you can aim for the most competitive programmes at university.",
    B: "Great work! Your performance shows strong ability. Keep pushing and you will reach the top universities in Malawi.",
    C: "Good effort! You have solid foundations. With more practice, you can improve and access a wide range of career options.",
    D: "You are on the right track. Hard work and dedication will help you improve significantly before your MSCE exams.",
    F: "Don't give up! Every great student started somewhere. Focus on your studies and seek help from teachers — you can do it!",
  };
  const recommendedSubjects =
    category === "Sciences"
      ? SCIENCE_SUBJECTS
      : category === "Humanities"
        ? HUMANITIES_SUBJECTS
        : category === "Mixed"
          ? MIXED_SUBJECTS
          : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero result banner */}
      <div className={`bg-gradient-to-br ${categoryBg} py-12 px-4`}>
        <div className="relative mx-auto max-w-3xl pt-12 text-center">
          <Link
            href="/"
            className="absolute left-0 top-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex gap-1 justify-center mb-6">
            <div className="h-1.5 w-10 bg-black rounded-full" />
            <div className="h-1.5 w-10 bg-red-500 rounded-full" />
            <div className="h-1.5 w-10 bg-[#0f7c2a] rounded-full" />
          </div>

          <StudentAvatar fallbackName={student?.name} />
          <p className="text-white/70 text-sm font-semibold mb-2 uppercase tracking-wider">
            Results for
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            {student?.name}
          </h1>
          {student?.school && (
            <p className="text-white/70 text-sm mb-6">
              {student.school}{student?.form ? ` · ${student.form}` : ""}
            </p>
          )}
          {student?.form && !student.school && (
            <p className="text-white/70 text-sm mb-6">{student.form}</p>
          )}

          <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 text-center sm:grid-cols-3">
            <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/15 px-4 py-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Grade</p>
              <p className="mt-1 text-4xl font-extrabold leading-none text-white">{grade}</p>
              <p className="mt-2 text-xs text-white/80">{gradeInfo.label}</p>
            </div>
            <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/15 px-4 py-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Overall</p>
              <p className="mt-1 text-4xl font-extrabold leading-none text-white">{totalScore}%</p>
              <p className="mt-2 text-xs text-white/80">Total score</p>
            </div>
            <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-white/20 bg-white/15 px-4 py-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/70">You are best suited for</p>
              <p className="mt-2 text-xl font-extrabold leading-snug text-white">{categoryLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Score breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Score Breakdown
          </h2>
          <div className="space-y-4">
            <ScoreBar
              label="Sciences & Mathematics"
              icon="science"
              score={sciScore}
              color="text-blue-600"
            />
            <ScoreBar
              label="Humanities & Languages"
              icon="books"
              score={humScore}
              color="text-amber-600"
            />
          </div>
          {Object.keys(result?.subjectScores ?? {}).length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h3 className="mb-3 text-sm font-bold text-slate-700">Scores by question-bank area</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(result?.subjectScores ?? {}).map(([subject, score]) => (
                  <div key={subject} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-600">{subject}</span>
                    <span className="font-bold text-slate-800">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-700 text-sm leading-relaxed">
              <span className="inline-flex items-center gap-1 font-bold">
                <AppIcon name="chart" className="h-4 w-4 brightness-0 opacity-60" />
                Analysis:
              </span>{" "}
              {categoryDesc}
            </p>
          </div>

          <div className={`mt-4 p-4 rounded-2xl border ${gradeColors[grade] || gradeColors.F}`}>
            <p className="text-sm leading-relaxed">
              <span className="inline-flex items-center gap-1 font-bold">
                <AppIcon name="communication" className="h-4 w-4 brightness-0 opacity-60" />
                Feedback:
              </span>{" "}
              {gradeMotivation[grade] || gradeMotivation.F}
            </p>
          </div>
        </div>

        {student?.form !== "Form 3" && <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
            <Lightbulb aria-hidden="true" className="h-5 w-5 text-[#1e5799]" />
            Guidance for {student?.form || "your next step"}
          </h2>
          <ul className="space-y-3">
            {guidance.map((tip) => (
              <li key={tip} className="flex gap-3 text-sm leading-relaxed text-slate-700">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1e5799]" />
                {tip}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            This quiz is for exploration and revision, not a diagnosis or a fixed career decision.
            Discuss choices with a teacher or school counsellor and verify current entry
            requirements with the institutions.
          </p>
        </section>}

        {selectedSubjects.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 font-bold text-slate-800">Subjects you selected</h2>
            <div className="flex flex-wrap gap-2">
              {selectedSubjects.map((subject) => (
                <span key={subject} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1a3c6e]">
                  {subject}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Career Recommendations */}
        <div>
          <h2 className="font-bold text-slate-800 text-xl mb-2 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#1e5799]" /> Recommended Career Paths
          </h2>
          <p className="text-slate-500 text-sm mb-5">
            Based on your {categoryLabel} aptitude, here are the best career paths for you in Malawi:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {careers.map((career) => (
              <CareerCard key={career.title} career={career} />
            ))}
          </div>
        </div>

        {/* MSCE Subjects to focus on */}
        <div className="bg-gradient-to-br from-[#1a3c6e] to-[#1e5799] rounded-3xl p-6 text-white">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AppIcon name="books" className="h-5 w-5 brightness-0 invert opacity-90" />
            Recommended MSCE Subjects to Focus On
          </h2>
          {recommendedSubjects.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {recommendedSubjects.map((subject) => (
                <div key={subject.subject} className="bg-white/10 rounded-xl p-3 border border-white/15">
                  <p className="flex items-center gap-1.5 font-semibold text-sm">
                    <AppIcon
                      name={subject.icon}
                      className="h-4 w-4 brightness-0 invert opacity-80"
                    />
                    {subject.subject}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">{subject.tip}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Study plan call to action */}
        <div className="bg-gradient-to-br from-[#1a3c6e] to-[#1e5799] rounded-3xl p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="mb-1.5 flex items-center gap-2 font-bold text-lg">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
                Now build your study plan
              </h2>
              <p className="text-white/85 text-sm leading-relaxed">
                See exactly how you performed in every single subject, then turn the MSCE syllabus
                into a week-by-week revision timetable you can tick off as you go.
              </p>
            </div>
            <Link
              href={`/plan/${sessionId}`}
              className="inline-flex items-center gap-2 bg-white text-[#1a3c6e] font-bold px-6 py-3.5 rounded-xl hover:shadow-lg transition-all shrink-0"
            >
              Plan my studies <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Inspirational quote */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 text-lg font-semibold italic mb-2">
            &ldquo;Education is the most powerful weapon which you can use to change the world.&rdquo;
          </p>
          <p className="text-amber-600 text-sm">— Nelson Mandela</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/quiz"
            className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 font-bold px-6 py-4 rounded-2xl hover:border-[#1a3c6e] hover:text-[#1a3c6e] transition-all"
          >
            <RotateCcw className="w-5 h-5" /> Retake Quiz
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] text-white font-bold px-6 py-4 rounded-2xl hover:shadow-lg transition-all"
          >
            <Trophy className="w-5 h-5 text-amber-300" /> View Leaderboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </main>
    </div>
  );
}
