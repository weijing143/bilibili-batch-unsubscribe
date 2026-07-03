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

      // 2. 滚动到该项并高亮引导用户点击 ⋮
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(400);

      // 3. 定位「更多」按钮
      const moreBtn = item.querySelector('.more-vertical');
      if (!moreBtn) {
        failed.push({ title, reason: '无更多按钮 (.more-vertical)' });
        log(`❌ [${i + 1}/${titlesToDelete.length}] FAIL: ${shortTitle} (无按钮)`);
        continue;
      }

      // 4. 强制显示按钮 + 高亮引导
      moreBtn.style.display = 'inline-block';
      moreBtn.style.visibility = 'visible';
      const origOutline = item.style.outline, origBg = item.style.background;
      item.style.outline = '3px solid #00a1d6';
      item.style.outlineOffset = '-3px';
      item.style.background = '#e0f7ff';
      moreBtn.style.background = '#00a1d6';
      moreBtn.style.color = '#fff';
      moreBtn.style.borderRadius = '4px';

      // 5. 阻止用户点击 ⋮ 时冒泡导致页面跳转
      const parent = moreBtn.parentElement;
      parent.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, { once: true, capture: true });

      log(`👆 [${i + 1}/${titlesToDelete.length}] 请点击 ⋮ → ${shortTitle}`);

      // 6. 轮询等待用户点击 ⋮ → 弹出菜单出现「取消订阅」
      const maxWait = 30000, pollInterval = 200;
      const startTime = Date.now();
      let unsubBtn = null;
      while (!unsubBtn && (Date.now() - startTime) < maxWait) {
        await sleep(pollInterval);
        const selectors = ['.menu-popover__panel-item', '.vui_popover-content', '.vui_popover', '.bili-popover__content .item'];
        for (const sel of selectors) {
          const items = document.querySelectorAll(sel);
          for (const el of items) {
            if ((el.textContent?.trim() === '取消订阅' || el.textContent?.trim().includes('取消订阅')) && el.offsetParent !== null) {
              unsubBtn = el;
              break;
            }
          }
          if (unsubBtn) break;
        }
      }

      // 7. 还原样式
      item.style.outline = origOutline; item.style.background = origBg;
      moreBtn.style.background = ''; moreBtn.style.color = ''; moreBtn.style.borderRadius = '';

      if (!unsubBtn) {
        document.body.click();
        failed.push({ title, reason: '超时：未检测到用户点击 ⋮' });
        log(`❌ [${i + 1}/${titlesToDelete.length}] FAIL: ${shortTitle} (超时)`);
        continue;
      }

      // 8. 自动点击「取消订阅」
      unsubBtn.click();
      success.push(title);
      log(`✅ [${i + 1}/${titlesToDelete.length}] OK: ${shortTitle}`);
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
