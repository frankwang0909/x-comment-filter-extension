const $ = (id) => document.getElementById(id);
const CONTENT_SCRIPT_FILES = [
  'shared/storage.js',
  'core/rules.js',
  'content/parser.js',
  'content/filter.js',
  'content/actions.js',
  'content/observer.js',
];
const CONTENT_STYLE_FILES = ['content/filter.css'];

async function load() {
  const data = await chrome.storage.local.get(['enabled', 'level', 'hideMode', 'stats']);
  $('enabled').checked = data.enabled !== false;
  $('hide-mode').checked = data.hideMode === true;
  $('level').value = data.level ?? 'normal';

  const stats = data.stats ?? {};
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('stat-today').textContent = stats.lastDate === today ? (stats.today ?? 0) : 0;
  $('stat-total').textContent = stats.total ?? 0;
  $('stat-restored').textContent = stats.restored ?? 0;
}

async function withActiveTab(fn) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('未找到当前标签页');
  return fn(tab.id, tab);
}

function setActionStatus(text, isError = false) {
  const el = $('action-status');
  el.textContent = text;
  el.style.color = isError ? '#f4212e' : '#71767b';
}

function formatBatchResult(response) {
  if (!response.total) return '当前页没有可处理的已拦截账号';
  if (response.localOnly === 0) return `已处理 ${response.total} 个账号，其中 ${response.remoteBlocked} 个已同步到 X Block`;

  const fallback = Object.entries(response.fallbackReasons || {})
    .map(([reason, count]) => `${reason}:${count}`)
    .join(', ');
  return `已处理 ${response.total} 个账号；X Block 成功 ${response.remoteBlocked} 个，仅本地拉黑 ${response.localOnly} 个${fallback ? `（${fallback}）` : ''}`;
}

async function sendMessageWithRecovery(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (!/Receiving end does not exist/i.test(error?.message || '')) {
      throw error;
    }

    await injectContentScripts(tabId);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function injectContentScripts(tabId) {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: CONTENT_STYLE_FILES,
  });

  for (const file of CONTENT_SCRIPT_FILES) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
  }
}

$('enabled').addEventListener('change', (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
});

$('hide-mode').addEventListener('change', (e) => {
  chrome.storage.local.set({ hideMode: e.target.checked });
});

$('level').addEventListener('change', (e) => {
  chrome.storage.local.set({ level: e.target.value });
});

$('open-options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

$('block-all').addEventListener('click', async () => {
  const btn = $('block-all');
  btn.disabled = true;
  setActionStatus('正在批量隐藏并加入黑名单...');

  try {
    const response = await withActiveTab((tabId, tab) => {
      if (!/^https:\/\/(x|twitter)\.com\//.test(tab.url || '')) {
        throw new Error('请先打开 x.com 的评论页面');
      }
      return sendMessageWithRecovery(tabId, { type: 'xf:block-all-filtered' });
    });

    if (!response?.ok) {
      throw new Error(response?.error || '批量屏蔽失败');
    }

    setActionStatus(formatBatchResult(response));
  } catch (error) {
    setActionStatus(error.message || String(error), true);
  } finally {
    btn.disabled = false;
  }
});

load();
