/**
 * 投喂系统 · 核心引擎
 * 负责：配方配置、状态判定、克数计算、单对覆盖、投喂记录、库存扣减
 */
const Feeding = {
  MEAL_LABEL: { am: '早餐', pm: '晚餐' },

  /* ============================================================
     默认配方（全部可在「投喂 → 配方设置」里修改）
     ============================================================ */
  DEFAULT_BASE: {
    young:    { label: '青年鸽',        grams: 13, unit: 'meal', corn: 70, pea: 15, sorghum: 15 },
    breeder:  { label: '种鸽空怀',      grams: 26, unit: 'meal', corn: 70, pea: 15, sorghum: 15 },
    laying:   { label: '种鸽下1个蛋',   grams: 26, unit: 'meal', corn: 45, pea: 35, sorghum: 20 },
    incubate: { label: '种鸽孵化期',    grams: 26, unit: 'meal', corn: 70, pea: 15, sorghum: 15 }
  },

  DEFAULT_CHICK: [
    { id: 'c0',  label: '带仔 0-2天',   from: 0,  to: 2,  grams: 60, unit: 'day', corn: 45, pea: 35, sorghum: 20 },
    { id: 'c1',  label: '带仔 3-5天',   from: 3,  to: 5,  grams: 70, unit: 'day', corn: 45, pea: 35, sorghum: 20 },
    { id: 'c2',  label: '带仔 6-10天',  from: 6,  to: 10, grams: 75, unit: 'day', corn: 45, pea: 35, sorghum: 20 },
    { id: 'c3',  label: '带仔 11-15天', from: 11, to: 15, grams: 75, unit: 'day', corn: 45, pea: 35, sorghum: 20 },
    { id: 'c4',  label: '带仔 16-20天', from: 16, to: 20, grams: 70, unit: 'day', corn: 52, pea: 29, sorghum: 19 },
    { id: 'c5',  label: '带仔 21-25天', from: 21, to: 25, grams: 60, unit: 'day', corn: 62, pea: 17, sorghum: 21 }
  ],

  /* ============================================================
     配置读写
     ============================================================ */
  feedIds() {
    const feeds = Storage.getFeeds();
    const idOf = (name, fb) => (feeds.find(f => f.name === name) || {}).id || fb;
    return {
      corn: idOf('玉米', 'f1'),
      pea: idOf('豌豆', 'f3'),
      sorghum: idOf('高粱', 'f6')
    };
  },

  defaultCfg() {
    return {
      v: 1,
      feeds: this.feedIds(),
      base: JSON.parse(JSON.stringify(this.DEFAULT_BASE)),
      chick: JSON.parse(JSON.stringify(this.DEFAULT_CHICK))
    };
  },

  cfg() {
    const d = this.defaultCfg();
    const s = Storage.getFeedingCfg();
    if (!s) return d;
    const base = {};
    Object.keys(d.base).forEach(k => { base[k] = Object.assign({}, d.base[k], (s.base || {})[k] || {}); });
    const chick = d.chick.map(st => {
      const old = (s.chick || []).find(x => x.id === st.id);
      return Object.assign({}, st, old || {});
    });
    return {
      v: 1,
      feeds: Object.assign({}, d.feeds, s.feeds || {}),
      base,
      chick
    };
  },

  saveCfg(c) { Storage.setFeedingCfg(c); },

  /** 确保三大主料（玉米/豌豆/高粱）与配方配置存在 */
  ensureDefaults() {
    let feeds = Storage.getFeeds();
    const need = [
      { name: '玉米', price: 2.8, preferred: 'f1' },
      { name: '豌豆', price: 4.5, preferred: 'f3' },
      { name: '高粱', price: 3.6, preferred: 'f6' }
    ];
    let changed = false;
    need.forEach(n => {
      if (!feeds.some(f => f.name === n.name)) {
        const id = feeds.some(f => f.id === n.preferred) ? Utils.uid('f') : n.preferred;
        feeds.push({ id, name: n.name, price: n.price, unit: 'kg' });
        changed = true;
      }
    });
    if (changed) {
      Storage.setFeeds(feeds);
      const stock = Storage.getStock();
      feeds.filter(f => need.some(n => n.name === f.name)).forEach(f => {
        if (!stock.some(s => s.feedId === f.id)) {
          stock.push({ feedId: f.id, qty: f.name === '高粱' ? 40 : 100, updatedAt: Utils.today() });
        }
      });
      Storage.setStock(stock);
    }

    // 一次性清理：去掉示例数据的小麦/颗粒配合饲料（实际只用玉米/豌豆/高粱/保健砂）
    if (localStorage.getItem('pigeon_feed_cleanup_v1') !== '1') {
      const keep = Storage.getFeeds().filter(f => f.name !== '小麦' && f.name !== '颗粒配合饲料');
      Storage.setFeeds(keep);
      Storage.setStock(Storage.getStock().filter(s => keep.some(f => f.id === s.feedId)));
      localStorage.setItem('pigeon_feed_cleanup_v1', '1');
    }
    if (!Storage.getFeedingCfg()) Storage.setFeedingCfg(this.defaultCfg());
    else Storage.setFeedingCfg(this.cfg());
    this.fixLogCosts();
  },

  /** 一次性修正历史投喂记录金额（旧版按「单份成本四舍五入后再乘只数」，集体目标会少算） */
  fixLogCosts() {
    if (localStorage.getItem('pigeon_feeding_cost_v2') === '1') return;
    const logs = Storage.getFeedingLog();
    let changed = false;
    logs.forEach(l => {
      const ing = l.ingredient || {};
      const c = this.r2(
        Number(ing.corn || 0) * this.pricePerGram('corn') +
        Number(ing.pea || 0) * this.pricePerGram('pea') +
        Number(ing.sorghum || 0) * this.pricePerGram('sorghum')
      );
      if (Math.abs(c - Number(l.cost || 0)) > 0.001) { l.cost = c; changed = true; }
    });
    if (changed) Storage.setFeedingLog(logs);
    localStorage.setItem('pigeon_feeding_cost_v2', '1');
  },

  feedInfo(key) {
    const id = this.cfg().feeds[key];
    const f = Storage.getFeeds().find(x => x.id === id) || { name: '未设置', price: 0, unit: 'kg' };
    return { id, name: f.name, price: Number(f.price) || 0, unit: f.unit || 'kg' };
  },

  /** 每克单价（库存单位 kg / 斤） */
  pricePerGram(key) {
    const f = this.feedInfo(key);
    return f.price / (f.unit === '斤' ? 500 : 1000);
  },

  /* ============================================================
     工具
     ============================================================ */
  r1(n) { return Math.round(Number(n || 0) * 10) / 10; },
  r2(n) { return Math.round(Number(n || 0) * 100) / 100; },
  r3(n) { return Math.round(Number(n || 0) * 1000) / 1000; },

  addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },

  mealKey(date, meal) { return `${date}:${meal}`; },

  /** 调整生效时机：am=今天早餐 / pm=今天晚餐 / next=明天早餐 */
  effectiveKey(choice) {
    const t = Utils.today();
    if (choice === 'am') return `${t}:am`;
    if (choice === 'pm') return `${t}:pm`;
    return `${this.addDays(t, 1)}:am`;
  },

  effectiveText(choice) {
    if (choice === 'am') return '今天早餐起生效';
    if (choice === 'pm') return '今天晚餐起生效（早餐不变）';
    return '明天早餐起生效（今天不变）';
  },

  currentMeal() {
    return new Date().getHours() < 12 ? 'am' : 'pm';
  },

  ratioText(r) { return `${r.corn}% / ${r.pea}% / ${r.sorghum}%`; },

  /** 按比例把「每餐总量」拆成三种原料克数 */
  split(perMeal, r) {
    const sum = Number(r.corn) + Number(r.pea) + Number(r.sorghum) || 100;
    return {
      corn: this.r1(perMeal * Number(r.corn) / sum),
      pea: this.r1(perMeal * Number(r.pea) / sum),
      sorghum: this.r1(perMeal * Number(r.sorghum) / sum)
    };
  },

  /** 高粱库存是否已断货（断货时配方自动降级，高粱份额并入豌豆） */
  _sorghumOut() {
    try {
      const cfg = this.cfg();
      const sid = cfg && cfg.feeds && cfg.feeds.sorghum;
      if (!sid) return false;
      const e = Storage.getStock().find(s => s.feedId === sid);
      return !e || Number(e.qty) <= 0;
    } catch (err) { return false; }
  },

  buildRecipe(src, label) {
    const grams = Number(src.grams) || 0;
    const unit = src.unit || 'meal';
    const perMeal = unit === 'day' ? grams / 2 : grams;
    let ratio = {
      corn: Number(src.corn) || 0,
      pea: Number(src.pea) || 0,
      sorghum: Number(src.sorghum) || 0
    };
    // 高粱断货自动降级：高粱份额并入豌豆，标注降级
    let degraded = false;
    if (ratio.sorghum > 0 && this._sorghumOut()) {
      ratio = { corn: ratio.corn, pea: this.r1(ratio.pea + ratio.sorghum), sorghum: 0 };
      degraded = true;
    }
    const ingredient = this.split(perMeal, ratio);
    const cost = this.r2(
      ingredient.corn * this.pricePerGram('corn') +
      ingredient.pea * this.pricePerGram('pea') +
      ingredient.sorghum * this.pricePerGram('sorghum')
    );
    return {
      label: degraded ? label + '（无高粱·已降级）' : label,
      grams,
      unit,
      perMeal: this.r1(perMeal),
      ratio,
      ratioText: this.ratioText(ratio),
      ingredient,
      cost,
      degraded
    };
  },

  scaleRecipe(recipe, count) {
    if (count <= 1) return recipe;
    const ingredient = {
      corn: this.r1(recipe.ingredient.corn * count),
      pea: this.r1(recipe.ingredient.pea * count),
      sorghum: this.r1(recipe.ingredient.sorghum * count)
    };
    return {
      ...recipe,
      perMeal: this.r1(recipe.perMeal * count),
      ingredient,
      // 用放大后的原料克数重新计价，避免「单份成本先四舍五入再乘只数」的累计偏差
      cost: this.r2(
        ingredient.corn * this.pricePerGram('corn') +
        ingredient.pea * this.pricePerGram('pea') +
        ingredient.sorghum * this.pricePerGram('sorghum')
      )
    };
  },

  /* ============================================================
     状态判定
     ============================================================ */
  /**
   * 配对当前投喂状态
   * 带仔 0-25 天 → 阶段日粮；下 1 个蛋 → 高蛋白配比；2 个蛋后 → 孵化配比；其余 → 空怀
   */
  pairState(breed, date) {
    if (!breed || breed.status === 'failed') return null;
    date = date || Utils.today();
    const cfg = this.cfg();

    if (breed.hatchDate && ['fledged', 'weaned', 'fattening'].includes(breed.status)) {
      const age = Utils.daysBetween(breed.hatchDate, date);
      if (age >= 0 && age <= 25) {
        const stage = cfg.chick.find(s => age >= s.from && age <= s.to) || cfg.chick[cfg.chick.length - 1];
        return { kind: 'chick', key: stage.id, stage, label: `带仔 ${age}天`, dayAge: age, source: stage };
      }
    }

    const eggs = Number(
      breed.eggCount != null ? breed.eggCount : (breed.status === 'hatching' || breed.status === 'incubating' ? 2 : 0)
    );
    if (eggs >= 2) return { kind: 'base', key: 'incubate', label: '孵化中·2枚蛋', source: cfg.base.incubate };
    if (eggs === 1) return { kind: 'base', key: 'laying', label: '下1个蛋', source: cfg.base.laying };
    return {
      kind: 'base', key: 'breeder',
      label: breed.status === 'sold' ? '出栏后空怀' : '种鸽空怀',
      source: cfg.base.breeder
    };
  },

  pairTitle(breed) {
    const m = Utils.pigeonById(breed.maleId);
    const f = Utils.pigeonById(breed.femaleId);
    return `${m ? m.code : '?'} × ${f ? f.code : '?'}`;
  },

  /** 青年鸽群 = 幼鸽 + 育肥 + 未配对种鸽（出栏后/没配对都按青年鸽算，归档的不算） */
  youngGroup() {
    const paired = new Set();
    Storage.getBreeds().forEach(b => {
      if (b.maleId) paired.add(b.maleId);
      if (b.femaleId) paired.add(b.femaleId);
    });
    const list = Storage.getPigeons().filter(p =>
      !p.archived && (
        p.status === 'young' ||
        p.status === 'fattening' ||
        (p.status === 'breeder' && !paired.has(p.id))
      ));
    return { count: list.length, list };
  },

  /* ============================================================
     单对 / 群体覆盖
     ============================================================ */
  /** 读取某对/群体保存的所有配方版本（兼容旧的单对象结构） */
  overrideList(type, id) {
    const all = Storage.getFeedingOverrides();
    const raw = type === 'pair' ? (all.pairs || {})[id] : all.young;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  },

  activeOverride(type, id, date, meal) {
    const key = this.mealKey(date, meal);
    const list = this.overrideList(type, id)
      .filter(o => o && o.effectiveKey && o.effectiveKey <= key)
      .sort((a, b) => b.effectiveKey.localeCompare(a.effectiveKey));
    return list[0] || null;
  },

  /** 尚未生效的最近一条（用于详情页提示） */
  pendingOverride(type, id, date, meal) {
    const key = this.mealKey(date, meal);
    return this.overrideList(type, id)
      .filter(o => o && o.effectiveKey && o.effectiveKey > key)
      .sort((a, b) => a.effectiveKey.localeCompare(b.effectiveKey))[0] || null;
  },

  saveOverride(type, id, data) {
    const all = Storage.getFeedingOverrides();
    all.pairs = all.pairs || {};
    const list = this.overrideList(type, id);
    const idx = list.findIndex(o => o.effectiveKey === data.effectiveKey);
    if (idx >= 0) list[idx] = data; else list.push(data);
    // 只保留最近 10 个版本，避免无限增长
    const kept = list.sort((a, b) => a.effectiveKey.localeCompare(b.effectiveKey)).slice(-10);
    if (type === 'pair') all.pairs[id] = kept;
    else all.young = kept;
    Storage.setFeedingOverrides(all);
  },

  clearOverride(type, id) {
    const all = Storage.getFeedingOverrides();
    if (type === 'pair') {
      if (all.pairs) delete all.pairs[id];
    } else {
      all.young = null;
    }
    Storage.setFeedingOverrides(all);
  },

  /* ============================================================
     配方计算
     ============================================================ */
  recipeForPair(breed, date, meal) {
    const state = this.pairState(breed, date);
    if (!state) return null;
    const ov = this.activeOverride('pair', breed.id, date, meal);
    const src = ov || state.source;
    const recipe = this.buildRecipe(src, state.label);
    recipe.override = !!ov;
    recipe.effectiveText = ov ? ov.effectiveText : '';
    return recipe;
  },

  recipeForYoung(date, meal) {
    const ov = this.activeOverride('young', 'young', date, meal);
    const cfg = this.cfg();
    const recipe = this.buildRecipe(ov || cfg.base.young, '青年鸽');
    recipe.override = !!ov;
    recipe.effectiveText = ov ? ov.effectiveText : '';
    return recipe;
  },

  /** 某天某餐的全部投喂目标（归档种鸽的对子不投喂；同一对只投一次——优先最新进行中的窝） */
  targetsFor(date, meal) {
    date = date || Utils.today();
    meal = meal || 'am';
    const list = [];
    const archived = new Set(Storage.getPigeons().filter(p => p.archived).map(p => p.id));
    // 新窝在前：同对多窝时优先取最新窝的配方状态（孵化中/带仔/空怀）
    const breeds = Storage.getBreeds()
      .filter(b => !archived.has(b.maleId) && !archived.has(b.femaleId))
      .sort((a, b) => String(b.pairDate || '').localeCompare(String(a.pairDate || '')));
    const seenCouple = new Set();
    breeds.forEach(b => {
      const key = b.maleId + '|' + b.femaleId;
      if (seenCouple.has(key)) return;
      const recipe = this.recipeForPair(b, date, meal);
      if (!recipe) return;   // 失败窝跳过，同对其它窝仍可投
      seenCouple.add(key);
      list.push({
        type: 'pair', id: b.id, title: this.pairTitle(b), label: recipe.label,
        count: 1, perMeal: recipe.perMeal, ingredient: recipe.ingredient,
        cost: recipe.cost, recipe, breed: b,
        fed: !!this.logFor(date, meal, 'pair', b.id)
      });
    });
    const group = this.youngGroup();
    if (group.count > 0) {
      const base = this.recipeForYoung(date, meal);
      const recipe = this.scaleRecipe(base, group.count);
      list.push({
        type: 'young', id: 'young', title: `青年鸽群（${group.count}只）`, label: '青年鸽',
        count: group.count, perMeal: recipe.perMeal, ingredient: recipe.ingredient,
        cost: recipe.cost, recipe: base, scaled: recipe,
        fed: !!this.logFor(date, meal, 'young', 'young')
      });
    }
    return list;
  },

  todaySummary(date) {
    date = date || Utils.today();
    const logs = Storage.getFeedingLog();
    const out = {};
    ['am', 'pm'].forEach(meal => {
      const targets = this.targetsFor(date, meal);
      const mealLogs = logs.filter(l => l.date === date && l.meal === meal);
      out[meal] = {
        targets,
        logs: mealLogs,
        needGram: this.r1(targets.reduce((s, t) => s + t.perMeal, 0)),
        needCost: this.r2(targets.reduce((s, t) => s + t.cost, 0)),
        fedGram: this.r1(mealLogs.reduce((s, l) => s + Number(l.total || 0), 0)),
        fedCost: this.r2(mealLogs.reduce((s, l) => s + Number(l.cost || 0), 0)),
        doneCount: targets.filter(t => t.fed).length,
        totalCount: targets.length
      };
    });
    return out;
  },

  /* ============================================================
     投喂记录
     ============================================================ */
  logFor(date, meal, targetType, targetId) {
    return Storage.getFeedingLog().find(l =>
      l.date === date && l.meal === meal && l.targetType === targetType && l.targetId === targetId
    ) || null;
  },

  /**
   * 记录一次投喂
   * target: targetsFor 的条目；custom: {grams, unit, corn, pea, sorghum} 本次临时调整
   * opts: { auto:true, reason:'自动扣料' } → 标记为自动扣料（待人工确认）
   */
  feed(target, date, meal, custom, opts) {
    date = date || Utils.today();
    meal = meal || 'am';
    const count = target.count || 1;
    let recipe = target.recipe;
    if (custom) recipe = this.buildRecipe(custom, target.label);
    const scaled = this.scaleRecipe(recipe, count);

    const log = {
      id: Utils.uid('fd'),
      date,
      meal,
      targetType: target.type,
      targetId: target.id,
      title: target.title,
      label: target.label,
      count,
      unit: recipe.unit,
      grams: recipe.grams,
      perMeal: scaled.perMeal,
      total: scaled.perMeal,
      ratio: recipe.ratio,
      ingredient: scaled.ingredient,
      cost: scaled.cost,
      auto: !!(opts && opts.auto),
      autoReason: (opts && opts.reason) || '',
      createdAt: new Date().toISOString()
    };

    const logs = Storage.getFeedingLog();
    // 同一餐同一目标只保留一条，避免重复扣库存
    const idx = logs.findIndex(l => l.date === date && l.meal === meal && l.targetType === target.type && l.targetId === target.id);
    if (idx >= 0) {
      this._adjustStock(logs[idx].ingredient, 1, date);
      logs.splice(idx, 1);
    }
    logs.push(log);
    Storage.setFeedingLog(logs);
    this._adjustStock(log.ingredient, -1, date);
    return log;
  },

  undo(logId) {
    const logs = Storage.getFeedingLog();
    const idx = logs.findIndex(l => l.id === logId);
    if (idx < 0) return false;
    const log = logs[idx];
    this._adjustStock(log.ingredient, 1, log.date);
    logs.splice(idx, 1);
    Storage.setFeedingLog(logs);
    return true;
  },

  /* ============================================================
     批次库存（先进先出 FIFO）
     库存条目：{ feedId, qty, updatedAt, batches:[{id,date,qty,price,note}] }
     - 入库/退回 → 新增一个批次
     - 扣料     → 从最老的批次开始扣
     - 旧数据无批次 → 首次访问时自动打包成一个批次
     ============================================================ */
  _stockEntry(feedId, date) {
    const stock = Storage.getStock();
    let e = stock.find(s => s.feedId === feedId);
    if (!e) {
      e = { feedId, qty: 0, updatedAt: date || Utils.today(), batches: [] };
      stock.push(e);
    }
    if (!e.batches) {
      e.batches = Number(e.qty) > 0
        ? [{ id: Utils.uid('bt'), date: e.updatedAt || Utils.today(), qty: Number(e.qty), price: 0, note: '旧库存迁移' }]
        : [];
    }
    return e;
  },

  /** 批次出入库：sign=1 新批次入库；sign=-1 先进先出扣减 */
  adjustBatches(feedId, qty, sign, date, price, note) {
    const stock = Storage.getStock();
    let e = stock.find(s => s.feedId === feedId);
    if (!e) {
      e = { feedId, qty: 0, updatedAt: date || Utils.today(), batches: [] };
      stock.push(e);
    }
    if (!e.batches) {
      e.batches = Number(e.qty) > 0
        ? [{ id: Utils.uid('bt'), date: e.updatedAt || Utils.today(), qty: Number(e.qty), price: 0, note: '旧库存迁移' }]
        : [];
    }
    qty = Math.round(Number(qty) * 1000) / 1000;
    if (qty > 0) {
      if (sign > 0) {
        e.batches.push({ id: Utils.uid('bt'), date: date || Utils.today(), qty, price: Number(price) || 0, note: note || '' });
      } else {
        let need = qty;
        e.batches.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
        for (const bt of e.batches) {
          if (need <= 0) break;
          const take = Math.min(bt.qty, need);
          bt.qty = Math.round((bt.qty - take) * 1000) / 1000;
          need -= take;
        }
        e.batches = e.batches.filter(b => b.qty > 0.0001);
      }
    }
    e.qty = Math.round(e.batches.reduce((s, b) => s + Number(b.qty), 0) * 1000) / 1000;
    e.updatedAt = date || Utils.today();
    Storage.setStock(stock); // 保存同一个数组引用，避免二次 parse 丢修改
    return e;
  },

  /** 盘点修正：把库存调整到实际数（差额作为修正批次 / 先进先出扣减） */
  stockTake(feedId, actualQty, note) {
    const e = this._stockEntry(feedId);
    const diff = Math.round((Number(actualQty) - Number(e.qty)) * 1000) / 1000;
    if (Math.abs(diff) < 0.0001) { Utils.toast('与当前库存一致，无需修正'); return e; }
    if (diff > 0) return this.adjustBatches(feedId, diff, 1, null, 0, note || '盘盈修正');
    return this.adjustBatches(feedId, -diff, -1, null, 0, note || '盘亏修正');
  },

  _adjustStock(ingredient, sign, date) {
    const cfg = this.cfg();
    ['corn', 'pea', 'sorghum'].forEach(k => {
      const feedId = cfg.feeds[k];
      const grams = Number((ingredient || {})[k] || 0);
      if (!feedId || !grams) return;
      this.adjustBatches(feedId, grams / 1000, sign, date);
    });
  },

  /** 库存是否够这一餐 */
  stockCheck(ingredient) {
    const cfg = this.cfg();
    const stock = Storage.getStock();
    const lack = [];
    ['corn', 'pea', 'sorghum'].forEach(k => {
      const need = Number((ingredient || {})[k] || 0) / 1000;
      const e = stock.find(s => s.feedId === cfg.feeds[k]);
      const qty = e ? Number(e.qty) : 0;
      if (need > qty) lack.push({ key: k, name: this.feedInfo(k).name, need: this.r3(need), qty: this.r2(qty) });
    });
    return lack;
  },

  /* ============================================================
     金额统计（供首页 / 盈利 / 库存使用）
     ============================================================ */
  logsBetween(start, end) {
    return Storage.getFeedingLog().filter(l => l.date >= start && l.date <= end);
  },

  costBetween(start, end) {
    return this.r2(this.logsBetween(start, end).reduce((s, l) => s + Number(l.cost || 0), 0));
  },

  costOfDay(date) {
    date = date || Utils.today();
    return this.costBetween(date, date);
  },

  costOfPair(breedId, start, end) {
    return this.r2(Storage.getFeedingLog()
      .filter(l => l.targetType === 'pair' && l.targetId === breedId && l.date >= start && l.date <= end)
      .reduce((s, l) => s + Number(l.cost || 0), 0));
  },

  /** 某饲料在区间内被投喂掉的公斤数 */
  kgOfFeedBetween(feedId, start, end) {
    const cfg = this.cfg();
    const key = Object.keys(cfg.feeds).find(k => cfg.feeds[k] === feedId);
    if (!key) return 0;
    return this.logsBetween(start, end)
      .reduce((s, l) => s + Number((l.ingredient || {})[key] || 0) / 1000, 0);
  },

  recentLogs(limit = 20) {
    return Storage.getFeedingLog()
      .slice()
      .sort((a, b) => (b.date + b.meal).localeCompare(a.date + a.meal) || String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  }
};
