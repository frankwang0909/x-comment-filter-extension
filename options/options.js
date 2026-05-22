const $ = (id) => document.getElementById(id);

// 同形字映射：仿冒者常用相近字替换
const HOMOGLYPH_MAP = {
  '人': '[人入]',
  '士': '[士土]',
  '谷': '[谷各]',
  '硅': '[硅硲]',
  '己': '[己已巳]',
  '大': '[大太]',
};

// 将普通昵称转为"任意顺序 + 同形字"正则
function buildImpersonationPattern(name) {
  return [...name].map(ch => {
    const cls = HOMOGLYPH_MAP[ch] || ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return `(?=.*${cls})`;
  }).join('');
}

let whitelist = [];
let blacklist = [];
let customKeywords = [];
let customImpersonation = [];

// ── 通用 tag 渲染 ────────────────────────────────────────────

function renderUserList(containerId, list, listName) {
  const container = $(containerId);
  container.innerHTML = '';
  list.forEach((username) => {
    const tag = document.createElement('div');
    tag.className = 'list-tag';
    tag.innerHTML = `<span>@${username}</span><button data-list="${listName}" data-user="${username}">×</button>`;
    container.appendChild(tag);
  });
}

function renderKeywords(list) {
  const container = $('custom-keyword-items');
  container.innerHTML = '';
  list.forEach((kw) => {
    const tag = document.createElement('div');
    tag.className = 'list-tag';
    tag.innerHTML = `<span>${kw}</span><button data-list="customKeywords" data-kw="${kw}">×</button>`;
    container.appendChild(tag);
  });
}

function renderImpersonation(list) {
  const container = $('impersonation-items');
  container.innerHTML = '';
  list.forEach((rule, i) => {
    const tag = document.createElement('div');
    tag.className = 'list-tag';
    tag.innerHTML = `<span>${rule.displayName} → @${rule.legitimateUsername}</span><button data-list="customImpersonation" data-index="${i}">×</button>`;
    container.appendChild(tag);
  });
}

// ── 删除事件（统一代理）────────────────────────────────────

document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-list]');
  if (!btn) return;
  const listName = btn.dataset.list;

  if (listName === 'whitelist') {
    whitelist = whitelist.filter((u) => u !== btn.dataset.user);
    renderUserList('whitelist-items', whitelist, 'whitelist');
  } else if (listName === 'blacklist') {
    blacklist = blacklist.filter((u) => u !== btn.dataset.user);
    renderUserList('blacklist-items', blacklist, 'blacklist');
  } else if (listName === 'customKeywords') {
    customKeywords = customKeywords.filter((k) => k !== btn.dataset.kw);
    renderKeywords(customKeywords);
  } else if (listName === 'customImpersonation') {
    customImpersonation.splice(Number(btn.dataset.index), 1);
    renderImpersonation(customImpersonation);
  }
});

// ── 添加事件 ─────────────────────────────────────────────────

$('whitelist-add').addEventListener('click', () => {
  const val = $('whitelist-input').value.trim().replace(/^@/, '').toLowerCase();
  if (val && !whitelist.includes(val)) {
    whitelist.push(val);
    renderUserList('whitelist-items', whitelist, 'whitelist');
    $('whitelist-input').value = '';
  }
});

$('blacklist-add').addEventListener('click', () => {
  const val = $('blacklist-input').value.trim().replace(/^@/, '').toLowerCase();
  if (val && !blacklist.includes(val)) {
    blacklist.push(val);
    renderUserList('blacklist-items', blacklist, 'blacklist');
    $('blacklist-input').value = '';
  }
});

$('custom-keyword-add').addEventListener('click', () => {
  const val = $('custom-keyword-input').value.trim();
  if (val && !customKeywords.includes(val)) {
    customKeywords.push(val);
    renderKeywords(customKeywords);
    $('custom-keyword-input').value = '';
  }
});

$('impersonation-add').addEventListener('click', () => {
  const displayName = $('impersonation-name-input').value.trim();
  const legitimateUsername = $('impersonation-user-input').value.trim().replace(/^@/, '').toLowerCase();
  if (!displayName || !legitimateUsername) return;

  const exists = customImpersonation.some(
    (r) => r.displayName === displayName && r.legitimateUsername === legitimateUsername
  );
  if (!exists) {
    const pattern = buildImpersonationPattern(displayName);
    customImpersonation.push({ displayName, pattern, legitimateUsername, matchType: 'regex' });
    renderImpersonation(customImpersonation);
    $('impersonation-name-input').value = '';
    $('impersonation-user-input').value = '';
  }
});

// ── 保存 ────────────────────────────────────────────────────

$('save').addEventListener('click', async () => {
  await chrome.storage.local.set({
    enabled: $('enabled').checked,
    showReason: $('showReason').checked,
    level: $('level').value,
    whitelist,
    blacklist,
    customKeywords,
    customImpersonation,
  });
  const msg = $('saved-msg');
  msg.style.display = 'inline';
  setTimeout(() => (msg.style.display = 'none'), 2000);
});

// ── 加载 ────────────────────────────────────────────────────

chrome.storage.local.get(
  ['enabled', 'showReason', 'level', 'whitelist', 'blacklist', 'customKeywords', 'customImpersonation'],
  (data) => {
    $('enabled').checked = data.enabled !== false;
    $('showReason').checked = data.showReason !== false;
    $('level').value = data.level ?? 'normal';
    whitelist = data.whitelist ?? [];
    blacklist = data.blacklist ?? [];
    customKeywords = data.customKeywords ?? [];
    customImpersonation = data.customImpersonation ?? [];
    renderUserList('whitelist-items', whitelist, 'whitelist');
    renderUserList('blacklist-items', blacklist, 'blacklist');
    renderKeywords(customKeywords);
    renderImpersonation(customImpersonation);
  }
);
