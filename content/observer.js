// ============================================================
// MutationObserver：仅在帖子详情页监听回复区 DOM 变化
// ============================================================

(function init() {
  // 只在 /status/<id> 详情页运行
  function isStatusPage() {
    return /\/status\/\d+/.test(location.pathname);
  }

  // 找到主帖 article（详情页第一个 tweet，不过滤）
  function getPrimaryArticle() {
    return document.querySelector('article[data-testid="tweet"]');
  }

  // 判断某个 article 是否是回复（非主帖、非嵌入推文）
  function isReplyArticle(article) {
    // 主帖跳过
    if (article === getPrimaryArticle()) return false;
    // 嵌入推文（quoted tweet）通常在另一个 article 内部
    if (article.closest('article[data-testid="tweet"] article')) return false;
    return true;
  }

  function maybeProcess(article) {
    if (isStatusPage() && isReplyArticle(article)) {
      Filter.processArticle(article);
    }
  }

  function scanAll() {
    if (!isStatusPage()) return;
    document.querySelectorAll('article[data-testid="tweet"]').forEach(maybeProcess);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const article = mutation.target.parentElement?.closest?.('article[data-testid="tweet"]');
        if (article) maybeProcess(article);
        continue;
      }

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('article[data-testid="tweet"]')) {
          maybeProcess(node);
        } else {
          node.querySelectorAll?.('article[data-testid="tweet"]').forEach(maybeProcess);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, characterData: true, subtree: true });

  // SPA 路由切换时重新判断
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      Filter.clearHiddenUsernames();
      setTimeout(scanAll, 800);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });

  scanAll();

  // Fix #1: 设置变更时立即对当前页生效
  // 清除所有已处理标记 + 移除占位条 + 恢复被折叠的 article + 重新扫描
  chrome.storage.onChanged.addListener((changes) => {
    const relevant = ['enabled', 'level', 'whitelist', 'blacklist', 'showReason'];
    if (!relevant.some((k) => k in changes)) return;

    // 移除占位条，恢复被隐藏的 article
    document.querySelectorAll('.xf-placeholder').forEach((el) => el.remove());
    document.querySelectorAll('article[data-testid="tweet"].xf-collapsed').forEach((el) => {
      el.classList.remove('xf-collapsed');
    });
    // 清除已处理标记，让所有 article 可被重新评估
    document.querySelectorAll('article[data-testid="tweet"][data-xf-processed]').forEach((el) => {
      el.removeAttribute('data-xf-processed');
      el.removeAttribute('data-xf-retry-count');
      el.removeAttribute('data-xf-signature');
    });

    Filter.clearHiddenUsernames();
    scanAll();
  });
})();
