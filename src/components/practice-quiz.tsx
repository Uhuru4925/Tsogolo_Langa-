"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";
import type { Subject } from "@/lib/questions";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icon-names";

interface PracticeOption {
  label: string;
  text: string;
  value: number;
}

interface PracticeQuestion {
  id: number;
  text: string;
  difficulty: string;
  cognitiveLevel: string;
  explanation: string | null;
  options: PracticeOption[];
}

const COGNITIVE_TONE: Record<string, string> = {
  recall: "bg-slate-200 text-slate-700",
  application: "bg-emerald-100 text-emerald-700",
  analysis: "bg-rose-100 text-rose-700",
};

const COGNITIVE_LABEL: Record<string, string> = {
  recall: "Recall",
  application: "Apply",
  analysis: "Analyse",
};

export function PracticeQuiz({ subject, label }: { subject: Subject; label: string }) {
const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadQuestions(exclude: number[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/practice?subject=${encodeURIComponent(subject)}&count=10&exclude=${exclude.join(",")}`,
      );
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
setQuestions(data.questions);
      setSeenIds((current) => [...current, ...data.questions.map((q: PracticeQuestion) => q.id)]);
      setIndex(0);
      setSelected(null);
      setSelectedIndex(null);
      setScore(0);
      setFinished(false);
    } catch {
      setError("Could not load practice questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuestions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const question = questions?.[index];
  const isCorrect = (value: number) => value === 4;

function choose(value: number, optionIndex: number) {
    if (selected !== null) return;
    setSelected(value);
    setSelectedIndex(optionIndex);
    if (isCorrect(value)) setScore((s) => s + 1);
  }

  function next() {
    if (!questions) return;
    if (index === questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSelectedIndex(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-10 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing {label} practice questions…
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "No practice questions found for this subject."}
        <button
          type="button"
          onClick={() => loadQuestions(seenIds)}
          className="ml-2 font-semibold underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (finished) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    const tier: { icon: IconName; message: string; tone: string } =
      pct >= 80
        ? { icon: "achievement", message: "Excellent! You look ready to retake the full quiz.", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" }
        : pct >= 50
          ? { icon: "target", message: "Good progress. Review the ones you missed, then practise again.", tone: "text-amber-700 bg-amber-50 border-amber-200" }
          : { icon: "study", message: "Keep practising this subject before your next attempt.", tone: "text-red-700 bg-red-50 border-red-200" };

    return (
      <div className={`rounded-xl border-2 p-5 text-center ${tier.tone}`}>
        <AppIcon name={tier.icon} className="mx-auto h-8 w-8 brightness-0 opacity-70" />
        <p className="mt-1 text-2xl font-extrabold">
          {score}/{total} <span className="text-base font-semibold">({pct}%)</span>
        </p>
        <p className="mt-2 text-sm leading-relaxed">{tier.message}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => loadQuestions(seenIds)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#1a3c6e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#16325c]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Practise more {label} questions
          </button>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0f7c2a] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0c6522]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Retake the full quiz
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
            {question.difficulty}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              COGNITIVE_TONE[question.cognitiveLevel] ?? "bg-slate-200 text-slate-700"
            }`}
          >
            {COGNITIVE_LABEL[question.cognitiveLevel] ?? question.cognitiveLevel}
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          Question {index + 1} of {questions.length} · Score {score}
        </span>
      </div>

      <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-800">{question.text}</p>

      <div className="space-y-2">
        {question.options.map((option, optionIndex) => {
          // Compare by position, not by point value - two distractors can
          // legitimately share the same partial-credit value (e.g. both worth
          // 1 point), which previously caused both to highlight as "chosen".
          const chosen = selectedIndex === optionIndex;
          const revealCorrect = selected !== null && isCorrect(option.value);
          const revealWrong = selected !== null && chosen && !isCorrect(option.value);

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => choose(option.value, optionIndex)}
              disabled={selected !== null}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                revealCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : revealWrong
                    ? "border-red-400 bg-red-50 text-red-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              } ${selected !== null ? "cursor-default" : "cursor-pointer"}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                {option.label}
              </span>
              <span className="flex-1">{option.text}</span>
              {revealCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
              {revealWrong && <XCircle className="h-4 w-4 shrink-0 text-red-600" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          {question.explanation && (
            <p className="text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">Why: </span>
              {question.explanation}
            </p>
          )}
          <button
            type="button"
            onClick={next}
            className="mt-3 w-full rounded-lg bg-[#1a3c6e] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16325c]"
          >
            {index === questions.length - 1 ? "See my score" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
