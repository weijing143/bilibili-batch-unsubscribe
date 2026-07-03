# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 规范。

## [1.0.1] - 2026-07-03

### 修复
- 🐛 `bilibiliExpandAll()` 现在循环最多 15 次点击「显示剩余N个」，确保合集超过一页时能全部展开（之前只点一次）
- 🐛 菜单搜索添加 `offsetParent` 过滤，防止误点 B 站 DOM 历史堆积的隐藏菜单项
- 🐛 菜单未找到时自动 `document.body.click()` 关闭菜单，避免菜单堆积

## [1.0.0] - 2026-07-03

### 新增
- 🎨 **可视化 UI 选择器** (`injectable-ui.js`) — 页面右侧浮层面板，支持搜索、全选、反选、拖动
- ⌨️ **控制台交互式命令** (`console-interactive.js`) — 序号范围语法 `1,3,5-8`，支持白名单模式
- 🤖 **核心批量 API** (`batch-unsubscribe.js`) — 供 Playwright MCP / 程序化调用
- 📄 **ZCode Skill 定义** (`SKILL.md`) — 三种模式统一入口
- 📚 **DOM 选择器参考** (`references/selectors.md`) — B 站前端结构备忘

### 设计决策
- **不加并行**：单账号并发会触发风控，实际速度瓶颈在服务端而非本地
- **默认 700ms 间隔**：接近正常用户点击节奏，避免风控
- **每 15 个冷却 3s**：让 B 站限流窗口自然刷新
- **执行前强制确认**：不可逆操作必须二次确认，展示完整列表
- **兜底选择器**：同时支持 `.menu-popover__panel-item` 和老版 `.vui_popover-content`

### 已知限制
- 需要用户已登录 B 站账号（不自动处理登录，涉及扫码/短信验证）
- 单次建议 ≤ 100 个，太多会触发风控
- 不处理「我创建的收藏夹」——只处理「我追的合集」，避免误删

[1.0.1]: https://github.com/weijing143/bilibili-batch-unsubscribe/releases/tag/v1.0.1
[1.0.0]: https://github.com/weijing143/bilibili-batch-unsubscribe/releases/tag/v1.0.0
