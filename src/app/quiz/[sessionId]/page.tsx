"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle,
  Clock,
  BookOpen,
  Lightbulb,
  X,
} from "lucide-react";
import { getQuestionsByIds, shuffleOptions, cognitiveLevelOf, COGNITIVE_LEVEL_LABEL, type Question } from "@/lib/questions";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icon-names";
import {
  addToQueue,
  getSession as getLocalSession,
  saveSession as saveLocalSession,
} from "@/lib/offline/db";

const subjectColors: Record<string, string> = {
  Science: "bg-blue-100 text-blue-800 border-blue-200",
  Math: "bg-purple-100 text-purple-800 border-purple-200",
  Humanities: "bg-amber-100 text-amber-800 border-amber-200",
  Language: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const subjectIcons: Record<string, IconName> = {
  Science: "science",
  Math: "study",
  Humanities: "books",
  Language: "communication",
  "Computer Studies": "computer",
  "Home Economics": "food",
  "Technical Arts": "construction",
  "Bible Knowledge": "library",
};

const cognitiveTone: Record<string, string> = {
  Recall: "bg-slate-200 text-slate-700",
  Apply: "bg-emerald-400 text-emerald-950",
  Analyse: "bg-rose-400 text-rose-950",
};

export default function QuizPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const router = useRouter();
  const { sessionId } = use(params);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [explainedQuestionId, setExplainedQuestionId] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timeElapsedRef = useRef(0);
  const [paper, setPaper] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const pendingSaveRef = useRef<Promise<void>>(Promise.resolve());

  const saveElapsedTime = useCallback(async (elapsedSeconds: number) => {
    if (sessionId.startsWith("local-")) {
      const local = await getLocalSession(sessionId);
      if (!local) throw new Error("Local quiz session was not found.");
      local.elapsedSeconds = elapsedSeconds;
      await saveLocalSession(local);
      await addToQueue({
        type: "update-session",
        payload: { sessionId, patch: { elapsedSeconds } },
      });
      return;
    }

    const user = (await import("@/lib/firebase/client")).getFirebaseAuth().currentUser;
    if (!user) throw new Error("Sign in again to save your quiz time.");
    const idToken = await user.getIdToken();
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ elapsedSeconds }),
      });
      if (!response.ok) throw new Error("Quiz time could not be saved.");
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      await addToQueue({
        type: "update-session",
        payload: { sessionId, patch: { elapsedSeconds } },
      });
      console.warn("Quiz timer saved locally and queued for sync.");
    }
  }, [sessionId]);

  // Each student receives their own randomly generated set of questions.
  useEffect(() => {
    let cancelled = false;
    async function loadPaper() {
      try {
        let ids: number[];
        let seed: number;
        let saved: Record<string, number>;
        let savedElapsedSeconds: number;
        if (sessionId.startsWith("local-")) {
          const local = await getLocalSession(sessionId);
          if (!local) throw new Error("Local quiz session was not found.");
          ids = local.questionIds;
          seed = local.seed;
          saved = local.answers;
          savedElapsedSeconds = local.elapsedSeconds ?? 0;
        } else {
          const user = (await import("@/lib/firebase/client")).getFirebaseAuth().currentUser;
          if (!user) throw new Error("Sign in again to continue this quiz.");
          const idToken = await user.getIdToken();
          const res = await fetch(`/api/sessions?sessionId=${sessionId}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Could not load quiz session.");
          ids = data?.session?.questionIds ?? [];
          seed = data?.session?.seed ?? 1;
          saved = (data?.session?.answers ?? {}) as Record<string, number>;
          savedElapsedSeconds = data?.session?.elapsedSeconds ?? 0;
        }
        if (cancelled) return;

        const questions = getQuestionsByIds(ids).map((q) => shuffleOptions(q, seed));
        setPaper(questions);
        timeElapsedRef.current = savedElapsedSeconds;
        setTimeElapsed(savedElapsedSeconds);
        const restoredAnswers = Object.fromEntries(
          Object.entries(saved).map(([k, v]) => [Number(k), v]),
        );
        setAnswers(restoredAnswers);
        const firstUnanswered = questions.findIndex(
          (question) => restoredAnswers[question.id] === undefined,
        );
        setCurrentIndex(firstUnanswered === -1 ? Math.max(questions.length - 1, 0) : firstUnanswered);
      } catch (err) {
        console.error("Could not load paper:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPaper();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const currentQuestion = paper[currentIndex];
  const totalQuestions = paper.length;
  const progress = totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = totalQuestions > 0 && currentIndex === totalQuestions - 1;

  useEffect(() => {
    if (loading) return;
    const timer = setInterval(() => {
      timeElapsedRef.current += 1;
      setTimeElapsed(timeElapsedRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const checkpoint = setInterval(() => {
      const elapsedSeconds = timeElapsedRef.current;
      const savePromise = pendingSaveRef.current
        .catch(() => undefined)
        .then(() => saveElapsedTime(elapsedSeconds));
      pendingSaveRef.current = savePromise;
      void savePromise.catch((error: unknown) => {
        console.error("Could not save quiz timer:", error);
      });
    }, 15000);
    return () => clearInterval(checkpoint);
  }, [loading, saveElapsedTime]);

const selectedOption =
  currentQuestion ? (answers[currentQuestion.id] ?? null) : null;
const selectedOptionIndex =
  currentQuestion && selectedOption !== null
    ? (selectedOptions[currentQuestion.id] ??
      currentQuestion.options.findIndex((option) => option.value === selectedOption))
    : null;
const showExplanation = currentQuestion?.id === explainedQuestionId;

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  async function saveAnswer(
    questionId: number,
    value: number,
    allAnswers: Record<number, number>,
    elapsedSeconds: number,
  ) {
    if (sessionId.startsWith("local-")) {
      const local = await getLocalSession(sessionId);
      if (!local) throw new Error("Local quiz session was not found.");
      local.answers = Object.fromEntries(
        Object.entries(allAnswers).map(([id, answer]) => [String(id), answer]),
      );
      local.answers[String(questionId)] = value;
      local.elapsedSeconds = elapsedSeconds;
      await saveLocalSession(local);
      await addToQueue({
        type: "update-session",
        payload: {
          sessionId,
          patch: { answers: local.answers, elapsedSeconds },
        },
      });
      return;
    }
    const user = (await import("@/lib/firebase/client")).getFirebaseAuth().currentUser;
    if (!user) throw new Error("Sign in again to save your answer.");
    const idToken = await user.getIdToken();
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        answers: Object.fromEntries(
          Object.entries(allAnswers).map(([id, answer]) => [String(id), answer]),
        ),
          elapsedSeconds,
        }),
    });
    if (!response.ok) throw new Error("The answer could not be saved.");
  }

  function handleSelectOption(value: number, optionIndex: number) {
    if (!currentQuestion) return;
    setSelectedOptions((options) => ({ ...options, [currentQuestion.id]: optionIndex }));
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    setExplainedQuestionId(currentQuestion.id);
    setSaveStatus("saving");
    const savePromise = pendingSaveRef.current
      .catch(() => undefined)
      .then(() => saveAnswer(currentQuestion.id, value, newAnswers, timeElapsedRef.current));
    pendingSaveRef.current = savePromise;
    void savePromise.then(() => {
      setSaveStatus("saved");
    }).catch((error: unknown) => {
      setSaveStatus("error");
      console.error("Could not save quiz answer:", error);
    });
  }

  async function handleNext() {
    if (isLastQuestion) {
      await handleSubmit();
    } else {
      setExplainedQuestionId(null);
      setCurrentIndex((i) => i + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setExplainedQuestionId(null);
      setCurrentIndex((i) => i - 1);
    }
  }

  async function handleSaveAndExit() {
    setSubmitting(true);
    try {
      const savePromise = pendingSaveRef.current
        .catch(() => undefined)
        .then(() => saveElapsedTime(timeElapsedRef.current));
      pendingSaveRef.current = savePromise;
      await savePromise;
      router.push("/");
    } catch (error) {
      console.error("Could not save progress before exiting:", error);
      setSaveStatus("error");
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await pendingSaveRef.current;
      if (sessionId.startsWith("local-")) {
        const local = await getLocalSession(sessionId);
        if (!local) throw new Error("Local quiz session was not found.");
        local.answers = Object.fromEntries(
          Object.entries(answers).map(([questionId, answer]) => [String(questionId), answer]),
        );
        local.elapsedSeconds = timeElapsedRef.current;
        local.completed = true;
        await saveLocalSession(local);
        await addToQueue({
          type: "update-session",
          payload: {
            sessionId,
            patch: {
              answers: local.answers,
              elapsedSeconds: local.elapsedSeconds,
              finalize: true,
            },
          },
        });
        router.push(`/results/${sessionId}`);
        return;
      }
      const user = (await import("@/lib/firebase/client")).getFirebaseAuth().currentUser;
      if (!user) throw new Error("Sign in again to save your results.");
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          finalize: true,
          elapsedSeconds: timeElapsedRef.current,
        }),
      });
      if (!response.ok) throw new Error("The quiz could not be finalized.");
      router.push(`/results/${sessionId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }

  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a3c6e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Generating your unique paper…</p>
          <p className="text-slate-400 text-sm mt-1">No two students get the same questions.</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-slate-700 font-semibold mb-2">This quiz session could not be loaded.</p>
          <p className="text-slate-500 text-sm mb-6">It may have expired or been removed.</p>
          <Link href="/quiz" className="inline-block bg-[#1a3c6e] text-white font-semibold px-6 py-3 rounded-xl">
            Start a new quiz
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1a3c6e]" />
            <span className="font-bold text-[#1a3c6e] text-sm">MSCE Career Quiz</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 sm:gap-4">
            <span className="hidden items-center gap-1 sm:flex">
              <Clock className="w-4 h-4" />
              {formatTime(timeElapsed)}
            </span>
            <span className="hidden font-semibold text-slate-700 sm:inline">
              {answeredCount}/{totalQuestions} answered
            </span>
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={submitting}
              className="rounded-lg bg-[#1a3c6e] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#15305a] disabled:cursor-wait disabled:opacity-60 sm:text-sm"
            >
              {submitting ? "Saving…" : "Save & exit"}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-[#1a3c6e] to-[#0f7c2a] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500" aria-live="polite">
          <span>
            {saveStatus === "saving" && "Saving your progress…"}
            {saveStatus === "saved" && "Progress saved automatically"}
            {saveStatus === "error" && "Could not save the latest answer. Please try again before exiting."}
          </span>
          <span className="sm:hidden">{answeredCount}/{totalQuestions} answered · {formatTime(timeElapsed)}</span>
        </div>
        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
          {paper.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                i === currentIndex
                  ? "bg-[#1a3c6e] text-white scale-110 shadow-md"
                  : answers[q.id] !== undefined
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden mb-6">
          {/* Card header */}
          <div className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900 shadow-sm">
                  Phase: {currentQuestion.difficulty}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                    cognitiveTone[COGNITIVE_LEVEL_LABEL[cognitiveLevelOf(currentQuestion)]]
                  }`}
                  title="What kind of thinking this question tests"
                >
                  {COGNITIVE_LEVEL_LABEL[cognitiveLevelOf(currentQuestion)]}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-white/20 text-white border-white/30">
                  <AppIcon
                    name={subjectIcons[currentQuestion.subject]}
                    className="h-4 w-4 brightness-0 opacity-70"
                  />
                  {currentQuestion.subject}
                </span>
              </div>
              <span className="text-white/70 text-sm font-medium">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>
            <h2 className="text-white text-lg md:text-xl font-semibold leading-relaxed">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Options */}
          <div className="p-6 space-y-3">
{currentQuestion.options.map((option, optionIndex) => {
              // Compare by position, not by point value - two distractors can
              // legitimately share the same partial-credit value (e.g. both
              // worth 1 point), which previously caused both to highlight.
              const isSelected = selectedOptionIndex === optionIndex;
              const hasAnswered = selectedOptionIndex !== null;
              const isCorrect = option.value === 4; // max score = correct answer

              let optionClass =
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left group";

              if (!hasAnswered) {
                optionClass +=
                  " border-slate-200 hover:border-[#1a3c6e] hover:bg-blue-50";
              } else if (isSelected && isCorrect) {
                optionClass += " border-emerald-500 bg-emerald-50";
              } else if (isSelected && !isCorrect) {
                optionClass += " border-red-400 bg-red-50";
              } else if (isCorrect && hasAnswered) {
                optionClass += " border-emerald-400 bg-emerald-50";
              } else {
                optionClass += " border-slate-200 bg-slate-50 opacity-60";
              }

              return (
                <button
                  key={option.label}
                  onClick={() => !hasAnswered && handleSelectOption(option.value, optionIndex)}
                  disabled={hasAnswered}
                  className={optionClass}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all ${
                      !hasAnswered
                        ? "bg-slate-100 text-slate-600 group-hover:bg-[#1a3c6e] group-hover:text-white"
                        : isSelected && isCorrect
                        ? "bg-emerald-500 text-white"
                        : isSelected && !isCorrect
                        ? "bg-red-500 text-white"
                        : isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {hasAnswered && isCorrect ? (
                      <Check aria-label="Correct" className="h-4 w-4" />
                    ) : hasAnswered && isSelected && !isCorrect ? (
                      <X aria-label="Incorrect" className="h-4 w-4" />
                    ) : (
                      option.label
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      !hasAnswered ? "text-slate-700" : isSelected ? "text-slate-800 font-semibold" : "text-slate-500"
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && currentQuestion.explanation && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-800 text-sm">
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Lightbulb aria-hidden="true" className="h-4 w-4" />
                    Explanation:
                  </span>{" "}
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" /> Previous
          </button>

          <div className="text-center">
            {selectedOption === null && (
              <p className="text-slate-400 text-xs">Select an answer to continue</p>
            )}
            {answeredCount === totalQuestions && (
              <p className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All questions answered!
              </p>
            )}
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={answeredCount < totalQuestions || submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f7c2a] text-white font-bold hover:bg-[#0a6122] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" /> Submit Quiz
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={selectedOption === null}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a3c6e] text-white font-bold hover:bg-[#15305a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Skip to results if all answered */}
        {answeredCount === totalQuestions && !isLastQuestion && (
          <div className="text-center mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-sm text-[#0f7c2a] hover:text-[#0a6122] font-semibold underline underline-offset-2"
            >
              {submitting ? "Submitting..." : "All done! Submit and see results →"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
