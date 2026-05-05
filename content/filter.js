// ============================================================
// 过滤逻辑：评分 → 折叠 → 注入占位 UI
// ============================================================

const Filter = (() => {
  const PROCESSED_ATTR = 'data-xf-processed';
  const COLLAPSED_CLASS = 'xf-collapsed';
  const RETRY_ATTR = 'data-xf-retry-count';
  const SIGNATURE_ATTR = 'data-xf-signature';
  const MAX_RETRIES = 5;

  // 直接隐藏模式下无占位条，用此集合记录已过滤账号供一键屏蔽使用
  const _hiddenUsernames = new Set();

  async function processArticle(article) {
    const settings = await Storage.getSettings();
    // 未启用时不标记：重新启用后可以重新处理
    if (!settings.enabled) return;

    const info = Parser.parseArticle(article);
    // 解析失败时不标记：DOM 可能尚未完整渲染，留给下次 MutationObserver 重试
    if (!info) return;

    // X 的回复节点常常先出壳、后补文本。字段不完整时先重试，避免过早标记导致漏拦。
    if (!hasEnoughInfo(info)) {
      scheduleRetry(article);
      return;
    }

    const signature = buildSignature(info);
    const processed = article.hasAttribute(PROCESSED_ATTR);
    const previousSignature = article.getAttribute(SIGNATURE_ATTR) || '';
    if (processed && previousSignature === signature) return;

    // 解析成功后才标记，避免 settings/rules 变更时永久跳过
    article.setAttribute(PROCESSED_ATTR, '1');
    article.setAttribute(SIGNATURE_ATTR, signature);
    article.removeAttribute(RETRY_ATTR);

    // 白名单优先
    if (settings.whitelist.includes(info.username)) return;

    // 黑名单直接强制折叠
    const forceCollapse = settings.blacklist.includes(info.username);

    // 用户自定义关键词：昵称/用户名/正文任一命中即屏蔽
    if (!forceCollapse) {
      const haystack = `${info.displayName} ${info.username} ${info.text}`.toLowerCase();
      for (const kw of (settings.customKeywords || [])) {
        if (kw && haystack.includes(kw.toLowerCase())) {
          markHiddenUsername(info.username);
          collapseArticle(article, info, { matched: true, reasons: [`自定义关键词: ${kw}`] }, settings);
          Storage.incrementStat('total');
          return;
        }
      }

      // 用户自定义仿冒保护：同昵称不同用户名
      for (const rule of (settings.customImpersonation || [])) {
        const nameMatches = rule.matchType === 'contains'
          ? info.displayName.includes(rule.displayName)
          : info.displayName === rule.displayName;
        if (nameMatches && info.username !== rule.legitimateUsername) {
          markHiddenUsername(info.username);
          collapseArticle(article, info, { matched: true, reasons: [`仿冒保护: ${rule.displayName}`] }, settings);
          Storage.incrementStat('total');
          return;
        }
      }
    }

    const result = forceCollapse
      ? { matched: true, reasons: ['黑名单用户'] }
      : scoreComment(info);

    if (forceCollapse || shouldFilter(result)) {
      markHiddenUsername(info.username);
      if (forceCollapse) {
        removeArticle(article);
      } else {
        collapseArticle(article, info, result, settings);
      }
      Storage.incrementStat('total');
    }
  }

  function collapseArticle(article, info, result, settings) {
    // 隐藏原始内容
    article.classList.add(COLLAPSED_CLASS);

    // hideMode：直接隐藏，不插占位条
    if (settings.hideMode) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'xf-placeholder';
    placeholder.dataset.username = info.username;

    const reasonText = settings.showReason && result.reasons.length
      ? result.reasons.slice(0, 2).join('、')
      : '';

    placeholder.innerHTML = `
      <span class="xf-label">🚫 已折叠疑似垃圾评论${reasonText ? `（${reasonText}）` : ''}</span>
      <div class="xf-actions">
        <button class="xf-btn xf-expand">展开</button>
        <button class="xf-btn xf-whitelist">不再折叠</button>
        <button class="xf-btn xf-block">Block</button>
      </div>
    `;

    if (!article.parentNode) return;
    article.parentNode.insertBefore(placeholder, article);
    bindPlaceholderEvents(placeholder, article, info);
  }

  function bindPlaceholderEvents(placeholder, article, info) {
    placeholder.querySelector('.xf-expand').addEventListener('click', () => {
      article.classList.remove(COLLAPSED_CLASS);
      placeholder.remove();
      unmarkHiddenUsername(info.username);
      Storage.incrementStat('restored');
    });

    placeholder.querySelector('.xf-whitelist').addEventListener('click', () => {
      Storage.addToList('whitelist', info.username);
      article.classList.remove(COLLAPSED_CLASS);
      placeholder.remove();
      unmarkHiddenUsername(info.username);
    });

    placeholder.querySelector('.xf-block').addEventListener('click', async () => {
      await Actions.block(article, info.username);
      placeholder.remove();
      if (article.isConnected) article.remove();
    });
  }

  function removeArticle(article) {
    const placeholder = article.previousElementSibling;
    if (placeholder?.classList?.contains('xf-placeholder')) {
      placeholder.remove();
    }
    article.remove();
  }

  function hasEnoughInfo(info) {
    // username 是最低要求；text 可以为空（纯 emoji 正文 X 用 <img> 渲染，innerText 读不到）
    return Boolean(info.username);
  }

  function scheduleRetry(article) {
    const retryCount = Number(article.getAttribute(RETRY_ATTR) || '0');
    if (retryCount >= MAX_RETRIES) {
      return;
    }

    article.setAttribute(RETRY_ATTR, String(retryCount + 1));
    window.setTimeout(() => {
      if (article.isConnected) processArticle(article);
    }, 400);
  }

  function buildSignature(info) {
    return `${info.username}::${info.displayName}::${info.text}`;
  }

  function markHiddenUsername(username) {
    if (username) _hiddenUsernames.add(username);
  }

  function unmarkHiddenUsername(username) {
    if (username) _hiddenUsernames.delete(username);
  }

  function getHiddenUsernames() { return new Set(_hiddenUsernames); }
  function clearHiddenUsernames() { _hiddenUsernames.clear(); }

  return { processArticle, getHiddenUsernames, clearHiddenUsernames, unmarkHiddenUsername };
})();
