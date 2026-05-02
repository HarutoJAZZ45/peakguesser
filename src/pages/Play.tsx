import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { generateQuiz, generateOptions, type Mountain } from '../data/mountains';
import Timer from '../components/Timer';
import './Play.css';

interface QuestionResult {
  mountain: Mountain;
  selected: string | null;
  correct: boolean;
}

const QUESTION_COUNT = 10;
const TIME_LIMIT_MS = 15000;

export default function Play() {
  const navigate = useNavigate();
  const [questions] = useState<Mountain[]>(() => generateQuiz(QUESTION_COUNT));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const startTimeRef = useRef(Date.now());
  const answeredRef = useRef(false);

  const currentMountain = questions[currentIndex];
  const options = useMemo(
    () => (currentMountain ? generateOptions(currentMountain) : []),
    [currentIndex, currentMountain]
  );

  const proceedToNext = useCallback(() => {
    if (currentIndex + 1 >= QUESTION_COUNT) {
      // ゲーム終了 → 結果画面へ
      const totalTimeMs = Date.now() - startTimeRef.current;
      navigate('/result', {
        state: { results: [...results], totalTimeMs },
        replace: true,
      });
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedId(null);
      setShowFeedback(false);
      answeredRef.current = false;
      setTimerKey(prev => prev + 1);
    }
  }, [currentIndex, results, navigate]);

  const handleAnswer = useCallback((mountainId: string) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const isCorrect = mountainId === currentMountain.id;
    setSelectedId(mountainId);
    setShowFeedback(true);

    setResults(prev => [
      ...prev,
      { mountain: currentMountain, selected: mountainId, correct: isCorrect },
    ]);

    setTimeout(proceedToNext, 1800);
  }, [currentMountain, proceedToNext]);

  const handleTimeUp = useCallback(() => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    setShowFeedback(true);
    setResults(prev => [
      ...prev,
      { mountain: currentMountain, selected: null, correct: false },
    ]);

    setTimeout(proceedToNext, 1800);
  }, [currentMountain, proceedToNext]);

  if (!currentMountain) return null;

  const getOptionClass = (opt: Mountain) => {
    if (!showFeedback) return 'play-option-btn';
    if (opt.id === currentMountain.id) {
      return selectedId === opt.id
        ? 'play-option-btn selected-correct'
        : 'play-option-btn reveal-correct';
    }
    if (opt.id === selectedId) return 'play-option-btn selected-wrong';
    return 'play-option-btn';
  };

  return (
    <div className="play-page">
      <div className="container">
        <div className="play-header">
          {/* Progress dots */}
          <div className="play-progress">
            {questions.map((_, i) => {
              let cls = 'play-progress-dot';
              if (i === currentIndex) cls += ' current';
              else if (results[i]?.correct) cls += ' correct';
              else if (results[i] && !results[i].correct) cls += ' wrong';
              return <div key={i} className={cls} />;
            })}
            <span className="play-progress-label">
              {currentIndex + 1} / {QUESTION_COUNT}
            </span>
          </div>

          {/* Timer */}
          <Timer
            durationMs={TIME_LIMIT_MS}
            running={!showFeedback}
            onTimeUp={handleTimeUp}
            resetKey={timerKey}
          />
        </div>

        {/* Image */}
        <div className="play-image-wrapper">
          <img
            key={currentMountain.id}
            className="play-image"
            src={currentMountain.imageUrl}
            alt="この山の名前は？"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
          <div className="play-image-overlay">
            <div className="play-question-text">この山は？</div>
          </div>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className="play-feedback fade-in">
            {selectedId === currentMountain.id ? (
              <div className="play-feedback-text correct">✓ 正解！</div>
            ) : (
              <div className="play-feedback-text wrong">
                {selectedId ? '✗ 不正解' : '✗ タイムアップ'}
              </div>
            )}
            <div className="play-feedback-detail">
              {currentMountain.name}（{currentMountain.elevation.toLocaleString()}m）— {currentMountain.location}
            </div>
          </div>
        )}

        {/* Options */}
        <div className="play-options">
          {options.map((opt, i) => (
            <button
              key={opt.id}
              className={getOptionClass(opt)}
              onClick={() => handleAnswer(opt.id)}
              disabled={showFeedback}
              id={`option-${i}`}
            >
              <span className="option-num">{i + 1}.</span>
              {opt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
