/**
 * 自动引擎
 * - 自动扣料：早餐 08:00 / 晚餐 18:00 到点自动扣库存（标记为「自动」，待人工确认）
 * - 自动补历史：最近 N 天缺的餐次自动补记（成本/统计不缺数据）
 * - 没喂退回：自动扣的餐可一键退回库存；确认喂了一键消除待确认标记
 *
 * 说明：产蛋后即视为自然孵化（无需单独「开始孵化」手续），
 *       照蛋/出壳/出栏等节点由待办中心提醒，不强制自动推进。
 */
const AutoEngine = {
  CFG: 'pigeon_auto_cfg',
  MEALS: [{ key: 'am', time: '08:00' }, { key: 'pm', time: '18:00' }],

  cfg() {
    try {
      return JSON.parse(localStorage.getItem(this.CFG) || 'null') ||
        { enabled: true, backfillDays: 7 };
    } catch (e) {
      return { enabled: true, backfillDays: 7 };
    }
  },
  saveCfg(v) { localStorage.setItem(this.CFG, JSON.stringify(v)); },

  /** 某天某餐是否已有投喂记录 */
  mealDone(date, meal) {
    return Storage.getFeedingLog().some(l => l.date === date && l.meal === meal);
  },

  /** 主入口：App 启动 + 每分钟定时调用 */
  run() {
    const cfg = this.cfg();
    if (!cfg.enabled) return;
    try {
      this.backfill(cfg.backfillDays);
      this.autoFeedToday();
    } catch (e) {
      console.warn('自动引擎异常：', e);
    }
  },

  /** 自动补历史：最近 N 天（不含今天）缺的餐次自动补记 */
  backfill(days) {
    days = Math.min(Math.max(Number(days) || 7, 0), 30);
    for (let i = days; i >= 1; i--) {
      const date = Utils.daysAgo(i);
      this.MEALS.forEach(m => {
        if (this.mealDone(date, m.key)) return;
        const targets = Feeding.targetsFor(date, m.key);
        if (!targets.length) return;
        targets.forEach(t => Feeding.feed(t, date, m.key, null, { auto: true, reason: '补历史' }));
      });
    }
  },

  /** 今日到点自动扣料（应用打开期间由定时器驱动） */
  autoFeedToday() {
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.MEALS.forEach(m => {
      if (hm < m.time) return;
      if (this.mealDone(Utils.today(), m.key)) return;
      const targets = Feeding.targetsFor(Utils.today(), m.key);
      if (!targets.length) return;
      targets.forEach(t => Feeding.feed(t, Utils.today(), m.key, null, { auto: true, reason: '自动扣料' }));
    });
  },

  startTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => this.run(), 60 * 1000);
  },

  /** 今日某餐是否存在「自动」记录 */
  todayAuto(meal) {
    const today = Utils.today();
    return Storage.getFeedingLog().some(l => l.date === today && l.meal === meal && l.auto);
  },

  /** 确认喂了：清掉该餐的自动标记 */
  confirmMeal(date, meal) {
    const logs = Storage.getFeedingLog();
    let n = 0;
    logs.forEach(l => {
      if (l.date === date && l.meal === meal && l.auto) { l.auto = false; n++; }
    });
    Storage.setFeedingLog(logs);
    return n;
  },

  /** 没喂退回：整餐撤销并退回库存 */
  refundMeal(date, meal) {
    const logs = Storage.getFeedingLog();
    const ids = logs.filter(l => l.date === date && l.meal === meal).map(l => l.id);
    ids.forEach(id => Feeding.undo(id));
    return ids.length;
  }
};
