/**
 * 数据持久化层 - 基于 LocalStorage
 * 所有数据以 JSON 存储，自动处理初始种子数据
 */
const Storage = {
  KEYS: {
    PIGEONS: 'pigeon_pigeons',       // 鸽子个体
    BREEDS:  'pigeon_breeds',        // 繁殖/配对/孵化记录
    FEEDS:   'pigeon_feeds',         // 饲料种类
    STOCK:   'pigeon_stock',         // 饲料库存
    FEED_LOG:'pigeon_feed_log',      // 饲料消耗记录
    SALES:   'pigeon_sales',         // 出栏/销售记录
    PEN:     'pigeon_pen',           // 鸽舍/圈舍
    ACCOUNTS:'pigeon_accounts',      // 账目（手动收入/支出）
    PAIR_PLANS:'pigeon_pair_plans',  // 配对计划
    AGING_CONFIG:'pigeon_aging_cfg', // 老龄化淘汰配置
    FEEDING_CFG:'pigeon_feeding_cfg',        // 投喂配方配置
    FEEDING_OVERRIDES:'pigeon_feeding_ovr',  // 单对/群体的配方覆盖
    FEEDING_LOG:'pigeon_feeding_log',        // 投喂记录
    EGG_STOCK:'pigeon_egg_stock',            // 鸽蛋库存（未受精蛋自动入库）
    RING_STOCK:'pigeon_ring_stock',          // 脚环库存
    EXCEPTIONS:'pigeon_exceptions',          // 异常记录（生病/药费/恢复）
    HEALTH_CFG:'pigeon_health_cfg'           // 保健砂/多维提醒配置
  },

  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
    } catch (e) {
      console.error('Storage get error:', key, e);
      return fallback !== undefined ? fallback : null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // 云端同步：本机数据变更 → 打时间戳 + 延迟上传
      if (window.Cloud) {
        Cloud.touchLocal();
        Cloud.schedule();
      }
      return true;
    } catch (e) {
      console.error('Storage set error:', key, e);
      return false;
    }
  },

  // ========== 便捷操作 ==========
  getPigeons() { return this.get(this.KEYS.PIGEONS, []); },
  setPigeons(v) { return this.set(this.KEYS.PIGEONS, v); },

  getBreeds()  { return this.get(this.KEYS.BREEDS, []); },
  setBreeds(v) { return this.set(this.KEYS.BREEDS, v); },

  getFeeds()   { return this.get(this.KEYS.FEEDS, []); },
  setFeeds(v)  { return this.set(this.KEYS.FEEDS, v); },

  getStock()   { return this.get(this.KEYS.STOCK, []); },
  setStock(v)  { return this.set(this.KEYS.STOCK, v); },

  getFeedLog() { return this.get(this.KEYS.FEED_LOG, []); },
  setFeedLog(v){ return this.set(this.KEYS.FEED_LOG, v); },

  getSales()   { return this.get(this.KEYS.SALES, []); },
  setSales(v)  { return this.set(this.KEYS.SALES, v); },

  getPens()    { return this.get(this.KEYS.PEN, []); },
  setPens(v)   { return this.set(this.KEYS.PEN, v); },

  getAccounts()  { return this.get(this.KEYS.ACCOUNTS, []); },
  setAccounts(v) { return this.set(this.KEYS.ACCOUNTS, v); },

  // 配对计划（用户设置：要多少对、目标时间、起始时间）
  getPairPlans()  { return this.get(this.KEYS.PAIR_PLANS, []); },
  setPairPlans(v) { return this.set(this.KEYS.PAIR_PLANS, v); },

  // 老龄化配置（种鸽淘汰阈值）
  getAgingConfig()  {
    return this.get(this.KEYS.AGING_CONFIG, {
      breederMaxMonths: 36,   // 种鸽超过36个月建议淘汰
      henMaxMonths: 36        // 雌鸽同理
    });
  },
  setAgingConfig(v) { return this.set(this.KEYS.AGING_CONFIG, v); },

  // 投喂配方配置（玉米/豌豆/高粱克数与比例）
  getFeedingCfg() { return this.get(this.KEYS.FEEDING_CFG, null); },
  setFeedingCfg(v) { return this.set(this.KEYS.FEEDING_CFG, v); },

  // 单对 / 青年鸽群的配方覆盖
  getFeedingOverrides() { return this.get(this.KEYS.FEEDING_OVERRIDES, { pairs: {}, young: null }); },
  setFeedingOverrides(v) { return this.set(this.KEYS.FEEDING_OVERRIDES, v); },

  // 投喂记录
  getFeedingLog() { return this.get(this.KEYS.FEEDING_LOG, []); },
  setFeedingLog(v) { return this.set(this.KEYS.FEEDING_LOG, v); },

  // 鸽蛋库存 { qty, price, logs:[{date,count,breedId,source,note}] }
  getEggStock() {
    return this.get(this.KEYS.EGG_STOCK, { qty: 0, price: 4, logs: [] });
  },
  setEggStock(v) { return this.set(this.KEYS.EGG_STOCK, v); },

  // 脚环库存 { qty, price, logs:[{date,count,price,note}] }
  getRingStock() {
    return this.get(this.KEYS.RING_STOCK, { qty: 0, price: 1.5, logs: [] });
  },
  setRingStock(v) { return this.set(this.KEYS.RING_STOCK, v); },

  // 异常记录 [{ id, pigeonId, date, note, cost, resolved, resolveDate, resolveCost }]
  getExceptions() { return this.get(this.KEYS.EXCEPTIONS, []); },
  setExceptions(v) { return this.set(this.KEYS.EXCEPTIONS, v); },

  // 保健砂/多维提醒 { gritDailyGrams, gritPackGrams, vitaminDays, lastGritDate, lastVitaminDate }
  getHealthCfg() {
    return this.get(this.KEYS.HEALTH_CFG, {
      gritDailyGrams: 30, gritPackGrams: 500, vitaminDays: 7,
      lastGritDate: null, lastVitaminDate: null
    });
  },
  setHealthCfg(v) { return this.set(this.KEYS.HEALTH_CFG, v); },

  // ========== 导入导出 ==========
  exportAll() {
    const data = {};
    Object.values(this.KEYS).forEach(k => { data[k] = this.get(k); });
    return JSON.stringify(data, null, 2);
  },

  importAll(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(data).forEach(k => { localStorage.setItem(k, JSON.stringify(data[k])); });
      return true;
    } catch (e) {
      return false;
    }
  },

  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    // 清除初始化标记，重置后才能重新写入示例/投喂测试数据
    localStorage.removeItem('pigeon_inited');
    localStorage.removeItem('pigeon_feeding_test_v1');
    localStorage.removeItem('pigeon_feeding_cost_v2');
  },

  /** 仅在首次使用时写入种子数据 */
  initIfEmpty() {
    const firstRun = localStorage.getItem('pigeon_inited');
    if (!firstRun) {
      SeedData.write();
      localStorage.setItem('pigeon_inited', '1');
    } else {
      // 后续升级：补齐新增的 accounts 表
      if (!localStorage.getItem(this.KEYS.ACCOUNTS)) {
        const seed = SeedData._buildAccounts();
        localStorage.setItem(this.KEYS.ACCOUNTS, JSON.stringify(seed));
      }
    }
  }
};
