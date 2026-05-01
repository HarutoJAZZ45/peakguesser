import { useEffect, useState, useRef, useCallback } from 'react';
import './Timer.css';

interface TimerProps {
  durationMs: number;
  running: boolean;
  onTimeUp: () => void;
  /** タイマーをリセットするためのキー */
  resetKey: number;
}

export default function Timer({ durationMs, running, onTimeUp, resetKey }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMs);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const calledRef = useRef(false);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const left = Math.max(0, durationMs - elapsed);
    setRemaining(left);

    if (left <= 0 && !calledRef.current) {
      calledRef.current = true;
      onTimeUp();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [durationMs, onTimeUp]);

  useEffect(() => {
    setRemaining(durationMs);
    calledRef.current = false;
    startTimeRef.current = Date.now();

    if (running) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [resetKey, running, durationMs, tick]);

  const pct = (remaining / durationMs) * 100;
  const seconds = Math.ceil(remaining / 1000);
  const isWarning = pct < 33;
  const isCritical = pct < 15;

  return (
    <div>
      <div className="timer-bar-container">
        <div
          className={`timer-bar ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`timer-text ${isWarning ? 'warning' : ''}`}>
        {seconds}
      </div>
    </div>
  );
}
