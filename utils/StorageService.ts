export interface AppConfig {
  isMonitoring: boolean;
  urlFilter: string; // regex pattern
  methodFilter: string[]; // GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
  typeFilter: string[]; // XHR, Fetch, WebSocket
  maskingEnabled: boolean;
  maskingKeys: string[];
}

export const DEFAULT_CONFIG: AppConfig = {
  isMonitoring: false,
  urlFilter: '',
  methodFilter: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  typeFilter: ['XHR', 'Fetch', 'WebSocket'],
  maskingEnabled: true,
  maskingKeys: ['authorization', 'cookie', 'token', 'password', 'secret', 'client_secret']
};

export class StorageService {
  static async getConfig(): Promise<AppConfig> {
    const result = await chrome.storage.local.get('appConfig');
    return { ...DEFAULT_CONFIG, ...(result.appConfig || {}) };
  }

  static async setConfig(config: Partial<AppConfig>): Promise<void> {
    const current = await this.getConfig();
    await chrome.storage.local.set({ appConfig: { ...current, ...config } });
  }
}
