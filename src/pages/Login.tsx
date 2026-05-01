import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { isConfigured } from '../firebase';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (user) {
    navigate('/home', { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setError('名前を入力してください');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      }
      navigate('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '認証に失敗しました';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google認証に失敗しました';
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <svg className="login-logo-icon" viewBox="0 0 64 64" fill="none">
          <polygon points="32,4 60,56 4,56" fill="#1a1a2e" stroke="#c84b31" strokeWidth="3" strokeLinejoin="round"/>
          <polygon points="32,16 50,50 14,50" fill="none" stroke="#f0ece2" strokeWidth="1.2" strokeLinejoin="round" opacity="0.4"/>
          <polygon points="32,28 42,46 22,46" fill="none" stroke="#f0ece2" strokeWidth="0.8" strokeLinejoin="round" opacity="0.2"/>
        </svg>
        <h1 className="login-title">Peak<span>Guesser</span></h1>
        <p className="login-subtitle">写真から山の名前を当てろ</p>
      </div>

      <div className="login-form-container">
        {isConfigured ? (
          <>
            <div className="login-tabs">
              <button
                className={`login-tab ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError(''); }}
                id="tab-login"
              >
                ログイン
              </button>
              <button
                className={`login-tab ${tab === 'signup' ? 'active' : ''}`}
                onClick={() => { setTab('signup'); setError(''); }}
                id="tab-signup"
              >
                新規登録
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {tab === 'signup' && (
                <div className="login-field">
                  <label className="login-label" htmlFor="input-name">名前</label>
                  <input
                    className="input"
                    id="input-name"
                    type="text"
                    placeholder="山好き太郎"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
              )}
              <div className="login-field">
                <label className="login-label" htmlFor="input-email">メールアドレス</label>
                <input
                  className="input"
                  id="input-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="login-field">
                <label className="login-label" htmlFor="input-password">パスワード</label>
                <input
                  className="input"
                  id="input-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} id="btn-submit">
                {loading ? '処理中...' : tab === 'login' ? 'ログイン' : '登録'}
              </button>
            </form>

            <div className="login-divider">または</div>

            <button className="login-google-btn" onClick={handleGoogle} id="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Googleでログイン
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--c-text-secondary)', marginBottom: 'var(--sp-md)', fontSize: 'var(--fs-sm)' }}>
              Firebase未設定のためゲストモードで利用できます。<br />
              ランキング・プロフィール機能にはFirebase設定が必要です。
            </p>
          </div>
        )}

        <a className="login-guest-link" href="/home" onClick={e => { e.preventDefault(); navigate('/home'); }} id="btn-guest">
          ゲストとしてプレイ →
        </a>
      </div>
    </div>
  );
}
