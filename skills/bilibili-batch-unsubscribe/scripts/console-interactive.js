// ============================================================
// B 站批量取消订阅 · 控制台交互式选择器（无 UI 极简版）
// ------------------------------------------------------------
//   用途：在纯净的 F12 控制台里通过序号选择
//   适合喜欢命令行的开发者
// ============================================================

(function () {
  'use strict';

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const c = { info: 'color:#00a1d6', ok: 'color:#10b981', fail: 'color:#ef4444', dim: 'color:#6b7280' };

  // 定位「我追的合集/收藏夹」区域，避免误碰自建收藏夹
  function getSubscribedSectionRoot() {
    const headers = document.querySelectorAll('.vui_collapse_item_header, [class*="collapse"][class*="header"]');
    for (const h of headers) {
      const t = (h.textContent || '').trim();
      if (t.includes('追的合集') || t.includes('我追的')) {
        return h.closest('.vui_collapse_item') || h.parentElement;
      }
    }
    return null;
  }

  function collectFavorites() {
    const root = getSubscribedSectionRoot() || document;
    return Array.from(root.querySelectorAll('.fav-sidebar-item')).map((el, i) => ({
      index: i,
      title: el.getAttribute('title') || el.textContent?.trim() || `未命名-${i}`,
      element: el,
    }));
  }

  // 半自动模式：B 站 Vue popover 不响应 JS 合成事件，需用户真实点击 ⋮
  // 脚本负责：滚动定位 → 高亮引导 → 阻止跳转 → 检测菜单 → 自动点「取消订阅」
  async function unsubOne(el) {
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await sleep(400);

    const moreBtn = el.querySelector('.more-vertical');
    if (!moreBtn) return { ok: false, reason: '无更多按钮' };

    // 强制显示 ⋮ 按钮
    moreBtn.style.display = 'inline-block';
    moreBtn.style.visibility = 'visible';

    // 高亮引导
    const origOutline = el.style.outline, origBg = el.style.background;
    el.style.outline = '3px solid #00a1d6';
    el.style.outlineOffset = '-3px';
    el.style.background = '#e0f7ff';
    moreBtn.style.background = '#00a1d6';
    moreBtn.style.color = '#fff';
    moreBtn.style.borderRadius = '4px';

    // 阻止点击冒泡导致跳转
    const parent = moreBtn.parentElement;
    parent.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, { once: true, capture: true });

    // 轮询等待用户点击 ⋮ → 弹出菜单出现
    const maxWait = 30000, pollInterval = 200;
    const startTime = Date.now();
    let unsubBtn = null;
    while (!unsubBtn && (Date.now() - startTime) < maxWait) {
      await sleep(pollInterval);
      const menus = document.querySelectorAll('.menu-popover__panel-item');
      for (const m of menus) {
        if ((m.textContent || '').trim() === '取消订阅' && m.offsetParent !== null) {
          unsubBtn = m;
          break;
        }
      }
    }

    // 还原样式
    el.style.outline = origOutline; el.style.background = origBg;
    moreBtn.style.background = ''; moreBtn.style.color = ''; moreBtn.style.borderRadius = '';

    if (!unsubBtn) { document.body.click(); return { ok: false, reason: '超时：未检测到用户点击 ⋮' }; }

    unsubBtn.click();
    await sleep(200);
    return { ok: true };
  }

  // 解析序号表达式："1,3,5-8,10" → [1,3,5,6,7,8,10]
  function parseSelection(input, max) {
    if (!input || input.toLowerCase() === 'all') return Array.from({ length: max }, (_, i) => i);
    if (input.toLowerCase() === 'none') return [];
    const result = new Set();
    for (const part of input.split(/[,\s]+/).filter(Boolean)) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map((x) => parseInt(x, 10));
        if (isFinite(a) && isFinite(b)) {
          for (let i = Math.min(a, b); i <= Math.max(a, b); i++) result.add(i);
        }
      } else {
        const n = parseInt(part, 10);
        if (isFinite(n)) result.add(n);
      }
    }
    return Array.from(result).filter((n) => n >= 0 && n < max).sort((a, b) => a - b);
  }

  // 展示列表 + 交互式提示
  async function main() {
    // 反复点「显示剩余N个」直到全部展开
    for (let round = 0; round < 15; round++) {
      const expand = document.querySelector('.fav-collapse-more');
      if (!expand || expand.offsetParent === null) break;
      expand.click();
      await sleep(900);
    }

    const favs = collectFavorites();
    if (favs.length === 0) {
      console.warn('%c [bili-unsub] 未检测到收藏夹项目，请确认已进入 favlist 页面并展开列表 ', c.fail);
      return;
    }

    console.log(`%c 检测到 ${favs.length} 个收藏夹 `, c.info);
    console.table(favs.map(({ index, title }) => ({ index, title })));

    console.log('%c 用法： ', c.info);
    console.log('%c   biliUnsub.run("1,3,5-8")    ← 按序号取消订阅 ', c.dim);
    console.log('%c   biliUnsub.run("all")        ← 取消订阅全部 ', c.dim);
    console.log('%c   biliUnsub.run("all", ["保留A","保留B"])  ← 白名单模式：留下这两个，其余全删 ', c.dim);
    console.log('%c   biliUnsub.list()            ← 重新查看列表 ', c.dim);

    // 全局挂载
    window.biliUnsub = {
      list: () => {
        const cur = collectFavorites();
        console.table(cur.map(({ index, title }) => ({ index, title })));
        return cur;
      },
      run: async (selection, keepList = null) => {
        let all = collectFavorites();
        let targets;
        if (keepList && Array.isArray(keepList)) {
          const keepSet = new Set(keepList);
          targets = all.filter((f) => !keepSet.has(f.title));
        } else {
          const idxList = parseSelection(String(selection), all.length);
          targets = idxList.map((i) => all[i]).filter(Boolean);
        }

        if (targets.length === 0) {
          console.warn('%c 无匹配项 ', c.fail);
          return;
        }

        console.log(`%c 将处理 ${targets.length} 项： `, c.info);
        targets.forEach((f, i) => console.log(`   ${i + 1}. ${f.title}`));

        if (!confirm(`⚠️ 即将取消订阅 ${targets.length} 个收藏夹，不可撤销！确定继续？`)) {
          console.log('%c 用户取消 ', c.dim);
          return;
        }

        console.log(`%c 💡 即将逐个处理，请点击蓝色高亮项的 ⋮ 按钮 `, c.info);

        const success = [], failed = [];
        for (let i = 0; i < targets.length; i++) {
          const t = targets[i];
          console.log(`%c [${i + 1}/${targets.length}] 👆 请点击 ⋮ → ${t.title} `, c.info);
          try {
            const r = await unsubOne(t.element);
            if (r.ok) {
              success.push(t.title);
              console.log(`%c ✅ 成功 `, c.ok);
            } else {
              failed.push({ title: t.title, reason: r.reason });
              console.log(`%c ❌ 失败: ${r.reason} `, c.fail);
            }
          } catch (e) {
            failed.push({ title: t.title, reason: e.message });
            console.log(`%c 💥 错误: ${e.message} `, c.fail);
          }
          // 每 15 个冷却 3s
          if ((i + 1) % 15 === 0 && i + 1 < targets.length) {
            console.log('%c ⏸ 批次冷却 3s... ', c.dim);
            await sleep(3000);
          } else {
            await sleep(700);
          }
        }

        console.log('%c ━━━━━━━━━━━━━━━━━━ ', c.info);
        console.log(`%c 完成：成功 ${success.length}，失败 ${failed.length} `, failed.length ? c.fail : c.ok);
        if (failed.length) console.table(failed);
        return { success, failed };
      },
    };
  }

  main();
})();
