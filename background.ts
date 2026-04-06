import { StorageService, AppConfig, DEFAULT_CONFIG } from './utils/StorageService';
import { MaskingUtils } from './utils/MaskingUtils';
import { HarExporter } from './utils/HarExporter';
import { NetworkRequest, TabData, PageData, PathData } from './types';

// Internal type for building page-grouped requests before serialization
interface InternalPageData {
  page: string;
  fullUrl: string;
  validXHRPaths: Map<string, NetworkRequest[]>;
  webSocketPaths: Set<string>;
}

// Typed params for Chrome Debugger API events
interface DebuggerParams {
  requestId?: string;
  url?: string;
  type?: string;
  timestamp?: number;
  errorText?: string;
  initiator?: unknown;
  headers?: Record<string, string>;
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    postData?: string;
  };
  response?: {
    status: number;
    headers: Record<string, string>;
    mimeType?: string;
  };
}

// Background service worker for network monitoring
class NetworkMonitor {
  isMonitoring: boolean;
  attachedTabs: Set<number>;
  networkRequests: Map<number, TabData>;
  tabUrls: Map<number, string>;
  appConfig: AppConfig;

  constructor() {
    this.isMonitoring = false;
    this.attachedTabs = new Set();
    // Modified data structure: tabId -> { currentUrl: string, pageRequests: Map<pageUrl, requests[]> }
    this.networkRequests = new Map();
    this.tabUrls = new Map(); // tabId -> current url
    this.appConfig = DEFAULT_CONFIG;

    // Setup event listeners immediately
    this.setupEventListeners();
    // Then load async states
    this.loadState();
  }

