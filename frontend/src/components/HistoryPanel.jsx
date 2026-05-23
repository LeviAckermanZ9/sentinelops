export default function HistoryPanel({ history }) {
  return (
    <div className="glass-card history-panel">
      <div className="panel-header">
        <h3>
          <span style={{ fontSize: '1.1em' }}>📋</span>
          History
        </h3>
        {history.length > 0 && (
          <span className="history-count">{history.length}</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="history-empty">
          <span className="empty-icon">🔍</span>
          <span>Predictions will appear here</span>
        </div>
      ) : (
        <ul className="history-list">
          {history.map((item, i) => (
            <li key={i} className="history-item" style={{ animationDelay: `${i * 0.05}s` }}>
              <span className="text">{item.text}</span>
              <div className="item-right">
                <span className={`badge ${item.label?.toLowerCase()}`}>
                  {item.label}
                </span>
                <span className="time">{item.time}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
