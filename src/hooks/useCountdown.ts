import { useEffect, useState } from 'react';

export function useCountdown(totalSeconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!active) {
      setRemaining(totalSeconds);
      return;
    }
    setRemaining(totalSeconds);
    const interval = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, totalSeconds]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return { remaining, label, expired: remaining === 0 };
}
