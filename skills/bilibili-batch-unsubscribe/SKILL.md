---
name: bilibili-batch-unsubscribe
description: 批量取消 B站（哔哩哔哩 bilibili）追的合集/收藏夹订阅，提供三种交互方式：页面注入式 UI 选择器（用户勾选）、控制台序号选择、程序化名单（黑名单/白名单）。当用户提到「批量取消 B 站收藏/订阅」、「清理 bilibili 追的合集」、「space.bilibili.com/favlist 批量处理」、「一键清理 B 站关注的合集」，或希望自动化操作 B 站个人空间收藏页时使用。同时支持 Playwright MCP 自动化和纯浏览器控制台两种执行方式。
---

# B站批量取消订阅 Skill

自动化清理 `space.bilibili.com/{UID}/favlist`「我追的合集/收藏夹」区块。

## 三种模式，按用户偏好选择

在开始前**先问用户想用哪种模式**（除非用户已经明确说了）：

| 模式 | 用户体验 | 何时用 |
|---|---|---|
| 🎨 **模式 A：注入式 UI 选择器** | 弹出浮层，勾选复选框，一键执行 | 用户想**可视化选择**、不确定要删哪些、要现场对照决定 |
| ⌨️ **模式 B：控制台序号交互** | 打印带序号列表，用户输入 `1,3,5-8` | 熟悉命令行、想快速批量选序号 |
| 📝 **模式 C：程序化名单** | 直接传 `deleteList` 或 `keepList` 数组 | 用户已经想好要删的名字、要重复执行的自动化任务 |

**推荐**：不清楚时优先推 **模式 A**，最直观。

## 每种模式的执行流程

### 模式 A：注入式 UI 选择器

告诉用户以下步骤（可以直接给出以下文字）：

```
1. 打开 https://space.bilibili.com/{你的UID}/favlist 并登录
2. F12 打开控制台
3. 复制 scripts/injectable-ui.js 全部内容，粘贴到控制台，回车
4. 页面右侧会弹出选择器，勾选想取消订阅的项
5. 点「🗑️ 取消订阅」，确认后自动执行
```

**你需要做的**：`Read` 出 `scripts/injectable-ui.js`，一次性把完整内容展示给用户（放在 ```js 代码块里），并附上以上使用步骤。

### 模式 B：控制台序号交互

同上但换脚本为 `scripts/console-interactive.js`。粘贴后：

- `biliUnsub.list()` — 打印表格
- `biliUnsub.run("1,3,5-8")` — 按序号执行
- `biliUnsub.run("all", ["要保留A","要保留B"])` — 白名单模式

### 模式 C：程序化名单（Playwright MCP 全自动）

这条路径适合 ZCode 自动化，走 Playwright MCP：

#### 步骤 1：打开页面并确保已登录
```
mcp__plugin_playwright_playwright__browser_navigate → https://space.bilibili.com/{UID}/favlist
```
如果跳转到登录页，**停下来告诉用户去手动登录**，等待用户确认再继续。B 站登录涉及扫码/手机验证码，不要试图自动登录。

#### 步骤 2：展开「显示剩余 N 个」
用 `browser_evaluate` 执行：
```js
() => { const b = document.querySelector('.fav-collapse-more'); if (b) b.click(); return !!b; }
```
等待 2 秒。

#### 步骤 3：导出当前所有收藏夹标题（**必做**）
```js
() => Array.from(document.querySelectorAll('.fav-sidebar-item'))
  .map((e, i) => ({ index: i, title: e.getAttribute('title') }))
```
把结果展示给用户对照确认——这一步能防止误删。

#### 步骤 4：计算最终要删除的名单
- 用户给的是 `deleteList` → 直接用
- 用户给的是 `keepList` → `finalDeleteList = allTitles - keepList`
- **删除前把最终名单打给用户看，明确得到"确认执行"回复后再动手**。不可逆操作。

#### 步骤 5：分批执行
`Read` 出 `scripts/batch-unsubscribe.js`，通过 `browser_evaluate` 加载函数，然后调用：
```js
await bilibiliBatchUnsubscribe(deleteList, {
  delayBetween: 700,
  hoverDelay: 300,
  clickDelay: 400,
});
```

分批规则：每批 ≤ 15 个，每次 600-800ms 间隔，每批之间 3-5 秒冷却。

#### 步骤 6：验证与收尾
重新执行步骤 3 导出当前列表，对比确认删除项已消失。输出最终报告。

## 关键 DOM 选择器

详见 `references/selectors.md`。核心：
- `.fav-sidebar-item[title="XXX"]` — 单个收藏夹项
- `.fav-sidebar-item .more-vertical` — 悬停后出现的「更多」按钮
- `.menu-popover__panel-item` / `.vui_popover-content` — 弹出菜单

⚠️ B 站前端可能更新，如果脚本失效先检查这些选择器。

## 安全与稳健性

| 情况 | 处理 |
|---|---|
| 用户没提供 UID（模式 C） | 停下来问 |
| 用户给的是模糊描述（如"删掉音乐类的"） | **不要自作主张匹配**，导出所有标题让用户逐一确认，或推荐模式 A 让用户可视化勾选 |
| 一次要删 > 30 个 | 主动提示"数量较多，建议分 2-3 批" |
| 某个标题匹配不到 | 记为 `[SKIP]`，继续后面的，最后统一汇报 |
| 悬停/点击失败超过 3 个 | 停下来，可能选择器变了，让用户 F12 检查并反馈 |
| 用户想撤回 | 明确告知**取消订阅是不可逆的**，只能重新手动追一次 |
| 用户问「能并行吗」 | 不建议。单账号并发触发风控，见 CHANGELOG 中的说明 |

## 输出格式

模式 C 每批执行完毕后给用户结构化报告：

```
📊 第 1/3 批处理完成
✅ 成功 (12):
   - 示例合集 A
   - 示例合集 B
   ...
❌ 失败 (1):
   - "XXX合集"（原因：更多按钮不可见）

⏳ 3 秒后开始第 2 批...
```

模式 A/B 由脚本自身在 UI/控制台输出。

## 目录内容

```
bilibili-batch-unsubscribe/
├── SKILL.md
├── scripts/
│   ├── injectable-ui.js          # 模式 A：页面浮层选择器
│   ├── console-interactive.js    # 模式 B：控制台序号交互
│   └── batch-unsubscribe.js      # 模式 C：程序化 API（Playwright/浏览器通用）
└── references/
    └── selectors.md              # DOM 选择器备忘
```
