import { useState, useEffect, useRef } from 'react';

export function useRestTimer(initialSeconds: number = 60, sessionId?: number) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  
  const reset = (newTotal?: number) => {
    setIsRunning(false);
    if (newTotal) {
      setTotalSeconds(newTotal);
      setSecondsLeft(newTotal);
    } else {
      setSecondsLeft(totalSeconds);
    }
  };

  const finishAndSave = () => {
    // Aquí podrías guardar el descanso en la base de datos si fuera necesario
    reset();
  };

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft]);

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return {
    totalSeconds,
    secondsLeft,
    isRunning,
    progress,
    start,
    pause,
    reset,
    finishAndSave
  };
}
