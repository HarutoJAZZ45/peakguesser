import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { getUserProfile, type UserProfile } from '../services/gameService';
import { mountains } from '../data/mountains';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then(p => setProfile(p));
    }
  }, [user]);

  return (
    <div className="home-page">
      <div className="container">
        <div className="home-hero">
          {isGuest && <div className="home-guest-badge">Guest Mode</div>}
          <h1 className="home-hero-title">
            写真から山を<span>当てろ</span>
          </h1>
          <p className="home-hero-desc">
            日本百名山の写真を見て、山の名前を4択から選べ。
            全{mountains.length}山から10問出題。制限時間は1問15秒。
          </p>
        </div>

        <div className="home-start-section">
          <button
            className="btn btn-primary home-start-btn"
            onClick={() => navigate('/play')}
            id="btn-start-game"
          >
            ▶ ゲーム開始
          </button>
          <p className="home-info">10問 / 1問15秒 / 4択</p>
        </div>

        {profile && (
          <div className="home-stats">
            <div className="home-stat-card">
              <div className="home-stat-value">{profile.bestScore}/10</div>
              <div className="home-stat-label">Best Score</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-value">{profile.totalGames}</div>
              <div className="home-stat-label">Games Played</div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-value">{profile.collectedMountains.length}</div>
              <div className="home-stat-label">Mountains Found</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
