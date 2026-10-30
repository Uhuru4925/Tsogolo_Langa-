"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ArrowLeft, Check, LoaderCircle, School, UserRound } from "lucide-react";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";
import { STUDENT_SUBJECTS } from "@/lib/student-subjects";

type StudentProfile = {
  name: string;
  school: string | null;
  form: string | null;
  selectedSubjects: string[];
};

export default function StudentSubjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(() => Boolean(getFirebaseClientConfigError()));
  const [profileReady, setProfileReady] = useState(false);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [form, setForm] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [error, setError] = useState(() => getFirebaseClientConfigError() ?? "");

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
            if (!nextUser) {
              router.replace(`/login?mode=signup&next=${encodeURIComponent("/profile/subjects")}`);
              return;
            }
            if (nextUser.isAnonymous) return;

            void (async () => {
              try {
                const token = await nextUser.getIdToken();
                const response = await fetch("/api/profile", {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: "no-store",
                });
                const data = (await response.json()) as {
                  profile: StudentProfile | null;
                  error?: string;
                };
                if (!response.ok) throw new Error(data.error || "Could not load your profile.");
                if (data.profile) {
                  setName(data.profile.name);
                  setSchool(data.profile.school ?? "");
                  setForm(data.profile.form ?? "");
                  setSelectedSubjects(data.profile.selectedSubjects ?? []);
                } else {
                  setName(nextUser.displayName ?? "");
                }
              } catch (loadError) {
                console.error("Could not load student profile:", loadError);
                setError(
                  loadError instanceof Error
                    ? loadError.message
                    : "Could not load your profile.",
                );
              } finally {
                setProfileReady(true);
              }
            })();
          },
          (authError) => {
            console.error("Could not load Firebase sign-in state:", authError);
            setError("Could not check your account. Please refresh and try again.");
            setAuthReady(true);
          },
        );
      })
      .catch((authError: unknown) => {
        console.error("Could not initialize Firebase Authentication:", authError);
        setError("Firebase Authentication is unavailable.");
        setAuthReady(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configError, router]);

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject],
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.isAnonymous) return;
    if (selectedSubjects.length === 0) {
      setError("Choose at least one subject.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, school, form, selectedSubjects }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save your profile.");

      const searchParams = new URLSearchParams(window.location.search);
      const next = searchParams.get("next");
      const fallbackDestination = searchParams.get("edit") === "1" ? "/profile" : "/";
      const destination =
        next?.startsWith("/") && !next.startsWith("//") ? next : fallbackDestination;
      router.replace(destination);
    } catch (saveError) {
      console.error("Could not save student profile:", saveError);
      setError(
        saveError instanceof Error ? saveError.message : "Could not save your profile.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!authReady || (user && !user.isAnonymous && !profileReady)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <LoaderCircle aria-label="Loading profile" className="h-7 w-7 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1a3c6e]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Home
        </Link>
        <section className="overflow-hidden rounded-3xl bg-white shadow-xl">
          <header className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] p-8 text-white">
            <p className="text-sm font-semibold text-white/70">Your learner profile</p>
            <h1 className="mt-1 text-2xl font-extrabold">Choose the subjects you take</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              Your next quiz will use these choices. You can update your subjects later from your profile.
            </p>
          </header>

          {!user ? (
            <div className="space-y-4 p-8 text-center">
              <p className="text-sm text-slate-600">{error || "Sign in or create an account to save your learner profile."}</p>
              <Link
                href="/login?mode=signup&next=%2Fprofile%2Fsubjects"
                className="inline-flex rounded-xl bg-[#1a3c6e] px-5 py-3 font-bold text-white hover:bg-[#15305a]"
              >
                Sign in or create an account
              </Link>
            </div>
          ) : user.isAnonymous ? (
            <div className="space-y-4 p-8 text-center">
              <h2 className="text-lg font-bold text-slate-800">Create an account to save your profile</h2>
              <p className="text-sm text-slate-600">
                Guest accounts cannot take or save quizzes. Create a permanent account first.
              </p>
              <Link
                href="/login?mode=signup&next=%2Fprofile%2Fsubjects"
                className="inline-flex rounded-xl bg-[#1a3c6e] px-5 py-3 font-bold text-white hover:bg-[#15305a]"
              >
                Create an account
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8 p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  <span className="mb-2 flex items-center gap-2"><UserRound className="h-4 w-4" /> Full name</span>
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#1a3c6e]"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  <span className="mb-2 flex items-center gap-2"><School className="h-4 w-4" /> Secondary school</span>
                  <input
                    required
                    value={school}
                    onChange={(event) => setSchool(event.target.value)}
                    autoComplete="organization"
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#1a3c6e]"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
                  <span className="mb-2 block">Level of study</span>
                  <select
                    required
                    value={form}
                    onChange={(event) => setForm(event.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-[#1a3c6e]"
                  >
                    <option value="">Select your level</option>
                    <option>Form 1</option>
                    <option>Form 2</option>
                    <option>Form 3</option>
                    <option>Form 4</option>
                  </select>
                </label>
              </div>

              <fieldset>
                <legend className="text-lg font-bold text-slate-800">Subjects you are taking</legend>
                <p className="mb-4 mt-1 text-sm text-slate-500">Choose all that apply. You can edit this list later.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STUDENT_SUBJECTS.map((subject) => {
                    const checked = selectedSubjects.includes(subject);
                    return (
                      <label
                        key={subject}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-medium transition ${
                          checked
                            ? "border-[#1a3c6e] bg-blue-50 text-[#1a3c6e]"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(subject)}
                          className="sr-only"
                        />
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          checked ? "border-[#1a3c6e] bg-[#1a3c6e] text-white" : "border-slate-300"
                        }`}>
                          {checked && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                        </span>
                        {subject}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a3c6e] px-5 py-3.5 font-bold text-white transition hover:bg-[#15305a] disabled:cursor-wait disabled:opacity-60"
              >
                {busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                {busy ? "Saving profile…" : "Save profile and continue"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
