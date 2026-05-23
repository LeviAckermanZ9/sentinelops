export default function HistoryPanel({ history }) {
  if (history.length === 0) {
    return (
      <div className="glass-card history-panel">
        <h3>📜 History</h3>
        <p className="history-empty">
          No predictions yet. Analyze some text to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card history-panel">
      <h3>📜 History ({history.length})</h3>
      <ul className="history-list">
        {history.map((item, idx) => (
          <li key={idx} className="history-item">
            <span className="text" title={item.text}>
              {item.text}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
              }}>
                {item.time}
              </span>
              <span className={`badge ${item.label.toLowerCase()}`}>
                {item.label} {Math.round(item.score * 100)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
