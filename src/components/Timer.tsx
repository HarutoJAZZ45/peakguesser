import { useEffect, useRef, useState } from 'react';
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
  const onTimeUpRef = useRef(onTimeUp);

  // onTimeUp の最新参照を常に保持（依存配列から外すため）
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setRemaining(durationMs);
    let animationFrameId: number;
    let startTime = Date.now();
    let isCalled = false;

    if (!running) return;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);

      if (left <= 0) {
        if (!isCalled) {
          isCalled = true;
          onTimeUpRef.current();
        }
        return; // これ以上 requestAnimationFrame を呼ばない
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [resetKey, running, durationMs]);

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
