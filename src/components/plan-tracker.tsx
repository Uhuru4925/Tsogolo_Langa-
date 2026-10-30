"use client";

import { useState } from "react";
import { BookOpen, Check, CheckCircle2, Circle, PenLine, RotateCcw } from "lucide-react";
import type { PlanWeek } from "@/lib/study/planner";
import { AppIcon } from "@/components/app-icon";

const KIND_META = {
  study: { label: "Learn", icon: BookOpen, tone: "bg-blue-100 text-blue-700" },
  practice: { label: "Practise", icon: PenLine, tone: "bg-emerald-100 text-emerald-700" },
  review: { label: "Review", icon: RotateCcw, tone: "bg-amber-100 text-amber-700" },
} as const;

export function PlanTracker({
  planId,
  weeks,
  initialCompleted,
}: {
  planId: string;
  weeks: PlanWeek[];
  initialCompleted: string[];
}) {
  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted));
  const [openWeek, setOpenWeek] = useState<number>(1);

  const totalTasks = weeks.reduce((sum, week) => sum + week.tasks.length, 0);
  const doneCount = completed.size;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  async function toggle(taskId: string) {
    const willBeDone = !completed.has(taskId);
    setCompleted((current) => {
      const next = new Set(current);
      if (willBeDone) next.add(taskId);
      else next.delete(taskId);
      return next;
    });

    try {
      await fetch("/api/study-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, taskId, done: willBeDone }),
      });
    } catch {
      // Revert on failure
      setCompleted((current) => {
        const next = new Set(current);
        if (willBeDone) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    }
  }

  return (
    <div>
      {/* Progress header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Your progress</p>
            <p className="text-xs text-slate-500">
              {doneCount} of {totalTasks} study sessions completed
            </p>
          </div>
          <span className="text-2xl font-extrabold text-[#0f7c2a]">{progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1a3c6e] to-[#0f7c2a] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Weeks */}
      <div className="space-y-3">
        {weeks.map((week) => {
          const weekDone = week.tasks.filter((task) => completed.has(task.id)).length;
          const allDone = week.tasks.length > 0 && weekDone === week.tasks.length;
          const isOpen = openWeek === week.week;

          return (
            <div
              key={week.week}
              className={`overflow-hidden rounded-2xl border-2 transition ${
                allDone ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenWeek(isOpen ? -1 : week.week)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      allDone ? "bg-emerald-500 text-white" : "bg-[#1a3c6e] text-white"
                    }`}
                  >
                    {allDone ? <Check aria-hidden="true" className="h-5 w-5" /> : week.week}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{week.label}</p>
                    <p className="truncate text-xs text-slate-500">{week.focus}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-600">
                    {weekDone}/{week.tasks.length}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {Math.round(week.totalMinutes / 60)} hrs
                  </p>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-2 border-t border-slate-100 p-4 pt-3">
                  {week.tasks.map((task) => {
                    const done = completed.has(task.id);
                    const meta = KIND_META[task.kind];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => toggle(task.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                          done
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1a3c6e]">
                              <AppIcon name={task.icon} className="h-4 w-4 brightness-0 opacity-60" />
                              {task.subject}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.tone}`}
                            >
                              <Icon className="h-2.5 w-2.5" />
                              {meta.label}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {task.minutes} min
                            </span>
                          </div>
                          <p
                            className={`text-sm font-medium ${
                              done ? "text-slate-500 line-through" : "text-slate-800"
                            }`}
                          >
                            {task.topic}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">{task.hint}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
