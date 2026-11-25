/**
 * 通知中心 · 待办提醒
 * 只负责「提醒 + 跳转」，所有状态推进都必须由人工确认
 */
const Notify = {
  CANDLE_DAYS: Utils.BREED_DAYS.candle,   // 下完第 2 个蛋后第 5 天照蛋
  HATCH_DAYS: Utils.BREED_DAYS.hatch,     // 孵化 18 天提醒出壳（点了确认才转带仔）
  SELL_DAYS: Utils.BREED_DAYS.sell,       // 带仔 25 天提醒出栏
  STOCK_WARN_DAYS: 7,    // 饲料剩余不足 7 天用量提醒

  _items: [],

  /** 生成待办列表 */
  items(date) {
    date = date || Utils.today();
    const list = [];
    const breeds = Storage.getBreeds();

    breeds.forEach(b => {
      if (b.status !== 'hatching' && b.status !== 'fledged') return;
      const title = Feeding.pairTitle(b);

      if (b.status === 'hatching') {
        const eggs = Number(b.eggCount != null ? b.eggCount : b.hatchCount) || 0;
        const base = b.secondEggDate || b.layDate;

        if (eggs === 1 && b.layDate && Utils.daysBetween(b.layDate, date) >= 1) {
          list.push({
            key: 'egg2:' + b.id, icon: '🥚', level: 'warn',
            title: `${title} · 补记第 2 个蛋`,
            sub: `第 1 个蛋 ${b.layDate}，已下第 2 个蛋点此确认`,
            breedId: b.id, action: 'secondEgg'
          });
        }
        if (base && !b.candledDate && Utils.daysBetween(base, date) >= this.CANDLE_DAYS) {
          list.push({
            key: 'candle:' + b.id, icon: '🔦', level: 'warn',
            title: `${title} · 待照蛋`,
            sub: `下第 2 个蛋后第 ${this.CANDLE_DAYS} 天，确认受精情况`,
            breedId: b.id, action: 'candle'
          });
        }
        if (base && Utils.daysBetween(base, date) >= this.HATCH_DAYS) {
          list.push({
            key: 'hatch:' + b.id, icon: '🐣', level: 'urgent',
            title: `${title} · 待出壳`,
            sub: `已孵化 ${Utils.daysBetween(base, date)} 天，点确认后才开始算带仔`,
            breedId: b.id, action: 'hatch'
          });
        }
      }

      if (b.status === 'fledged' && b.hatchDate) {
        const age = Utils.daysBetween(b.hatchDate, date);
        if (age >= this.SELL_DAYS) {
          list.push({
            key: 'sell:' + b.id, icon: '📤', level: 'info',
            title: `${title} · 可出栏`,
            sub: `带仔 ${age} 天（≥${this.SELL_DAYS} 天），存活 ${b.surviveCount} 只`,
            breedId: b.id, action: 'sell'
          });
        }
      }
    });

    this._stockWarnings(date).forEach(x => list.push(x));

    // 保健砂每日提醒（当天没记录就提醒）
    const hc = Storage.getHealthCfg();
    if (hc.gritDailyGrams > 0 && hc.lastGritDate !== date) {
      list.push({
        key: 'grit:' + date, icon: '🪨', level: 'info',
        title: `保健砂 · 每日 ${hc.gritDailyGrams}g`,
        sub: hc.lastGritDate ? `上次添加 ${hc.lastGritDate}，今天还没记` : '还没记过，点此确认今天已添加',
        action: 'grit'
      });
    }
    // 多维提醒（每 N 天一次）
    const vDays = Number(hc.vitaminDays) || 7;
    const vBase = hc.lastVitaminDate || null;
    if (vDays > 0 && (!vBase || Utils.daysBetween(vBase, date) >= vDays)) {
      list.push({
        key: 'vitamin:' + date, icon: '💊', level: 'info',
        title: `多维 · 该补充了`,
        sub: vBase ? `上次补充 ${vBase}（每 ${vDays} 天一次）` : '还没记过，点此确认已补充',
        action: 'vitamin'
      });
    }
    return list;
  },

  /** 某种饲料的剩余量 / 日均消耗 / 可撑天数 */
  stockDaysLeft(feedId, date) {
    date = date || Utils.today();
    const start = Utils._addDays(date, -6);
    const e = Storage.getStock().find(s => s.feedId === feedId);
    const qty = e ? Number(e.qty) || 0 : 0;

    let used = Feeding.kgOfFeedBetween(feedId, start, date);
    Storage.getFeedLog()
      .filter(l => l.feedId === feedId && l.date >= start && l.date <= date)
      .forEach(l => { used += Number(l.qty) || 0; });

    const perDay = used / 7;
    return { qty, perDay, daysLeft: perDay > 0 ? qty / perDay : Infinity };
  },

  _stockWarnings(date) {
    const cfg = Feeding.cfg();
    const feeds = Storage.getFeeds();
    const out = [];

    ['corn', 'pea', 'sorghum'].forEach(k => {
      const feedId = cfg.feeds[k];
      const f = feeds.find(x => x.id === feedId);
      if (!f) return;
      const s = this.stockDaysLeft(feedId, date);

      if (s.qty <= 0) {
        out.push({
          key: 'stock:' + feedId, icon: '📦', level: 'urgent',
          title: `${f.name} 已用完`, sub: '库存为 0，请及时补料', action: 'stock'
        });
      } else if (s.daysLeft < this.STOCK_WARN_DAYS) {
        const r1 = v => Math.round(v * 10) / 10;
        out.push({
          key: 'stock:' + feedId, icon: '📦', level: 'warn',
          title: `${f.name} 只剩 ${r1(s.daysLeft)} 天用量`,
          sub: `库存 ${r1(s.qty)}kg · 日均约 ${r1(s.perDay * 100) / 100}kg`, action: 'stock'
        });
      }
    });
    return out;
  },

  count() {
    return this.items().length;
  },

  /** 刷新顶部铃铛与红点 */
  refresh() {
    const bell = document.getElementById('nav-bell');
    if (!bell) return;
    this._items = this.items();
    const n = this._items.length;
    const badge = document.getElementById('nav-bell-badge');
    bell.hidden = n === 0;
    if (badge) {
      badge.hidden = n === 0;
      badge.textContent = n > 99 ? '99+' : String(n);
    }
  },

  /** 通知中心 */
  openCenter() {
    const items = this.items();
    this._items = items;

    if (items.length === 0) {
      Utils.openModal('🔔 待办', `
        <div class="empty-state" style="padding:28px 0">
          <div class="empty-icon">✅</div>
          <div class="empty-title">今天没有待办</div>
          <div class="empty-desc">照蛋、出壳、出栏、库存不足都会在这里提醒</div>
        </div>
      `, [{ label: '关闭', style: 'btn-secondary' }]);
      return;
    }

    const colorOf = lv => lv === 'urgent'
      ? { c: 'var(--ios-red)', bg: 'rgba(255,59,48,0.10)' }
      : lv === 'warn'
        ? { c: 'var(--ios-orange)', bg: 'rgba(255,149,0,0.10)' }
        : { c: 'var(--ios-blue)', bg: 'rgba(0,122,255,0.08)' };

    const body = `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${items.map((it, i) => {
          const c = colorOf(it.level);
          return `
            <div data-notify="${i}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;background:${c.bg};cursor:pointer">
              <div style="font-size:20px">${it.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:600;color:${c.c}">${it.title}</div>
                <div style="font-size:12px;color:var(--ios-gray);margin-top:2px">${it.sub}</div>
              </div>
              <span style="color:var(--ios-gray3);font-size:18px">›</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    Utils.openModal('🔔 待办 · ' + items.length, body, [{ label: '关闭', style: 'btn-secondary' }]);
    document.querySelectorAll('[data-notify]').forEach(el => {
      el.onclick = () => this.run(items[Number(el.dataset.notify)]);
    });
  },

  /** 执行某条待办（跳转到对应操作） */
  run(item) {
    if (!item) return;
    Utils.closeModal();
    switch (item.action) {
      case 'stock':     App.switchTab('stock'); break;
      case 'secondEgg': BreedPage.markSecondEgg(item.breedId); break;
      case 'candle':    BreedPage.openCandle(item.breedId); break;
      case 'hatch':     BreedPage.advanceToHatch(item.breedId); break;
      case 'sell':      BreedPage.resolveSell(item.breedId); break;
      case 'grit':      this.confirmGrit(); break;
      case 'vitamin':   this.confirmVitamin(); break;
    }
  },

  /** 确认保健砂已添加（自动扣保健砂库存） */
  confirmGrit() {
    const hc = Storage.getHealthCfg();
    const gritFeed = Storage.getFeeds().find(f => f.name === '保健砂');
    Utils.openModal('🪨 保健砂确认', `
      <p style="font-size:13px;line-height:1.8">今天已按 <b>${hc.gritDailyGrams}g</b> 添加保健砂？<br>
      ${gritFeed ? '确认后自动从保健砂库存扣减。' : '（库存里没有「保健砂」品类，仅做记录）'}</p>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认已添加', style: 'btn-primary', onClick: () => {
        if (gritFeed) Feeding.adjustBatches(gritFeed.id, hc.gritDailyGrams / (gritFeed.unit === '斤' ? 500 : 1000), -1);
        hc.lastGritDate = Utils.today();
        Storage.setHealthCfg(hc);
        Utils.closeModal();
        Utils.toast('已记录 · 保健砂已扣库存');
        this.refresh();
      }}
    ]);
  },

  /** 确认多维已补充 */
  confirmVitamin() {
    const hc = Storage.getHealthCfg();
    Utils.openModal('💊 多维确认', `<p style="font-size:13px;line-height:1.8">今天已给鸽子补充多维？<br>下次提醒：${Number(hc.vitaminDays) || 7} 天后。</p>`, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认已补充', style: 'btn-primary', onClick: () => {
        hc.lastVitaminDate = Utils.today();
        Storage.setHealthCfg(hc);
        Utils.closeModal();
        Utils.toast('已记录 · 多维已补充');
        this.refresh();
      }}
    ]);
  }
};
