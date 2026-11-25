/**
 * 通用工具函数
 */
const Utils = {
  // ========== 日期 ==========
  today() {
    return new Date().toISOString().slice(0, 10);
  },

  daysBetween(d1, d2) {
    if (!d1 || !d2) return 0;
    const a = new Date(d1), b = new Date(d2);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  formatDateFull(dateStr) {
    if (!dateStr) return '-';
    return dateStr;
  },

  ageDays(dob) {
    return this.daysBetween(dob, this.today());
  },

  /** 距离目标日期还有/过了几天，返回可读文本 */
  daysUntil(target) {
    if (!target) return '';
    const diff = this.daysBetween(this.today(), target);
    if (diff === 0) return '今天';
    if (diff > 0) return `还有 ${diff} 天`;
    return `已过 ${-diff} 天`;
  },

  // ========== 数字/金额 ==========
  fmtMoney(n) {
    if (n == null) return '¥0.00';
    return '¥' + Number(n).toFixed(2);
  },

  fmtNum(n, digits = 1) {
    if (n == null) return '0';
    return Number(n).toFixed(digits);
  },

  /** 克数显示：最多 1 位小数，去掉多余的 0（2.1111 → 2.1，30 → 30） */
  fmtG(n) {
    const x = Math.round((Number(n) || 0) * 10) / 10;
    return String(x);
  },

  // ========== ID ==========
  uid(prefix = 'id') {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  // ========== 鸽舍/名称查找 ==========
  penName(id) {
    const pen = Storage.getPens().find(p => p.id === id);
    return pen ? pen.name : '-';
  },

  feedName(id) {
    const f = Storage.getFeeds().find(x => x.id === id);
    return f ? f.name : '已删饲料';
  },

  pigeonById(id) {
    return Storage.getPigeons().find(p => p.id === id);
  },

  /** 某只鸽子当前未恢复的异常记录 */
  unresolvedException(pid) {
    return Storage.getExceptions().find(e => e.pigeonId === pid && !e.resolved);
  },

  /** 药费成本（异常初始药费 + 恢复补记药费） */
  pigeonMedCost(id) {
    return Storage.getExceptions().filter(e => e.pigeonId === id)
      .reduce((s, e) => s + (e.cost || 0) + (e.resolveCost || 0), 0);
  },

  /** 这对配对是否有未恢复异常（任一只） */
  pairHasUnresolved(b) {
    return !!(this.unresolvedException(b.maleId) || this.unresolvedException(b.femaleId));
  },

  /** 繁殖损失合计（作废/啄蛋/无受精算损失） */
  pairLossTotal(b) {
    return (b.losses || []).reduce((s, l) => s + (l.amount || 0), 0);
  },

  /** 个人繁殖损失分摊（参与过的每窝损失 ÷ 2） */
  pigeonLossCost(id) {
    return Storage.getBreeds().filter(b => b.maleId === id || b.femaleId === id)
      .reduce((s, b) => s + this.pairLossTotal(b) / 2, 0);
  },

  /** 硬性成本汇总 = 买价 + 药费 + 繁殖损失分摊 + 窝成本转入 */
  pigeonHardCost(id) {
    const p = this.pigeonById(id);
    if (!p) return 0;
    return (p.purchasePrice || 0) + this.pigeonMedCost(id) +
      this.pigeonLossCost(id) + (p.nestCostInherited || 0);
  },

  codeExists(code, ignoreId) {
    const c = String(code || '').trim().toUpperCase();
    if (!c) return false;
    return Storage.getPigeons().some(p =>
      p.id !== ignoreId && String(p.code || '').trim().toUpperCase() === c);
  },

  /** 某只鸽子的 N 代祖先 → Map<祖先id, 代数> */
  ancestorsOf(id, depth = 4) {
    const map = new Map();
    const walk = (pid, gen) => {
      if (!pid || gen > depth) return;
      const p = this.pigeonById(pid);
      if (!p) return;
      [p.sireId, p.damId].forEach(pid2 => {
        if (!pid2) return;
        if (!map.has(pid2) || map.get(pid2) > gen) map.set(pid2, gen);
        walk(pid2, gen + 1);
      });
    };
    walk(id, 1);
    return map;
  },

  /** 出售/死亡后编号加「.」；同名退役编号已存在则递增序号（A1001. → A1001.2 → A1001.3） */
  retireCode(code, selfId) {
    if (!code) return code;
    const base = String(code).replace(/\.+$/, '');
    const taken = n => Storage.getPigeons().some(z =>
      z.id !== selfId && String(z.code || '').trim() === (n === 1 ? base + '.' : base + '.' + n));
    if (!taken(1)) return base + '.';
    let n = 2;
    while (taken(n)) n++;
    return base + '.' + n;
  },

  /** 家族代数：外购或无父母记录 = 第 1 代；子代 = 父母最大代数 + 1 */
  generationOf(id) {
    const p = this.pigeonById(id);
    if (!p) return 1;
    if (p.source === 'purchased') return 1;
    const gens = [p.sireId, p.damId].filter(Boolean).map(pid => this.generationOf(pid));
    return gens.length ? Math.max(...gens) + 1 : 1;
  },

  /**
   * 4 代内近亲检查
   * @returns {{related:boolean, commonId?:string, maleGen?:number, femaleGen?:number}}
   */
  inbreedingCheck(maleId, femaleId, depth = 4) {
    if (!maleId || !femaleId) return { related: false };
    if (maleId === femaleId) return { related: true, commonId: maleId, maleGen: 0, femaleGen: 0 };
    const a = this.ancestorsOf(maleId, depth);
    const b = this.ancestorsOf(femaleId, depth);
    if (a.has(femaleId)) return { related: true, commonId: femaleId, maleGen: a.get(femaleId), femaleGen: 0 };
    if (b.has(maleId)) return { related: true, commonId: maleId, maleGen: 0, femaleGen: b.get(maleId) };
    for (const [aid, ga] of a) {
      if (b.has(aid)) return { related: true, commonId: aid, maleGen: ga, femaleGen: b.get(aid) };
    }
    return { related: false };
  },

  // ========== 日期工具 ==========
  /** 当前月份 YYYY-MM */
  currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  /** 获取某月起始和结束日期 */
  monthRange(ym) {
    const [y, m] = ym.split('-').map(Number);
    const first = `${ym}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const last = `${ym}-${String(lastDay).padStart(2,'0')}`;
    return { first, last };
  },

  // ========== 多源聚合统计（统一口径） ==========
  /**
   * 汇总指定区间的收支
   * 收入来源：sales + accounts(income)
   * 支出来源：feed_log + accounts(expense)
   */
  aggregateBetween(start, end) {
    // 收入 = 销售 + 手动收入账目
    const salesInRange = Storage.getSales()
      .filter(s => s.saleDate >= start && s.saleDate <= end)
      .reduce((s, x) => s + Number(x.total || 0), 0);

    const acctIncome = Storage.getAccounts()
      .filter(a => a.type === 'income' && a.date >= start && a.date <= end)
      .reduce((s, a) => s + Number(a.amount || 0), 0);

    // 支出 = 饲料消耗 + 投喂系统消耗 + 手动支出账目
    const feedInRange = Storage.getFeedLog()
      .filter(l => l.date >= start && l.date <= end)
      .reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);

    const feedingInRange = Feeding.costBetween(start, end);

    const acctExpense = Storage.getAccounts()
      .filter(a => a.type === 'expense' && a.date >= start && a.date <= end)
      .reduce((s, a) => s + Number(a.amount || 0), 0);

    return {
      income:  salesInRange + acctIncome,
      expense: feedInRange + feedingInRange + acctExpense,
      profit:  (salesInRange + acctIncome) - (feedInRange + feedingInRange + acctExpense),
      // 明细，用于明细弹窗
      salesInRange, acctIncome, feedInRange, feedingInRange, acctExpense
    };
  },

  /** 累计（全量） */
  aggregateAll() {
    return this.aggregateBetween('0000-01-01', '9999-12-31');
  },

  /** 本月 */
  aggregateMonth(ym) {
    ym = ym || this.currentMonth();
    const { first, last } = this.monthRange(ym);
    return this.aggregateBetween(first, last);
  },

  /** 上一个完整月 */
  aggregatePrevMonth() {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const date = new Date(y, m - 2, 1); // 上个月第1天
    const ym = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
    const { first, last } = this.monthRange(ym);
    return { ...this.aggregateBetween(first, last), ym };
  },

  /** 某一年 */
  aggregateYear(year) {
    year = year || new Date().getFullYear();
    return this.aggregateBetween(`${year}-01-01`, `${year}-12-31`);
  },

  // ========== 鸽子吃用（饲料消耗）专用 ==========
  /** 某月鸽子吃用总金额 */
  feedCostOfMonth(ym) {
    ym = ym || this.currentMonth();
    const { first, last } = this.monthRange(ym);
    const manual = Storage.getFeedLog()
      .filter(l => l.date >= first && l.date <= last)
      .reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
    return manual + Feeding.costBetween(first, last);
  },

  /** 单日鸽子吃用 */
  feedCostOfDay(dateStr) {
    dateStr = dateStr || this.today();
    const manual = Storage.getFeedLog()
      .filter(l => l.date === dateStr)
      .reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
    return manual + Feeding.costOfDay(dateStr);
  },

  /** N 天前的日期 */
  daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  },

  // ========== 日均消耗 & 剩余天数 ==========
  /** 某饲料最近 N 天日均消耗量 */
  dailyAvgConsume(feedId, days = 30) {
    const start = this.daysAgo(days);
    const end = this.today();
    const logs = Storage.getFeedLog()
      .filter(l => l.feedId === feedId && l.date >= start && l.date <= end);
    const manualTotal = logs.reduce((s, l) => s + Number(l.qty || 0), 0);
    const feedingTotal = Feeding.kgOfFeedBetween(feedId, start, end);
    const total = manualTotal + feedingTotal;
    if (logs.length === 0 && feedingTotal === 0) return { avg: 0, total: 0, days: 0, price: 0 };
    // 日均 = 总量 / 实际有消耗的天数（更合理）
    const daySet = new Set(logs.map(l => l.date));
    Feeding.logsBetween(start, end).forEach(l => daySet.add(l.date));
    const uniqueDays = daySet.size;
    const avg = total / Math.max(uniqueDays, 1);
    const latestPrice = logs.sort((a,b) => b.date.localeCompare(a.date))[0];
    return { avg, total, days: uniqueDays, price: latestPrice ? latestPrice.price || 0 : 0 };
  },

  /** 某饲料库存还能吃几天 */
  daysUntilOut(feedId) {
    const stock = Storage.getStock().find(s => s.feedId === feedId);
    const qty = stock ? Number(stock.qty) : 0;
    const { avg } = this.dailyAvgConsume(feedId);
    if (!avg || avg <= 0) return Infinity; // 没消耗过 = 永久
    return Math.floor(qty / avg);
  },

  /** 按月汇总（用于图表） */
  aggregateByMonths(limitMonths = 12) {
    const map = {};

    // 收入：sales + accounts(income)
    Storage.getSales().forEach(s => {
      if (!s.saleDate) return;
      const m = s.saleDate.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m].income += Number(s.total || 0);
    });
    Storage.getAccounts().forEach(a => {
      if (!a.date) return;
      const m = a.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      if (a.type === 'income') map[m].income += Number(a.amount || 0);
      else map[m].expense += Number(a.amount || 0);
    });
    Storage.getFeedLog().forEach(l => {
      if (!l.date) return;
      const m = l.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m].expense += Number(l.price || 0) * Number(l.qty || 0);
    });
    Storage.getFeedingLog().forEach(l => {
      if (!l.date) return;
      const m = l.date.slice(0, 7);
      if (!map[m]) map[m] = { income: 0, expense: 0 };
      map[m].expense += Number(l.cost || 0);
    });

    return Object.keys(map).sort().reverse().slice(0, limitMonths).map(m => ({
      month: m,
      income: map[m].income,
      expense: map[m].expense,
      profit: map[m].income - map[m].expense
    }));
  },

  // ========== 兼容旧调用（保留） ==========
  totalFeedCost() {
    return Storage.getFeedLog().reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
  },
  totalSales() {
    return Storage.getSales().reduce((s, x) => s + Number(x.total || 0), 0);
  },
  totalProfit() {
    const a = this.aggregateAll();
    return a.profit;
  },

  // ========== 出栏预计（按实际带仔批次算） ==========
  /** 养殖关键天数（与通知中心共用） */
  BREED_DAYS: { candle: 5, hatch: 18, sell: 25 },

  /** 每对种鸽理论周期天数（默认值，实际优先用 farmCycleDays 的平均数据） */
  breedingCycleDays() {
    // 配对+5天→下蛋, +18天孵化, +25天带仔→出栏 = 约48天/轮
    return 48;
  },

  /**
   * 某对的实际繁殖周期：同一对连续两窝「下蛋间隔」的平均天数
   * 有 2 窝以上记录才有历史；没有返回 null
   */
  pairCycleDays(maleId, femaleId) {
    const lays = Storage.getBreeds()
      .filter(b => b.maleId === maleId && b.femaleId === femaleId && b.layDate)
      .map(b => b.layDate).sort();
    const gaps = [];
    for (let i = 1; i < lays.length; i++) {
      const g = this.daysBetween(lays[i - 1], lays[i]);
      if (g >= 20 && g <= 120) gaps.push(g); // 过滤异常值（漏记/补录）
    }
    if (!gaps.length) return null;
    return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  },

  /** 全场平均繁殖周期：所有配对的实际周期取平均；没有历史时用默认 48 */
  farmCycleDays() {
    const byPair = {};
    Storage.getBreeds().forEach(b => {
      if (!b.layDate) return;
      const key = [b.maleId, b.femaleId].sort().join('_');
      (byPair[key] = byPair[key] || new Set()).add(b.layDate);
    });
    const all = [];
    Object.values(byPair).forEach(set => {
      const lays = [...set].sort();
      for (let i = 1; i < lays.length; i++) {
        const g = this.daysBetween(lays[i - 1], lays[i]);
        if (g >= 20 && g <= 120) all.push(g);
      }
    });
    if (!all.length) return this.breedingCycleDays();
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  },

  /** 当前种鸽对数（status='breeder'） */
  activeBreederPairs() {
    const breeders = Storage.getPigeons().filter(p => p.status === 'breeder');
    const active = Storage.getBreeds().filter(b => b.status === 'paired');
    return active.length || Math.floor(breeders.length / 2);
  },

  /**
   * 区间内预计出栏（只）
   * 优先按「带仔满 25 天」落在区间内的存活乳鸽统计，结果一定是整数
   */
  expectedSaleBetween(start, end) {
    let due = 0;
    Storage.getBreeds().forEach(b => {
      if (!b.hatchDate || b.status === 'failed') return;
      const d = this._addDays(b.hatchDate, this.BREED_DAYS.sell);
      if (d >= start && d <= end) due += Number(b.surviveCount || 0);
    });
    if (due > 0) return due;

    // 没有可追踪的批次时按活跃配对粗估，取整避免出现 0.1 只
    const days = this.daysBetween(start, end) + 1;
    return Math.round(this.activeBreederPairs() * 2 / this.farmCycleDays() * days);
  },

  /** 某日期范围的实际出栏（从 sales 表） */
  actualSaleBetween(start, end) {
    return Storage.getSales()
      .filter(s => s.saleDate >= start && s.saleDate <= end)
      .reduce((s, x) => s + (Number(x.count) || Number(x.pigeonIds?.length) || 1), 0);
  },

  /** 明天预计出栏 */
  expectedTomorrow() {
    const tmr = this.daysAgo(-1);
    return this.expectedSaleBetween(tmr, tmr);
  },

  /** 本周预计出栏（周一到周日） */
  expectedThisWeek() {
    const now = new Date();
    const dow = now.getDay() === 0 ? 7 : now.getDay(); // 周一=1, 周日=7
    const monday = new Date(now); monday.setDate(now.getDate() - (dow - 1));
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
    const start = monday.toISOString().slice(0, 10);
    const end = sunday.toISOString().slice(0, 10);
    return {
      expected: this.expectedSaleBetween(start, end),
      actual:   this.actualSaleBetween(start, end),
      start, end
    };
  },

  /** 在养（幼鸽+育肥鸽数量） */
  inStockYoung() {
    return Storage.getPigeons().filter(p => p.status === 'young' || p.status === 'fattening').length;
  },

  /** 上月预计 vs 实际 */
  lastMonthCompare() {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const ym = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;
    const { first, last } = this.monthRange(ym);
    return {
      ym,
      expected: this.expectedSaleBetween(first, last),
      actual:   this.actualSaleBetween(first, last)
    };
  },

  /** 本月预计 vs 实际 */
  thisMonthCompare() {
    const { first, last } = this.monthRange(this.currentMonth());
    return {
      ym: this.currentMonth(),
      expected: this.expectedSaleBetween(first, last),
      actual:   this.actualSaleBetween(first, last)
    };
  },

  /** 下月预计 */
  nextMonthExpected() {
    const [y, m] = this.currentMonth().split('-').map(Number);
    const next = new Date(y, m, 1);
    const ym = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;
    const { first, last } = this.monthRange(ym);
    return { ym, expected: this.expectedSaleBetween(first, last) };
  },

  // ========== 配对计划进度 ==========
  /** 现有配对数（按公母组合去重，排除已出栏） */
  currentPairedCount() {
    const active = Storage.getBreeds().filter(b => b.status !== 'sold');
    const combos = new Set(active.map(b => [b.maleId, b.femaleId].sort().join('_')));
    return combos.size;
  },

  /** 配对计划进度（按现有种鸽与近期配对速度预测） */
  pairPlanProgress(plan) {
    const current = this.currentPairedCount();
    const remaining = Math.max(plan.targetPairs - current, 0);

    // 现有种鸽还能配多少对
    const breeders = Storage.getPigeons().filter(p => p.status === 'breeder');
    const males = breeders.filter(p => p.gender === '公').length;
    const females = breeders.filter(p => p.gender === '母').length;
    const capacity = Math.max(Math.min(males, females) - current, 0);
    const shortage = Math.max(remaining - capacity, 0);

    // 近期配对速度：近 30 天新增配对数 / 30 天，最少按 2 天/对
    const since = this._addDays(this.today(), -29);
    const recent = Storage.getBreeds().filter(b => b.pairDate && b.pairDate >= since).length;
    const rate = Math.max(recent / 30, 0.5);

    let daysToReach = null;
    if (remaining === 0) daysToReach = 0;
    else if (shortage === 0) daysToReach = Math.ceil(remaining / rate);

    let progress = Math.round(current / Math.max(plan.targetPairs, 1) * 100);
    if (progress > 100) progress = 100;

    let deadline = null;
    if (plan.deadlineDate) {
      deadline = this.daysBetween(this.today(), plan.deadlineDate);
    }

    return { current, target: plan.targetPairs, remaining, daysToReach, progress, deadline, capacity, shortage, maxPairs: current + capacity };
  },

  // ========== 老龄化淘汰检查 ==========
  /** 返回需要淘汰的种鸽列表 [{pigeon, ageMonths, thresholdMonths}] */
  agingCheck() {
    const cfg = Storage.getAgingConfig();
    const now = new Date();
    const breeders = Storage.getPigeons().filter(p => p.status === 'breeder' && p.dob);
    return breeders.map(p => {
      const dob = new Date(p.dob);
      const ageMonths = Math.round((now - dob) / (1000*60*60*24*30));
      const threshold = cfg.breederMaxMonths;
      return {
        ...p,
        ageMonths,
        threshold,
        overDue: ageMonths >= threshold,
        monthsLeft: Math.max(threshold - ageMonths, 0)
      };
    }).sort((a, b) => b.ageMonths - a.ageMonths);
  },

  // ========== 配对时间线（从 breed 记录自动算预计节点） ==========
  /**
   * 一个配对的完整时间线节点（链式推算）
   * - 有实际日期的节点用实际值；没有的从上一个节点链式推算：
   *   下蛋=配对+5天（首窝默认），出壳=下蛋+18，照蛋=下蛋+5，出栏=出壳+25
   * - 这一窝出栏后，追加「预计下蛋(下一窝)」= 本窝下蛋日期 + 该对实际周期
   *   （该对有 2 窝以上历史用平均周期；没有历史用默认 48）
   */
  breedTimeline(breed) {
    const pairDate = breed.pairDate || breed.createdAt || this.today();
    const lay = breed.layDate || this._addDays(pairDate, 5);
    const hatch = breed.hatchDate || this._addDays(lay, this.BREED_DAYS.hatch);
    const candle = breed.fledgeDate || this._addDays(lay, this.BREED_DAYS.candle);
    const sell = this._addDays(hatch, this.BREED_DAYS.sell);

    const nodes = [
      { key: 'pair',  label: '配对',     date: pairDate, isActual: !!breed.pairDate,  status: breed.status === 'paired' ? 'done' : 'pending' },
      { key: 'lay',   label: '下蛋',     date: lay,      isActual: !!breed.layDate,   status: (['hatching','fledged','weaned','sold'].includes(breed.status) || !!breed.layDate) ? 'done' : 'pending' },
      { key: 'fledge',label: '照蛋',     date: candle,   isActual: !!breed.fledgeDate, status: (['weaned','sold'].includes(breed.status) || !!breed.fledgeDate) ? 'done' : 'pending' },
      { key: 'hatch', label: '出壳',     date: hatch,    isActual: !!breed.hatchDate, status: (['fledged','weaned','sold'].includes(breed.status) || !!breed.hatchDate) ? 'done' : 'pending' },
      { key: 'wean',  label: '出栏',     date: sell,     isActual: breed.status === 'sold', status: breed.status === 'sold' ? 'done' : 'pending' }
    ];

    // 下一窝预计下蛋：按这一对的实际周期推算
    if (breed.status === 'sold' && breed.layDate) {
      const cyc = this.pairCycleDays(breed.maleId, breed.femaleId) || this.breedingCycleDays();
      const nextLay = this._addDays(breed.layDate, cyc);
      nodes.push({
        key: 'nextlay', label: `下蛋·下一窝（按周期${cyc}天）`,
        date: nextLay, isActual: false, status: 'pending', nextNest: true
      });
    }

    // 计算每个节点距今天数（数字，正=未来，负=已过）
    nodes.forEach(n => { n.daysUntil = this.daysBetween(this.today(), n.date); });
    return nodes;
  },

  _addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },

  // ========== 配对卡片增强：状态 / 预计节点 / 淘汰 / 成本 ==========
  /** 孵化天数常数 */
  INCUBATION_DAYS: 18,

  /** 配对当前状态（带颜色 + 已持续天数） */
  breedStatusInfo(breed) {
    const t = this.today();
    const from = d => (d ? this.daysBetween(d, t) : 0);
    const map = {
      paired:   { label: '配对中', color: 'var(--ios-purple)', bg: 'rgba(175,82,222,0.12)' },
      hatching: { label: '孵化中', color: 'var(--ios-orange)', bg: 'rgba(255,149,0,0.12)' },
      fledged:  { label: '带仔',   color: 'var(--ios-green)',  bg: 'rgba(52,199,89,0.12)' },
      weaned:   { label: '育肥',   color: 'var(--ios-blue)',   bg: 'rgba(0,122,255,0.12)' },
      sold:     { label: '已出栏', color: 'var(--ios-gray)',   bg: 'rgba(118,118,128,0.12)' }
    };
    const base = map[breed.status] || map.paired;

    let days = 0;
    if (breed.status === 'paired')   days = from(breed.pairDate);
    if (breed.status === 'hatching') days = from(breed.layDate);
    if (breed.status === 'fledged')  days = from(breed.hatchDate);
    if (breed.status === 'weaned')   days = from(breed.hatchDate);
    if (breed.status === 'sold')     days = 0;
    days = Math.max(days, 0);

    let text = base.label;
    if (days > 0) {
      text = breed.status === 'hatching'
        ? `孵化 ${days}天/${this.INCUBATION_DAYS}天`
        : `${base.label} ${days}天`;
    }
    return { ...base, text, days };
  },

  /** 最近要发生的 N 个未到期节点（到期后自动被后续节点顶替；下一窝的预计即使过期也显示） */
  upcomingNodes(breed, limit = 2) {
    return this.breedTimeline(breed)
      .filter(n => n.status !== 'done' && (n.daysUntil >= 0 || n.nextNest))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, limit);
  },

  /** 日期 → 11月20号 */
  fmtMonthDay(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${Number(parts[1])}月${Number(parts[2])}号`;
  },

  // ========== 养殖时间线（自动从现有记录推导，无需手工补日志） ==========
  /**
   * opts: { pigeonId } 单鸽时间线 或 { breedId } 一对的时间线（全部窝次）
   * 返回 [{date, icon, text, red}] 按时间倒序
   */
  timelineFor(opts) {
    const evs = [];
    const push = (date, icon, text, red) => {
      if (date) evs.push({ date: String(date), icon, text, red: !!red });
    };
    const breeds = Storage.getBreeds();
    const exceptions = Storage.getExceptions();
    const sales = Storage.getSales();

    if (opts.breedId) {
      const cur = breeds.find(b => b.id === opts.breedId);
      if (!cur) return [];
      // 这一对（同公同母）的全部窝
      const nests = breeds.filter(b => b.maleId === cur.maleId && b.femaleId === cur.femaleId);
      nests.forEach(b => this._nestEvents(b, push));
      // 两只鸽子的异常
      exceptions.filter(e => e.pigeonId === cur.maleId || e.pigeonId === cur.femaleId).forEach(e => {
        const p = this.pigeonById(e.pigeonId);
        push(e.date, '🚑', `${p?.code || ''} 异常：${e.note}${e.cost ? '（药费' + this.fmtMoney(e.cost) + '）' : ''}`, !e.resolved);
        if (e.resolved) push(e.resolveDate, '✅', `${p?.code || ''} 恢复：${e.note}${e.resolveCost ? '（补药费' + this.fmtMoney(e.resolveCost) + '）' : ''}`);
      });
      // 整窝出栏收入
      const nestIds = nests.map(b => b.id);
      sales.filter(s => nestIds.includes(s.breedId)).forEach(s => {
        push(s.saleDate, '📤', `出栏 ${s.count} 只${s.total ? ' · 收入 ' + this.fmtMoney(s.total) : ''}${s.buyer ? ' · ' + s.buyer : ''}`);
      });
    } else if (opts.pigeonId) {
      const p = this.pigeonById(opts.pigeonId);
      if (!p) return [];
      push(p.dob, p.source === 'purchased' ? '🛒' : '🐣',
        (p.source === 'purchased' ? '购入' : '出生') + (p.purchasePrice ? '（' + this.fmtMoney(p.purchasePrice) + '）' : ''));
      breeds.filter(b => b.maleId === opts.pigeonId || b.femaleId === opts.pigeonId)
        .forEach(b => this._nestEvents(b, push, true));
      exceptions.filter(e => e.pigeonId === opts.pigeonId).forEach(e => {
        push(e.date, '🚑', `异常：${e.note}${e.cost ? '（药费' + this.fmtMoney(e.cost) + '）' : ''}`, !e.resolved);
        if (e.resolved) push(e.resolveDate, '✅', `恢复：${e.note}${e.resolveCost ? '（补药费' + this.fmtMoney(e.resolveCost) + '）' : ''}`);
      });
      sales.filter(s => (s.pigeonIds || []).includes(opts.pigeonId)).forEach(s => {
        push(s.saleDate, '📤', `出售${s.total ? ' · 收入 ' + this.fmtMoney(s.total) : ''}${s.buyer ? ' · ' + s.buyer : ''}`);
      });
      push(p.deadDate, '⚰️', '死亡', true);
    }
    evs.sort((a, b) => b.date.localeCompare(a.date));
    return evs;
  },

  /** 一窝的繁殖事件（withPair=附带配对名，用于单鸽时间线） */
  _nestEvents(b, push, withPair) {
    const m = this.pigeonById(b.maleId), f = this.pigeonById(b.femaleId);
    const tag = withPair ? `（${m?.code || '?'} × ${f?.code || '?'}）` : '';
    push(b.pairDate, '💍', `配对${tag}`);
    push(b.layDate, '🥚', `下蛋${(b.eggCount != null && b.eggCount !== '') ? ' ' + b.eggCount + ' 枚' : ''}${tag}`);
    push(b.secondEggDate, '🥚', `第 2 个蛋${tag}`);
    push(b.candledDate, '🔦', `照蛋：${b.fertileCount} 枚受精${tag}`, b.candledDate && b.fertileCount === 0);
    push(b.hatchDate, '🐣', `出壳 ${b.hatchCount || 0} 只${tag}`);
    (b.losses || []).forEach(l => push(l.date, '⚠️', `${l.reason || '繁殖损失'}${l.amount ? '（' + this.fmtMoney(l.amount) + '）' : ''}${tag}`, true));
    if (b.status === 'sold') {
      const rs = b.resolution === 'keep' ? '留种' : b.resolution === 'pending' ? '转待定' : '出栏';
      push(b.fledgeDate || b.hatchDate, '📦', rs + (b.surviveCount ? ` ${b.surviveCount} 只` : '') + tag);
    }
    if (b.status === 'failed') push(b.fledgeDate || b.hatchDate || b.layDate || b.pairDate, '✗', '窝失败' + tag, true);
  },

  /** 淘汰时间（生日 + 阈值月数），返回剩余年月 */
  retireInfo(dob, thresholdMonths) {
    if (!dob) return null;
    const cfg = Storage.getAgingConfig();
    const th = thresholdMonths || cfg.breederMaxMonths;
    const d = new Date(dob);
    d.setMonth(d.getMonth() + th);
    const dateStr = d.toISOString().slice(0, 10);

    const today = new Date(this.today());
    let months = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
    if (d.getDate() < today.getDate()) months -= 1;

    const overdue = months < 0;
    const abs = Math.abs(months);
    const years = Math.floor(abs / 12);
    const remMonths = abs % 12;

    let remainTxt = '';
    if (years > 0) remainTxt += `${years}年`;
    remainTxt += `${remMonths}个月`;

    return { date: dateStr, months, years, remMonths, overdue, remainTxt };
  },

  /** 某日期区间饲料成本 */
  feedCostBetween(start, end) {
    const manual = Storage.getFeedLog()
      .filter(l => l.date >= start && l.date <= end)
      .reduce((s, l) => s + Number(l.price || 0) * Number(l.qty || 0), 0);
    return manual + Feeding.costBetween(start, end);
  },

  /** 当前活跃配对数量（用于成本均摊，最少 1） */
  activePairCount() {
    return Math.max(this.currentPairedCount(), 1);
  },

  /** 某窝累计成本（优先取该对的实际投喂金额） */
  /** 这一对（同公同母）的全部窝，按配对日期升序 */
  coupleNests(maleId, femaleId) {
    return Storage.getBreeds()
      .filter(b => b.maleId === maleId && b.femaleId === femaleId)
      .sort((a, b) => String(a.pairDate || '').localeCompare(String(b.pairDate || '')));
  },

  /** 窝的结束日：出栏=fledgeDate；失败=失败标记日；进行中=null */
  nestEndDate(b) {
    if (b.status === 'sold') return b.fledgeDate || null;
    if (b.status === 'failed') {
      const ds = [...(b.losses || []).map(l => l.date), b.candledDate, b.layDate, b.pairDate].filter(Boolean);
      return ds.length ? ds.sort()[ds.length - 1] : null;
    }
    return null;
  },

  /** 窝成本核算窗口（连蛋带仔成本归属规则）
   * - 带仔期间下的新蛋：吃用继续算旧窝，直到旧窝出栏 → 新窝成本未开始（start=null）
   * - 上一窝正常出栏：新窝从「上一窝出栏日」起算（空怀期吃用挂新窝）
   * - 上一窝失败：不接给新窝 → 新窝从自己下蛋日起算
   * - 进行中的窝算到今天
   */
  nestCostWindow(b) {
    const nests = this.coupleNests(b.maleId, b.femaleId);
    const idx = nests.findIndex(x => x.id === b.id);
    const prev = idx > 0 ? nests[idx - 1] : null;
    let start = b.pairDate || b.layDate || this.today();
    if (prev) {
      const prevEnd = this.nestEndDate(prev);
      if (prevEnd && prev.status === 'sold') {
        if (prevEnd > start) start = prevEnd;      // 正常出栏交接
      } else if (!prevEnd) {
        start = null;                              // 旧窝还在养（带仔）→ 新窝成本未开始
      }
    }
    let end = this.nestEndDate(b) || this.today();
    if (start && end < start) end = start;
    return { start, end };
  },

  /** 这一对在区间内的吃用（按对核算：统计该对全部窝的投喂记录，投喂按对去重后只会记在主窝） */
  coupleCost(maleId, femaleId, start, end) {
    if (!start) return 0;
    const nestIds = new Set(this.coupleNests(maleId, femaleId).map(b => b.id));
    const direct = Storage.getFeedingLog()
      .filter(l => l.targetType === 'pair' && nestIds.has(l.targetId) && l.date >= start && l.date <= end)
      .reduce((s, l) => s + (Number(l.cost) || 0), 0);
    if (direct > 0) return direct;
    return this.feedCostBetween(start, end) / Math.max(this.activePairCount(), 1);
  },

  pairCost(breed) {
    const w = this.nestCostWindow(breed);
    return this.coupleCost(breed.maleId, breed.femaleId, w.start, w.end);
  },

  /** 今天每窝吃用（按对去重：同一对任意窝都显示同额，优先取该对的实际投喂金额） */
  pairTodayCost(breed) {
    const nestIds = new Set(this.coupleNests(breed.maleId, breed.femaleId).map(b => b.id));
    const direct = Storage.getFeedingLog()
      .filter(l => l.targetType === 'pair' && nestIds.has(l.targetId) && l.date === this.today())
      .reduce((s, l) => s + (Number(l.cost) || 0), 0);
    if (direct > 0) return direct;
    return this.feedCostOfDay() / Math.max(this.activePairCount(), 1);
  },

  // ========== Toast ==========
  toast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  },

  // ========== 简易 Modal ==========
  openModal(title, bodyHTML, buttons) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';

    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (b.style || 'btn-secondary');
      btn.textContent = b.label;
      btn.onclick = () => {
        if (b.onClick) b.onClick();
        if (!b.keepOpen) this.closeModal();
      };
      footer.appendChild(btn);
    });

    modal.hidden = false;
  },

  closeModal() {
    document.getElementById('modal').hidden = true;
  }
};

// 点击遮罩关闭
document.addEventListener('DOMContentLoaded', () => {
  const m = document.getElementById('modal');
  if (m) {
    m.addEventListener('click', e => {
      if (e.target === m) Utils.closeModal();
    });
  }
  const c = document.getElementById('modal-close');
  if (c) c.addEventListener('click', Utils.closeModal);
});
