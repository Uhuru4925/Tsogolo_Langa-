"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Check, Loader2, Sparkles, Target } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icon-names";

interface SubjectOption {
  subject: string;
  icon: IconName;
  why: string;
  recommended: boolean;
  priority: boolean;
}

export function PlanBuilder({
  sessionId,
  options,
  defaultSelected,
  defaultPriority,
}: {
  sessionId: string;
  options: SubjectOption[];
  defaultSelected: string[];
  defaultPriority: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [weeks, setWeeks] = useState(8);
  const [hours, setHours] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggle(subject: string) {
    setSelected((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : current.length >= 6
          ? current
          : [...current, subject],
    );
  }

  async function createPlan() {
    if (selected.length === 0) {
      setError("Choose at least one subject to focus on.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          subjects: selected,
          prioritySubjects: defaultPriority.filter((item) => selected.includes(item)),
          weeks,
          hoursPerWeek: hours,
        }),
      });
      if (!res.ok) throw new Error("failed");
      router.push(`/study-plans/${sessionId}`);
    } catch {
      setError("Could not build your plan. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <Target className="h-5 w-5 text-[#1a3c6e]" />
        <h2 className="text-lg font-bold text-slate-800">Choose the subjects to improve</h2>
      </div>
      <p className="mb-5 text-sm text-slate-600">
        Pick up to six. Subjects marked <strong>Recommended</strong> come from your quiz results.
      </p>

      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected.includes(option.subject);
          return (
            <button
              key={option.subject}
              type="button"
              onClick={() => toggle(option.subject)}
              className={`rounded-xl border-2 p-3 text-left transition ${
                active
                  ? "border-[#1a3c6e] bg-[#1a3c6e]/5"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AppIcon name={option.icon} className="h-4 w-4 brightness-0 opacity-60" />
                    <span className="font-semibold text-slate-800">{option.subject}</span>
                    {option.priority && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        Priority
                      </span>
                    )}
                    {option.recommended && !option.priority && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {option.why}
                  </p>
                </div>
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold ${
                    active ? "border-[#1a3c6e] bg-[#1a3c6e] text-white" : "border-slate-300"
                  }`}
                >
                  {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Weeks until your exam
            </span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[#1a3c6e]">{weeks}</span>
          </label>
          <input
            type="range"
            min={2}
            max={24}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="w-full accent-[#1a3c6e]"
          />
        </div>
        <div>
          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Study hours per week</span>
            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[#1a3c6e]">{hours} hrs</span>
          </label>
          <input
            type="range"
            min={2}
            max={30}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-[#0f7c2a]"
          />
        </div>
      </div>

      {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

      <button
        type="button"
        onClick={createPlan}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f7c2a] px-6 py-3.5 font-bold text-white transition hover:bg-[#0c6522] disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Building your timetable…" : "Build my study plan"}
      </button>
    </div>
  );
}
