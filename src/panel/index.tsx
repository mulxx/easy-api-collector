import { useCallback, useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ReactECharts from 'echarts-for-react';
import { Locale, LOCALES, getMessages } from '../i18n';
import "./index.scss";

// Ensure the NetworkRequest type mimics what we export in background.
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status: string;
  type?: string;
  responseStatus?: number;
  timestamp?: number;
  responseTimestamp?: number;
}

function Panel() {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('eac-theme') as 'light' | 'dark') || 'light'
  );
  const [locale, setLocale] = useState<Locale>(
    () => (localStorage.getItem('eac-locale') as Locale) || 'en'
  );

  const t = useMemo(() => getMessages(locale), [locale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eac-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('eac-locale', locale);
  }, [locale]);

  // Stable tab id for the lifetime of the devtools panel
  const tabId = useMemo(() => chrome.devtools?.inspectedWindow?.tabId?.toString() || "", []);

  const fetchRequests = useCallback(() => {
    if (!chrome?.runtime?.id) return;
    try {
      chrome.runtime.sendMessage({ action: "getRequests" }, (response) => {
        try {
          if (chrome.runtime.lastError) return;
          if (response && response.requests) {
            const tabData = response.requests[tabId] || Object.values(response.requests).flat() || [];
            setRequests(tabData as NetworkRequest[]);
          }
        } catch (_err) {
          // Ignore context invalidation in callback
        }
      });
    } catch (_e) {
      // Context invalidated
    }
  }, [tabId]);

  // Fetch once on mount — no polling; user triggers updates via the Refresh button
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ECharts Pie Chart for Status
  const pieOption = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    requests.forEach(req => {
      const code = req.responseStatus ? String(req.responseStatus) : (req.status === 'failed' ? 'Failed' : 'Pending');
      statusCounts[code] = (statusCounts[code] || 0) + 1;
    });

    return {
      backgroundColor: 'transparent',
      title: { text: t.statusDist, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      series: [
        {
          name: 'Status',
          type: 'pie',
          radius: '60%',
          data: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }
      ]
    };
  }, [requests, t]);

  // ECharts Bar Chart for Request Types
  const barOption = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    requests.forEach(req => {
      const type = req.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return {
      backgroundColor: 'transparent',
      title: { text: t.resourceTypes, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: Object.keys(typeCounts) },
      yAxis: { type: 'value' },
      series: [{ data: Object.values(typeCounts), type: 'bar', itemStyle: { color: '#5470c6' } }]
    };
  }, [requests, t]);

  // Duration scatter plot
  const scatterOption = useMemo(() => {
    const data = requests
      .filter(req => req.timestamp && req.responseTimestamp)
      .map(req => [
        new Date(req.timestamp! * 1000).toLocaleTimeString(),
        ((req.responseTimestamp! - req.timestamp!) * 1000).toFixed(0)
      ]);

    return {
      backgroundColor: 'transparent',
      title: { text: t.latency, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: 'item',
        formatter: (params: { value: [string, string] }) =>
          `${t.latencyTime}: ${params.value[0]}<br/>${t.latencyMs}: ${params.value[1]} ms`
      },
      xAxis: { type: 'category' },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} ms' } },
      series: [{ symbolSize: 10, data, type: 'scatter', itemStyle: { color: '#91cc75' } }]
    };
  }, [requests, t]);

  const getStatusBadge = (req: NetworkRequest) => {
    if (req.status === 'failed') return <span className="status-badge error">Failed</span>;
    if (req.status === 'pending') return <span className="status-badge pending">Pending</span>;
    return <span className="status-badge success">{req.responseStatus || 200}</span>;
  };

  return (
    <div className="panel-container">
      <div className="toolbar">
        <button className="toolbar-btn" onClick={fetchRequests}>{t.refresh}</button>
        <button
          className="toolbar-btn"
          onClick={() => setTheme(p => p === 'light' ? 'dark' : 'light')}
        >
          {theme === 'dark' ? t.lightMode : t.darkMode}
        </button>
        <select
          className="locale-select"
          value={locale}
          onChange={e => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>

      <div className="charts-row">
        <div className="chart-card"><ReactECharts key={theme} theme={theme} option={pieOption} style={{ height: '100%' }} /></div>
        <div className="chart-card"><ReactECharts key={theme} theme={theme} option={barOption} style={{ height: '100%' }} /></div>
        <div className="chart-card"><ReactECharts key={theme} theme={theme} option={scatterOption} style={{ height: '100%' }} /></div>
      </div>

      <div className="table-card">
        <h3>{t.capturedRequests} ({requests.length})</h3>
        <table className="requests-table">
          <thead>
            <tr>
              <th>{t.method}</th>
              <th>{t.status}</th>
              <th>{t.type}</th>
              <th>{t.url}</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.requestId}>
                <td className="method-badge">{req.method}</td>
                <td>{getStatusBadge(req)}</td>
                <td>{req.type || 'N/A'}</td>
                <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.url}>
                  {req.url}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t.noRequestsYet}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Panel />);
