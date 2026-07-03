# <div align="center">🧹 B站批量取消订阅</div>

<div align="center">

**一键清理你在 Bilibili「我追的合集/收藏夹」里再也不看的内容**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Browser%20%7C%20ZCode-brightgreen)](#)
[![No Dependency](https://img.shields.io/badge/deps-zero-orange)](#)

**中文** · [English](#english)

</div>

---

## 🎯 这是什么？

B 站没有提供"批量取消订阅追的合集"的功能。这个项目提供**三种方式**帮你一键清理：

| 模式 | 谁适合 | 怎么用 |
|---|---|---|
| 🎨 **可视化 UI** | **99% 的用户** | F12 粘贴一段代码 → 右侧弹出选择器 → 勾选 → 一键清理 |
| ⌨️ **控制台命令** | 喜欢命令行的开发者 | 粘贴脚本，用序号语法 `1,3,5-8` 选择 |
| 🤖 **ZCode Skill** | ZCode 用户 | 直接对话："帮我批量取消 B 站追的合集" |

---

## 🖼️ 效果预览

```
┌─────────────────────────────────┐
│ 🧹 B站批量取消订阅          v1.0.0 [✕]│
├─────────────────────────────────┤
│ 🔍 [搜索名称...        ]  [🔄]  │
│ [全选] [全不选] [反选]           │
├─────────────────────────────────┤
│ 共 42 个 · 已选 5 个             │
├─────────────────────────────────┤
│ ☑ 示例合集 A                     │
│ ☑ 示例合集 B                     │
│ ☐ 学习资料合集                   │
│ ☑ 示例合集 C                     │
│ ...                              │
├─────────────────────────────────┤
│ [📋 导出选中]  [🗑️ 取消订阅]     │
└─────────────────────────────────┘
```

---

## 🚀 快速开始（3 步）

### 方式 1：可视化 UI（推荐）

1. **登录 B 站**，进入 `https://space.bilibili.com/{你的UID}/favlist`
2. **F12** 打开浏览器控制台
3. 复制 [`dist/selector-ui.js`](dist/selector-ui.js) 全部内容，**粘贴到控制台**回车

页面右侧会弹出选择器面板，勾选想删除的项 → 点击「🗑️ 取消订阅」→ 确认。

### 方式 2：控制台命令

同上步骤 1-2，粘贴 [`dist/console.js`](dist/console.js) 后：

```js
biliUnsub.list()                        // 打印所有收藏夹
biliUnsub.run("1,3,5-8")                // 取消序号 1、3、5-8
biliUnsub.run("all", ["技术分享"])       // 除了「技术分享」全删
```

### 方式 3：ZCode Skill

**安装**：把整个 `skills/bilibili-batch-unsubscribe/` 复制到：
- `~/.agents/skills/`（全局）
- 或 `<你的项目>/.agents/skills/`（项目级）

**使用**：在 ZCode 中直接说
```
帮我批量取消 B 站追的合集
```

---

## ✨ 特性

- ✅ **零依赖** — 纯原生 JS，无需安装任何东西
- ✅ **三种交互** — UI 勾选 / 序号命令 / 程序化名单
- ✅ **搜索过滤** — UI 中支持关键词搜索
- ✅ **防误删** — 执行前必须确认，展示完整列表
- ✅ **分批处理** — 每批 15 个，避免触发风控
- ✅ **可拖动面板** — 不遮挡页面内容
- ✅ **失败重试友好** — 单个失败不阻塞后续，最后统一报告
- ✅ **不可逆保护** — 明确区分「我追的合集」与「我创建的收藏夹」

---

## ⚠️ 使用须知

| 项 | 说明 |
|---|---|
| 🔒 **仅本地执行** | 所有代码在你自己的浏览器中运行，不上传任何数据 |
| ⏱️ **有速率限制** | 单次建议 ≤ 100 个，太快会触发 B 站风控 |
| 🚫 **不可撤销** | 取消订阅后需要重新手动搜索并追合集 |
| 🎯 **只处理"追的合集"** | **不会碰**你自己创建的收藏夹 |
| 🌐 **需要登录态** | 必须先登录 B 站账号 |

---

## 🛠️ 项目结构

```
bilibili-batch-unsubscribe/
├── skills/
│   └── bilibili-batch-unsubscribe/    # ZCode Skill 主体
│       ├── SKILL.md                    # Skill 定义
│       ├── scripts/
│       │   ├── injectable-ui.js        # 可视化 UI（模式 A）
│       │   ├── console-interactive.js  # 控制台交互（模式 B）
│       │   └── batch-unsubscribe.js    # 程序化 API（模式 C）
│       └── references/
│           └── selectors.md            # DOM 选择器备忘
├── dist/                               # 面向普通用户的即用产物
│   ├── selector-ui.js                  # = injectable-ui.js
│   └── console.js                      # = console-interactive.js
├── docs/
├── package.json                        # ZCode Plugin manifest
├── LICENSE
├── CHANGELOG.md
└── README.md
```

---

## 🤝 贡献

欢迎提 Issue 和 PR！特别欢迎：

- B 站前端更新后的选择器修复
- 更多语言的 README 翻译
- UI 改进建议
- 其他 B 站批量操作的扩展（批量删除收藏视频、批量取消关注等）

---

## 📜 License

[MIT](LICENSE) © 2026

**免责声明**：本工具仅用于帮助用户管理自己的账号数据，请合理使用。因使用本工具产生的任何账号问题由使用者自行承担。作者不对任何数据丢失或账号异常负责。

---

<a id="english"></a>

## English

**Bulk-unsubscribe your Bilibili followed collections in one click.**

Bilibili doesn't provide a batch-unsubscribe feature for "followed collections". This tool provides three ways:

- **Visual UI**: paste a script to F12, get a checkbox panel on the right
- **Console commands**: interactive selection by index range like `1,3,5-8`
- **ZCode Skill**: talk to your AI assistant in natural language

### Quick Start

1. Log into `https://space.bilibili.com/{YOUR_UID}/favlist`
2. Open F12 DevTools → Console
3. Copy [`dist/selector-ui.js`](dist/selector-ui.js), paste, and press Enter
4. Use the floating panel on the right to select and unsubscribe

### License

MIT. See [LICENSE](LICENSE).

---

<div align="center">
Made with ❤️ · Star ⭐ if this helped you
</div>
