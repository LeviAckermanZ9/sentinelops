import { useState } from 'react';
import { api } from '../api/client';

export default function LoginModal({ onClose, onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = isLogin
        ? await api.login(email, password)
        : await api.register(email, password);

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      onAuth(data.user);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
        <p className="subtitle">
          {isLogin
            ? 'Sign in to access the sentiment analysis API'
            : 'Register for a new SentinelOps account'}
        </p>

        {error && (
          <div className="modal-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <div className="modal-footer">
            <button
              id="auth-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>

            <p className="toggle-text">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
