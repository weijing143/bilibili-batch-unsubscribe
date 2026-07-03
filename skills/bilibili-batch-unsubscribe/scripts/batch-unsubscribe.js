// ============================================================
// B 站批量取消订阅 - 核心函数
// 同时支持：浏览器 F12 控制台 + Playwright MCP browser_evaluate
// ============================================================

/**
 * 批量取消订阅 B 站追的合集/收藏夹
 * @param {string[]} titlesToDelete - 要删除的收藏夹标题数组
 * @param {object} [options]
 * @param {number} [options.delayBetween=700]  - 每次操作间隔 (ms)
 * @param {number} [options.hoverDelay=300]    - 悬停等待 (ms)
 * @param {number} [options.clickDelay=400]    - 点击更多按钮后等待菜单弹出 (ms)
 * @param {boolean} [options.verbose=true]     - 是否 console.log 每一步
 * @returns {Promise<{success:string[], failed:{title:string,reason:string}[]}>}
 */
async function bilibiliBatchUnsubscribe(titlesToDelete, options = {}) {
  const {
    delayBetween = 700,
    hoverDelay = 300,
    clickDelay = 400,
    verbose = true,
  } = options;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (...a) => verbose && console.log(...a);

  const success = [];
  const failed = [];

  log(`🚀 准备处理 ${titlesToDelete.length} 个收藏夹...`);

  for (let i = 0; i < titlesToDelete.length; i++) {
    const title = titlesToDelete[i];
    const shortTitle = title.length > 30 ? title.slice(0, 30) + '…' : title;

    try {
      // 1. 定位项目：优先精确匹配 title 属性
      let item = document.querySelector(
        `.fav-sidebar-item[title="${CSS.escape(title)}"]`
      );

      // 兜底：遍历所有项目按 textContent 匹配
      if (!item) {
        const all = document.querySelectorAll('.fav-sidebar-item');
        for (const el of all) {
          if (
            el.getAttribute('title') === title ||
            el.textContent?.trim().includes(title)
          ) {
            item = el;
            break;
          }
        }
      }

      if (!item) {
        failed.push({ title, reason: '未找到该收藏夹项' });
        log(`⏭️ [${i + 1}/${titlesToDelete.length}] SKIP: ${shortTitle}`);
        continue;
      }

      // 2. 滚动到视野
      item.scrollIntoView({ block: 'center', behavior: 'instant' });
      await sleep(200);

      // 3. 触发悬停 —— 双保险：mouseenter + mouseover
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      await sleep(hoverDelay);

      // 4. 定位「更多」按钮
      const moreBtn = item.querySelector('.more-vertical');
      if (!moreBtn) {
        failed.push({ title, reason: '无更多按钮 (.more-vertical)' });
        log(`❌ [${i + 1}/${titlesToDelete.length}] FAIL: ${shortTitle} (无按钮)`);
        continue;
      }

      // 检查可见性
      const style = getComputedStyle(moreBtn);
      if (style.display === 'none' || style.visibility === 'hidden') {
        // 尝试再次悬停
        item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await sleep(hoverDelay);
      }

      // ★ 强制显示按钮：CSS :hover 伪类不响应 JS 合成事件
      moreBtn.style.display = 'inline-block';
      moreBtn.style.visibility = 'visible';

      // 阻止点击事件冒泡到父级 .fav-sidebar-item（否则会触发导航跳转，关闭菜单）
      const parent = moreBtn.parentElement;
      const stopNav = (e) => { e.stopPropagation(); e.preventDefault(); };
      parent.addEventListener('click', stopNav, { once: true, capture: true });

      // 补齐 pointer/mouse 全套事件，确保 Vue 弹出菜单
      ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach((type) => {
        moreBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
      });
      await sleep(clickDelay);

      // 5. 查找并点击「取消订阅」菜单项
      //    关键：必须用 offsetParent 过滤隐藏菜单（B 站会堆积历史菜单在 DOM）
      const clicked = (() => {
        const selectors = [
          '.menu-popover__panel-item',
          '.vui_popover-content',
          '.vui_popover',
          '.bili-popover__content .item',
        ];
        for (const sel of selectors) {
          const items = document.querySelectorAll(sel);
          for (const el of items) {
            const text = el.textContent?.trim() ?? '';
            if ((text === '取消订阅' || text.includes('取消订阅')) && el.offsetParent !== null) {
              el.click();
              return true;
            }
          }
        }
        // 没找到可见菜单，关闭可能打开的菜单避免堆积
        document.body.click();
        return false;
      })();

      if (clicked) {
        success.push(title);
        log(`✅ [${i + 1}/${titlesToDelete.length}] OK: ${shortTitle}`);
      } else {
        failed.push({ title, reason: '未找到「取消订阅」菜单项' });
        log(`❌ [${i + 1}/${titlesToDelete.length}] FAIL: ${shortTitle} (无菜单)`);
      }

      await sleep(delayBetween);
    } catch (e) {
      failed.push({ title, reason: e.message || String(e) });
      log(`💥 [${i + 1}/${titlesToDelete.length}] ERROR: ${shortTitle}`, e);
    }
  }

  const report = {
    total: titlesToDelete.length,
    success,
    failed,
    successCount: success.length,
    failedCount: failed.length,
  };

  log('\n══════════ 处理完成 ══════════');
  log(`✅ 成功: ${success.length}`);
  log(`❌ 失败: ${failed.length}`);
  if (failed.length) {
    log('失败清单:');
    failed.forEach((f) => log(`  - ${f.title}: ${f.reason}`));
  }

  return report;
}

