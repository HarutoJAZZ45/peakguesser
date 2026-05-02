import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { updateDisplayName } from '../services/gameService';
import { mountains } from '../data/mountains';
import MountainCard from '../components/MountainCard';
import './Profile.css';

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

  const collectedMountains = mountains.filter(m =>
    userProfile.collectedMountains.includes(m.id)
  );

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
            <div className="profile-stat-value">{collectedMountains.length}</div>
            <div className="profile-stat-label">Collected</div>
          </div>
        </div>

        <h2 className="profile-section-title">Mountain Collection</h2>
        {collectedMountains.length === 0 ? (
          <div className="profile-collection-empty">
            まだ正解した山がありません。ゲームをプレイして山を集めよう！
          </div>
        ) : (
          <div className="profile-collection-grid">
            {collectedMountains.map(m => (
              <MountainCard key={m.id} mountain={m} mini />
            ))}
          </div>
        )}

        <div className="profile-logout-section">
          <button className="btn btn-outline" onClick={handleLogout} id="btn-logout">
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
