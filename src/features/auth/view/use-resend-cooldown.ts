"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ResendCooldown {
  restart: () => void;
  secondsRemaining: number;
}

export function useResendCooldown(durationSeconds = 60): ResendCooldown {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSecondsRemaining(durationSeconds);
    timerRef.current = setInterval(() => {
      setSecondsRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);
  }, [durationSeconds]);

  useEffect(() => {
    if (secondsRemaining === 0 && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [secondsRemaining]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    []
  );

  return { restart, secondsRemaining };
}
