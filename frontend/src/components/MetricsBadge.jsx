import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function MetricsBadge() {
  const [status, setStatus] = useState('loading'); // online, offline, loading

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.healthML();
        setStatus('online');
      } catch {
        setStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  const labels = {
    online: 'API Online',
    offline: 'API Offline',
    loading: 'Checking...',
  };

  return (
    <div className="status-badge" id="api-status-badge">
      <span className={`status-dot ${status}`} />
      <span>{labels[status]}</span>
    </div>
  );
}
