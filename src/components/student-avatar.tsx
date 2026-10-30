"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, getFirebaseClientConfigError } from "@/lib/firebase/client";

export function StudentAvatar({ fallbackName }: { fallbackName?: string | null }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (getFirebaseClientConfigError()) return;

    let cancelled = false;
    let unsubscribe = () => {};
    void Promise.resolve()
      .then(() => getFirebaseAuth())
      .then((auth) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(
          auth,
          setUser,
          (error) => {
            console.error("Could not load student avatar:", error);
          },
        );
      })
      .catch((error: unknown) => {
        console.error("Could not initialize Firebase for student avatar:", error);
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const initials = (user?.displayName || user?.email || fallbackName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      role="img"
      aria-label={
        user?.isAnonymous
          ? "Guest profile"
          : `${user?.displayName || fallbackName || "Student"} profile`
      }
      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/15 text-xl font-bold text-white"
    >
      {user?.isAnonymous ? (
        "G"
      ) : user?.photoURL ? (
        <Image
          src={user.photoURL}
          alt=""
          width={56}
          height={56}
          unoptimized
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
