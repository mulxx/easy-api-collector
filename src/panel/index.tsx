import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import ReactECharts from 'echarts-for-react';
import './index.css';

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
  
  useEffect(() => {
    // In actual devtools, this gets the tabId of the current inspected window:
    const tabId = chrome.devtools?.inspectedWindow?.tabId?.toString() || "";

    const fetchRequests = () => {
      chrome.runtime.sendMessage({ action: "getRequests" }, (response) => {
        if (response && response.requests) {
          // If we run outside the panel context, maybe fallback to all requests for debugging.
          const tabData = response.requests[tabId] || Object.values(response.requests).flat() || [];
          setRequests(tabData as NetworkRequest[]);
        }
      });
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 2000); // Polling for updates
    return () => clearInterval(interval);
  }, []);

  // ECharts Pie Chart for Status
  const pieOption = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    requests.forEach(req => {
      const code = req.responseStatus ? String(req.responseStatus) : (req.status === 'failed' ? 'Failed' : 'Pending');
      statusCounts[code] = (statusCounts[code] || 0) + 1;
    });
    
    return {
      title: { text: 'Status Code Distribution', left: 'center', textStyle: { fontSize: 14 } },
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
  }, [requests]);

  // ECharts Bar Chart for Request Types
  const barOption = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    requests.forEach(req => {
      const type = req.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return {
      title: { text: 'Resource Types', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: Object.keys(typeCounts) },
      yAxis: { type: 'value' },
      series: [{ data: Object.values(typeCounts), type: 'bar', itemStyle: { color: '#5470c6' } }]
    };
  }, [requests]);

  // Duration scatter plot
  const scatterOption = useMemo(() => {
    const data = requests
      .filter(req => req.timestamp && req.responseTimestamp)
      .map(req => [
        new Date(req.timestamp! * 1000).toLocaleTimeString(), 
        ((req.responseTimestamp! - req.timestamp!) * 1000).toFixed(0)
      ]);

    return {
      title: { text: 'Request Latency (ms)', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item', formatter: 'Time: {c0}<br/>Latency: {c1} ms' },
      xAxis: { type: 'category' },
      yAxis: { type: 'value', axisLabel: { formatter: '{value} ms' } },
      series: [{ symbolSize: 10, data, type: 'scatter', itemStyle: { color: '#91cc75' } }]
    };
  }, [requests]);

  const getStatusBadge = (req: NetworkRequest) => {
    if (req.status === 'failed') return <span className="status-badge error">Failed</span>;
    if (req.status === 'pending') return <span className="status-badge pending">Pending</span>;
    return <span className="status-badge success">{req.responseStatus || 200}</span>;
  };

  return (
    <div className="panel-container">
      <div className="charts-row">
        <div className="chart-card"><ReactECharts option={pieOption} style={{ height: '100%' }} /></div>
        <div className="chart-card"><ReactECharts option={barOption} style={{ height: '100%' }} /></div>
        <div className="chart-card"><ReactECharts option={scatterOption} style={{ height: '100%' }} /></div>
      </div>

      <div className="table-card">
        <h3>Captured Network Requests ({requests.length})</h3>
        <table className="requests-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Status</th>
              <th>Type</th>
              <th>URL</th>
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
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No requests captured yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Panel />);
