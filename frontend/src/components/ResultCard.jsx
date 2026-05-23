import { useEffect, useState } from 'react';

export default function ResultCard({ result }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const isPositive = result?.label === 'POSITIVE';
  const scorePercent = result ? Math.round(result.score * 100) : 0;

  useEffect(() => {
    if (!result) return;
    let start = 0;
    const target = scorePercent;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      start = Math.round(target * eased);
      setAnimatedScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    setAnimatedScore(0);
    requestAnimationFrame(animate);
  }, [result, scorePercent]);

  if (!result) {
    return (
      <div className="glass-card result-card">
        <div className="gauge-container">
          <div className="gauge-ring">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle className="gauge-outer" cx="100" cy="100" r="95" />
              <circle className="gauge-bg" cx="100" cy="100" r={radius} />
            </svg>
            <div className="gauge-value">
              <div className="score" style={{ color: 'var(--text-muted)', fontSize: '2rem' }}>—</div>
              <div className="label" style={{ color: 'var(--text-muted)' }}>
                Awaiting
              </div>
            </div>
          </div>
        </div>
        <div className="awaiting-label">
          <span>Enter text to see results</span>
          <span className="awaiting-cursor" />
        </div>
      </div>
    );
  }

  const dashOffset = circumference - (animatedScore / 100) * circumference;
  const glowClass = isPositive ? 'positive-glow' : 'negative-glow';

  return (
    <div className="glass-card result-card">
      <div className="gauge-container">
        <div className={`gauge-ring ${glowClass}`}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle className="gauge-outer" cx="100" cy="100" r="95" />
            <circle className="gauge-bg" cx="100" cy="100" r={radius} />
            <circle
              className={`gauge-fill ${isPositive ? 'positive' : 'negative'}`}
              cx="100"
              cy="100"
              r={radius}
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

      <p className="analyzed-text">
        {result.text.length > 120 ? result.text.slice(0, 120) + '…' : result.text}
      </p>

      <div className="result-meta">
        <div className="meta-item">
          <span className="meta-value">{result.inference_time_ms?.toFixed(1)}ms</span>
          <span className="meta-label">Latency</span>
        </div>
        <div className="meta-item">
          <span className="meta-value">{(result.score * 100).toFixed(2)}%</span>
          <span className="meta-label">Confidence</span>
        </div>
        <div className="meta-item">
          <span className="meta-value" style={{ fontSize: 'var(--font-size-xs)' }}>
            {result.model_version?.split('-').slice(-2).join('-') || 'sst-2'}
          </span>
          <span className="meta-label">Model</span>
        </div>
      </div>
    </div>
  );
}
