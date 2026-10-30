"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, LoaderCircle, UserRound } from "lucide-react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";

function getSignOutErrorMessage(error: unknown): string {
  if (error instanceof Error && "code" in error && typeof error.code === "string") {
    return `Could not sign out (${error.code}). Please try again.`;
  }
  return "Could not sign out. Please try again.";
}

export function AuthProfileButton({
  onUserChange,
}: {
  onUserChange: (user: User | null) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [configError] = useState(() => getFirebaseClientConfigError() ?? "");
  const [ready, setReady] = useState(() => Boolean(configError));
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

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
            onUserChange(nextUser);
            setReady(true);
          },
          (authError) => {
            console.error("Could not observe Firebase authentication state:", authError);
            setError("Could not load your account status.");
            setReady(true);
          },
        );
      })
      .catch((authError: unknown) => {
        console.error("Could not initialize Firebase authentication:", authError);
        setError("Could not load your account status.");
        setReady(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [configError, onUserChange]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      await signOut(getFirebaseAuth());
      setUser(null);
      setMenuOpen(false);
      window.location.assign("/");
    } catch (signOutError) {
      console.error("Could not sign out:", signOutError);
      setError(getSignOutErrorMessage(signOutError));
    } finally {
      setSigningOut(false);
    }
  }

  if (!ready) {
    return (
      <span
        aria-label="Loading account"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white"
      >
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          <LogIn aria-hidden="true" className="h-4 w-4" />
          Sign in
        </Link>
        {(error || configError) && (
          <span role="status" className="max-w-48 text-right text-xs text-white/80">
            {error || configError}
          </span>
        )}
      </div>
    );
  }

  const accountLabel = user.isAnonymous
    ? "Guest account"
    : user.displayName || user.email || "Your account";
  const initials = user.isAnonymous
    ? "G"
    : (user.displayName || user.email || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={`Open profile menu for ${accountLabel}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-white text-lg font-bold text-[#1a3c6e] shadow-md transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={48}
            height={48}
            unoptimized
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          initials || <UserRound aria-hidden="true" className="h-6 w-6" />
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="pointer-events-auto absolute right-0 z-[60] mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl"
        >
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="truncate text-sm font-bold">{accountLabel}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {user.isAnonymous ? "Signed in as guest" : "Signed in"}
            </p>
          </div>
          {error && (
            <p role="alert" className="px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          {!user.isAnonymous && (
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <UserRound aria-hidden="true" className="h-4 w-4" />
              My profile
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="pointer-events-auto mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
          >
            {signingOut ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut aria-hidden="true" className="h-4 w-4" />
            )}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
