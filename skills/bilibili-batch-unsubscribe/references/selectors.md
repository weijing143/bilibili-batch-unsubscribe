# B 站 favlist 页面 DOM 结构备忘

> 基于 2025 年 B 站前端版本整理。如果 B 站前端更新导致选择器失效，先在浏览器 F12 里重新确认这些节点。

## 页面地址
```
https://space.bilibili.com/{UID}/favlist
```

## 关键选择器

| 用途 | 选择器 | 说明 |
|---|---|---|
| 收藏夹侧边栏容器 | `.fav-sidebar` | 左侧「我追的合集/收藏夹」整块 |
| 单个收藏夹项 | `.fav-sidebar-item` | 每一项，包含 `title` 属性 |
| 通过标题精准定位 | `.fav-sidebar-item[title="收藏夹名"]` | 首选定位方式 |
| 「显示剩余 N 个」按钮 | `.fav-collapse-more` | 首次进入需点击展开 |
| 「更多」按钮（三点/竖点） | `.fav-sidebar-item .more-vertical` | 悬停后才可见 |
| 弹出菜单容器 | `.menu-popover__panel-item` | 新版 |
| 弹出菜单容器（备选） | `.vui_popover-content`, `.vui_popover` | 部分账号仍是老版 |
| 弹出菜单项 | 上述容器下的子元素 | 通过 `textContent === '取消订阅'` 匹配 |

## 触发菜单的完整交互序列

```
1. scrollIntoView({block:'center'})    ← 保证元素在视野内
2. mouseenter + mouseover              ← 触发 hover 状态显示「更多」按钮
3. .more-vertical.click()              ← 打开菜单
4. 遍历 .menu-popover__panel-item      ← 找 textContent="取消订阅"
5. 点击该菜单项                          ← 触发取消订阅 API
```

## 常见坑

1. **`.more-vertical` 悬停失败**：B 站用 CSS `:hover` 控制显示，Playwright/纯 JS 的 `mouseenter` 事件有时无法触发 CSS 伪类。补救办法：
   - 直接给按钮加 style：`moreBtn.style.display = 'inline-block'`
   - 或直接 `.click()`（很多情况下即使 `display:none` 事件也能触发）

2. **菜单选择器版本差异**：不同用户看到的可能是 `.menu-popover__panel-item` 或 `.vui_popover-content`，脚本里两个都要试。

3. **`title` 属性含特殊字符**：使用 `CSS.escape(title)` 而不是直接字符串拼接，避免包含引号、括号的标题引起选择器语法错误。

4. **合集 vs 收藏夹**：
   - 「我追的合集」——本 skill 处理的目标，操作是「取消订阅」
   - 「我创建的收藏夹」——**不要处理**，那是用户自己的收藏夹，操作叫「删除」，误操作会真删数据

5. **API 频率限制**：连续操作超过 ~20 次可能触发风控，接口返回错误但前端不提示。建议：
   - 单批 ≤ 15
   - 每批间隔 3-5 秒
   - 每次操作间隔 ≥ 600ms

## 如何快速验证选择器是否还有效

在 F12 控制台执行：
```js
// 应返回 > 0
document.querySelectorAll('.fav-sidebar-item').length

// 悬停一个项目后应能拿到
document.querySelector('.fav-sidebar-item .more-vertical')

// 点击更多后应能拿到
document.querySelectorAll('.menu-popover__panel-item, .vui_popover-content')
  .forEach(e => console.log(e.textContent))
```
