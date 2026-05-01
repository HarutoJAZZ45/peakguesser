import { Routes, Route, Navigate } from 'react-router';
import Header from './components/Header';
import Login from './pages/Login';
import Home from './pages/Home';
import Play from './pages/Play';
import Result from './pages/Result';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';

export default function App() {
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
