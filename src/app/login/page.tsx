"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";

type AuthMode = "signin" | "signup";

function getPostAuthDestination(): string {
  const destination = new URLSearchParams(window.location.search).get("next");
  return destination?.startsWith("/") && !destination.startsWith("//")
    ? destination
    : "/";
}

function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !("code" in error)) {
    return "We could not complete sign-in. Please try again.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already uses this email. Sign in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase Authentication.";
    case "auth/network-request-failed":
      return "A network error interrupted sign-in. Check your connection and try again.";
    default:
      return "We could not complete sign-in. Please try again.";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mode") === "signup"
      ? "signup"
      : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [authReady, setAuthReady] = useState(() => Boolean(getFirebaseClientConfigError()));

  useEffect(() => {
    if (configError) return;
    return onAuthStateChanged(
      getFirebaseAuth(),
      () => setAuthReady(true),
      (authError) => {
        console.error("Could not load Firebase sign-in state:", authError);
        setError("Could not check your account. Please refresh and try again.");
        setAuthReady(true);
      },
    );
  }, [configError]);

  function getAuthDestination(isCreatingAccount: boolean): string {
    const destination = getPostAuthDestination();
    if (!isCreatingAccount) return destination;
    return destination === "/profile/subjects"
      ? destination
      : `/profile/subjects?next=${encodeURIComponent(destination)}`;
  }

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const displayName = name.trim();
        if (displayName) await updateProfile(credential.user, { displayName });
        router.replace(getAuthDestination(true));
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        router.replace(getAuthDestination(false));
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setBusy(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(getFirebaseAuth(), provider);
      router.replace(getAuthDestination(mode === "signup"));
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setBusy(false);
    }
  }

  async function handleGuestSignIn() {
    setBusy(true);
    setError("");
    try {
      await signInAnonymously(getFirebaseAuth());
      router.replace(getPostAuthDestination() === "/" ? "/quiz" : getPostAuthDestination());
    } catch (authError) {
      setError(getAuthErrorMessage(authError));
      setBusy(false);
    }
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a3c6e] via-[#1e5799] to-[#0f7c2a]">
        <LoaderCircle aria-label="Loading sign-in" className="h-8 w-8 animate-spin text-white" />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a3c6e] via-[#1e5799] to-[#0f7c2a] px-4 py-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-white/5" />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/75 transition hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to home
        </Link>

        <section className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <header className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] px-8 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
              <BookOpen aria-hidden="true" className="h-7 w-7 text-[#1a3c6e]" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Save your progress and explore your future with MalawiGuide.
            </p>
            <div className="mt-5 flex justify-center gap-1" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-black" />
              <div className="h-1 w-10 rounded-full bg-red-500" />
              <div className="h-1 w-10 rounded-full bg-[#0f7c2a]" />
            </div>
          </header>

          <div className="space-y-5 p-7 sm:p-8">
            {configError ? (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
              >
                <p className="font-bold">Firebase Authentication needs configuration.</p>
                <p className="mt-1">
                  Add the Firebase web app variables to <code>.env.local</code>, then restart the
                  development server.
                </p>
                <p className="mt-2 break-all text-xs">{configError}</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span
                    aria-hidden="true"
                    className="font-extrabold text-[#4285f4]"
                  >
                    G
                  </span>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3" aria-hidden="true">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    or with email
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label htmlFor="display-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                        Name
                      </label>
                      <div className="relative">
                        <UserRound aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="display-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-[#1a3c6e]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-[#1a3c6e]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <LockKeyhole aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        minLength={6}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border-2 border-slate-200 py-3 pl-10 pr-12 text-slate-800 outline-none transition focus:border-[#1a3c6e]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Eye aria-hidden="true" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] py-3.5 font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                    {mode === "signup" ? "Create account" : "Sign in"}
                  </button>
                </form>

                <p className="text-center text-sm text-slate-600">
                  {mode === "signup" ? "Already have an account?" : "New to MalawiGuide?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "signup" ? "signin" : "signup");
                      setError("");
                    }}
                    className="font-bold text-[#1a3c6e] hover:underline"
                  >
                    {mode === "signup" ? "Sign in" : "Create an account"}
                  </button>
                </p>

                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleGuestSignIn}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <UserRound aria-hidden="true" className="h-4 w-4" />
                    Continue as a guest
                  </button>
                  <p className="mt-2 text-center text-xs leading-relaxed text-slate-400">
                    Guest access creates an anonymous Firebase account. Your progress may not be
                    recoverable if you change devices.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
