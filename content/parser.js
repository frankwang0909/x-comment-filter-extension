// ============================================================
// DOM 解析：从评论节点提取账号与文本信息
// ============================================================

const Parser = (() => {
  // X 的 DOM 结构会变，集中管理选择器方便后续修复
  const SEL = {
    // 评论/回复的顶层 article
    tweet: 'article[data-testid="tweet"]',
    // 用户名 @handle（aria-label 或 href 中）
    userLink: 'a[href^="/"][role="link"][tabindex="-1"]',
    // 显示名（粗体名字）
    displayName: '[data-testid="User-Name"] span span',
    // 推文正文
    tweetText: '[data-testid="tweetText"]',
  };

  function parseArticle(article) {
    try {
      const textEl = article.querySelector(SEL.tweetText) || findTweetTextFallback(article);
      const text = textEl ? getNodeText(textEl) : '';

      // 作者信息必须从 User-Name 区域锚定，避免误取推文正文中的 @mention 链接
      const authorSection = article.querySelector('[data-testid="User-Name"]');
      if (!authorSection) return null;

      // 用户名：User-Name 区域内的第一个 /username 格式链接
      const authorLink = [...authorSection.querySelectorAll('a[href^="/"]')]
        .find((a) => /^\/[^/]+\/?$/.test(a.getAttribute('href')));
      // X 用户名大小写不敏感，统一小写，与 whitelist/blacklist 匹配一致
      const username = authorLink
        ? authorLink.getAttribute('href').replace(/^\//, '').replace(/\/$/, '').toLowerCase()
        : '';

      // 显示名：User-Name 区域的第一个非 @handle 文本段
      let displayName = '';
      for (const span of authorSection.querySelectorAll('span')) {
        const t = getNodeText(span);
        if (t && !t.startsWith('@') && !/^·|\d+[smhdwy]$/.test(t)) {
          displayName = t;
          break;
        }
      }

      return { text, username, displayName };
    } catch (e) {
      return null;
    }
  }

  function getNodeText(node) {
    return (node?.innerText || node?.textContent || '').trim();
  }

  function findTweetTextFallback(article) {
    return [...article.querySelectorAll('div[lang], span[lang]')]
      .find((node) => getNodeText(node));
  }

  return { parseArticle, SEL };
})();
