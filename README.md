<div align="center">
  <h1>🚀 Easy API Collector</h1>
  <p>A powerful Chrome extension for real-time API packet capture, analysis, and export<br/>强大的 Chrome 浏览器 API 抓包、分析与导出工具</p>
  <p>
    <img src="https://img.shields.io/badge/Manifest-V3-blue" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript" />
    <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite" />
    <img src="https://img.shields.io/badge/ECharts-6-AA344D" />
  </p>
  <p>
    <a href="#english">English</a> · <a href="#简体中文">简体中文</a>
  </p>
</div>

---

<h2 id="english">English</h2>

**Easy API Collector** is a Chrome Extension (Manifest V3) built for developers and testers. It uses the **Chrome Debugger API** (CDP) to intercept all network traffic in real time, then surfaces the captured data through three integrated interfaces: a DevTools panel, a full-page realtime dashboard, and a filterable options UI — all with **dark / light theme switching** and **10-language i18n support**.

---

### ✨ Features

| Category            | Details                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Capture**         | Intercepts XHR, Fetch, WebSocket, Script, Image and all other CDP network event types via `chrome.debugger`                                |
| **Rule Engine**     | Filter by HTTP method, request type, and arbitrary URL regex; rules take effect immediately across all capture surfaces                    |
| **Privacy Masking** | Field-level key masking — any Header or JSON body key matching the configured list is replaced with `***MASKED***` at capture time         |
| **HAR Export**      | One-click export of all captured requests in standard HAR 1.2 format for import into Postman, Charles, etc.                                |
| **JSON Analysis**   | Structured analysis export grouping API paths by originating page with method and payload summaries                                        |
| **DevTools Panel**  | Dedicated tab in Chrome DevTools (F12) with three ECharts: status code distribution (pie), resource type (bar), latency scatter            |
| **Realtime Viewer** | Full-page standalone dashboard opened via the popup; shows per-page method distribution and resource type charts plus a full request table |
| **Options Page**    | Persistent configuration via `chrome.storage` — method/type allow-list, URL regex filter, masking key management                           |
| **Theme**           | Dark / Light mode toggle, persisted in `localStorage` across all three pages (`eac-theme`)                                                 |
| **i18n**            | 10 languages: English · 中文 · 日本語 · 한국어 · Español · Português · Français · Deutsch · Italiano · Русский                             |
| **Manual Refresh**  | Dashboards fetch data only on initial load and on user-triggered Refresh — no auto-polling that could cause phantom data clears            |

---

### 🏗️ Architecture

```
easy-api-collector/
├── manifest.json              # MV3 manifest — debugger, activeTab, storage, tabs
├── background.ts              # Service Worker — NetworkMonitor class, chrome.debugger CDP
├── popup.html / popup.ts      # Extension popup — toggle monitoring, download, open Viewer
├── devtools.html              # DevTools entry page (registers the panel)
├── panel.html                 # DevTools panel host page
├── viewer.html                # Standalone realtime dashboard host page
├── options.html               # Options page host page
│
├── src/
│   ├── i18n.ts                # 10-locale Messages interface + getMessages() + LOCALES[]
│   ├── devtools/              # DevTools panel registration script
│   ├── panel/
│   │   ├── index.tsx          # React app — status/type/latency charts, request table
│   │   └── index.scss         # CSS custom properties (light/dark theming)
│   ├── viewer/
│   │   ├── index.tsx          # React app — per-page method & type charts, request table
│   │   └── index.scss         # CSS custom properties (light/dark theming)
│   └── options/
│       ├── index.tsx          # React app — method/type filter, URL regex, masking keys
│       └── index.scss         # CSS custom properties (light/dark theming)
│
├── types/index.ts             # Shared TypeScript interfaces (NetworkRequest, PageData, …)
├── utils/
│   ├── StorageService.ts      # chrome.storage abstraction + AppConfig + DEFAULT_CONFIG
│   ├── MaskingUtils.ts        # Field-level masking for headers and JSON bodies
│   └── HarExporter.ts        # HAR 1.2 export from NetworkRequest[]
│
└── vite.config.ts             # @crxjs/vite-plugin + react; multi-entry build
```

**Data flow:**

1. `popup.ts` sends `toggleMonitoring` → `background.ts` calls `chrome.debugger.attach`
2. Background listens to CDP events (`Network.requestWillBeSent`, `Network.responseReceived`, etc.), applies config filters and masking, saves state to `chrome.storage.local`
3. Panel / Viewer send `getRequests` → background serializes `Map`→plain object and responds
4. Dashboards render on first load and when the user clicks **Refresh** — no polling interval

---

### 📦 Installation

