import { useEffect, useState } from 'react';

const secondsBetween = (expiresAt, now) =>
  expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000)) : 0;

/** Seconds remaining until `expiresAt` (an ISO string or Date), updated every second. */
export function useCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return undefined;
    const expiry = new Date(expiresAt).getTime();

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= expiry) clearInterval(timer);
    };
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [expiresAt]);

  return secondsBetween(expiresAt, now);
}
