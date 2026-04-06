import { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ReactECharts from 'echarts-for-react';
import { Locale, LOCALES, getMessages } from '../i18n';
import "./index.scss";

// Using similar types to the panel
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status: string;
  type?: string;
  responseStatus?: number;
  pageUrl?: string;
  postData?: string | object;
}

interface PathData {
  path: string;
  method: string;
  payload: string;
}

interface PageData {
  page: string;
  fullUrl: string;
  validXHRPaths: PathData[];
  unknownXHRPaths: string[];
  webSocketPaths: string[];
}

function Viewer() {
  // background sends pageGroupedRequests as PageData[] (array).
  // We convert it to Record<string, PageData> keyed by page name for easy lookup.
  const [data, setData] = useState<{ requests: Record<string, NetworkRequest[]>, pageGroupedRequests: Record<string, PageData> }>({
    requests: {},
    pageGroupedRequests: {}
  });
  const [activePage, setActivePage] = useState<string | null>(null);
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

  const fetchData = () => {
    try {
      if (!chrome?.runtime?.id) return;
      chrome.runtime.sendMessage({ action: "getRequests" }, (response) => {
        try {
          if (chrome.runtime.lastError) return;

          if (response) {
            // Convert PageData[] → Record<string, PageData> keyed by page name
            const pgrArray: PageData[] = response.pageGroupedRequests || [];
            const pgrMap: Record<string, PageData> = {};
            pgrArray.forEach(p => { pgrMap[p.page] = p; });

            setData({
              requests: response.requests || {},
              pageGroupedRequests: pgrMap
            });
          }
        } catch (_err) {
          // Ignore context invalidation in callback
        }
      });
    } catch (_e) {
      // Ignore context invalidation directly
    }
  };

  // Fetch once on mount — no polling; user triggers updates via the Refresh button
  useEffect(() => {
    fetchData();
  }, []);

  const pageNames = useMemo(() => Object.keys(data.pageGroupedRequests), [data.pageGroupedRequests]);

  // Set default active page if empty
  useEffect(() => {
    if (!activePage && pageNames.length > 0) {
      setActivePage(pageNames[0]);
    }
  }, [pageNames, activePage]);

  // Aggregate raw requests belonging to the active page by matching pageUrl === fullUrl
  const activeRequests = useMemo(() => {
    if (!activePage) return [];
    const pageData = data.pageGroupedRequests[activePage];
    if (!pageData) return [];
    const all = Object.values(data.requests).flat() as NetworkRequest[];
    return all.filter(r => r.pageUrl === pageData.fullUrl);
  }, [activePage, data]);

  const methodDistribution = useMemo(() => {
    const counts: Record<string, number> = { GET: 0, POST: 0, OTHER: 0 };
    activeRequests.forEach(req => {
      if (req.method === 'GET') counts.GET++;
      else if (req.method === 'POST') counts.POST++;
      else counts.OTHER++;
    });
    return {
      backgroundColor: 'transparent',
      title: { text: t.httpMethod, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: Object.entries(counts).map(([name, value]) => ({ name, value })),
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 }
      }]
    };
  }, [activeRequests, t]);

  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    activeRequests.forEach(req => {
      const key = req.type || 'Other';
      types[key] = (types[key] || 0) + 1;
    });
    return {
      backgroundColor: 'transparent',
      title: { text: t.resourceType, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: Object.keys(types) },
      series: [{ type: 'bar', data: Object.values(types), itemStyle: { color: '#73c0de' } }]
    };
  }, [activeRequests, t]);

  return (
    <div className="viewer-app">
      <div className="header">
        <h1>{t.dashboardTitle}</h1>
        <div className="controls">
          <button
            className="btn"
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
          <button className="btn" onClick={fetchData}>{t.refresh}</button>
          <button className="btn" onClick={() => window.close()}>{t.close}</button>
        </div>
      </div>

      <div className="main-content">
        <aside className="sidebar">
          <h3 className="sidebar-title">{t.pages}</h3>
          <ul className="site-list">
            {pageNames.length === 0 ? <li className="site-item" style={{ color: 'var(--text-muted)' }}>{t.noData}</li> : null}
            {pageNames.map(page => (
              <li
                key={page}
                className={`site-item ${activePage === page ? 'active' : ''}`}
                onClick={() => setActivePage(page)}
              >
                🌐 {page}
              </li>
            ))}
          </ul>
        </aside>

        <section className="dashboard">
          {!activePage ? (
            <div className="empty-state">{t.selectPage}</div>
          ) : (
            <>
              <div className="charts-grid">
                <div className="chart-card">
                  <ReactECharts key={theme} theme={theme} option={methodDistribution} style={{ height: '100%' }} />
                </div>
                <div className="chart-card">
                  <ReactECharts key={theme} theme={theme} option={typeDistribution} style={{ height: '100%' }} />
                </div>
              </div>
              <div className="data-table-wrapper">
                <h3>{t.capturedApis} ({activeRequests.length})</h3>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>{t.method}</th>
                      <th style={{ width: '80px' }}>{t.status}</th>
                      <th>{t.url}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRequests.map((req, i) => (
                      <tr key={req.requestId || i}>
                        <td>
                          <span className={`badge ${req.method === 'GET' ? 'get' : req.method === 'POST' ? 'post' : 'other'}`}>
                            {req.method}
                          </span>
                        </td>
                        <td>{req.responseStatus || req.status}</td>
                        <td style={{ wordBreak: 'break-all' }}>{req.url}</td>
                      </tr>
                    ))}
                    {activeRequests.length === 0 && (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t.noRequests}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Viewer />);
