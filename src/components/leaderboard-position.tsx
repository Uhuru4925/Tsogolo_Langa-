"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { LoaderCircle, Trophy } from "lucide-react";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";

type PositionResponse = {
  position: { rank: number; score: number; totalResults: number } | null;
  error?: string;
};

export function LeaderboardPosition() {
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [message, setMessage] = useState(
    () => configError || "Sign in to see your leaderboard position.",
  );
  const [position, setPosition] = useState<PositionResponse["position"]>(null);
  const [loading, setLoading] = useState(() => !configError);

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
          (user) => {
            setPosition(null);
            if (!user || user.isAnonymous) {
              setMessage(
                user?.isAnonymous
                  ? "Create an account to see a saved leaderboard position."
                  : "Sign in to see your leaderboard position.",
              );
              setLoading(false);
              return;
            }

            setLoading(true);
            void (async () => {
              try {
                const token = await user.getIdToken();
                const response = await fetch("/api/leaderboard", {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: "no-store",
                });
                const data = (await response.json()) as PositionResponse;
                if (!response.ok) throw new Error(data.error || "Could not load your position.");
                if (cancelled) return;
                setPosition(data.position);
                setMessage(
                  data.position
                    ? ""
                    : "Complete a quiz with this account to get your leaderboard position.",
                );
              } catch (error) {
                console.error("Could not load learner leaderboard position:", error);
                if (!cancelled) {
                  setMessage(error instanceof Error ? error.message : "Could not load your position.");
                }
              } finally {
                if (!cancelled) setLoading(false);
              }
            })();
          },
          (error) => {
            console.error("Could not observe Firebase authentication:", error);
            setMessage("Could not check your account. Please refresh and try again.");
            setLoading(false);
          },
        );
      })
      .catch((error: unknown) => {
        console.error("Could not initialize Firebase Authentication:", error);
        setMessage("Firebase Authentication is unavailable.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configError]);

  return (
    <aside className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          {loading ? (
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
          ) : (
            <Trophy aria-hidden="true" className="h-5 w-5" />
          )}
        </div>
        {position ? (
          <div>
            <p className="font-bold text-slate-800">
              Your leaderboard position: #{position.rank}
            </p>
            <p className="text-sm text-slate-600">
              Best score {position.score}% · ranked against {position.totalResults} quiz results
            </p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-slate-800">{loading ? "Checking your position…" : message}</p>
            {!loading && message.startsWith("Sign in") && (
              <Link href="/login?next=%2Fleaderboard" className="mt-1 inline-block text-sm font-bold text-[#1a3c6e] underline">
                Sign in
              </Link>
            )}
            {!loading && message.startsWith("Create an account") && (
              <Link href="/login?mode=signup&next=%2Fleaderboard" className="mt-1 inline-block text-sm font-bold text-[#1a3c6e] underline">
                Create an account
              </Link>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
