// ============================================================
// B 站批量取消订阅 · 页面注入式 UI 选择器
// ------------------------------------------------------------
//   使用方式：
//   1. 打开 https://space.bilibili.com/{你的UID}/favlist
//   2. F12 打开控制台，粘贴本文件全部内容，回车
//   3. 页面右侧会弹出选择器，勾选要取消订阅的项，点「批量取消订阅」
// ============================================================

(function () {
  'use strict';

  // ========== 防止重复注入 ==========
  if (window.__bilibiliUnsubUIInstalled) {
    document.getElementById('bili-unsub-panel')?.remove();
  }
  window.__bilibiliUnsubUIInstalled = true;

  // ========== 常量 ==========
  const PANEL_ID = 'bili-unsub-panel';
  const STYLE_ID = 'bili-unsub-style';
  const VERSION = '1.0.0';

  // ========== 样式 ==========
  const CSS = `
  #${PANEL_ID} {
    position: fixed; top: 20px; right: 20px;
    width: 380px; max-height: calc(100vh - 40px);
    background: #fff; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,.18);
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 13px; z-index: 999999;
    display: flex; flex-direction: column;
    border: 1px solid #e5e7eb;
  }
  #${PANEL_ID} * { box-sizing: border-box; }
  #${PANEL_ID} .bu-header {
    padding: 12px 16px; background: linear-gradient(90deg,#00a1d6,#00b5e5);
    color: #fff; border-radius: 12px 12px 0 0;
    display: flex; align-items: center; justify-content: space-between;
    cursor: move; user-select: none;
  }
  #${PANEL_ID} .bu-title { font-weight: 600; font-size: 14px; }
  #${PANEL_ID} .bu-version { font-size: 11px; opacity: .8; margin-left: 6px; }
  #${PANEL_ID} .bu-close {
    background: rgba(255,255,255,.2); border: 0; color: #fff;
    width: 22px; height: 22px; border-radius: 50%;
    cursor: pointer; font-size: 14px; line-height: 1;
  }
  #${PANEL_ID} .bu-close:hover { background: rgba(255,255,255,.35); }
  #${PANEL_ID} .bu-toolbar {
    padding: 10px 16px; border-bottom: 1px solid #f0f0f0;
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }
  #${PANEL_ID} .bu-search {
    flex: 1; min-width: 120px;
    padding: 6px 10px; border: 1px solid #d1d5db;
    border-radius: 6px; font-size: 12px; outline: none;
  }
  #${PANEL_ID} .bu-search:focus { border-color: #00a1d6; }
  #${PANEL_ID} .bu-btn {
    padding: 6px 10px; border: 1px solid #d1d5db;
    background: #fff; border-radius: 6px; cursor: pointer;
    font-size: 12px; color: #374151; white-space: nowrap;
  }
  #${PANEL_ID} .bu-btn:hover { background: #f9fafb; border-color: #00a1d6; }
  #${PANEL_ID} .bu-btn-primary {
    background: #00a1d6; color: #fff; border-color: #00a1d6;
  }
  #${PANEL_ID} .bu-btn-primary:hover { background: #0090c0; }
  #${PANEL_ID} .bu-btn-danger {
    background: #ef4444; color: #fff; border-color: #ef4444;
  }
  #${PANEL_ID} .bu-btn-danger:hover { background: #dc2626; }
  #${PANEL_ID} .bu-btn:disabled {
    opacity: .5; cursor: not-allowed;
  }
  #${PANEL_ID} .bu-stats {
    padding: 8px 16px; background: #f9fafb;
    font-size: 12px; color: #6b7280;
    display: flex; justify-content: space-between;
  }
  #${PANEL_ID} .bu-stats b { color: #00a1d6; }
  #${PANEL_ID} .bu-list {
    flex: 1; overflow-y: auto; max-height: 50vh;
    padding: 4px 0;
  }
  #${PANEL_ID} .bu-item {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 16px; cursor: pointer;
    border-left: 3px solid transparent;
    transition: background .15s;
  }
  #${PANEL_ID} .bu-item:hover { background: #f3f4f6; }
  #${PANEL_ID} .bu-item.selected {
    background: #fef2f2; border-left-color: #ef4444;
  }
  #${PANEL_ID} .bu-item input { cursor: pointer; flex-shrink: 0; }
  #${PANEL_ID} .bu-item-title {
    flex: 1; overflow: hidden; text-overflow: ellipsis;
    white-space: nowrap; color: #111827;
  }
  #${PANEL_ID} .bu-footer {
    padding: 12px 16px; border-top: 1px solid #f0f0f0;
    display: flex; gap: 8px;
  }
  #${PANEL_ID} .bu-footer .bu-btn { flex: 1; padding: 8px; }
  #${PANEL_ID} .bu-progress {
    padding: 10px 16px; background: #fffbeb;
    border-top: 1px solid #fde68a; font-size: 12px;
    color: #92400e; display: none;
  }
  #${PANEL_ID} .bu-progress-bar {
    height: 6px; background: #fde68a; border-radius: 3px;
    overflow: hidden; margin-top: 6px;
  }
  #${PANEL_ID} .bu-progress-fill {
    height: 100%; background: #f59e0b; width: 0;
    transition: width .3s;
  }
  #${PANEL_ID} .bu-log {
    max-height: 140px; overflow-y: auto;
    background: #1f2937; color: #d1d5db;
    padding: 8px 16px; font-family: monospace;
    font-size: 11px; display: none; border-radius: 0 0 12px 12px;
  }
  #${PANEL_ID} .bu-log-ok { color: #34d399; }
  #${PANEL_ID} .bu-log-fail { color: #f87171; }
  #${PANEL_ID} .bu-log-skip { color: #fbbf24; }
  #${PANEL_ID} .bu-empty {
    padding: 40px 16px; text-align: center; color: #9ca3af;
  }
  `;

  // ========== 注入样式 ==========
  document.getElementById(STYLE_ID)?.remove();
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ========== 工具函数 ==========
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function collectFavorites() {
    const items = $$('.fav-sidebar-item');
    return items.map((el, i) => ({
      index: i,
      title: el.getAttribute('title') || el.textContent?.trim() || `未命名-${i}`,
      element: el,
    }));
  }

  async function expandAll() {
    const btn = $('.fav-collapse-more');
    if (btn) {
      btn.click();
      await sleep(1500);
      return true;
    }
    return false;
  }

  // ========== 核心：单个取消订阅 ==========
  async function unsubscribeOne(item, opts) {
    const { hoverDelay = 300, clickDelay = 400 } = opts;
    const el = item.element;

    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    await sleep(150);

    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(hoverDelay);

    const moreBtn = el.querySelector('.more-vertical');
    if (!moreBtn) return { ok: false, reason: '无更多按钮' };

    moreBtn.click();
    await sleep(clickDelay);

    const selectors = [
      '.menu-popover__panel-item',
      '.vui_popover-content',
      '.vui_popover',
      '.bili-popover__content .item',
    ];
    for (const sel of selectors) {
      const menuItems = $$(sel);
      for (const mi of menuItems) {
        const text = mi.textContent?.trim() ?? '';
        if (text === '取消订阅' || text.includes('取消订阅')) {
          mi.click();
          return { ok: true };
        }
      }
    }
    return { ok: false, reason: '未找到「取消订阅」菜单' };
  }

  // ========== 批量执行 ==========
  async function runBatch(selectedItems, opts, onProgress) {
    const {
      delayBetween = 700,
      batchSize = 15,
      batchCooldown = 3000,
    } = opts;
    const success = [];
    const failed = [];

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      onProgress({ current: i + 1, total: selectedItems.length, item: item.title, phase: 'processing' });
      try {
        const r = await unsubscribeOne(item, opts);
        if (r.ok) {
          success.push(item.title);
          onProgress({ current: i + 1, total: selectedItems.length, item: item.title, phase: 'ok' });
        } else {
          failed.push({ title: item.title, reason: r.reason });
          onProgress({ current: i + 1, total: selectedItems.length, item: item.title, phase: 'fail', reason: r.reason });
        }
      } catch (e) {
        failed.push({ title: item.title, reason: e.message || String(e) });
        onProgress({ current: i + 1, total: selectedItems.length, item: item.title, phase: 'fail', reason: e.message });
      }

      const isBatchEnd = (i + 1) % batchSize === 0 && i + 1 < selectedItems.length;
      if (isBatchEnd) {
        onProgress({ current: i + 1, total: selectedItems.length, phase: 'cooldown' });
        await sleep(batchCooldown);
      } else {
        await sleep(delayBetween);
      }
    }

    return { success, failed };
  }

  // ========== UI 构建 ==========
  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="bu-header">
        <div>
          <span class="bu-title">🧹 B站批量取消订阅</span>
          <span class="bu-version">v${VERSION}</span>
        </div>
        <button class="bu-close" title="关闭">✕</button>
      </div>
      <div class="bu-toolbar">
        <input class="bu-search" placeholder="🔍 搜索名称..." />
        <button class="bu-btn" data-action="refresh" title="重新扫描">🔄</button>
      </div>
      <div class="bu-toolbar" style="border-top:0;padding-top:0;">
        <button class="bu-btn" data-action="select-all">全选</button>
        <button class="bu-btn" data-action="select-none">全不选</button>
        <button class="bu-btn" data-action="invert">反选</button>
      </div>
      <div class="bu-stats">
        <span>共 <b class="bu-total">0</b> 个</span>
        <span>已选 <b class="bu-selected">0</b> 个</span>
      </div>
      <div class="bu-list"></div>
      <div class="bu-progress">
        <div class="bu-progress-text">准备中...</div>
        <div class="bu-progress-bar"><div class="bu-progress-fill"></div></div>
      </div>
      <div class="bu-log"></div>
      <div class="bu-footer">
        <button class="bu-btn" data-action="export">📋 导出选中</button>
        <button class="bu-btn bu-btn-danger" data-action="run">🗑️ 取消订阅</button>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  // ========== 拖拽 ==========
  function makeDraggable(panel) {
    const header = $('.bu-header', panel);
    let sx = 0, sy = 0, px = 0, py = 0, dragging = false;
    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('bu-close')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      const rect = panel.getBoundingClientRect();
      px = rect.left; py = rect.top;
      panel.style.right = 'auto';
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = (px + e.clientX - sx) + 'px';
      panel.style.top = (py + e.clientY - sy) + 'px';
    });
    document.addEventListener('mouseup', () => (dragging = false));
  }

  // ========== 状态管理 ==========
  const state = {
    favorites: [],       // 全部收藏夹
    selectedIds: new Set(), // 选中的 index
    filter: '',
    running: false,
  };

  // ========== 渲染 ==========
  function render(panel) {
    const list = $('.bu-list', panel);
    const filtered = state.favorites.filter((f) =>
      !state.filter || f.title.toLowerCase().includes(state.filter.toLowerCase())
    );

    if (state.favorites.length === 0) {
      list.innerHTML = `<div class="bu-empty">
        未检测到收藏夹项目。<br>请先点击页面「显示剩余N个」展开列表。<br>
        <button class="bu-btn" style="margin-top:12px" data-action="expand">尝试自动展开</button>
      </div>`;
    } else if (filtered.length === 0) {
      list.innerHTML = `<div class="bu-empty">未找到匹配「${state.filter}」的项目</div>`;
    } else {
      list.innerHTML = filtered.map((f) => `
        <label class="bu-item ${state.selectedIds.has(f.index) ? 'selected' : ''}" data-index="${f.index}">
          <input type="checkbox" ${state.selectedIds.has(f.index) ? 'checked' : ''} />
          <span class="bu-item-title" title="${escapeHtml(f.title)}">${escapeHtml(f.title)}</span>
        </label>
      `).join('');
    }

    $('.bu-total', panel).textContent = state.favorites.length;
    $('.bu-selected', panel).textContent = state.selectedIds.size;
    $('[data-action="run"]', panel).disabled = state.running || state.selectedIds.size === 0;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // ========== 日志 ==========
  function log(panel, text, type = '') {
    const box = $('.bu-log', panel);
    box.style.display = 'block';
    const line = document.createElement('div');
    line.className = `bu-log-${type}`;
    line.textContent = text;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }

  // ========== 事件绑定 ==========
  function bindEvents(panel) {
    panel.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) {
        // 单个 item 点击
        const item = e.target.closest('.bu-item');
        if (item) {
          const idx = parseInt(item.dataset.index, 10);
          if (state.selectedIds.has(idx)) state.selectedIds.delete(idx);
          else state.selectedIds.add(idx);
          render(panel);
        }
        return;
      }

      const action = btn.dataset.action;

      switch (action) {
        case 'refresh': {
          state.favorites = collectFavorites();
          state.selectedIds.clear();
          render(panel);
          break;
        }
        case 'expand': {
          const ok = await expandAll();
          state.favorites = collectFavorites();
          render(panel);
          break;
        }
        case 'select-all': {
          const filtered = state.favorites.filter((f) =>
            !state.filter || f.title.toLowerCase().includes(state.filter.toLowerCase())
          );
          filtered.forEach((f) => state.selectedIds.add(f.index));
          render(panel);
          break;
        }
        case 'select-none': {
          state.selectedIds.clear();
          render(panel);
          break;
        }
        case 'invert': {
          state.favorites.forEach((f) => {
            if (state.selectedIds.has(f.index)) state.selectedIds.delete(f.index);
            else state.selectedIds.add(f.index);
          });
          render(panel);
          break;
        }
        case 'export': {
          const selected = state.favorites
            .filter((f) => state.selectedIds.has(f.index))
            .map((f) => f.title);
          const text = JSON.stringify(selected, null, 2);
          try {
            await navigator.clipboard.writeText(text);
            alert(`✅ 已复制 ${selected.length} 项到剪贴板\n\n${selected.slice(0, 5).join('\n')}${selected.length > 5 ? '\n...' : ''}`);
          } catch {
            prompt('复制以下内容:', text);
          }
          break;
        }
        case 'run': {
          if (state.running) return;
          const selected = state.favorites.filter((f) => state.selectedIds.has(f.index));
          if (selected.length === 0) return;

          const confirmMsg =
            `⚠️ 即将取消订阅 ${selected.length} 个收藏夹\n\n` +
            selected.slice(0, 10).map((f) => `  • ${f.title}`).join('\n') +
            (selected.length > 10 ? `\n  ... 还有 ${selected.length - 10} 个` : '') +
            `\n\n此操作不可撤销！确定继续吗？`;
          if (!confirm(confirmMsg)) return;

          state.running = true;
          render(panel);

          const progressEl = $('.bu-progress', panel);
          const progressText = $('.bu-progress-text', panel);
          const progressFill = $('.bu-progress-fill', panel);
          progressEl.style.display = 'block';

          log(panel, `▶ 开始处理 ${selected.length} 个项目...`);

          const result = await runBatch(selected, {}, (p) => {
            if (p.phase === 'processing') {
              progressText.textContent = `处理中 ${p.current}/${p.total}: ${p.item.slice(0, 30)}`;
            } else if (p.phase === 'ok') {
              log(panel, `✅ [${p.current}/${p.total}] ${p.item}`, 'ok');
            } else if (p.phase === 'fail') {
              log(panel, `❌ [${p.current}/${p.total}] ${p.item} (${p.reason})`, 'fail');
            } else if (p.phase === 'cooldown') {
              log(panel, `⏸ 批次冷却 3s...`, 'skip');
            }
            const pct = (p.current / p.total) * 100;
            progressFill.style.width = pct + '%';
          });

          log(panel, `━━━━━━━━━━━━━━━━━━`);
          log(panel, `完成：成功 ${result.success.length} · 失败 ${result.failed.length}`, result.failed.length ? 'skip' : 'ok');

          progressText.textContent = `✅ 完成：成功 ${result.success.length} · 失败 ${result.failed.length}`;
          state.running = false;

          // 从列表移除成功的
          const successSet = new Set(result.success);
          state.favorites = state.favorites.filter((f) => !successSet.has(f.title));
          state.selectedIds.clear();
          render(panel);
          break;
        }
      }
    });

    $('.bu-search', panel).addEventListener('input', (e) => {
      state.filter = e.target.value;
      render(panel);
    });

    $('.bu-close', panel).addEventListener('click', () => {
      panel.remove();
      window.__bilibiliUnsubUIInstalled = false;
    });
  }

  // ========== 启动 ==========
  const panel = buildPanel();
  makeDraggable(panel);
  bindEvents(panel);

  // 自动展开 + 扫描
  (async () => {
    await expandAll();
    state.favorites = collectFavorites();
    render(panel);
    console.log(`[bili-unsub] 已加载 ${state.favorites.length} 个收藏夹`);
  })();

  console.log('%c B站批量取消订阅 UI 已注入 ', 'background:#00a1d6;color:#fff;padding:4px 8px;border-radius:4px');
})();
