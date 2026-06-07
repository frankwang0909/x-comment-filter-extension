// ============================================================
// 本地存储封装（chrome.storage.local）
// ============================================================

const Storage = (() => {
  const DEFAULTS = {
    enabled: true,
    level: 'normal',          // 'loose' | 'normal' | 'strict'
    hideMode: true,           // true = 直接隐藏，不显示占位条
    showReason: true,
    whitelist: [],            // username strings
    blacklist: [],            // username strings
    customKeywords: [],       // 用户自定义关键词（昵称/用户名/正文任一命中即屏蔽）
    customImpersonation: [],  // 用户自定义仿冒保护 [{displayName, legitimateUsername}]
    stats: { today: 0, total: 0, restored: 0, lastDate: '' },
  };

  async function get(keys = null) {
    return new Promise((resolve) => {
      const storageArea = getStorageArea();
      if (!storageArea) {
        resolve({ ...DEFAULTS });
        return;
      }

      safeStorageCall(
        () => storageArea.get(keys ?? Object.keys(DEFAULTS), (result) => {
          if (hasRuntimeError()) {
            resolve({ ...DEFAULTS });
            return;
          }
          resolve({ ...DEFAULTS, ...result });
        }),
        () => resolve({ ...DEFAULTS })
      );
    });
  }

  async function set(data) {
    return new Promise((resolve) => {
      const storageArea = getStorageArea();
      if (!storageArea) {
        resolve();
        return;
      }

      safeStorageCall(
        () => storageArea.set(data, () => {
          resolve();
        }),
        () => resolve()
      );
    });
  }

  async function getSettings() {
    return get(['enabled', 'level', 'hideMode', 'showReason', 'whitelist', 'blacklist', 'customKeywords', 'customImpersonation']);
  }

  function localDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 串行化 stats 的 read-modify-write，防止并发扫描时互相覆盖
  let _statsQueue = Promise.resolve();
  function incrementStat(key) {
    _statsQueue = _statsQueue
      .catch(() => {})
      .then(async () => {
        const { stats } = await get(['stats']);
        const today = localDateString();
        if (stats.lastDate !== today) {
          stats.today = 0;
          stats.lastDate = today;
        }
        stats[key] = (stats[key] ?? 0) + 1;
        if (key === 'total') stats.today += 1;
        await set({ stats });
      })
      .catch(() => {});
    return _statsQueue;
  }

  async function addToList(listName, username) {
    const data = await get([listName]);
    const list = data[listName] ?? [];
    if (!list.includes(username)) {
      list.push(username);
      await set({ [listName]: list });
    }
  }

  async function removeFromList(listName, username) {
    const data = await get([listName]);
    const list = (data[listName] ?? []).filter((u) => u !== username);
    await set({ [listName]: list });
  }

  function safeStorageCall(run, fallback) {
    try {
      run();
    } catch (error) {
      if (!getStorageArea() || isContextInvalidated(error)) {
        fallback();
        return;
      }
      throw error;
    }
  }

  function isContextInvalidated(error) {
    return /Extension context invalidated/i.test(error?.message || '');
  }

  function getStorageArea() {
    try {
      return globalThis.chrome?.storage?.local ?? null;
    } catch (_) {
      return null;
    }
  }

  function hasRuntimeError() {
    try {
      return Boolean(globalThis.chrome?.runtime?.lastError);
    } catch (_) {
      return true;
    }
  }

  return { get, set, getSettings, incrementStat, addToList, removeFromList };
})();
