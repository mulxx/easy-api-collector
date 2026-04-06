import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StorageService, AppConfig, DEFAULT_CONFIG } from '../../utils/StorageService';
import './index.scss';

function Options() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [newMaskingKey, setNewMaskingKey] = useState('');
  const [toast, setToast] = useState('');

  const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  const REQUEST_TYPES = ['XHR', 'Fetch', 'WebSocket'];

  useEffect(() => {
    StorageService.getConfig().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    await StorageService.setConfig(config);
    // Notify background script about config update
    chrome.runtime.sendMessage({ action: 'updateConfig', config });
    showToast('配置已保存生效！');
  };

  const handleMethodChange = (method: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      methodFilter: checked 
        ? [...prev.methodFilter, method] 
        : prev.methodFilter.filter(m => m !== method)
    }));
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      typeFilter: checked 
        ? [...prev.typeFilter, type] 
        : prev.typeFilter.filter(t => t !== type)
    }));
  };

  const handleAddMaskingKey = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    const trimmed = newMaskingKey.trim().toLowerCase();
    if (trimmed && !config.maskingKeys.includes(trimmed)) {
      setConfig(prev => ({ ...prev, maskingKeys: [...prev.maskingKeys, trimmed] }));
      setNewMaskingKey('');
    }
  };

  const handleRemoveMaskingKey = (key: string) => {
    setConfig(prev => ({ ...prev, maskingKeys: prev.maskingKeys.filter(k => k !== key) }));
  };

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}
      <h1>Easy API Collector - 过滤与脱敏配置</h1>

      <div className="section">
        <h3>🌐 拦截类型与方法黑白名单机制</h3>
        <div className="form-group">
          <label>监听的网络类型 (请求载体)：</label>
          <div className="checkbox-group">
            {REQUEST_TYPES.map(type => (
              <label key={type} className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={config.typeFilter.includes(type)}
                  onChange={(e) => handleTypeChange(type, e.target.checked)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>监听的 HTTP Method 动作：</label>
          <div className="checkbox-group">
            {HTTP_METHODS.map(method => (
              <label key={method} className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={config.methodFilter.includes(method)}
                  onChange={(e) => handleMethodChange(method, e.target.checked)}
                />
                {method}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <h3>🔍 URL 路径正则过滤配置</h3>
        <div className="form-group">
          <label>URL 过滤条件 (正则表达式)：</label>
          <input 
            type="text" 
            value={config.urlFilter || ''} 
            onChange={(e) => setConfig({ ...config, urlFilter: e.target.value })}
            placeholder="例如: .*api\\.github\\.com.* 或者 ^https:\/\/.*\\/v1\/.*" 
          />
          <div className="help-text">如果填写，则仅抓取 URL 能够匹配该正则表达式的请求。留空表示拦截所有。</div>
        </div>
      </div>

      <div className="section">
        <h3>🔒 隐私脱敏模式配置</h3>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="maskingEnabled"
            checked={config.maskingEnabled}
            onChange={(e) => setConfig({ ...config, maskingEnabled: e.target.checked })}
          />
          <label htmlFor="maskingEnabled" style={{ margin: 0 }}>开启 Payload 和 Headers 字段级自动脱敏</label>
        </div>
        
        {config.maskingEnabled && (
          <div className="form-group" style={{ marginTop: '16px', background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
            <label>模糊处理的关键字列表 (无论 Header 还是 JSON 体只要键名匹配就会被 *** 打码)：</label>
            <div className="tag-list">
              {config.maskingKeys.map(key => (
                <div key={key} className="tag">
                  {key} <span onClick={() => handleRemoveMaskingKey(key)} title="移除">×</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
              <input 
                type="text" 
                placeholder="输入新关键字后回车..." 
                value={newMaskingKey}
                onChange={e => setNewMaskingKey(e.target.value)}
                onKeyDown={handleAddMaskingKey}
              />
              <button className="btn-add" onClick={handleAddMaskingKey}>添加</button>
            </div>
            <div className="help-text">拦截时如果 JSON 或请求头属性名(无视大小写)等于列表中任何一个词，将替换为 `***` 脱敏字样。</div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'right', marginTop: '40px' }}>
        <button className="btn-primary" onClick={handleSave}>保存当前配置 (Save Options)</button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
