import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRanking, type ScoreRecord } from '../services/gameService';
import { isConfigured } from '../firebase';
import './Ranking.css';

export default function Ranking() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    getRanking(50)
      .then(r => setRecords(r))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (ms: number) => {
    const sec = Math.round(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
  };

  const formatDate = (d: Date) => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}/${day}`;
  };

  return (
    <div className="ranking-page">
      <div className="container">
        <h1 className="ranking-title">Ranking</h1>
        <p className="ranking-subtitle">上位50位のスコアランキング</p>

        {!isConfigured && (
          <div className="ranking-guest-notice">
            Firebase未設定のためランキング機能は利用できません。<br />
            .envにFirebase設定を追加してください。
          </div>
        )}

        {loading ? (
          <div className="ranking-empty" style={{ animation: 'pulse 1s infinite' }}>
            読み込み中...
          </div>
        ) : records.length === 0 ? (
          <div className="ranking-empty">
            まだ記録がありません。最初のスコアを記録しよう！
          </div>
        ) : (
          <div className="ranking-table-wrapper">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, i) => {
                  const rank = i + 1;
                  const isMe = user && rec.userId === user.uid;
                  const rankCls = rank <= 3 ? `rank-col rank-${rank}` : 'rank-col';
                  return (
                    <tr key={rec.id || i} className={isMe ? 'ranking-highlight' : ''}>
                      <td className={rankCls}>{rank}</td>
                      <td className="name-col">{rec.displayName}</td>
                      <td className="score-col">{rec.score}/10</td>
                      <td className="time-col">{formatTime(rec.timeMs)}</td>
                      <td className="time-col">{formatDate(rec.playedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
