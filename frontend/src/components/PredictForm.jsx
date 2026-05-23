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
    { icon: '😊', text: 'This movie was absolutely fantastic! The acting was superb and the story was captivating.' },
    { icon: '😤', text: 'Terrible experience. The food was cold and the service was awful. Never going back.' },
    { icon: '😐', text: 'The weather today is quite moderate, nothing particularly special about it.' },
  ];

  const charPercent = (text.length / 5000) * 100;
  const charClass = charPercent > 90 ? 'danger' : charPercent > 70 ? 'warning' : '';

  return (
    <div className="glass-card predict-card">
      <div className="card-header">
        <h2>
          <span style={{ fontSize: '1.2em' }}>✨</span>
          Analyze Sentiment
        </h2>
        <p>Enter any text to analyze its emotional tone using AI</p>
      </div>

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
          <span className={`char-counter ${charClass}`}>
            {text.length.toLocaleString()} / 5,000
          </span>
          {text.length > 0 && (
            <button
              type="button"
              onClick={() => setText('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--error)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              Clear
            </button>
          )}
        </div>

        <button
          id="predict-submit"
          type="submit"
          className="btn btn-primary"
          disabled={!text.trim() || isLoading}
          style={{ width: '100%', padding: '0.9rem', fontSize: 'var(--font-size-base)' }}
        >
          {isLoading ? (
            <>
              <span className="spinner" />
              Analyzing...
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.1em' }}>⚡</span>
              Analyze Sentiment
            </>
          )}
        </button>
      </form>

      <div className="examples-section">
        <p className="label">Try an example</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {examples.map((ex, i) => (
            <button
              key={i}
              className="example-btn"
              onClick={() => setText(ex.text)}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ex.icon}</span>
              <span>{ex.text.length > 70 ? ex.text.slice(0, 70) + '…' : ex.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