// ============================================================
// 辅助函数：导出当前页面所有收藏夹标题
// ============================================================
function bilibiliListAllFavorites() {
  return Array.from(document.querySelectorAll('.fav-sidebar-item')).map(
    (el, i) => ({
      index: i,
      title: el.getAttribute('title') || el.textContent?.trim() || '',
    })
  );
}

// ============================================================
// 辅助函数：展开「显示剩余N个」
// ============================================================
async function bilibiliExpandAll() {
  // 反复点击「显示剩余N个」直到全部展开（合集可能很多，最多尝试 15 次）
  let clicks = 0;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let round = 0; round < 15; round++) {
    const btn = document.querySelector('.fav-collapse-more');
    if (!btn || btn.offsetParent === null) break;
    btn.click();
    clicks++;
    await sleep(900);
  }
  return clicks > 0;
}

// ============================================================
// 白名单模式辅助：计算要删除的
// ============================================================
function bilibiliComputeDeleteFromKeep(keepList) {
  const all = bilibiliListAllFavorites().map((x) => x.title);
  const keepSet = new Set(keepList);
  return all.filter((t) => !keepSet.has(t));
}

// ============================================================
// 使用示例（在浏览器 F12 控制台执行）：
// ============================================================
/*
// 步骤 1：展开全部
await bilibiliExpandAll();

// 步骤 2：查看当前所有收藏夹
console.table(bilibiliListAllFavorites());

// 步骤 3A：黑名单模式 —— 指定要删的
const toDelete = [
  "示例合集 A",
  "示例合集 B",
  "示例合集 C",
];
await bilibiliBatchUnsubscribe(toDelete);

// 步骤 3B：白名单模式 —— 指定要留的
const toKeep = ["技术分享", "学习资料"];
const finalDelete = bilibiliComputeDeleteFromKeep(toKeep);
console.log('将要删除:', finalDelete);  // 先看一眼
await bilibiliBatchUnsubscribe(finalDelete);
*/

// 暴露到全局（浏览器控制台直接可用）
if (typeof window !== 'undefined') {
  window.bilibiliBatchUnsubscribe = bilibiliBatchUnsubscribe;
  window.bilibiliListAllFavorites = bilibiliListAllFavorites;
  window.bilibiliExpandAll = bilibiliExpandAll;
  window.bilibiliComputeDeleteFromKeep = bilibiliComputeDeleteFromKeep;
}
