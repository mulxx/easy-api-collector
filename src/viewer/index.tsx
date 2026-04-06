import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ReactECharts from 'echarts-for-react';
import "./index.scss";

// Using similar types to the panel
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  status: string;
  type?: string;
  responseStatus?: number;
  postData?: string | object;
}

interface PageData {
  page: string;
  fullUrl: string;
  validXHRPaths: Record<string, string[]>;
  unknownXHRPaths: string[];
  webSocketPaths: string[];
}

function Viewer() {
  const [data, setData] = useState<{ requests: Record<string, NetworkRequest[]>, pageGroupedRequests: Record<string, PageData> }>({
    requests: {},
    pageGroupedRequests: {}
  });
  const [activePage, setActivePage] = useState<string | null>(null);

  const fetchData = () => {
    try {
      if (!chrome?.runtime?.id) return;
      chrome.runtime.sendMessage({ action: "getRequests" }, (response) => {
        try {
          if (chrome.runtime.lastError) return;

          if (response) {
            setData({
              requests: response.requests || {},
              pageGroupedRequests: response.pageGroupedRequests || {}
            });
          }
        } catch (err) {
          // Ignore context invalidation in callback
        }
      });
    } catch (e) {
      // Ignore context invalidation directly
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
  }, []);

  const pageNames = useMemo(() => Object.keys(data.pageGroupedRequests), [data.pageGroupedRequests]);
  
  // Set default active page if empty
  useEffect(() => {
    if (!activePage && pageNames.length > 0) {
      setActivePage(pageNames[0]);
    }
  }, [pageNames, activePage]);

  // Aggregate requests for the active page
  const activeRequests = useMemo(() => {
    if (!activePage) return [];
    // The background doesn't strictly link pages to the raw array easily unless we match URLs or just show all for the tab
    // Let's fallback to combining everything for a rough overview, or trying to filter by activePage string matching tabUrls
    // For simplicity of a viewer user, if page string exists, maybe we just show all requests the background stored. 
    // In `getRequests` background aggregates ALL requests across ALL tabs into `requestsForPopup[tabId]`. 
    const all = Object.values(data.requests).flat();
    return all.filter(r => (r as Record<string, unknown>).pageUrl && ((r as Record<string, unknown>).pageUrl.includes(activePage) || activePage.includes((r as Record<string, unknown>).pageUrl)));
  }, [activePage, data.requests]);

  const methodDistribution = useMemo(() => {
    const counts: Record<string, number> = { GET: 0, POST: 0, OTHER: 0 };
    activeRequests.forEach(req => {
      if (req.method === 'GET') counts.GET++;
      else if (req.method === 'POST') counts.POST++;
      else counts.OTHER++;
    });
    return {
      title: { text: "HTTP 方法比重", left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: Object.entries(counts).map(([name, value]) => ({ name, value })),
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 }
      }]
    };
  }, [activeRequests]);

  const typeDistribution = useMemo(() => {
    const types: Record<string, number> = {};
    activeRequests.forEach(req => {
      const t = req.type || 'Other';
      types[t] = (types[t] || 0) + 1;
    });
    return {
      title: { text: "资源拦截类别", left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: Object.keys(types) },
      series: [{ type: 'bar', data: Object.values(types), itemStyle: { color: '#73c0de' } }]
    };
  }, [activeRequests]);

  return (
    <div className="viewer-app">
      <div className="header">
        <h1>Easy API Collector 实时大屏雷达</h1>
        <div className="controls">
          <button className="btn" onClick={fetchData}>手动刷新</button>
          <button className="btn" onClick={() => window.close()}>关闭</button>
        </div>
      </div>

      <div className="main-content">
        <aside className="sidebar">
          <h3 className="sidebar-title">抓包来源页面 (Pages)</h3>
          <ul className="site-list">
            {pageNames.length === 0 ? <li className="site-item" style={{ color: '#ccc' }}>暂无数据</li> : null}
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
            <div className="empty-state">请先在左侧选择一个捕获的页面来源</div>
          ) : (
            <>
              <div className="charts-grid">
                <div className="chart-card">
                  <ReactECharts option={methodDistribution} style={{ height: '100%' }} />
                </div>
                <div className="chart-card">
                  <ReactECharts option={typeDistribution} style={{ height: '100%' }} />
                </div>
              </div>
              <div className="data-table-wrapper">
                <h3>已捕获端点 API ({activeRequests.length} 条)</h3>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Method</th>
                      <th style={{ width: '80px' }}>Status</th>
                      <th>URL</th>
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
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>在该网页下暂未命中过滤规则的数据</td></tr>
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
