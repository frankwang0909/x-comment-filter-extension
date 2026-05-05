// ============================================================
// 用户操作：Block（直接调 X 内部 API，与网页版行为一致）
// ============================================================

const Actions = (() => {
  // X 网页版的 App Bearer Token（固定值，X 官方客户端内置）
  const BEARER =
    'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I%2BxMSnMtRLiL%2B' +
    'IiikZgJzUGA%3DgkznhaxeRQaUGGVF4XKzL1jDv8M7M6pxeGfH1y4zB4';

  // 从 cookie 读取 CSRF token（ct0），X 用它做请求合法性校验
  function getCt0() {
    const m = document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/);
    return m ? m[1] : null;
  }

  // 调 X REST API 屏蔽指定用户名（接受 screen_name，无需提前查 user_id）
  async function blockViaApi(username) {
    const ct0 = getCt0();
    if (!ct0) return { ok: false, reason: 'no_ct0' };

    try {
      const resp = await fetch('https://api.twitter.com/1.1/blocks/create.json', {
        method: 'POST',
        credentials: 'include',          // 带上 auth_token cookie，实现用户身份
        headers: {
          'Authorization': `Bearer ${BEARER}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-csrf-token': ct0,
          'x-twitter-active-user': 'yes',
          'x-twitter-client-language': 'en',
        },
        body: `screen_name=${encodeURIComponent(username)}&include_entities=false&skip_status=true`,
      });
      return { ok: resp.ok, status: resp.status };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  }

  // 单个 Block（占位条上的 Block 按钮）
  // 先走 API；API 失败时降级为加本地黑名单，并把降级结果显式返回
  async function block(article, username, options = {}) {
    const { silent = false } = options;

    const result = await blockViaApi(username);
    if (result.ok) {
      await Storage.addToList('blacklist', username);
      if (!silent) showToast(`已屏蔽 @${username}`);
      return { ok: true, remoteBlocked: true, localBlacklisted: true };
    } else {
      await Storage.addToList('blacklist', username);
      if (!silent) showToast(`API 失败（${result.status ?? result.reason}），已加入本地黑名单 @${username}`);
      return {
        ok: true,
        remoteBlocked: false,
        localBlacklisted: true,
        fallbackReason: result.status ?? result.reason ?? 'unknown',
      };
    }
  }

  // 批量 Block（popup 一键按钮）
  // 同时覆盖两种模式：
  //   普通模式 → 扫描 DOM 中的 .xf-placeholder
  //   直接隐藏模式 → 从 Filter._hiddenUsernames 内存集合读取
  async function blockAllFiltered() {
    const targets = [];
    const seen = new Set();

    // 普通模式：有占位条
    document.querySelectorAll('.xf-placeholder').forEach((placeholder) => {
      const username = placeholder.dataset.username;
      const article = placeholder.nextElementSibling;
      if (!username || seen.has(username)) return;
      if (!article?.matches?.('article[data-testid="tweet"]')) return;
      seen.add(username);
      targets.push({ username, placeholder, article });
    });

    // 直接隐藏模式：仅补充当前页已记录的隐藏账号（路由切换时会清空）
    for (const username of Filter.getHiddenUsernames()) {
      if (!seen.has(username)) {
        seen.add(username);
        targets.push({ username });
      }
    }

    if (targets.length === 0) return { total: 0 };

    const summary = {
      total: targets.length,
      remoteBlocked: 0,
      localOnly: 0,
      fallbackReasons: {},
    };

    // 串行请求：X 的 blocks/create 接口会拒绝同一 session 的并发重复请求
    for (const { username, placeholder, article } of targets) {
      const result = await block(null, username, { silent: true });
      if (result.remoteBlocked) summary.remoteBlocked += 1;
      else {
        summary.localOnly += 1;
        const key = String(result.fallbackReason || 'unknown');
        summary.fallbackReasons[key] = (summary.fallbackReasons[key] ?? 0) + 1;
      }
      placeholder?.remove();
      if (article?.isConnected) article.remove();
      Filter.unmarkHiddenUsername(username);
    }

    Filter.clearHiddenUsernames();
    return summary;
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'xf-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message?.type !== 'xf:block-all-filtered') return;

      blockAllFiltered()
        .then((result) => sendResponse({ ok: true, ...result }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || String(error) }));

      return true;
    });
  }

  return { block, blockAllFiltered };
})();
