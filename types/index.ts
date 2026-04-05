export type PostDataBody =
  | string
  | { text?: string; params?: Array<{ name: string; value: string }> }
  | null;

export interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  postData?: PostDataBody;
  postDataFetched?: boolean;
  timestamp?: number;
  type?: string;
  tabUrl?: string;
  status: string; // 'pending' | 'completed' | 'failed' | 'connecting' | 'connected' | 'closed'
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  mimeType?: string;
  responseTimestamp?: number;
  errorText?: string;
  initiator?: unknown;
  closedTimestamp?: number;
  failedTimestamp?: number;
  pageUrl?: string; // used when returning to popup
}

export interface PathData {
  path: string;
  method: string;
  payload: string;
}

export interface PageData {
  page: string;
  fullUrl: string;
  validXHRPaths: PathData[];
  unknownXHRPaths: string[];
  webSocketPaths: string[];
}

export interface TabData {
  currentUrl: string;
  pageRequests: Map<string, NetworkRequest[]>;
}

export interface ApplicationState {
  isMonitoring: boolean;
  networkRequests: Record<
    string,
    { currentUrl: string; pageRequests: Record<string, NetworkRequest[]> }
  >;
}

export interface AnalysisResult {
  appName: string;
  apiPaths: PageData[];
}
