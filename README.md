<div align="center">
  <h1>🚀 Easy API Collector</h1>
  <p>A powerful and easy-to-use Chrome extension for API packet capture and real-time analysis / 一个强大且易用的 Chrome 浏览器 API 抓包与实时分析插件</p>
  <p>
    <a href="#english">English</a> | <a href="#简体中文">简体中文</a>
  </p>
</div>

<br />

---

<h2 id="english">English</h2>

**Easy API Collector** is a developer and tester assistant tool built on the core capabilities of Chrome extensions. It provides real-time network request monitoring, regular expression filtering, sensitive field desensitization, and a visual dashboard driven by ECharts. Whether you are a developer troubleshooting frontend issues or a tester needing to export API data, it provides immense convenience.

### ✨ Core Features

- 🔍 **Comprehensive Real-time Capture**: Seamlessly monitors and captures all network requests (XHR, Fetch, Script, Image, etc.).
- 🎨 **Multi-dimensional Visual Dashboard**:
  - **DevTools Advanced Panel**: Features an exclusive Tab in the F12 Developer Tools, supporting in-depth analysis such as status code distribution, resource categories, and response latency scatter plots.
  - **Viewer Standalone Dashboard**: Provides a real-time request monitoring dashboard and charts for regular users or non-developers.
- ⚙️ **Flexible Rule Engine**: Supports filtering by HTTP Method, request type, and powerful regular expressions to precisely target the APIs you need to capture.
- 🔒 **Privacy & Masking Protection**: Built-in Keys masking feature. Once enabled, it automatically replaces sensitive Headers or fields like Authorization and Token to prevent data leaks.
- ⚡ **Modern Tech Stack**: Built with React 18 + Vite v5 + ECharts + SCSS, offering rapid hot module replacement and excellent performance.

---

### 📦 Installation and Local Usage Guide (For Regular Users)

To easily use this tool without any development experience, follow these simple steps:

