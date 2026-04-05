class NetworkMonitorPopup {
  constructor() {
    this.isMonitoring = false;
    this.requests = {};
    this.tabUrls = {};

    this.initializeElements();
    this.setupEventListeners();
    this.loadStatus();
  }

  // #region init
  initializeElements() {
    this.toggleSwitch = document.getElementById("toggleMonitoring");
    this.statusText = document.getElementById("statusText");
    this.analyzeAndDownloadBtn = document.getElementById("analyzeAndDownloadBtn");
    this.clearRequestsBtn = document.getElementById("clearRequests");
  }

  setupEventListeners() {
    this.toggleSwitch.addEventListener("change", () => {
      this.toggleMonitoring();
    });

    this.analyzeAndDownloadBtn.addEventListener("click", () => {
      this.analyzeAndDownload();
    });

    this.clearRequestsBtn.addEventListener("click", () => {
      this.clearRequests();
    });
  }
  // #endregion

  // #region updateRequests
  async updateRequests() {
    const response = await this.sendMessage({ action: "getRequests" });
    this.requests = response.requests || {};
    this.tabUrls = response.tabUrls || {};
    this.pageGroupedRequests = response.pageGroupedRequests || [];
  }
  // #endregion

  // #region loadStatus
  async loadStatus() {
    try {
      const response = await this.sendMessage({ action: "getStatus" });
      this.updateUI(response);
      await this.updateRequests();
    } catch (error) {
      console.error("Failed to load status:", error);
    }
  }
  // #endregion

  // #region toggleMonitoring
  async toggleMonitoring() {
    try {
      const response = await this.sendMessage({ action: "toggleMonitoring" });
      this.updateUI(response);

      // Reload requests after toggle
      setTimeout(() => this.loadStatus(), 500);
    } catch (error) {
      console.error("Failed to toggle monitoring:", error);
    }
  }
  // #endregion

  // #region analyzeAndDownload
  async analyzeAndDownload() {
    try {
      // Disable button to prevent repeated clicks
      this.analyzeAndDownloadBtn.disabled = true;
      this.analyzeAndDownloadBtn.textContent = "Analyzing...";
      
      // Step 1: Analyze data
      await this.updateRequests();
      this.analysis = this.performAnalysis();
      this.showTemporaryMessage("Analysis completed!");
      
      // Short delay to let the user see the analysis completion message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Download data
      this.analyzeAndDownloadBtn.textContent = "⬇Downloading...";
      await this.downloadAnalysis();
      
      // Restore button state
      this.analyzeAndDownloadBtn.disabled = false;
      this.analyzeAndDownloadBtn.textContent = "Analyze & Download JSON";
    } catch (error) {
      console.error("Failed to analyze and download:", error);
      this.showTemporaryMessage("Operation failed!");
      
      // Restore button state
      this.analyzeAndDownloadBtn.disabled = false;
      this.analyzeAndDownloadBtn.textContent = "Analyze & Download JSON";
    }
  }
  // #endregion

  // #region performAnalysis
  performAnalysis() {
    const analysis = {
      appName: '',
      apiPaths: []
    };
    if (this.pageGroupedRequests && this.pageGroupedRequests.length > 0) {
      analysis.apiPaths = this.pageGroupedRequests.map(pageData => ({
        page: pageData.page,
        validXHRPaths: pageData.validXHRPaths.map(pathData => ({
          path: pathData.path,
          method: pathData.method,
          payload: pathData.payload
        })),
        unknownXHRPaths: pageData.unknownXHRPaths,
        webSocketPaths: pageData.webSocketPaths
      }));
    }

    const tabUrl = Object.values(this.tabUrls)[0];
    if (tabUrl) {
      const { pathname } = new URL(tabUrl);
      analysis.appName = pathname.split('/')[1] || 'unknown';
    }
    return analysis;
  }
  // #endregion

  // #region clearRequests
  async clearRequests() {
    if (confirm("Are you sure you want to clear all captured requests?")) {
      try {
        await this.sendMessage({ action: "clearRequests" });
        await this.updateRequests();
        this.showTemporaryMessage("All data cleared!");
      } catch (error) {
        console.error("Failed to clear requests:", error);
      }
    }
  }
  // #endregion

  // #region updateUI
  updateUI(response) {
    this.isMonitoring = response.isMonitoring;
    this.toggleSwitch.checked = this.isMonitoring;
    this.statusText.textContent = `Monitoring: ${
      this.isMonitoring ? "ON" : "OFF"
    }`;
    this.statusText.style.color = this.isMonitoring ? "#4CAF50" : "#4b83f9";
  }
  // #endregion

  // #region downloadAnalysis
  // Download analysis result as JSON file
  async downloadAnalysis() {
    try {
      if (!this.analysis) {
        this.showTemporaryMessage("No analysis data available");
        return;
      }
      
      const data = this.analysis;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Usage-Analysis-${new Date()
        .toISOString()
        .slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showTemporaryMessage("Analysis downloaded!");
    } catch (e) {
      console.error("Failed to download analysis:", e);
      this.showTemporaryMessage("Download failed");
    }
  }
  // #endregion

  // #region showTemporaryMessage
  showTemporaryMessage(message) {
    const originalText = this.statusText.textContent;
    this.statusText.textContent = message;
    setTimeout(() => {
      this.statusText.textContent = originalText;
    }, 2000);
  }
  // #endregion

  // #region sendMessage
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
  // #endregion
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new NetworkMonitorPopup();
});
