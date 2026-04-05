# Easy API Collector - Network Monitor Browser Extension

A browser extension for real-time network request monitoring and analysis. Capture and analyze API calls by page navigation, with intelligent page grouping and structured data export.

## 1. Overview

This extension provides developers and QA engineers with deep insights into web application network behavior:

- **Real-time Network Monitoring**: Capture all XHR, Fetch, and WebSocket requests across all tabs
- **Smart Page Grouping**: Automatically detect page transitions and group API calls by page context
- **API Analysis**: Extract and organize API paths with UUID normalization for better pattern recognition
- **Data Export**: Export analysis results as JSON for further processing or reporting
- **One-Click Control**: Simple toggle to start/stop monitoring without page reload

## 2. Key Features

### Network Capture
- XHR/Fetch request interception via Chrome Debugger API
- WebSocket connection tracking and endpoint monitoring
- Multi-tab support with automatic tab lifecycle management
- Request status and timing information

### Intelligent Analysis
- Page-level API grouping - understand which APIs each page depends on
- Smart URL pattern detection - distinguish meaningful URL changes from hash/parameter variations
- API path extraction and deduplication
- Domain and endpoint statistics

### Data Management
- Real-time data updates in popup UI
- Clear all captured data with one click
- JSON export for integration with analytics tools
- Persistent storage across browser sessions

## 3. Installation

1. Clone or download this repository
2. Open Browser and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select the project folder
5. The extension is now installed and ready to use

## 4. Quick Start

1. **Enable Monitoring**
   - Click the extension icon in the toolbar
   - Toggle "Monitoring" switch ON
   - Status changes to "Monitoring: ON"

2. **Browse Normally**
   - Navigate through websites
   - Extension automatically captures all network requests
   - Works across page transitions and multiple tabs

3. **View Results**
   - Click "View Requests" to see all captured requests
   - Click "Analyze Data" to see page-grouped API analysis
   - Real-time statistics displayed at the top

4. **Export Data**
   - Click "Export Analysis" to download JSON results
   - Use for debugging, or API usage analysis via RCIS API Watchtower

5. **Clean Up**
   - Click "Clear Data" to reset all captured information

## 5. Technical Details

### Architecture
- **Manifest V3**: Modern extension format with Service Worker
- **Background Service Worker** (`background.js`): Handles network monitoring and data management
- **Chrome Debugger API**: Intercepts network events (XHR, Fetch, WebSocket)
- **Chrome Storage API**: Persists monitoring state and captured data
- **Popup UI** (`popup.html`/`popup.js`): User interface for interaction

### Permissions
- `debugger`: Required to intercept network requests
- `activeTab`: Access current tab information
- `storage`: Store monitoring data and state
- `tabs`: Manage multi-tab monitoring
- `<all_urls>`: Monitor network requests on any website

### File Structure
```
├── manifest.json              # Extension configuration
├── background.js              # Service Worker core logic
├── popup.html                 # Popup UI interface
├── popup.js                   # Popup interaction logic
├── lens.png                   # Extension icon
└── README.md                  # This file
```

## 6. Requirements

- Chrome 88+ (Manifest V3 support)
- No external dependencies

## 7. Notes

1. **Permissions**: Browser displays "Debugging this browser" - this is normal and required for network interception
2. **Performance**: Heavy monitoring may impact performance; clear data regularly
3. **Privacy**: All data is processed locally; nothing is uploaded to servers
4. **Debugger**: Only one debugger can attach per tab - other tabs will silently skip

## 8. Q&A

**Q: Why does Browser say "Debugging this browser"?**
A: The extension uses the Chrome Debugger API to intercept network requests. This is normal and required.

**Q: Can I use this on multiple tabs?**
A: Yes, the extension monitors all tabs simultaneously and groups APIs by page automatically.

**Q: Does this upload my data anywhere?**
A: No, all data processing is local. Nothing is sent to any servers.

**Q: How do I clear the extension cache?**
A: Click the "Clear Data" button in the popup to reset all captured data.