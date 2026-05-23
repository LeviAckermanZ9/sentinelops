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
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ].slice(0, 50));
      addToast('success', `${data.label === 'POSITIVE' ? '🟢' : '🔴'} ${data.label} — ${Math.round(data.score * 100)}% confidence`);
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
      {/* Floating Particles */}
      <div className="particles">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

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
            <img src="/logo.png" alt="SentinelOps" className="brand-logo" />
            <span className="brand-text">SentinelOps</span>
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
              Powered by <span className="accent">DistilBERT</span> — analyze the emotional tone of any text in real-time with production-grade AI
            </p>
            <div className="feature-pills">
              <span className="feature-pill">⚡ Real-time Inference</span>
              <span className="feature-pill">🧠 DistilBERT Model</span>
              <span className="feature-pill">📊 Prometheus Metrics</span>
              <span className="feature-pill">🔒 JWT Auth</span>
              <span className="feature-pill">☸️ K8s Ready</span>
            </div>
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
      <footer className="footer">
        <span className="footer-brand">🛡️ SentinelOps v1.0.0</span>
        <span>INT377 — Cloud Computing & DevOps Essentials • Session 2025-26</span>
        <div className="footer-links">
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <a href="http://localhost:3000" target="_blank" rel="noreferrer">Grafana</a>
          <a href="http://localhost:9090" target="_blank" rel="noreferrer">Prometheus</a>
        </div>
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
