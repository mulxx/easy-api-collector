// Background service worker for network monitoring
class NetworkMonitor {
  constructor() {
    this.isMonitoring = false;
    this.attachedTabs = new Set();
    // Modified data structure: tabId -> { currentUrl: string, pageRequests: Map<pageUrl, requests[]> }
    this.networkRequests = new Map();
    this.tabUrls = new Map(); // tabId -> current url

    // Initialize state from storage
    this.loadState();

    // Setup event listeners
    this.setupEventListeners();
  }

  // #region loadState
  async loadState() {
    const result = await chrome.storage.local.get([
      "isMonitoring",
      "networkRequests",
    ]);
    this.isMonitoring = result.isMonitoring || false;
    if (result.networkRequests) {
      // Convert stored data back to Map structure
      this.networkRequests = new Map();
      for (const [tabId, tabData] of Object.entries(result.networkRequests)) {
        if (tabData && tabData.pageRequests) {
          this.networkRequests.set(tabId, {
            currentUrl: tabData.currentUrl || "",
            pageRequests: new Map(Object.entries(tabData.pageRequests)),
          });
        }
      }
    }
  }
  // #endregion

  // #region saveState
  async saveState() {
    // Convert Map structure to plain object for storage
    const requestsObj = {};
    for (const [tabId, tabData] of this.networkRequests) {
      requestsObj[tabId] = {
        currentUrl: tabData.currentUrl,
        pageRequests: Object.fromEntries(tabData.pageRequests),
      };
    }
    await chrome.storage.local.set({
      isMonitoring: this.isMonitoring,
      networkRequests: requestsObj,
    });
  }
  // #endregion

