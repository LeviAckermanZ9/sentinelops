import { useState } from 'react';

export default function PredictForm({ onSubmit, isLoading }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text.trim());
    }
  };

  const examples = [
    'This movie was absolutely fantastic! The acting was superb.',
    'Terrible experience. The food was cold and the service was awful.',
    'The weather today is quite moderate, nothing special.',
  ];

  return (
    <div className="glass-card" style={{ padding: 'var(--space-xl)' }}>
      <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-xs)' }}>
        Analyze Sentiment
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
        Enter any text to analyze its emotional tone
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          id="predict-input"
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here..."
          rows={5}
          maxLength={5000}
          disabled={isLoading}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
        }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            {text.length} / 5000
          </span>
        </div>

        <button
          id="predict-submit"
          type="submit"
          className="btn btn-primary"
          disabled={!text.trim() || isLoading}
          style={{ width: '100%', padding: '0.875rem' }}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Analyzing...
            </>
          ) : (
            '✨ Analyze Sentiment'
          )}
        </button>
      </form>

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
          Try an example:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              className="btn btn-secondary"
              onClick={() => setText(ex)}
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                justifyContent: 'flex-start',
              }}
            >
              {ex.length > 60 ? ex.slice(0, 60) + '…' : ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