  // #region loadState
  async loadState() {
    this.appConfig = await StorageService.getConfig();
    const result = await chrome.storage.local.get(['isMonitoring', 'networkRequests']);
    this.isMonitoring = Boolean(result.isMonitoring);
    if (result.networkRequests) {
      // Convert stored data back to Map structure
      this.networkRequests = new Map();
      for (const [tabIdStr, tabData] of Object.entries(
        result.networkRequests as Record<string, Record<string, unknown>>
      )) {
        if (tabData && tabData.pageRequests) {
          const tabId = parseInt(tabIdStr, 10);
          this.networkRequests.set(tabId, {
            currentUrl: (tabData.currentUrl as string) || '',
            pageRequests: new Map(Object.entries(tabData.pageRequests))
          });
        }
      }
    }

    // if the SW was killed and restarted while monitoring was active,
    // the debugger connection is lost. Re-attach to the current active tab.
    if (this.isMonitoring && this.attachedTabs.size === 0) {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          const tab = tabs[0];
          if (
            tab.id !== undefined &&
            tab.url &&
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://')
          ) {
            // Detach first in case a stale session exists
            await this.detachDebugger(tab.id);
            await this.attachDebugger(tab.id, tab.url);
          }
        }
      } catch (_e) {
        // If re-attach fails (e.g. no active tab), reset monitoring state
        this.isMonitoring = false;
        await chrome.storage.local.set({ isMonitoring: false });
      }
    }
  }
  // #endregion

  // #region saveState
  async saveState() {
    // Convert Map structure to plain object for storage
    const requestsObj: Record<
      string,
      { currentUrl: string; pageRequests: Record<string, NetworkRequest[]> }
    > = {};
    for (const [tabId, tabData] of this.networkRequests) {
      requestsObj[tabId.toString()] = {
        currentUrl: tabData.currentUrl,
        pageRequests: Object.fromEntries(
          (tabData.pageRequests as Map<string, NetworkRequest[]>).entries()
        )
      };
    }
    await chrome.storage.local.set({
      isMonitoring: this.isMonitoring,
      networkRequests: requestsObj
    });
  }
  // #endregion

  // #region setupEventListeners
  setupEventListeners() {
    // Listen for tab updates to track URL changes
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
      if (changeInfo.url && this.isMonitoring) {
        const oldUrl = this.tabUrls.get(tabId);
        const newUrl = changeInfo.url;

        // Update current URL
        this.tabUrls.set(tabId, newUrl);

        // Initialize tab data structure if not exists
        if (!this.networkRequests.has(tabId)) {
          this.networkRequests.set(tabId, {
            currentUrl: newUrl,
            pageRequests: new Map()
          });
        } else {
          // Update current URL in tab data
          const tabData = this.networkRequests.get(tabId)!;
          tabData.currentUrl = newUrl;
        }

        // If URL changed significantly (not just hash or query params), create new page entry
        if (oldUrl && this.isSignificantUrlChange(oldUrl, newUrl)) {
          const tabData = this.networkRequests.get(tabId)!;
          if (!tabData.pageRequests.has(newUrl)) {
            tabData.pageRequests.set(newUrl, []);
          }
        }
      }
    });

    // Listen for tab removal to clean up
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.detachDebugger(tabId);
      this.attachedTabs.delete(tabId);
    });

    // When the active tab changes, switch monitoring to new tab
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      if (!this.isMonitoring) return;

      // Pre-flight: fetch the new tab info BEFORE clearing any data.
      // If the user opens an extension page (e.g. viewer.html) or a chrome:// page,
      // do NOT disrupt the current monitoring session.
      let newTab: chrome.tabs.Tab;
      try {
        newTab = await chrome.tabs.get(activeInfo.tabId);
      } catch (_e) {
        return;
      }
      if (
        !newTab.url ||
        newTab.url.startsWith('chrome://') ||
        newTab.url.startsWith('chrome-extension://')
      ) {
        return;
      }

      // Safe to switch monitoring to the new real web tab.
      for (const oldTabId of this.attachedTabs) {
        await this.detachDebugger(oldTabId);
      }
      this.attachedTabs.clear();
      this.networkRequests.clear();
      this.tabUrls.clear();
      // Persist the cleared state immediately
      await this.saveState();

      if (newTab.id !== undefined) {
        this.tabUrls.set(newTab.id, newTab.url);
        this.networkRequests.set(newTab.id, {
          currentUrl: newTab.url,
          pageRequests: new Map([[newTab.url, []]])
        });
        await this.attachDebugger(newTab.id, newTab.url);
      }
    });

    // Bug1 fix: register the debugger event listener once here, not inside attachDebugger,
    // to prevent duplicate listeners accumulating on every attach call.
    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (source.tabId !== undefined && this.attachedTabs.has(source.tabId)) {
        this.handleNetworkEvent(source.tabId, method, params);
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(
      (
        message: unknown,
        _sender: chrome.runtime.MessageSender,
        sendResponse: (r?: unknown) => void
      ) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep the message channel open for async response
      }
    );
  }
  // #endregion

  // #region isSignificantUrlChange
  isSignificantUrlChange(oldUrl: string, newUrl: string): boolean {
    try {
      const oldUrlObj = new URL(oldUrl);
      const newUrlObj = new URL(newUrl);

      // Consider it significant if:
      // 1. Different domain
      // 2. Different pathname
      // 3. Different search params (but ignore hash changes)
      return (
        oldUrlObj.hostname !== newUrlObj.hostname ||
        oldUrlObj.pathname !== newUrlObj.pathname ||
        oldUrlObj.search !== newUrlObj.search
      );
    } catch (_e) {
      // If URL parsing fails, consider it significant
      return true;
    }
  }
  // #endregion

  // #region handleMessage
  async handleMessage(message: unknown, sendResponse: (r?: unknown) => void) {
    const msg = message as { action: string; config?: Partial<AppConfig> };
    switch (msg.action) {
      case 'toggleMonitoring':
        await this.toggleMonitoring();
        sendResponse({ isMonitoring: this.isMonitoring });
        break;

      case 'getStatus':
        sendResponse({
          isMonitoring: this.isMonitoring,
          requestCount: this.getTotalRequestCount()
        });
        break;

      case 'getRequests': {
        // Convert the new data structure for compatibility with popup
        const requestsForPopup: Record<string, NetworkRequest[]> = {};
        for (const [tabId, tabData] of this.networkRequests) {
          // Flatten all requests from all pages in this tab
          const allRequests: NetworkRequest[] = [];
          for (const [pageUrl, requests] of Array.from(tabData.pageRequests.entries())) {
            allRequests.push(...requests.map((req) => ({ ...req, pageUrl })));
          }
          requestsForPopup[tabId.toString()] = allRequests;
        }

        sendResponse({
          requests: requestsForPopup,
          tabUrls: Object.fromEntries(this.tabUrls),
          // New field: page-grouped requests
          pageGroupedRequests: this.getPageGroupedRequests()
        });
        break;
      }

      case 'getRequestsAsHar': {
        const harRequests: NetworkRequest[] = [];
        for (const [_, tabData] of this.networkRequests) {
          for (const [_pageUrl, requests] of Array.from(tabData.pageRequests.entries())) {
            harRequests.push(...requests);
          }
        }
        sendResponse({
          har: HarExporter.export(harRequests)
        });
        break;
      }

      case 'clearRequests':
        this.networkRequests.clear();
        this.tabUrls.clear();
        await this.saveState();
        sendResponse({ success: true });
        break;

      case 'updateConfig':
        await StorageService.setConfig(msg.config!);
        this.appConfig = await StorageService.getConfig();
        sendResponse({ success: true, config: this.appConfig });
        break;

      case 'getConfig':
        sendResponse({ config: this.appConfig });
        break;
    }
  }
  // #endregion

  // #region getPageGroupedRequests
  getPageGroupedRequests(): PageData[] {
    const pageGrouped: Record<string, InternalPageData> = {};
    for (const [_, tabData] of this.networkRequests) {
      for (const [pageUrl, requests] of Array.from(tabData.pageRequests.entries())) {
        if (requests.length > 0) {
          const pageName = this.extractPageName(pageUrl);
          if (!pageGrouped[pageName]) {
            pageGrouped[pageName] = {
              page: pageName,
              fullUrl: pageUrl,
              validXHRPaths: new Map(),
              webSocketPaths: new Set()
            };
          }

          // Extract API paths from requests
          requests.forEach((request) => {
            // XHR/Fetch requests
            if (request.type === 'XHR' || request.type === 'Fetch') {
              try {
                const url = new URL(request.url);
                // Replace UUIDs in pathname with 'uuid' to avoid duplicates
                const normalizedPathname = this.normalizePathname(url.pathname);

                const targetMap = pageGrouped[pageName].validXHRPaths;

                // Store requests for this path
                if (!targetMap.has(normalizedPathname)) {
                  targetMap.set(normalizedPathname, []);
                }
                targetMap.get(normalizedPathname)!.push(request);
              } catch (_e) {
                // Invalid URL
              }
            }

            // WebSocket connections
            if (request.type === 'WebSocket') {
              try {
                const url = new URL(request.url);
                const normalizedPathname = this.normalizePathname(url.pathname);
                pageGrouped[pageName].webSocketPaths.add(normalizedPathname);
              } catch (_e) {
                // Invalid WebSocket URL
              }
            }
          });
        }
      }
    }

    // Convert Maps to Arrays with extracted fields for JSON serialization
    const result: PageData[] = Object.values(pageGrouped).map((page) => {
      const processPathMap = (pathMap: Map<string, NetworkRequest[]>): PathData[] => {
        return Array.from(pathMap.entries()).map(([pathname, pathRequests]) => {
          // Find successful requests (status 200)
          const successfulRequests = pathRequests.filter((r) => r.responseStatus === 200);

          // Extract method and payload from a successful request
          let method = '';
          let payload = '';

          if (successfulRequests.length > 0) {
            // Bug6 fix: use the first (earliest) successful request instead of a random one
            // to guarantee deterministic output across multiple analyze calls.
            const selectedRequest = successfulRequests[0];

            method = selectedRequest.method || '';

            // Extract payload
            if (selectedRequest.method === 'GET') {
              // For GET requests, extract query parameters
              try {
                const url = new URL(selectedRequest.url);
                if (url.search) {
                  payload = url.search.substring(1); // Remove the leading '?'
                }
              } catch (_e) {
                // Invalid URL, leave payload empty
              }
            } else if (
              selectedRequest.method === 'POST' ||
              selectedRequest.method === 'PUT' ||
              selectedRequest.method === 'PATCH'
            ) {
              // For POST/PUT/PATCH requests, extract body
              let bodyText = null;
              if (selectedRequest.postData) {
                if (typeof selectedRequest.postData === 'string') {
                  bodyText = selectedRequest.postData;
                } else if (selectedRequest.postData.text) {
                  bodyText = selectedRequest.postData.text;
                } else if (selectedRequest.postData.params) {
                  // Handle form data
                  bodyText = selectedRequest.postData.params
                    .map((p) => `${p.name}=${p.value}`)
                    .join('&');
                }
              }

              if (bodyText) {
                // Try to parse and re-stringify JSON to normalize
                try {
                  const trimmed = bodyText.trim();
                  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    const parsed = JSON.parse(bodyText);
                    payload = JSON.stringify(parsed);
                  } else {
                    payload = bodyText;
                  }
                } catch (_e) {
                  // Not valid JSON, use original body text
                  payload = bodyText;
                }
              }
            }
          }

          return {
            path: pathname,
            method: method,
            payload: payload
          };
        });
      };

      return {
        page: page.page,
        fullUrl: page.fullUrl,
        validXHRPaths: processPathMap(page.validXHRPaths),
        unknownXHRPaths: [],
        webSocketPaths: Array.from(page.webSocketPaths)
      };
    });
    return result;
  }
  // #endregion

  // #region normalizePathname
  normalizePathname(pathname: string): string {
    // UUID pattern: 8-4-4-4-12 hexadecimal characters
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    return pathname.replace(uuidRegex, 'uuid');
  }
  // #endregion

  // #region extractPageName
  extractPageName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter((segment) => segment !== '');
      // Extract meaningful page name from URL
      // Examples:
      // xxx.com/app/pageA?param=id         -> pageA        (2 segments)
      // xxx.com/app/module/pageA           -> module-pageA (3 segments)
      // xxx.com/app/module/sub/pageA/...   -> last 2 segments joined (4+ segments)
      if (pathSegments.length === 0) {
        return 'home';
      } else if (pathSegments.length === 1) {
        return pathSegments[0];
      } else if (pathSegments.length === 2) {
        return pathSegments[pathSegments.length - 1];
      } else {
        // Bug8 fix: for 3+ segments take the last two, covers both 3-segment and
        // deeper paths instead of falling through to a generic 'home'.
        return pathSegments[pathSegments.length - 2] + '-' + pathSegments[pathSegments.length - 1];
      }
    } catch (_e) {
      return 'unknown';
    }
  }
  // #endregion

  // #region toggleMonitoring
  async toggleMonitoring() {
    this.isMonitoring = !this.isMonitoring;

    if (this.isMonitoring) {
      await this.startMonitoring();
    } else {
      await this.stopMonitoring();
    }

    await this.saveState();
  }
  // #endregion

  // #region startMonitoring
  async startMonitoring() {
    // Attach debugger only to current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      if (
        tab.id !== undefined &&
        tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://')
      ) {
        this.tabUrls.set(tab.id, tab.url);
        // Initialize new data structure
        this.networkRequests.set(tab.id, {
          currentUrl: tab.url,
          pageRequests: new Map([[tab.url, []]])
        });
        await this.attachDebugger(tab.id, tab.url);
      }
    }
  }
  // #endregion

  // #region stopMonitoring
  async stopMonitoring() {
    // Detach debugger from all tabs
    for (const tabId of this.attachedTabs) {
      await this.detachDebugger(tabId);
    }
    this.attachedTabs.clear();
  }
  // #endregion

  // #region attachDebugger
  async attachDebugger(tabId: number, url: string) {
    try {
      await chrome.debugger.attach({ tabId }, '1.3');
      await chrome.debugger.sendCommand({ tabId }, 'Network.enable');

      this.attachedTabs.add(tabId);
      this.tabUrls.set(tabId, url);

      // Initialize tab data structure if not exists
      if (!this.networkRequests.has(tabId)) {
        this.networkRequests.set(tabId, {
          currentUrl: url,
          pageRequests: new Map([[url, []]])
        });
      }
    } catch (_error) {
      // Silently fail - debugger attach errors are usually non-critical
    }
  }
  // #endregion

  // #region getPostData
  async getPostData(tabId: number, requestId: string): Promise<{ text: string } | null> {
    try {
      const response = (await chrome.debugger.sendCommand({ tabId }, 'Network.getRequestPostData', {
        requestId
      })) as { postData?: string } | undefined;
      // Return in the expected format: { text: string }
      if (response?.postData) {
        return { text: response.postData };
      }
      return null;
    } catch (_e) {
      // Request might not have body or already completed
      return null;
    }
  }
  // #endregion

  // #region detachDebugger
  async detachDebugger(tabId: number) {
    try {
      await chrome.debugger.detach({ tabId });
    } catch (_error) {
      // Tab might already be closed or debugger not attached - ignore
    }
  }
  // #endregion

  // #region handleNetworkEvent
  handleNetworkEvent(tabId: number, method: string, params: unknown) {
    if (!this.isMonitoring) return;
    const p = params as DebuggerParams;

    const tabData = this.networkRequests.get(tabId);
    if (!tabData) return;

    const currentUrl = tabData.currentUrl;
    if (!tabData.pageRequests.has(currentUrl)) {
      tabData.pageRequests.set(currentUrl, []);
    }

    const requests = tabData.pageRequests.get(currentUrl)!;

    // Apply URL filter: prefer request.url (actual API endpoint) over p.url (document URL)
    const urlToFilter = p.request?.url ?? p.url;
    if (urlToFilter && this.appConfig.urlFilter) {
      try {
        const regex = new RegExp(this.appConfig.urlFilter, 'i');
        if (!regex.test(urlToFilter)) return; // Drop request due to filter
      } catch (_e) {
        // Regex might be invalid, just ignore
      }
    }

    // Handle WebSocket events
    if (method === 'Network.webSocketCreated') {
      if (this.appConfig.typeFilter && !this.appConfig.typeFilter.includes('WebSocket')) return;

      const wsRequest = {
        requestId: p.requestId!,
        url: p.url!,
        method: 'WebSocket',
        headers: {},
        timestamp: Date.now() / 1000,
        type: 'WebSocket',
        tabUrl: currentUrl,
        status: 'connecting',
        initiator: p.initiator
      };
      requests.push(wsRequest);
      return;
    }

    if (method === 'Network.webSocketHandshakeResponseReceived') {
      const wsIndex = requests.findIndex((r) => r.requestId === p.requestId);
      if (wsIndex !== -1) {
        requests[wsIndex] = {
          ...requests[wsIndex],
          status: 'connected',
          responseStatus: p.response!.status,
          responseHeaders: MaskingUtils.maskHeaders(p.response!.headers, this.appConfig),
          responseTimestamp: p.timestamp
        };
      }
      return;
    }

    if (method === 'Network.webSocketClosed') {
      const wsIndex = requests.findIndex((r) => r.requestId === p.requestId);
      if (wsIndex !== -1) {
        requests[wsIndex] = {
          ...requests[wsIndex],
          status: 'closed',
          closedTimestamp: p.timestamp
        };
      }
      return;
    }

    // Handle regular XHR/Fetch requests
    if (p.type !== 'XHR' && p.type !== 'Fetch') return;

    // Type Filter
    if (this.appConfig.typeFilter && !this.appConfig.typeFilter.includes(p.type!)) return;

    // Method Filter
    const reqMethod = p.request?.method?.toUpperCase();
    if (
      reqMethod &&
      this.appConfig.methodFilter &&
      this.appConfig.methodFilter.length > 0 &&
      !this.appConfig.methodFilter.includes(reqMethod)
    ) {
      return;
    }

    switch (method) {
      case 'Network.requestWillBeSent': {
        const request = {
          requestId: p.requestId!,
          url: p.request!.url,
          method: p.request!.method,
          headers: MaskingUtils.maskHeaders(p.request!.headers, this.appConfig),
          postData: MaskingUtils.maskPayload(p.request!.postData, this.appConfig), // Initial postData if available
          timestamp: p.timestamp,
          type: p.type,
          tabUrl: currentUrl,
          status: 'pending'
        };

        // If postData is not in the initial request, try to fetch it for POST/PUT/PATCH
        if (
          !request.postData &&
          (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')
        ) {
          // Defer the fetch slightly to allow the request to be fully formed
          setTimeout(() => {
            this.getPostData(tabId, p.requestId!)
              .then((postData) => {
                if (postData && postData.text) {
                  const reqIndex = requests.findIndex((r) => r.requestId === p.requestId);
                  if (reqIndex !== -1) {
                    requests[reqIndex].postData = {
                      text: MaskingUtils.maskPayload(postData.text, this.appConfig) ?? undefined
                    };
                    requests[reqIndex].postDataFetched = true;
                  }
                }
              })
              .catch((err) => {
                console.warn(`Failed to fetch postData for ${request.url}:`, err);
              });
          }, 100); // Small delay to ensure request is ready
        }

        requests.push(request);
        break;
      }

      case 'Network.requestWillBeSentExtraInfo': {
        const extraIndex = requests.findIndex((r) => r.requestId === p.requestId);
        if (extraIndex !== -1) {
          const request = requests[extraIndex];
          // Try to use p.headers if available (update headers)
          if (p.headers) {
            request.headers = MaskingUtils.maskHeaders(
              { ...request.headers, ...p.headers },
              this.appConfig
            );
          }

          // Handle postData for POST/PUT/PATCH requests
          if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
            // If postData not already captured, try to fetch it
            const pd = request.postData;
            if (!pd || (typeof pd !== 'string' && !pd.text)) {
              // Use async function to fetch postData
              this.getPostData(tabId, p.requestId!)
                .then((postData) => {
                  if (postData && postData.text) {
                    request.postData = {
                      text: MaskingUtils.maskPayload(postData.text, this.appConfig) ?? undefined
                    };
                    // Mark that postData has been fetched
                    request.postDataFetched = true;
                  }
                })
                .catch((err) => {
                  console.warn(`Failed to get postData for ${request.url}:`, err);
                });
            }
          }
        }
        break;
      }
      case 'Network.responseReceived': {
        const reqIndex = requests.findIndex((r) => r.requestId === p.requestId);
        if (reqIndex !== -1) {
          const req = requests[reqIndex];
          requests[reqIndex] = {
            ...req,
            status: 'completed',
            responseStatus: p.response!.status,
            responseHeaders: MaskingUtils.maskHeaders(p.response!.headers, this.appConfig),
            mimeType: p.response!.mimeType,
            responseTimestamp: p.timestamp
          };

          // Last chance to get postData if not already fetched
          if (
            (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') &&
            !req.postData &&
            !req.postDataFetched
          ) {
            this.getPostData(tabId, p.requestId!)
              .then((postData) => {
                if (postData && postData.text) {
                  requests[reqIndex].postData = {
                    text: MaskingUtils.maskPayload(postData.text, this.appConfig) ?? undefined
                  };
                  requests[reqIndex].postDataFetched = true;
                }
              })
              .catch(() => {
                // Silently fail - request might be too old
              });
          }
        }
        break;
      }
      case 'Network.loadingFailed': {
        const failedReqIndex = requests.findIndex((r) => r.requestId === p.requestId);
        if (failedReqIndex !== -1) {
          requests[failedReqIndex] = {
            ...requests[failedReqIndex],
            status: 'failed',
            errorText: p.errorText,
            failedTimestamp: p.timestamp
          };
        }
        break;
      }
    }

    // Update the page requests
    tabData.pageRequests.set(currentUrl, requests);
  }
  // #endregion

  // #region getTotalRequestCount
  getTotalRequestCount() {
    let total = 0;
    for (const tabData of this.networkRequests.values()) {
      for (const requests of tabData.pageRequests.values()) {
        total += requests.length;
      }
    }
    return total;
  }
  // #endregion
}

// Initialize the network monitor
export const networkMonitor = new NetworkMonitor();
