# Privacy Policy — X 垃圾评论过滤器 / X Spam Comment Filter

**Last updated: 2026-05-04**

---

## 中文

### 数据收集

本扩展**不收集、不存储、不传输任何用户数据**。

### 数据使用

- 扩展仅在浏览器本地运行，所有处理均在你的设备上完成。
- 用户自定义设置（白名单、黑名单、自定义规则、统计数据）仅存储在本地浏览器的 `chrome.storage.local` 中，不会同步到任何外部服务器。
- 扩展不会访问、读取或记录你的账号信息、浏览历史或任何个人信息。

### 网络请求

- 扩展会在用户主动点击「拉黑」按钮时，通过 X（Twitter）已登录的会话调用 X 的内部 API（`blocks/create.json`）执行拉黑操作。此请求直接发送至 X 服务器，扩展本身不参与传输、不记录任何请求内容。
- 扩展不向任何第三方服务发送数据。

### 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 在本地保存用户设置和统计数据 |
| `activeTab` | 在当前 X 页面执行过滤逻辑 |
| `scripting` | 注入内容脚本以扫描评论 |
| `host_permissions` (x.com, twitter.com) | 仅在 X 页面上运行 |

### 联系

如有隐私相关问题，请通过 [GitHub Issues](https://github.com/frankwang/x-comment-filter-extension/issues) 联系。

---

## English

### Data Collection

This extension **does not collect, store, or transmit any user data**.

### Data Usage

- The extension runs entirely in your browser. All processing happens locally on your device.
- User preferences (whitelist, blacklist, custom rules, and statistics) are stored only in your browser's local storage (`chrome.storage.local`) and are never sent to any external server.
- The extension does not access, read, or record your account credentials, browsing history, or any personal information.

### Network Requests

- When you explicitly click the "Block" button, the extension calls X's internal API (`blocks/create.json`) using your existing logged-in X session to perform the block action. This request goes directly to X's servers. The extension itself does not intercept, log, or relay any request content.
- The extension sends no data to any third-party service.

### Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings and statistics locally |
| `activeTab` | Run filtering logic on the current X page |
| `scripting` | Inject content scripts to scan comments |
| `host_permissions` (x.com, twitter.com) | Operate only on X pages |

### Contact

For privacy-related questions, please open an issue on [GitHub](https://github.com/frankwang/x-comment-filter-extension/issues).
