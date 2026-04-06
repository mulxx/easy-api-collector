import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StorageService, AppConfig, DEFAULT_CONFIG } from '../../utils/StorageService';
import { Locale, LOCALES, getMessages } from '../i18n';
import './index.scss';

function Options() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [newMaskingKey, setNewMaskingKey] = useState('');
  const [toast, setToast] = useState('');
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
    chrome.runtime.sendMessage({ action: 'updateConfig', config });
    showToast(t.toastSaved);
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

  if (loading) return (
    <>
      <nav className="options-toolbar">
        <button className="btn-tool" onClick={() => setTheme(p => p === 'light' ? 'dark' : 'light')}>
          {theme === 'dark' ? t.lightMode : t.darkMode}
        </button>
        <select className="locale-select" value={locale} onChange={e => setLocale(e.target.value as Locale)}>
          {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </nav>
      <div style={{ padding: 20, color: 'var(--text-primary)' }}>{t.optionsLoading}</div>
    </>
  );

  return (
    <>
      <nav className="options-toolbar">
        <button className="btn-tool" onClick={() => setTheme(p => p === 'light' ? 'dark' : 'light')}>
          {theme === 'dark' ? t.lightMode : t.darkMode}
        </button>
        <select className="locale-select" value={locale} onChange={e => setLocale(e.target.value as Locale)}>
          {LOCALES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </nav>

      <div className="container">
        {toast && <div className="toast">{toast}</div>}
        <h1>{t.optionsTitle}</h1>

        <div className="section">
          <h3>{t.sectionNetwork}</h3>
          <div className="form-group">
            <label>{t.labelNetworkTypes}</label>
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
            <label>{t.labelHttpMethods}</label>
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
          <h3>{t.sectionUrl}</h3>
          <div className="form-group">
            <label>{t.labelUrlFilter}</label>
            <input
              type="text"
              value={config.urlFilter || ''}
              onChange={(e) => setConfig({ ...config, urlFilter: e.target.value })}
              placeholder={t.placeholderUrlFilter}
            />
            <div className="help-text">{t.helpUrlFilter}</div>
          </div>
        </div>

        <div className="section">
          <h3>{t.sectionMasking}</h3>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="maskingEnabled"
              checked={config.maskingEnabled}
              onChange={(e) => setConfig({ ...config, maskingEnabled: e.target.checked })}
            />
            <label htmlFor="maskingEnabled" style={{ margin: 0 }}>{t.labelMaskingEnabled}</label>
          </div>

          {config.maskingEnabled && (
            <div className="form-group masking-inset">
              <label>{t.labelMaskingKeys}</label>
              <div className="tag-list">
                {config.maskingKeys.map(key => (
                  <div key={key} className="tag">
                    {key} <span onClick={() => handleRemoveMaskingKey(key)} title="×">×</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', maxWidth: '300px' }}>
                <input
                  type="text"
                  placeholder={t.placeholderMaskingKey}
                  value={newMaskingKey}
                  onChange={e => setNewMaskingKey(e.target.value)}
                  onKeyDown={handleAddMaskingKey}
                />
                <button className="btn-add" onClick={handleAddMaskingKey}>{t.btnAdd}</button>
              </div>
              <div className="help-text">{t.helpMaskingKeys}</div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: '40px' }}>
          <button className="btn-primary" onClick={handleSave}>{t.btnSave}</button>
        </div>
      </div>
    </>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