#### Option A — Load the pre-built `dist/` (no Node.js required)

1. Download or clone this repository
2. Run `npm install && npm run build` to produce the `dist/` folder  
   _(or download a release ZIP if available)_
3. Open `chrome://extensions/` in Chrome
4. Enable **Developer mode** (top-right toggle)
5. Click **Load unpacked** → select the `dist/` folder
6. Pin the extension to the toolbar

#### Option B — Development mode (hot-reload)

```bash
git clone https://github.com/your-username/easy-api-collector.git
cd easy-api-collector
npm install
npm run dev          # Vite build --watch; dist/ is updated on every save
```

Load `dist/` into Chrome as above. After code changes, click the 🔄 refresh icon on `chrome://extensions` if the extension does not hot-reload automatically.

---

### 🚀 Usage

1. **Navigate** to any web page you want to capture
2. **Click** the Easy API Collector extension icon → toggle **Start Monitoring**
3. **Browse** the target site — requests are captured in real time
4. **Open DevTools** (F12) → go to the **Easy API Collector** tab for the panel view
5. **Click "Open Dashboard"** in the popup for the full-page Viewer
6. **Click "Analyze & Export JSON"** to download a structured API path summary
7. **Click "Download HAR"** to export a HAR file importable in most HTTP tools
8. **Click "Open Options"** (or via `chrome://extensions` → Details → Extension options) to configure filters and masking
9. Use the **🌙 / ☀️** button and the **language selector** on any dashboard to switch theme / UI language — settings persist across all three pages via `localStorage`

---

### ⚙️ Options Reference

| Setting           | Default                                                                   | Description                                                       |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Network Types** | XHR, Fetch, WebSocket                                                     | Transport types to capture                                        |
| **HTTP Methods**  | All 7                                                                     | Methods to include in capture                                     |
| **URL Filter**    | _(empty)_                                                                 | Regex applied to the full request URL; empty = capture all        |
| **Masking**       | Enabled                                                                   | When on, values of matching keys are replaced with `***MASKED***` |
| **Masking Keys**  | `authorization`, `cookie`, `token`, `password`, `secret`, `client_secret` | Case-insensitive key name list                                    |

---

### ⚠️ Developer Mode Notice

Because this extension is loaded locally via Developer Mode, Chrome may occasionally show a banner: **"Disable developer mode extensions"**. This is a standard Chrome safety prompt and is **not** an indication of any problem with this extension.

- All request processing happens **entirely in your local browser** — no data is sent to any external server
- Click the **✖ (close)** button on the banner or **Cancel** to dismiss it; do **not** click "Disable"

---

### 🛠️ Tech Stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| Language      | TypeScript 6 (strict)                                                 |
| UI Framework  | React 19 + React DOM                                                  |
| Build Tool    | Vite 5 + `@crxjs/vite-plugin` 2                                       |
| Charts        | ECharts 6 + `echarts-for-react` 3                                     |
| Styling       | SCSS + CSS Custom Properties (theme tokens)                           |
| Extension API | Chrome MV3 — `chrome.debugger` (CDP), `chrome.storage`, `chrome.tabs` |
| Code Quality  | ESLint + Prettier + Husky + lint-staged                               |

---

### 📄 License

This project is licensed under the [MIT License](./LICENSE).

<br/>

---

<h2 id="简体中文">简体中文</h2>

**Easy API Collector** 是一个基于 Chrome 扩展（Manifest V3）的开发者与测试人员辅助工具。它通过 **Chrome Debugger API（CDP）** 实时拦截全部网络流量，并通过三个集成界面展示数据：DevTools 面板、全屏实时大屏和可配置的选项页，全部支持**深色/浅色主题切换**和 **10 语言国际化**。

---

### ✨ 功能特性

| 类别              | 说明                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| **抓包**          | 通过 `chrome.debugger` 拦截 XHR、Fetch、WebSocket、Script、Image 等所有 CDP 网络事件类型                    |
| **规则引擎**      | 按 HTTP Method、请求类型、URL 正则过滤，规则立即生效                                                        |
| **隐私脱敏**      | 字段级 Key 掩码——任何 Header 或 JSON 体中键名匹配配置列表的值，在抓包时自动替换为 `***MASKED***`            |
| **HAR 导出**      | 一键导出标准 HAR 1.2 格式文件，可直接导入 Postman、Charles 等工具                                           |
| **JSON 分析导出** | 按照抓包来源页面对 API 路径进行结构化分组，附带请求方法和 Payload 摘要                                      |
| **DevTools 面板** | Chrome DevTools（F12）专属 Tab，含三个 ECharts 图表：状态码饼图、资源类型柱图、延迟散点图                   |
| **实时大屏**      | 通过 Popup 打开的全屏独立看板，展示每个来源页面的方法分布、资源类型图表及完整请求列表                       |
| **选项页**        | 通过 `chrome.storage` 持久化配置——方法/类型白名单、URL 正则过滤、脱敏 Key 管理                              |
| **主题**          | 深色/浅色模式切换，通过 `localStorage`（`eac-theme`）在三个页面间共享持久化                                 |
| **国际化**        | 10 种语言：English · 中文 · 日本語 · 한국어 · Español · Português · Français · Deutsch · Italiano · Русский |
| **手动刷新**      | 看板仅在首次加载和用户点击 Refresh 时获取数据，无自动轮询，彻底避免 SW 重启导致的"数据清空再出现"问题       |

