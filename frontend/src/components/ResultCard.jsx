import { useEffect, useState } from 'react';

export default function ResultCard({ result }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const circumference = 2 * Math.PI * 75; // radius = 75
  const isPositive = result?.label === 'POSITIVE';
  const scorePercent = result ? Math.round(result.score * 100) : 0;

  useEffect(() => {
    if (!result) return;
    // Animate score from 0 to actual value
    let start = 0;
    const target = scorePercent;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(target * eased);
      setAnimatedScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [result, scorePercent]);

  if (!result) {
    return (
      <div className="glass-card result-card">
        <div className="gauge-container">
          <div className="gauge-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle className="gauge-bg" cx="90" cy="90" r="75" />
            </svg>
            <div className="gauge-value">
              <div className="score" style={{ color: 'var(--text-muted)' }}>—</div>
              <div className="label" style={{ color: 'var(--text-muted)' }}>
                Awaiting input
              </div>
            </div>
          </div>
        </div>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}>
          Enter text on the left to see sentiment analysis results
        </p>
      </div>
    );
  }

  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="glass-card result-card">
      <div className="gauge-container">
        <div className="gauge-ring">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle className="gauge-bg" cx="90" cy="90" r="75" />
            <circle
              className={`gauge-fill ${isPositive ? 'positive' : 'negative'}`}
              cx="90"
              cy="90"
              r="75"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="gauge-value">
            <div className={`score ${isPositive ? 'positive' : 'negative'}`}>
              {animatedScore}%
            </div>
            <div className={`label ${isPositive ? 'positive' : 'negative'}`}>
              {result.label}
            </div>
          </div>
        </div>
      </div>

      <p style={{
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: 'var(--font-size-sm)',
        maxWidth: '300px',
        margin: '0 auto',
        lineHeight: '1.6',
      }}>
        &ldquo;{result.text.length > 100 ? result.text.slice(0, 100) + '…' : result.text}&rdquo;
      </p>

      <div className="result-meta">
        <div className="meta-item">
          <span className="meta-value">{result.inference_time_ms}ms</span>
          <span>Latency</span>
        </div>
        <div className="meta-item">
          <span className="meta-value">{(result.score * 100).toFixed(2)}%</span>
          <span>Confidence</span>
        </div>
        <div className="meta-item">
          <span className="meta-value" style={{ fontSize: 'var(--font-size-xs)' }}>
            {result.model_version?.split('/').pop() || 'distilbert-sst2'}
          </span>
          <span>Model</span>
        </div>
      </div>
    </div>
  );
}