  // #region setupEventListeners
  setupEventListeners() {
    // Listen for tab updates to track URL changes
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url && this.isMonitoring) {
        const oldUrl = this.tabUrls.get(tabId);
        const newUrl = changeInfo.url;

        // Update current URL
        this.tabUrls.set(tabId, newUrl);

        // Initialize tab data structure if not exists
        if (!this.networkRequests.has(tabId)) {
          this.networkRequests.set(tabId, {
            currentUrl: newUrl,
            pageRequests: new Map(),
          });
        } else {
          // Update current URL in tab data
          const tabData = this.networkRequests.get(tabId);
          tabData.currentUrl = newUrl;
        }

        // If URL changed significantly (not just hash or query params), create new page entry
        if (oldUrl && this.isSignificantUrlChange(oldUrl, newUrl)) {
          const tabData = this.networkRequests.get(tabId);
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
      // Detach from previous tab(s)
      for (const oldTabId of this.attachedTabs) {
        await this.detachDebugger(oldTabId);
      }
      this.attachedTabs.clear();
      this.networkRequests.clear();
      this.tabUrls.clear();
      // Attach to new active tab
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (
          tab.url &&
          !tab.url.startsWith("chrome://") &&
          !tab.url.startsWith("chrome-extension://")
        ) {
          this.tabUrls.set(tab.id, tab.url);
          // Initialize new tab data structure
          this.networkRequests.set(tab.id, {
            currentUrl: tab.url,
            pageRequests: new Map([[tab.url, []]]),
          });
          await this.attachDebugger(tab.id, tab.url);
        }
      } catch (e) {
        console.error("Failed to switch monitoring to active tab:", e);
      }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async response
    });
  }
  // #endregion

  // #region isSignificantUrlChange
  isSignificantUrlChange(oldUrl, newUrl) {
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
    } catch (e) {
      // If URL parsing fails, consider it significant
      return true;
    }
  }
  // #endregion

  // #region handleMessage
  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case "toggleMonitoring":
        await this.toggleMonitoring();
        sendResponse({ isMonitoring: this.isMonitoring });
        break;

      case "getStatus":
        sendResponse({
          isMonitoring: this.isMonitoring,
          requestCount: this.getTotalRequestCount(),
        });
        break;

      case "getRequests":
        // Convert the new data structure for compatibility with popup
        const requestsForPopup = {};
        for (const [tabId, tabData] of this.networkRequests) {
          // Flatten all requests from all pages in this tab
          const allRequests = [];
          for (const [pageUrl, requests] of tabData.pageRequests) {
            allRequests.push(...requests.map((req) => ({ ...req, pageUrl })));
          }
          requestsForPopup[tabId] = allRequests;
        }

        sendResponse({
          requests: requestsForPopup,
          tabUrls: Object.fromEntries(this.tabUrls),
          // New field: page-grouped requests
          pageGroupedRequests: this.getPageGroupedRequests(),
        });
        break;

      case "clearRequests":
        this.networkRequests.clear();
        this.tabUrls.clear();
        await this.saveState();
        sendResponse({ success: true });
        break;
    }
  }
  // #endregion

  // #region getPageGroupedRequests
  getPageGroupedRequests() {
    const pageGrouped = {};
    for (const [tabId, tabData] of this.networkRequests) {
      for (const [pageUrl, requests] of tabData.pageRequests) {
        if (requests.length > 0) {
          const pageName = this.extractPageName(pageUrl);
          if (!pageGrouped[pageName]) {
            pageGrouped[pageName] = {
              page: pageName,
              fullUrl: pageUrl,
              validXHRPaths: new Map(),
              unknownXHRPaths: new Set(),
              webSocketPaths: new Set(),
            };
          }

          // Extract API paths from requests
          requests.forEach((request) => {
            // XHR/Fetch requests
            if (request.type === "XHR" || request.type === "Fetch") {
              try {
                const url = new URL(request.url);
                // Replace UUIDs in pathname with 'uuid' to avoid duplicates
                const normalizedPathname = this.normalizePathname(url.pathname);

                const targetMap = pageGrouped[pageName].validXHRPaths;

                // Store requests for this path
                if (!targetMap.has(normalizedPathname)) {
                  targetMap.set(normalizedPathname, []);
                }
                targetMap.get(normalizedPathname).push(request);
              } catch (e) {
                // Invalid URL
              }
            }

            // WebSocket connections
            if (request.type === "WebSocket") {
              try {
                const url = new URL(request.url);
                const normalizedPathname = this.normalizePathname(url.pathname);
                pageGrouped[pageName].webSocketPaths.add(normalizedPathname);
              } catch (e) {
                // Invalid WebSocket URL
              }
            }
          });
        }
      }
    }

    // Convert Maps to Arrays with extracted fields for JSON serialization
    const result = Object.values(pageGrouped).map((page) => {
      const processPathMap = (pathMap) => {
        return Array.from(pathMap.entries()).map(([pathname, pathRequests]) => {
          // Find successful requests (status 200)
          const successfulRequests = pathRequests.filter(
            (r) => r.responseStatus === 200
          );

          // Extract method and payload from a successful request
          let method = "";
          let payload = "";
          
          if (successfulRequests.length > 0) {
            const selectedRequest =
              successfulRequests[
                Math.floor(Math.random() * successfulRequests.length)
              ];

            method = selectedRequest.method || "";
            
            // Extract payload
            if (selectedRequest.method === "GET") {
              // For GET requests, extract query parameters
              try {
                const url = new URL(selectedRequest.url);
                if (url.search) {
                  payload = url.search.substring(1); // Remove the leading '?'
                }
              } catch (e) {
                // Invalid URL, leave payload empty
              }
            } else if (selectedRequest.method === "POST" || selectedRequest.method === "PUT" || selectedRequest.method === "PATCH") {
              // For POST/PUT/PATCH requests, extract body
              let bodyText = null;
              if (selectedRequest.postData) {
                if (typeof selectedRequest.postData === 'string') {
                  bodyText = selectedRequest.postData;
                } else if (selectedRequest.postData.text) {
                  bodyText = selectedRequest.postData.text;
                } else if (selectedRequest.postData.params) {
                  // Handle form data
                  bodyText = selectedRequest.postData.params.map(p => `${p.name}=${p.value}`).join('&');
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
                } catch (e) {
                  // Not valid JSON, use original body text
                  payload = bodyText;
                }
              }
            }
          }

          return {
            path: pathname,
            method: method,
            payload: payload,
          };
        });
      };

      return {
        page: page.page,
        fullUrl: page.fullUrl,
        validXHRPaths: processPathMap(page.validXHRPaths),
        unknownXHRPaths: Array.from(page.unknownXHRPaths),
        webSocketPaths: Array.from(page.webSocketPaths),
      };
    });
    return result;
  }
  // #endregion

  // #region normalizePathname
  normalizePathname(pathname) {
    // UUID pattern: 8-4-4-4-12 hexadecimal characters
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    return pathname.replace(uuidRegex, "uuid");
  }
  // #endregion

  // #region extractPageName
  extractPageName(url) {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((segment) => segment !== "");
      // Extract meaningful page name from URL
      // Examples:
      // xxx.com/app/pageA?param=id -> pageA
      // xxx.com/app/pageB?param=id -> pageB
      if (pathSegments.length === 3) {
        return pathSegments[1] + "-" + pathSegments[2];
      } else if (pathSegments.length === 2) {
        return pathSegments[pathSegments.length - 1]; // Last segment
      } else if (pathSegments.length === 1) {
        return pathSegments[0];
      } else {
        return "home";
      }
    } catch (e) {
      return "unknown";
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
        tab.url &&
        !tab.url.startsWith("chrome://") &&
        !tab.url.startsWith("chrome-extension://")
      ) {
        this.tabUrls.set(tab.id, tab.url);
        // Initialize new data structure
        this.networkRequests.set(tab.id, {
          currentUrl: tab.url,
          pageRequests: new Map([[tab.url, []]]),
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
  async attachDebugger(tabId, url) {
    try {
      await chrome.debugger.attach({ tabId }, "1.3");
      await chrome.debugger.sendCommand({ tabId }, "Network.enable");

      // Enable WebSocket monitoring
      await chrome.debugger.sendCommand({ tabId }, "Runtime.enable");

      this.attachedTabs.add(tabId);
      this.tabUrls.set(tabId, url);

      // Initialize tab data structure if not exists
      if (!this.networkRequests.has(tabId)) {
        this.networkRequests.set(tabId, {
          currentUrl: url,
          pageRequests: new Map([[url, []]]),
        });
      }

      // Listen for network events
      chrome.debugger.onEvent.addListener((source, method, params) => {
        if (source.tabId === tabId) {
          this.handleNetworkEvent(tabId, method, params);
        }
      });
    } catch (error) {
      // Silently fail - debugger attach errors are usually non-critical
    }
  }
  // #endregion

  // #region getPostData
  async getPostData(tabId, requestId) {
    try {
      const response = await chrome.debugger.sendCommand(
        { tabId },
        "Network.getRequestPostData",
        { requestId }
      );
      // Return in the expected format: { text: string }
      if (response && response.postData) {
        return { text: response.postData };
      }
      return null;
    } catch (e) {
      // Request might not have body or already completed
      return null;
    }
  }
  // #endregion

  // #region detachDebugger
  async detachDebugger(tabId) {
    try {
      await chrome.debugger.detach({ tabId });
    } catch (error) {
      // Tab might already be closed or debugger not attached - ignore
    }
  }
  // #endregion

  // #region handleNetworkEvent
  handleNetworkEvent(tabId, method, params) {
    if (!this.isMonitoring) return;

    const tabData = this.networkRequests.get(tabId);
    if (!tabData) return;

    const currentUrl = tabData.currentUrl;
    if (!tabData.pageRequests.has(currentUrl)) {
      tabData.pageRequests.set(currentUrl, []);
    }

    const requests = tabData.pageRequests.get(currentUrl);

    // Handle WebSocket events
    if (method === "Network.webSocketCreated") {
      const wsRequest = {
        requestId: params.requestId,
        url: params.url,
        method: "WebSocket",
        headers: {},
        timestamp: Date.now() / 1000,
        type: "WebSocket",
        tabUrl: currentUrl,
        status: "connecting",
        initiator: params.initiator,
      };
      requests.push(wsRequest);
      return;
    }

    if (method === "Network.webSocketHandshakeResponseReceived") {
      const wsIndex = requests.findIndex(
        (r) => r.requestId === params.requestId
      );
      if (wsIndex !== -1) {
        requests[wsIndex] = {
          ...requests[wsIndex],
          status: "connected",
          responseStatus: params.response.status,
          responseHeaders: params.response.headers,
          responseTimestamp: params.timestamp,
        };
      }
      return;
    }

    if (method === "Network.webSocketClosed") {
      const wsIndex = requests.findIndex(
        (r) => r.requestId === params.requestId
      );
      if (wsIndex !== -1) {
        requests[wsIndex] = {
          ...requests[wsIndex],
          status: "closed",
          closedTimestamp: params.timestamp,
        };
      }
      return;
    }

    // Handle regular XHR/Fetch requests
    if (params.type !== "XHR" && params.type !== "Fetch") return;

    switch (method) {
      case "Network.requestWillBeSent":
        const request = {
          requestId: params.requestId,
          url: params.request.url,
          method: params.request.method,
          headers: params.request.headers,
          postData: params.request.postData, // Initial postData if available
          timestamp: params.timestamp,
          type: params.type,
          tabUrl: currentUrl,
          status: "pending",
        };
        
        // If postData is not in the initial request, try to fetch it for POST/PUT/PATCH
        if (!request.postData && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
          // Defer the fetch slightly to allow the request to be fully formed
          setTimeout(() => {
            this.getPostData(tabId, params.requestId).then((postData) => {
              if (postData) {
                const reqIndex = requests.findIndex(r => r.requestId === params.requestId);
                if (reqIndex !== -1) {
                  requests[reqIndex].postData = postData;
                  requests[reqIndex].postDataFetched = true;
                }
              }
            }).catch((err) => {
              console.warn(`Failed to fetch postData for ${request.url}:`, err);
            });
          }, 100); // Small delay to ensure request is ready
        }
        
        requests.push(request);
        break;

      case "Network.requestWillBeSentExtraInfo":
        const extraIndex = requests.findIndex(
          (r) => r.requestId === params.requestId
        );
        if (extraIndex !== -1) {
          const request = requests[extraIndex];
          // Try to use params.headers if available (update headers)
          if (params.headers) {
            request.headers = { ...request.headers, ...params.headers };
          }
          
          // Handle postData for POST/PUT/PATCH requests
          if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
            // If postData not already captured, try to fetch it
            if (!request.postData || !request.postData.text) {
              // Use async function to fetch postData
              this.getPostData(tabId, params.requestId).then((postData) => {
                if (postData) {
                  request.postData = postData;
                  // Mark that postData has been fetched
                  request.postDataFetched = true;
                }
              }).catch((err) => {
                console.warn(`Failed to get postData for ${request.url}:`, err);
              });
            }
          }
        }
        break;

      case "Network.responseReceived":
        const reqIndex = requests.findIndex(
          (r) => r.requestId === params.requestId
        );
        if (reqIndex !== -1) {
          const req = requests[reqIndex];
          requests[reqIndex] = {
            ...req,
            status: "completed",
            responseStatus: params.response.status,
            responseHeaders: params.response.headers,
            mimeType: params.response.mimeType,
            responseTimestamp: params.timestamp,
          };
          
          // Last chance to get postData if not already fetched
          if ((req.method === "POST" || req.method === "PUT" || req.method === "PATCH") && 
              !req.postData && !req.postDataFetched) {
            this.getPostData(tabId, params.requestId).then((postData) => {
              if (postData) {
                requests[reqIndex].postData = postData;
                requests[reqIndex].postDataFetched = true;
              }
            }).catch(() => {
              // Silently fail - request might be too old
            });
          }
        }
        break;

      case "Network.loadingFailed":
        const failedReqIndex = requests.findIndex(
          (r) => r.requestId === params.requestId
        );
        if (failedReqIndex !== -1) {
          requests[failedReqIndex] = {
            ...requests[failedReqIndex],
            status: "failed",
            errorText: params.errorText,
            failedTimestamp: params.timestamp,
          };
        }
        break;
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
const networkMonitor = new NetworkMonitor();