1. **Get the Source Code / Build Package**:
   - Download the latest build ZIP file (e.g., `easy-api-collector-dist.zip`) from the [Releases page](#) on GitHub, or clone this repository and run `npm run build` locally to generate the `dist` directory.
2. **Open Extension Management**:
   - Open your Chrome browser, type `chrome://extensions/` in the address bar, and press Enter.
3. **Enable Developer Mode**:
   - Find and **turn on the "Developer mode"** toggle in the top right corner of the page.
4. **Load the Extension**:
   - Click the **"Load unpacked"** button in the top left corner.
   - Select the folder you just downloaded and extracted (Note: It must be the directory containing `manifest.json`, usually the `dist/` directory).
5. **Start Using**:
   - Once installed successfully, you can pin Easy API Collector to your browser's extension bar.
   - Open the F12 Developer Tools on any web page and locate the `Easy API Collector` panel; or click the extension icon to open the standalone Viewer dashboard.

---

### ⚠️ Developer Mode Pop-up Disclaimer & Prompts

Since this extension currently needs to be loaded locally via **Developer Mode**, the Chrome browser may occasionally (e.g., upon browser restart) prompt a safety warning: **"Disable developer mode extensions"**.

- **This is Normal**: Chrome uses this pop-up to casually prevent malicious scripts from lurking in developer mode without the user's knowledge.
- **Disclaimer**: This extension is entirely open-source, and all code and request data processing happen **locally in your browser**. **It will NOT report or collect any of your private data to any third-party servers**.
- **Action Prompt**: When you see this pop-up, simply click the **"✖️ (Close)"** button in the top right corner or select **"Cancel"** to keep the extension running. Do not click disable.

---

### 🛠️ Local Development & Contribution

We welcome developers to join this open-source project, submit Issues, or Pull Requests! Here is the local development guide:

#### 1. Environment Preparation

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed in your local environment.

#### 2. Clone the Project & Install Dependencies

```bash
git clone https://github.com/your-username/easy-api-collector.git
cd easy-api-collector
npm install
```

#### 3. Start Locally (Hot Reload Development)

```bash
npm run dev
```

This command starts Vite's watch mode, enabling Hot Module Replacement (HMR) for Chrome extensions via `@crxjs/vite-plugin`.

- The `dist` directory will be generated after startup.
- Follow the [Installation Guide] above to load the `dist` directory into Chrome's Developer Mode.
- After that, modifying code under `src/` will usually auto-reload the extension (if it fails to apply, click the 🔄 refresh button for the extension on the `chrome://extensions` page).

#### 4. Production Build

```bash
npm run build
```

When submitting a PR or preparing a new release, make sure to use the build command to package the final compressed and optimized output.

---

<br />

<h2 id="简体中文">简体中文</h2>

**Easy API Collector** 是一个基于 Chrome 扩展核心能力构建的开发者与测试人员辅助工具。它提供了实时的网络请求监听、正则过滤、敏感字段脱敏以及通过 ECharts 驱动的可视化大屏。无论你是排查前端问题的开发者，还是需要导出 API 数据的测试人员，它都能为你提供极大的便利。

### ✨ 核心特性

- 🔍 **全方位实时抓包**：无缝监听并捕获所有网络请求（XHR、Fetch、Script、Image等）。
- 🎨 **多维可视化看板**：
  - **DevTools 高级面板**：在 F12 开发者工具中拥有专属 Tab，支持状态码分布、资源类别、响应延迟散点图等深度分析。
  - **Viewer 独立大屏**：提供给普通用户或非开发者使用的实时请求监控看板与图表。
- ⚙️ **灵活的规则引擎**：支持按 HTTP Method、请求类型（Type）以及强大的正则表达式过滤，精准命中你需要捕获的接口。
- 🔒 **隐私与脱敏防护**：内置 Keys 掩码脱敏功能，开启后可自动替换 Authorization、Token 等敏感 Header 或字段，防止数据泄露。
- ⚡ **现代技术栈底座**：基于 React 18 + Vite v5 + ECharts + SCSS，热更新飞快，性能优异。

---

### 📦 安装与本地使用指南（适合普通用户）

为了让没有任何开发经验的用户也能轻松使用，请遵循以下简单步骤：

1. **获取源码/构建包**：
   - 在 Github 的 [Releases 页面](#) 下载最新的构建产物压缩包（例如 `easy-api-collector-dist.zip`），或者直接克隆本仓库并在本地执行一次 `npm run build` 生成 `dist` 目录。
2. **打开扩展管理**：
   - 打开 Chrome 浏览器，在地址栏输入 `chrome://extensions/` 并回车。
3. **开启开发者模式**：
   - 在页面右上角，找到并**开启「开发者模式」**开关。
4. **加载扩展程序**：
   - 点击左上角的 **「加载已解压的扩展程序」**（Load unpacked）按钮。
   - 选择你刚刚下载并解压的文件夹（注意：必须是包含 `manifest.json` 的那个目录，通常是 `dist/` 目录）。
5. **开始使用**：
   - 安装成功后，你可以在浏览器右上角插件栏固定 Easy API Collector。
   - 在任意网页打开 F12 开发者工具，找到 `Easy API Collector` 面板；或者点击插件图标打开独立的大屏界面。

---

### ⚠️ 开发者模式弹窗免责与操作提示

由于本插件目前需要通过**开发者模式**在本地加载运行，Chrome 浏览器在某些情况下（如重启浏览器时）可能会弹出一个安全提示：**“请停用以开发者模式运行的扩展程序”**。

- **这是正常现象**：Chrome 旨在通过此弹窗防止恶意恶意脚本在用户不知情的情况下以开发者模式潜伏。
- **免责声明**：本插件完全开源，所有的代码与请求数据处理均在您的**浏览器本地**进行，**不会上报或收集任何您的隐私数据到任何第三方服务器**。
- **操作提示**：遇到此弹窗时，为了保证插件继续运行，请放心点击右上角的 **「✖️（关闭）」** 或选择 **「取消」** 即可，不要点击“停用”。

---

### 🛠️ 本地开发与参与贡献

我们非常欢迎开发者参与到这个开源项目中来，提交 Issue 或 Pull Request！以下是本地开发指南：

#### 1. 环境准备

确保你的本地环境已经安装了 [Node.js](https://nodejs.org/) (推荐 v18+)。

#### 2. 克隆项目与安装依赖

```bash
git clone https://github.com/your-username/easy-api-collector.git
cd easy-api-collector
npm install
```

#### 3. 本地启动（热更新开发）

```bash
npm run dev
```

此命令会启动 Vite 的 watch 模式，通过 `@crxjs/vite-plugin` 实现 Chrome 扩展的热更新。

- 启动后会生成 `dist` 目录。
- 按照上方【安装指南】将 `dist` 目录加载到 Chrome 的开发者模式中。
- 此后你修改 `src/` 下的代码，插件大多支持自动热重载（如果不生效，可在 `chrome://extensions` 页面点击该扩展的 🔄 刷新按钮）。

#### 4. 生产环境构建

```bash
npm run build
```

在提交 PR 或者准备发布新版本时，请确保使用 build 命令打包出最终压缩与优化的产物。

---

## 📄 License / 开源协议

This project is licensed under the [MIT License](./LICENSE). / 本项目基于 [MIT License](./LICENSE) 开源。

You are free to use, modify, and distribute this project's code, but please retain the original author's copyright notice. / 这意味着你可以自由地使用、修改和分发本项目的代码，但烦请保留原作者的版权声明信息。

<br />

<div align="center">
  <sub>Made with ❤️ by the Easy API Collector Contributors</sub>
</div>
