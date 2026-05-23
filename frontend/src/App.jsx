import { useState, useCallback } from 'react';
import { api } from './api/client';
import PredictForm from './components/PredictForm';
import ResultCard from './components/ResultCard';
import MetricsBadge from './components/MetricsBadge';
import HistoryPanel from './components/HistoryPanel';
import LoginModal from './components/LoginModal';
import Toast from './components/Toast';

export default function App() {
  // Auth state
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return token ? { authenticated: true } : null;
  });
  const [showLogin, setShowLogin] = useState(false);

  // Prediction state
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle prediction
  const handlePredict = async (text) => {
    setIsLoading(true);
    try {
      const { data } = await api.predict(text);
      setResult(data);
      setHistory((prev) => [
        {
          text: data.text,
          label: data.label,
          score: data.score,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 50)); // Keep last 50
      addToast('success', `Sentiment: ${data.label} (${Math.round(data.score * 100)}%)`);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Prediction failed';
      addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle auth
  const handleAuth = (userData) => {
    setUser({ ...userData, authenticated: true });
    addToast('success', `Welcome, ${userData.email}!`);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore — token might already be invalid
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    addToast('success', 'Logged out successfully');
  };

  return (
    <div className="app-layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1200px',
        }}>
          <div className="navbar-brand">
            <div className="brand-icon">🛡️</div>
            SentinelOps
          </div>

          <div className="navbar-actions">
            <MetricsBadge />
            {user ? (
              <button
                id="logout-btn"
                className="btn btn-secondary"
                onClick={handleLogout}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                Sign Out
              </button>
            ) : (
              <button
                id="login-btn"
                className="btn btn-primary"
                onClick={() => setShowLogin(true)}
                style={{ fontSize: 'var(--font-size-sm)' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Hero */}
          <div className="hero">
            <h1>Sentiment Analysis</h1>
            <p className="tagline">
              Powered by DistilBERT — analyze the emotional tone of any text in real-time
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
              <PredictForm onSubmit={handlePredict} isLoading={isLoading} />
              <HistoryPanel history={history} />
            </div>
            <div>
              <ResultCard result={result} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: 'var(--space-lg)',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-xs)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        SentinelOps v1.0.0 — INT377 Cloud Computing & DevOps Essentials
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onAuth={handleAuth}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