---

### 🏗️ 项目架构

```
easy-api-collector/
├── manifest.json              # MV3 Manifest — debugger, activeTab, storage, tabs
├── background.ts              # Service Worker — NetworkMonitor 类，chrome.debugger CDP
├── popup.html / popup.ts      # 扩展 Popup — 开关监听、下载、打开大屏
├── devtools.html              # DevTools 入口页（注册面板）
├── panel.html                 # DevTools 面板宿主页
├── viewer.html                # 独立实时大屏宿主页
├── options.html               # 选项页宿主页
│
├── src/
│   ├── i18n.ts                # 10 语言 Messages 接口 + getMessages() + LOCALES[]
│   ├── devtools/              # DevTools 面板注册脚本
│   ├── panel/                 # DevTools 面板 React 应用
│   ├── viewer/                # 实时大屏 React 应用
│   └── options/               # 选项页 React 应用
│
├── types/index.ts             # 共享 TypeScript 类型（NetworkRequest、PageData 等）
├── utils/
│   ├── StorageService.ts      # chrome.storage 封装 + AppConfig + DEFAULT_CONFIG
│   ├── MaskingUtils.ts        # Headers 和 JSON 体字段脱敏
│   └── HarExporter.ts        # NetworkRequest[] → HAR 1.2 格式导出
│
└── vite.config.ts             # @crxjs/vite-plugin + react，多入口构建
```

**数据流：**

1. `popup.ts` 发送 `toggleMonitoring` → `background.ts` 调用 `chrome.debugger.attach`
2. Background 监听 CDP 事件，应用配置过滤和脱敏规则后将数据保存到 `chrome.storage.local`
3. Panel / Viewer 发送 `getRequests` → Background 将 `Map` 序列化为普通对象并响应
4. 看板在首次加载和用户手动点击 **刷新** 时更新数据，无定时轮询

---

### 📦 安装与使用

#### 方式 A — 加载已构建的 `dist/`（无需 Node.js）

1. 下载或克隆本仓库
2. 执行 `npm install && npm run build` 生成 `dist/` 目录
3. 打开 `chrome://extensions/`，开启右上角**开发者模式**
4. 点击**加载已解压的扩展程序** → 选择 `dist/` 目录
5. 将扩展固定到浏览器工具栏

#### 方式 B — 开发热更新模式

```bash
git clone https://github.com/your-username/easy-api-collector.git
cd easy-api-collector
npm install
npm run dev   # Vite build --watch，每次保存后自动更新 dist/
```

按方式 A 加载 `dist/`。代码修改后如未自动热重载，在 `chrome://extensions` 页面手动点击 🔄 刷新。

---

### 🚀 使用流程

1. 打开目标网页
2. 点击扩展图标 → 开启**开始监听**
3. 浏览目标站点，请求实时被捕获
4. 打开 F12 → 找到 **Easy API Collector** 面板查看 DevTools 看板
5. 点击 Popup 中的 **"打开大屏"** 进入全屏 Viewer
6. 点击 **"分析并导出 JSON"** 下载结构化 API 路径摘要
7. 点击 **"下载 HAR"** 导出 HAR 文件
8. 通过选项页配置过滤规则与脱敏 Key
9. 任意看板右上角可切换 **🌙 / ☀️ 主题** 和 **语言** — 设置通过 `localStorage` 在三个页面间共享

---

### ⚠️ 开发者模式弹窗说明

由于需要以开发者模式本地加载，Chrome 可能偶尔弹出「请停用以开发者模式运行的扩展程序」提示。本扩展完全开源，所有数据处理均在**浏览器本地**进行，**不会上报任何数据到第三方服务器**。遇到弹窗请直接点击 **✖（关闭）**，不要点"停用"。

---

### 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源，可自由使用、修改和分发，烦请保留原作者版权声明。

<br/>

<div align="center">
  <sub>Made with ❤️ by the Easy API Collector Contributors</sub>
</div>
