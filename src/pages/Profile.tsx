import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { updateDisplayName } from '../services/gameService';
import { mountains } from '../data/mountains';
import './Profile.css';

/** 山の状態 */
type MountainStatus = 'summited' | 'climbing' | 'retired' | 'unattempted';

function getMountainStatus(
  id: string,
  correctCounts: Record<string, number>,
  attempted: string[],
): MountainStatus {
  const count = correctCounts[id] || 0;
  if (count >= 2) return 'summited';
  if (count === 1) return 'climbing';
  if (attempted.includes(id)) return 'retired';
  return 'unattempted';
}

const STATUS_COLORS: Record<MountainStatus, string> = {
  summited: '#22c55e',   // 緑
  climbing: '#eab308',   // 黄色
  retired: '#ef4444',    // 赤
  unattempted: '#3f3f46', // グレー
};

const STATUS_LABELS: Record<MountainStatus, string> = {
  summited: '登頂',
  climbing: '登山中',
  retired: 'リタイア',
  unattempted: '未挑戦',
};

/** SVGドーナツチャート */
function DonutChart({ counts }: { counts: Record<MountainStatus, number> }) {
  const total = mountains.length;
  const radius = 90;
  const strokeWidth = 28;
  const center = 120;
  const circumference = 2 * Math.PI * radius;

  const order: MountainStatus[] = ['summited', 'climbing', 'retired', 'unattempted'];
  let offset = 0;

  // 完了率（登頂 / 全体）
  const completionRate = total > 0 ? Math.round((counts.summited / total) * 100) : 0;

  return (
    <div className="donut-chart-wrapper">
      <svg viewBox={`0 0 ${center * 2} ${center * 2}`} className="donut-chart-svg">
        {order.map(status => {
          const count = counts[status];
          if (count === 0) return null;
          const dashLength = (count / total) * circumference;
          const dashGap = circumference - dashLength;
          const currentOffset = offset;
          offset += dashLength;

          return (
            <circle
              key={status}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={STATUS_COLORS[status]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${dashGap}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="butt"
              className="donut-segment"
              style={{ '--delay': `${order.indexOf(status) * 150}ms` } as React.CSSProperties}
            />
          );
        })}
        {/* 中央テキスト */}
        <text x={center} y={center - 8} textAnchor="middle" className="donut-center-value">
          {completionRate}%
        </text>
        <text x={center} y={center + 16} textAnchor="middle" className="donut-center-label">
          登頂率
        </text>
      </svg>

      <div className="donut-legend">
        {order.map(status => (
          <div key={status} className="donut-legend-item">
            <span
              className="donut-legend-dot"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span className="donut-legend-label">{STATUS_LABELS[status]}</span>
            <span className="donut-legend-count">{counts[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isGuest, signOut, userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isGuest) {
      navigate('/', { replace: true });
      return;
    }
    if (userProfile) {
      setNewName(userProfile.displayName || '');
    }
  }, [userProfile, isGuest, navigate]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    await updateDisplayName(user.uid, newName.trim());
    await refreshProfile();
    setEditing(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!userProfile) {
    return (
      <div className="profile-page">
        <div className="container">
          <div style={{ textAlign: 'center', padding: 'var(--sp-3xl)', color: 'var(--c-text-muted)' }}>
            読み込み中...
          </div>
        </div>
      </div>
    );
  }

  const avgScore = userProfile.totalGames > 0
    ? (userProfile.totalCorrect / userProfile.totalGames).toFixed(1)
    : '—';

  // 山の状態を集計
  const correctCounts = userProfile.mountainCorrectCounts || {};
  const attempted = userProfile.attemptedMountains || [];

  const statusCounts: Record<MountainStatus, number> = {
    summited: 0,
    climbing: 0,
    retired: 0,
    unattempted: 0,
  };

  for (const m of mountains) {
    const status = getMountainStatus(m.id, correctCounts, attempted);
    statusCounts[status]++;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={userProfile.displayName} />
            ) : (
              userProfile.displayName[0]
            )}
          </div>
          <div>
            {editing ? (
              <div className="profile-edit-name">
                <input
                  className="input"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  id="input-edit-name"
                />
                <button className="btn btn-primary" onClick={handleSaveName} style={{ padding: '0.5rem 1rem' }}>
                  保存
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                  取消
                </button>
              </div>
            ) : (
              <div>
                <h1 className="profile-name">{userProfile.displayName}</h1>
                <button
                  className="btn btn-ghost"
                  onClick={() => setEditing(true)}
                  style={{ padding: '2px 8px', fontSize: 'var(--fs-xs)' }}
                >
                  名前を編集
                </button>
              </div>
            )}
            <div className="profile-email">{user?.email}</div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{userProfile.totalGames}</div>
            <div className="profile-stat-label">Games</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{userProfile.bestScore}/10</div>
            <div className="profile-stat-label">Best Score</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{avgScore}</div>
            <div className="profile-stat-label">Avg Score</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{statusCounts.summited}</div>
            <div className="profile-stat-label">Summited</div>
          </div>
        </div>

        <h2 className="profile-section-title">百名山チャレンジ</h2>
        <DonutChart counts={statusCounts} />

        <div className="profile-logout-section">
          <button className="btn btn-outline" onClick={handleLogout} id="btn-logout">
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
