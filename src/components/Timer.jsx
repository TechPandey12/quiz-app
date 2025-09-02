import { useEffect, useState } from "react";

/**
 * props:
 *  - seconds (number): starting seconds
 *  - running (bool): whether timer should run
 *  - onExpire(): called when timer reaches 0
 *  - onTick(remaining): optional callback every second
 *  - resetKey: change this to force reset the timer
 */
export default function Timer({ seconds = 20, running = true, onExpire, onTick, resetKey }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => setRemaining(seconds), [seconds, resetKey]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      setRemaining(r => {
        const next = r - 1;
        onTick?.(next);
        if (next <= 0) {
          onExpire?.();
          clearInterval(id);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining, resetKey]);

  return <div className="timer">⏱️ {remaining}s</div>;
}
