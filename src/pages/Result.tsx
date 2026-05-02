import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { saveScore } from '../services/gameService';
import { useEffect, useState, useRef } from 'react';
import MountainCard from '../components/MountainCard';
import type { Mountain } from '../data/mountains';
import './Result.css';

interface QuestionResult {
  mountain: Mountain;
  selected: string | null;
  correct: boolean;
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, refreshProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const state = location.state as {
    results: QuestionResult[];
    totalTimeMs: number;
  } | null;

  const saveAttempted = useRef(false);

  useEffect(() => {
    // If no results, redirect to home
    if (!state) {
      navigate('/home', { replace: true });
      return;
    }

    // Automatically save score for logged-in users
    if (!isGuest && user && !saved && !saveAttempted.current) {
      saveAttempted.current = true;
      const currentScore = state.results.filter(r => r.correct).length;
      const correctIds = state.results.filter(r => r.correct).map(r => r.mountain.id);
      
      saveScore(user.uid, currentScore, state.totalTimeMs, correctIds)
        .then(() => { refreshProfile(); setSaved(true); })
        .catch(err => console.error('Failed to auto-save score:', err));
    }
  }, [state, navigate, user, isGuest, saved]);

  if (!state) return null;

  const { results, totalTimeMs } = state;
  const score = results.filter(r => r.correct).length;
  const totalSeconds = Math.round(totalTimeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeStr = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;

  const getMessage = () => {
    if (score === 10) return '完璧！ あなたは真の山岳マスターだ。';
    if (score >= 8) return '素晴らしい。山への知識が深い。';
    if (score >= 6) return 'なかなかの腕前だ。';
    if (score >= 4) return 'まだまだ修行が必要だ。';
    return '山はお前を待っている。再挑戦せよ。';
  };

  // Auto-save handles saving now.


  return (
    <div className="result-page">
      <div className="container">
        <div className="result-score-section">
          <div className="result-score-label">Your Score</div>
          <div className="result-score-value">
            {score}<span className="result-score-total">/{results.length}</span>
          </div>
          <div className="result-time">TIME: {timeStr}</div>
          <p className="result-message">{getMessage()}</p>
        </div>

        <div className="result-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/play', { replace: true })}
            id="btn-retry"
          >
            もう一度挑戦
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate('/home')}
            id="btn-home"
          >
            ホームに戻る
          </button>
          {!isGuest && !saved && (
            <div className="result-saving">スコアを記録中...</div>
          )}
        </div>
        {saved && (
          <div className="result-saved-msg">✓ スコアを記録しました</div>
        )}

        <h2 className="result-review-title">振り返り</h2>
        <div className="result-review-grid">
          {results.map((r, i) => (
            <MountainCard
              key={i}
              mountain={r.mountain}
              result={r.correct ? 'correct' : 'wrong'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
