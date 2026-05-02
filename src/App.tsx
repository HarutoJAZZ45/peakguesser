import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Home from './pages/Home';
import Play from './pages/Play';
import Result from './pages/Result';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      gap: '1rem',
      color: 'var(--c-text-muted)',
    }}>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 48, height: 48 }}>
        <polygon points="32,8 56,52 8,52" fill="#1a1a2e" stroke="#c84b31" strokeWidth="3" strokeLinejoin="round"/>
        <polygon points="32,20 46,48 18,48" fill="none" stroke="#f0ece2" strokeWidth="1.5" strokeLinejoin="round" opacity="0.5"/>
      </svg>
      <div style={{
        fontFamily: 'var(--ff-heading)',
        fontSize: 'var(--fs-sm)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        animation: 'pulse 1.5s infinite',
      }}>
        Loading...
      </div>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Routes>
        {/* Login page — no header */}
        <Route path="/" element={<Login />} />

        {/* All other pages with header */}
        <Route
          path="*"
          element={
            <>
              <Header />
              <Routes>
                <Route path="/home" element={<Home />} />
                <Route path="/play" element={<Play />} />
                <Route path="/result" element={<Result />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/home" replace />} />
              </Routes>
            </>
          }
        />
      </Routes>
    </>
  );
}

