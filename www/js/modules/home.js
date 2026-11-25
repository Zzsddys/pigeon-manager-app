/**
 * 首页 Dashboard - 养殖仪表盘
 */
const HomePage = {
  render() {
    document.getElementById('nav-title').textContent = '鸽管家';
    document.getElementById('nav-action').hidden = true;
    document.getElementById('nav-back').hidden = true;

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="search-bar">
        <input type="text" class="search-input" id="global-search" placeholder="搜索鸽子编号 / 品种 / 备注…" />
      </div>

      ${this._overviewCards()}

      <div style="margin-top:12px"></div>

      ${this._salePlanBigCard()}

      <div style="margin-top:12px"></div>

      ${this._pairPlanBigCard()}

      <div style="margin-top:12px"></div>

      ${this._agingBigCard()}

      <div style="margin-top:12px"></div>

      ${this._stockChips()}

      <div style="margin-top:12px"></div>

      ${this._populationCard()}

      <div style="height: 100px"></div>
    `;

    document.getElementById('global-search').addEventListener('input', e => {
      if (e.target.value.length >= 1) App.searchPigeons(e.target.value);
    });

    setTimeout(() => {
      this._bindTaps();
      this._bindPopulation();
    }, 0);
  },

  _bindTaps() {
    document.querySelectorAll('#page-content [data-route]').forEach(el => {
      if (el._tapBound) return;
      el._tapBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', e => {
        e.stopPropagation();
        const route = el.dataset.route;
        if (route) App.switchTab(route);
      });
    });
    document.querySelectorAll('#page-content [data-pair-card]').forEach(el => {
      if (el._tapBound) return;
      el._tapBound = true;
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.showPairCardDetail(el.dataset.pairCard);
      });
    });
    const planCard = document.querySelector('#page-content [data-pair-plan]');
    if (planCard && !planCard._bound) {
      planCard._bound = true;
      planCard.addEventListener('click', e => { e.stopPropagation(); this.openPairPlanForm(); });
    }
  },

  // ============================================================
  // 通用小卡片
  // ============================================================
  _miniCard(title, bodyHTML, footTxt) {
    return `
      <div style="flex:1;min-width:0;text-align:center;padding:8px 5px;background:rgba(255,255,255,0.6);border-radius:10px;border:0.5px solid rgba(0,0,0,0.03)">
        <div style="font-size:10px;color:var(--ios-gray3);font-weight:600;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${title}</div>
        ${bodyHTML}
        <div style="font-size:10px;color:var(--ios-gray);margin-top:4px;padding-top:4px;border-top:0.5px solid rgba(0,0,0,0.06);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${footTxt}</div>
      </div>
    `;
  },

  // ============================================================
  // 今日概览
  // ============================================================
  _overviewCards() {
    const all = Utils.aggregateAll();
    const year = Utils.aggregateYear();
    const prevMonth = Utils.aggregatePrevMonth();
    const feedThisMonth = Utils.feedCostOfMonth();
    const feedPrevMonth = Utils.feedCostOfMonth(prevMonth.ym);
    const feedYesterday = Utils.feedCostOfDay(Utils.daysAgo(1));
    const feedToday = Utils.feedCostOfDay();

    const fmt = v => Utils.fmtMoney(v);
    const fmtP = v => (v >= 0 ? '+' : '') + Utils.fmtMoney(v).slice(1);
    const color = v => v >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';

    const feedChange = feedPrevMonth > 0 ? ((feedThisMonth - feedPrevMonth) / feedPrevMonth * 100) : 0;
    const feedChangeTxt = feedChange === 0 ? '持平'
      : `${feedChange > 0 ? '↑' : '↓'} ${Math.abs(feedChange).toFixed(0)}%`;

    return `
      <div class="overview-grid">
        <div class="overview-card tappable" data-route="profit"
             style="grid-column: span 1;background:linear-gradient(160deg,#f0fdf4 0%,#ecfeff 80%);border:0.5px solid rgba(52,199,89,0.15)">
          <div class="card-hint-arrow">›</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div style="display:flex;align-items:center;gap:6px">
              <div class="overview-icon green" style="width:24px;height:24px;font-size:14px;margin-bottom:0">💰</div>
              <div style="font-size:12px;color:var(--ios-gray);font-weight:600">累计盈亏</div>
            </div>
          </div>
          <div style="font-size:26px;font-weight:800;color:${color(all.profit)};letter-spacing:-0.5px;margin:4px 0 10px">${fmtP(all.profit)}</div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
            <span style="font-weight:600;color:var(--ios-green)">总收入</span><span style="font-weight:600;color:var(--ios-green)">${fmt(all.income)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
            <span style="font-weight:600;color:var(--ios-red)">总支出</span><span style="font-weight:600;color:var(--ios-red)">${fmt(all.expense)}</span>
          </div>
          <div style="border-top:0.5px solid var(--ios-separator);padding-top:8px">
            <div style="font-size:10px;color:var(--ios-gray3);margin-bottom:4px">${new Date().getFullYear()} 年</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span style="font-weight:600;color:var(--ios-green)">本年收入</span><span style="font-weight:600;color:var(--ios-green)">${fmt(year.income)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px">
              <span style="font-weight:600;color:var(--ios-red)">本年支出</span><span style="font-weight:600;color:var(--ios-red)">${fmt(year.expense)}</span>
            </div>
          </div>
        </div>

        <div class="overview-card tappable" data-route="stock"
             style="grid-column: span 1;background:linear-gradient(160deg,#fff7ed 0%,#fef3c7 80%);border:0.5px solid rgba(255,149,0,0.15)">
          <div class="card-hint-arrow">›</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div style="display:flex;align-items:center;gap:6px">
              <div class="overview-icon orange" style="width:24px;height:24px;font-size:14px;margin-bottom:0">🌾</div>
              <div style="font-size:12px;color:var(--ios-gray);font-weight:600">本月鸽子吃用</div>
            </div>
            <span style="font-size:10px;color:var(--ios-gray3);background:rgba(118,118,128,0.12);padding:2px 6px;border-radius:8px">${Utils.currentMonth()}</span>
          </div>
          <div style="font-size:26px;font-weight:800;color:var(--ios-orange);letter-spacing:-0.5px;margin:4px 0 10px">${fmt(feedThisMonth)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:3px">
            <span style="color:var(--ios-gray)">上月 ${prevMonth.ym}</span><span style="font-weight:600">${fmt(feedPrevMonth)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:8px">
            <span style="color:var(--ios-gray)">比上月</span>
            <span style="font-weight:700;color:${feedChange>0?'var(--ios-red)':'var(--ios-green)'}">${feedChangeTxt}</span>
          </div>
          <div style="border-top:0.5px solid var(--ios-separator);padding-top:8px">
            <div style="display:flex;gap:8px">
              <div style="flex:1;text-align:center;background:rgba(0,0,0,0.03);border-radius:8px;padding:6px 4px">
                <div style="font-size:10px;color:var(--ios-gray3);margin-bottom:2px">昨天</div>
                <div style="font-size:13px;font-weight:700;color:var(--ios-orange)">${fmt(feedYesterday)}</div>
              </div>
              <div style="flex:1;text-align:center;background:rgba(0,0,0,0.03);border-radius:8px;padding:6px 4px">
                <div style="font-size:10px;color:var(--ios-gray3);margin-bottom:2px">今天</div>
                <div style="font-size:13px;font-weight:700;color:var(--ios-orange)">${fmt(feedToday)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ============================================================
  // 🐦 种群统计（顶部四格可点 + 状态筛选 + 鸽子卡片）
  // ============================================================
  _populationCard() {
    const pigeons = Storage.getPigeons();
    const breeds = Storage.getBreeds();
    const young = pigeons.filter(p => p.status === 'young').length;
    const squab = pigeons.filter(p => this._isSquab(p)).length;
    const pairs = Utils.currentPairedCount();

    const stat = (key, label, num, unit, color, sub) => `
      <button class="pop-stat" data-pop-stat="${key}">
        <div style="font-size:10px;color:var(--ios-gray3);margin-bottom:2px">${label}</div>
        <div style="font-size:19px;font-weight:800;color:${color};line-height:1.15">${num}<span style="font-size:10px;font-weight:600"> ${unit}</span></div>
        <div style="font-size:9px;color:var(--ios-gray3);margin-top:2px">${sub}</div>
      </button>`;

    return `
      <div class="home-big-card" style="background:linear-gradient(140deg,#eff6ff 0%,#f5f3ff 100%)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(0,122,255,0.15);display:flex;align-items:center;justify-content:center;font-size:16px">🐦</div>
          <div style="font-size:14px;font-weight:700">种群统计</div>
          <div style="font-size:10px;color:var(--ios-gray3);margin-left:auto">共 ${pigeons.length} 只 · ${breeds.length} 对</div>
        </div>

        <div style="display:flex;gap:6px">
          ${stat('all', '全部', this._populationPigeons('all').length, '只', 'var(--ios-blue)', '种鸽+青年')}
          ${stat('pairs', '总对', pairs, '对', 'var(--ios-purple)', '已配对')}
          ${stat('young', '青年', young, '只', 'var(--ios-green)', '生长中')}
          ${stat('squab', '乳鸽', squab, '只', 'var(--ios-orange)', '育肥中')}
        </div>

        <div style="display:flex;gap:6px;overflow-x:auto;margin-top:12px;padding-bottom:2px" id="pop-chips">
          ${this._populationChips()}
        </div>

        <div id="pop-list" style="margin-top:10px">
          ${this._populationList('default')}
        </div>
      </div>
    `;
  },

  _isSquab(p) { return p.status === 'fatten' || p.status === 'fattening'; },

  /** 配对当前所处阶段（用于种群统计筛选） */
  _pairStatusKey(b) {
    if (b.status === 'hatching') return (b.eggCount || 0) >= 2 ? 'incubating' : 'laying';
    if (b.status === 'fledged') {
      const days = b.hatchDate ? Utils.daysBetween(b.hatchDate, Utils.today()) : 0;
      const sell = (Utils.BREED_DAYS && Utils.BREED_DAYS.sell) || 25;
      return days >= sell ? 'tosell' : 'brooding';
    }
    if (b.status === 'weaned') return 'tosell';
    if (b.status === 'sold') return 'empty';   // 出栏后空怀 → 归入「空怀」筛选
    return 'empty';
  },

  _popStatusDefs() {
    const abnormalN = Storage.getBreeds().filter(b => Utils.pairHasUnresolved(b)).length;
    return [
      { key: 'abnormal',   label: '异常',   icon: '🚑' },
      { key: 'empty',      label: '空怀',   icon: '🌾' },
      { key: 'laying',     label: '产蛋',   icon: '🥚' },
      { key: 'incubating', label: '孵蛋',   icon: '🪺' },
      { key: 'brooding',   label: '带仔',   icon: '🐣' },
      { key: 'tosell',     label: '待售',   icon: '📤' }
    ].map(d => ({ ...d, n: d.key === 'abnormal' ? abnormalN : this._populationBreeds(d.key).length }))
      .filter(d => d.n > 0);
  },

  _populationChips() {
    return this._popStatusDefs().map(d => {
      const meta = this._phaseMeta(d.key);
      return `
      <button class="pop-chip" data-pop-status="${d.key}">
        <span style="width:6px;height:6px;border-radius:50%;background:${meta.color};display:inline-block;margin-right:4px;vertical-align:1px"></span>${d.label} ${d.n}
      </button>`;
    }).join('');
  },

  /** 各阶段配色（每个状态一个颜色） */
  _phaseMeta(key) {
    return {
      abnormal:   { label: '异常',   color: '#d32f2f' },
      brooding:   { label: '带仔',   color: '#1f7a4d' },
      incubating: { label: '孵蛋',   color: '#b0741a' },
      laying:     { label: '产蛋',   color: '#c25e0e' },
      empty:      { label: '空怀',   color: '#5b7c99' },
      tosell:     { label: '待售',   color: '#7a4fd0' },
      sold:       { label: '已出栏', color: '#8e8e93' }
    }[key] || { label: key, color: '#8e8e93' };
  },

  /** 配对阶段 → 配对列表（异常永远排最前；归档种鸽的对子不显示） */
  _populationBreeds(filter) {
    const breeds = Storage.getBreeds();
    const archived = new Set(Storage.getPigeons().filter(p => p.archived).map(p => p.id));
    const active = breeds.filter(b => !archived.has(b.maleId) && !archived.has(b.femaleId));
    const order = { brooding: 0, incubating: 1, laying: 2, empty: 3, tosell: 4, sold: 5 };
    if (filter === 'abnormal') {
      return active.filter(b => Utils.pairHasUnresolved(b))
        .sort((a, b) => (order[this._pairStatusKey(a)] ?? 9) - (order[this._pairStatusKey(b)] ?? 9));
    }
    if (filter === 'pairs') {
      return active
        .filter(b => b.status !== 'sold' && b.status !== 'failed')
        .sort((a, b) => {
          const ab = (Utils.pairHasUnresolved(b) ? 0 : 1) - (Utils.pairHasUnresolved(a) ? 0 : 1);
          if (ab !== 0) return ab;
          return (order[this._pairStatusKey(a)] ?? 9) - (order[this._pairStatusKey(b)] ?? 9);
        });
    }
    return active.filter(b => this._pairStatusKey(b) === filter);
  },

  _populationPigeons(filter) {
    const pigeons = Storage.getPigeons();
    if (filter === 'all') {
      return pigeons.filter(p => (p.status === 'breeder' || p.status === 'young') && !p.archived && p.code && p.code.trim());
    }
    if (filter === 'young') return pigeons.filter(p => p.status === 'young' && !p.archived && p.code && p.code.trim());
    return [];
  },

  /** 同一对只显示一张卡：优先显示最新进行中的窝（旧窝仍在带仔则通过卡片内提示展示） */
  _dedupeCoupleCards(list) {
    const primary = new Map();
    list.forEach(b => {
      const key = b.maleId + '|' + b.femaleId;
      const cur = primary.get(key);
      if (!cur) { primary.set(key, b); return; }
      const bActive = b.status !== 'sold' && b.status !== 'failed';
      const cActive = cur.status !== 'sold' && cur.status !== 'failed';
      if (bActive && (!cActive || String(b.pairDate || '') > String(cur.pairDate || ''))) {
        primary.set(key, b);
      }
    });
    return list.filter(b => {
      const k = b.maleId + '|' + b.femaleId;
      if (primary.get(k) && primary.get(k).id === b.id) { primary.delete(k); return true; }
      return false;
    });
  },

  /** 同对的另一窝（进行中） */
  _siblingNest(b) {
    return Storage.getBreeds().find(x =>
      x.id !== b.id && x.maleId === b.maleId && x.femaleId === b.femaleId &&
      x.status !== 'sold' && x.status !== 'failed');
  },

  _populationList(filter) {
    // 全部 / 默认：青年鸽卡片 + 种鸽配对卡片
    if (filter === 'all' || filter === 'default') {
      const young = this._populationPigeons('young');
      const pairs = this._dedupeCoupleCards(this._populationBreeds('pairs'));
      if (young.length === 0 && pairs.length === 0) {
        return `<div style="text-align:center;font-size:12px;color:var(--ios-gray3);padding:16px 0">还没有鸽子</div>`;
      }
      return `<div class="pop-pair-list">
        ${pairs.map(b => this._pairCardHTML(b)).join('')}
        ${young.map(p => this._pigeonRichCard(p)).join('')}
      </div>`;
    }

    // 乳鸽 = 正在带仔的种鸽卡片；总对 / 状态胶囊 = 对应阶段的配对卡片
    const key = filter === 'squab' ? 'brooding' : filter;
    if (key === 'pairs' || this._popStatusDefs().some(d => d.key === key)) {
      const list = key === 'pairs' ? this._dedupeCoupleCards(this._populationBreeds(key)) : this._populationBreeds(key);
      if (list.length === 0) {
        return `<div style="text-align:center;font-size:12px;color:var(--ios-gray3);padding:16px 0">没有符合条件的配对</div>`;
      }
      return `<div class="pop-pair-list">${list.map(b => this._pairCardHTML(b)).join('')}</div>`;
    }

    // 青年：青年鸽卡片
    const list = this._populationPigeons(filter);
    if (list.length === 0) {
      return `<div style="text-align:center;font-size:12px;color:var(--ios-gray3);padding:16px 0">没有符合条件的鸽子</div>`;
    }
    return `<div class="pop-pair-list">${list.map(p => this._pigeonRichCard(p)).join('')}</div>`;
  },

  // 单只鸽子卡片（同配对卡样式：状态 / 预计 / 淘汰 / 吃用）
  _pigeonRichCard(p) {
    const labelOf = { breeder: '种鸽', young: '青年鸽', fatten: '乳鸽', fattening: '乳鸽', sold: '已出栏', dead: '死亡' };
    const g = p.gender === '公' ? '♂' : p.gender === '母' ? '♀' : '🐥';
    const age = p.dob ? Utils.ageDays(p.dob) : 0;
    const ri = Utils.retireInfo(p.dob);
    const cur = Storage.getBreeds().find(b =>
      (b.maleId === p.id || b.femaleId === p.id) && b.status !== 'sold' && b.status !== 'failed');
    const curMeta = cur ? this._phaseMeta(this._pairStatusKey(cur)) : null;
    const upcoming = cur ? Utils.upcomingNodes(cur, 3) : [];
    const penShort = (Utils.penName(p.penId) || '未设鸽舍').split('·')[0];

    const nodesHTML = upcoming.length
      ? upcoming.map(n => `
          <div style="font-size:13px;color:#b0741a;line-height:2;font-weight:500">
            预计${n.label} ${Utils.fmtMonthDay(n.date)}
            <span style="color:var(--ios-gray3);font-weight:400">（${n.daysUntil < 0 ? '已过期' + (-n.daysUntil) + '天，待补记' : n.daysUntil === 0 ? '今天' : '还有 ' + n.daysUntil + ' 天'}）</span>
          </div>`).join('')
      : `<div style="font-size:12.5px;color:var(--ios-gray3);line-height:2">${cur ? '暂无待办节点' : '未配对，暂无繁殖节点'}</div>`;

    const meal = Feeding.recipeForYoung(Utils.today(), 'am');
    const dailyCost = meal ? meal.cost * 2 : 0;
    const unres = Utils.unresolvedException(p.id);
    const hardCost = Utils.pigeonHardCost(p.id);

    return `
      <div class="home-big-card tappable" data-pigeon-card="${p.id}" style="background:#fff;padding:14px 16px;border-radius:16px">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span style="font-size:17px;font-weight:800;letter-spacing:0.3px">${p.code || '未编号'} <span style="font-size:13px;color:${p.gender === '母' ? '#ff2d55' : 'var(--ios-blue)'}">${g}</span></span>
          ${p.family ? `<span style="font-size:10px;font-weight:600;color:var(--ios-purple);background:rgba(175,82,222,0.12);padding:2px 6px;border-radius:5px">家号 ${p.family}</span>` : ''}
          <span style="font-size:10px;font-weight:700;color:var(--ios-blue);background:rgba(0,122,255,0.12);padding:3px 7px;border-radius:6px">${penShort}</span>
          <span style="font-size:11px;font-weight:700;color:#fff;background:${curMeta ? curMeta.color : 'var(--ios-purple)'};padding:3px 9px;border-radius:6px">${curMeta ? curMeta.label : (labelOf[p.status] || p.status)}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--ios-gray)">${age} 天</span>
        </div>

        <div style="font-size:12px;color:var(--ios-gray3);margin-top:5px">
          ${p.breed || '未登记'} · ${p.weight ? p.weight + 'g' : '未登记体重'} · ${cur ? '配对 ' + Feeding.pairTitle(cur) : '未配对'}
        </div>

        <div style="margin-top:4px">${nodesHTML}</div>
        ${unres ? `<div style="font-size:13px;color:var(--ios-red);line-height:2;font-weight:600">🚑 未恢复：${unres.note}</div>` : ''}

        ${ri ? `<div style="font-size:12.5px;color:${ri.overdue ? 'var(--ios-red)' : ri.months <= 6 ? '#c0392b' : 'var(--ios-gray)'};line-height:2">⏰ 预计淘汰 ${ri.date}（${ri.overdue ? '已超 ' + ri.remainTxt : '还有 ' + ri.remainTxt}）</div>` : ''}

        <div style="font-size:13px;font-weight:700;color:var(--ios-text);margin-top:8px">
          ${cur ? '今日吃用' : '每日吃用'} ${Utils.fmtMoney(cur ? Utils.pairTodayCost(cur) : dailyCost)}
        </div>

        <div style="font-size:12px;color:var(--ios-gray3);margin-top:3px">上次操作：${(() => {
          const evs = [];
          if (cur) {
            if (cur.pairDate) evs.push([cur.pairDate, '配对']);
            if (cur.layDate) evs.push([cur.layDate, '下蛋']);
            if (cur.candledDate) evs.push([cur.candledDate, '照蛋']);
            if (cur.hatchDate) evs.push([cur.hatchDate, '出壳']);
            (cur.losses || []).forEach(l => evs.push([l.date, l.reason]));
          }
          if (unres) evs.push([unres.date, '记异常']);
          evs.sort((x, y) => String(y[0]).localeCompare(String(x[0])));
          return evs[0] ? `${evs[0][1]} ${String(evs[0][0]).slice(5)}` : '无';
        })()}</div>

        <div style="font-size:12.5px;color:#b0741a;margin-top:4px">🐣 ${age} 天（${Math.max(1, Math.floor(age / 30))} 月）</div>
      </div>
    `;
  },

  _bindPopulation() {
    document.querySelectorAll('#page-content [data-pop-stat]').forEach(el => {
      if (el._bound) return;
      el._bound = true;
      el.addEventListener('click', e => {
        e.stopPropagation();
        const on = el.classList.contains('active');
        document.querySelectorAll('[data-pop-stat]').forEach(s => s.classList.toggle('active', !on && s === el));
        document.querySelectorAll('[data-pop-status]').forEach(c => c.classList.remove('active'));
        document.getElementById('pop-list').innerHTML = this._populationList(on ? 'default' : el.dataset.popStat);
        this._bindPigeonCards();
        this._bindTaps();
      });
    });

    document.querySelectorAll('#page-content [data-pop-status]').forEach(chip => {
      if (chip._bound) return;
      chip._bound = true;
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const on = chip.classList.contains('active');
        document.querySelectorAll('[data-pop-status]').forEach(c => c.classList.toggle('active', !on && c === chip));
        document.querySelectorAll('[data-pop-stat]').forEach(s => s.classList.remove('active'));
        document.getElementById('pop-list').innerHTML = this._populationList(on ? 'default' : chip.dataset.popStatus);
        this._bindPigeonCards();
        this._bindTaps();
      });
    });

    this._bindPigeonCards();
  },

  _bindPigeonCards() {
    document.querySelectorAll('#pop-list [data-pigeon-card]').forEach(el => {
      if (el._bound) return;
      el._bound = true;
      el.addEventListener('click', e => {
        e.stopPropagation();
        this.showPigeonCardDetail(el.dataset.pigeonCard);
      });
    });
  },

  // 鸽子卡片详情（弹窗，与配对卡同款）
  showPigeonCardDetail(id) {
    const p = Utils.pigeonById(id);
    if (!p) return;
    const labelOf = { breeder: '种鸽', young: '青年鸽', fatten: '乳鸽', fattening: '乳鸽', sold: '已出栏', dead: '死亡' };
    const age = p.dob ? Utils.ageDays(p.dob) : 0;
    const ri = Utils.retireInfo(p.dob);
    const breeds = Storage.getBreeds().filter(b => b.maleId === id || b.femaleId === id);
    const cur = breeds.find(b => b.status !== 'sold' && b.status !== 'failed');
    const curMeta = cur ? this._phaseMeta(this._pairStatusKey(cur)) : null;
    const upcoming = cur ? Utils.upcomingNodes(cur, 3) : [];
    const g = p.gender === '公' ? '♂' : p.gender === '母' ? '♀' : '?';
    const gColor = p.gender === '母' ? '#ff2d55' : 'var(--ios-blue)';
    const penShort = (Utils.penName(p.penId) || '未设鸽舍').split('·')[0];
    const meal = Feeding.recipeForYoung(Utils.today(), 'am');
    const dailyCost = meal ? meal.cost * 2 : 0;
    const sire = p.sireId ? Utils.pigeonById(p.sireId) : null;
    const dam = p.damId ? Utils.pigeonById(p.damId) : null;
    const ancCount = Utils.ancestorsOf(id, 4).size;
    const unres = Utils.unresolvedException(id);
    const hardCost = Utils.pigeonHardCost(id);

    const meta = curMeta || { label: (labelOf[p.status] || p.status) + (p.pending ? ' · 待定' : ''), color: p.pending ? '#c25e0e' : (p.status === 'breeder' ? '#1f7a4d' : 'var(--ios-purple)') };

    const nodesHTML = upcoming.length
      ? upcoming.map(n => `
          <div style="font-size:13px;color:#b0741a;line-height:2;font-weight:500">
            预计${n.label} ${Utils.fmtMonthDay(n.date)}
            <span style="color:var(--ios-gray3);font-weight:400">（${n.daysUntil < 0 ? '已过期' + (-n.daysUntil) + '天，待补记' : n.daysUntil <= 0 ? '今天' : '还有 ' + n.daysUntil + ' 天'}）</span>
          </div>`).join('')
      : `<div style="font-size:12.5px;color:var(--ios-gray3);line-height:2">${cur ? '暂无待办节点' : '未配对，暂无繁殖节点'}</div>`;



    Utils.openModal('卡片详情', `
      <div style="padding:2px 16px 10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="min-width:0">
            <div style="font-size:24px;font-weight:800;letter-spacing:0.4px;line-height:1.25">${p.code || '未编号'} <span style="font-size:15px;color:${gColor}">${g}</span></div>
            <div style="font-size:12px;color:var(--ios-gray3);margin-top:5px">${p.breed || '未登记'} · ${p.weight ? p.weight + 'g' : '未登记体重'} · ${cur ? '配对 ' + Feeding.pairTitle(cur) : '未配对'}</div>
          </div>
          <button id="pg-ops" style="flex-shrink:0;background:#1c1c1e;color:#fff;border:0;border-radius:10px;padding:9px 15px;font-size:13px;font-weight:600">操作</button>
        </div>

        <div style="display:flex;align-items:center;gap:7px;margin-top:12px">
          <span style="font-size:11px;font-weight:700;color:var(--ios-gray);background:rgba(118,118,128,0.14);padding:3px 7px;border-radius:6px">${penShort}</span>
          <span style="font-size:11px;font-weight:700;color:#fff;background:${meta.color};padding:3px 9px;border-radius:6px">${meta.label}</span>
          <span style="margin-left:auto;font-size:11px;color:var(--ios-gray)">${age} 天</span>
        </div>

        <div style="margin-top:8px">${nodesHTML}</div>
        ${unres ? `<div style="font-size:13px;color:var(--ios-red);line-height:2;font-weight:600">🚑 未恢复：${unres.note}</div>` : ''}
        ${ri ? `<div style="font-size:12.5px;color:${ri.overdue ? 'var(--ios-red)' : ri.months <= 6 ? '#c0392b' : 'var(--ios-gray)'};line-height:2">⏰ 预计淘汰 ${ri.date}（${ri.overdue ? '已超 ' + ri.remainTxt : '还有 ' + ri.remainTxt}）</div>` : ''}

        <div style="font-size:13.5px;font-weight:700;margin-top:8px">
          ${cur ? '今日吃用' : '每日吃用'} ${Utils.fmtMoney(cur ? Utils.pairTodayCost(cur) : dailyCost)}
        </div>
        ${hardCost > 0 ? `<div style="font-size:12px;color:var(--ios-gray);margin-top:3px">硬性成本 <b style="color:var(--ios-red)">${Utils.fmtMoney(hardCost)}</b>（买价${Utils.fmtMoney(p.purchasePrice || 0)} · 药费${Utils.fmtMoney(Utils.pigeonMedCost(p.id))} · 损失分摊${Utils.fmtMoney(Utils.pigeonLossCost(p.id))}${p.nestCostInherited ? ' · 窝转' + Utils.fmtMoney(p.nestCostInherited) : ''}）</div>` : ''}

        <div style="margin-top:12px;background:var(--ios-gray6);border-radius:12px;padding:8px 14px">
          ${this._infoRow2('出生日期', p.dob)}
          ${this._infoRow2('代数', `第 ${Utils.generationOf(id)} 代`)}
          ${this._infoRow2('家号', p.family || '未登记')}
          ${this._infoRow2('来源', p.source === 'purchased' ? '外购' : '自繁')}
          ${this._infoRow2('血统', (sire || dam) ? `♂${sire?.code || '—'} × ♀${dam?.code || '—'}` : '未登记')}
          ${this._infoRow2('4 代祖先', ancCount ? ancCount + ' 只（已录入）' : '未录入')}
          ${this._infoRow2('配对情况', cur ? Feeding.pairTitle(cur) : '未配对')}
          ${this._infoRow2('硬性成本', hardCost > 0 ? `${Utils.fmtMoney(hardCost)}（买价${Utils.fmtMoney(p.purchasePrice || 0)} + 药费${Utils.fmtMoney(Utils.pigeonMedCost(id))} + 损失分摊${Utils.fmtMoney(Utils.pigeonLossCost(id))}${p.nestCostInherited ? ' + 窝转' + Utils.fmtMoney(p.nestCostInherited) : ''}）` : '无', hardCost > 0 ? 'var(--ios-red)' : null)}
          ${this._infoRow2('异常', unres ? `${unres.note}（未恢复）` : (Storage.getExceptions().some(e => e.pigeonId === id) ? '历史异常已恢复' : '无'), unres ? 'var(--ios-red)' : null)}
          ${this._infoRow2('备注', p.notes || '无')}
        </div>

        <div style="font-size:12px;color:var(--ios-gray3);margin-top:3px">上次操作：${(() => {
          const evs = [];
          if (cur) {
            if (cur.pairDate) evs.push([cur.pairDate, '配对']);
            if (cur.layDate) evs.push([cur.layDate, '下蛋']);
            if (cur.candledDate) evs.push([cur.candledDate, '照蛋']);
            if (cur.hatchDate) evs.push([cur.hatchDate, '出壳']);
            (cur.losses || []).forEach(l => evs.push([l.date, l.reason]));
          }
          if (unres) evs.push([unres.date, '记异常']);
          evs.sort((x, y) => String(y[0]).localeCompare(String(x[0])));
          return evs[0] ? `${evs[0][1]} ${String(evs[0][0]).slice(5)}` : '无';
        })()}</div>

        <div style="font-size:12.5px;color:#b0741a;margin-top:6px">🐣 ${age} 天（约 ${Math.max(1, Math.floor(age / 30))} 个月）</div>
      </div>
    `, [
      { label: '完整档案', style: 'btn-primary', onClick: () => {
        Utils.closeModal();
        PigeonsPage.showDetail(id);
      }},
      { label: '关闭', style: 'btn-secondary' }
    ]);

    document.getElementById('pg-ops').onclick = () => this._pigeonActions(id);
  },

  /** 鸽子卡片的「操作」菜单 */
  _pigeonActions(id) {
    const p = Utils.pigeonById(id);
    if (!p) return;
    const cur = Storage.getBreeds().find(b =>
      (b.maleId === id || b.femaleId === id) && b.status !== 'sold' && b.status !== 'failed');
    const unres = Utils.unresolvedException(id);

    const item = (icon, title, sub, act) => `
      <button class="pg-action" data-act="${act}" style="width:100%;display:flex;align-items:center;gap:12px;background:#fff;border:0;border-bottom:0.5px solid var(--ios-separator);padding:14px 16px;text-align:left;cursor:pointer">
        <span style="font-size:19px;width:24px;text-align:center">${icon}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:15px;font-weight:600;color:var(--ios-text)">${title}</span>
          <span style="display:block;font-size:11px;color:var(--ios-gray3);margin-top:2px">${sub}</span>
        </span>
        <span style="color:var(--ios-gray3)">›</span>
      </button>`;

    Utils.openModal('操作', `
      <div style="margin:-6px 0 8px;border-top:0.5px solid var(--ios-separator);border-radius:12px;overflow:hidden">
        ${item('✏️', '编辑档案', '编号 / 家号 / 血统 / 体重 / 备注', 'edit')}
        ${p.gender === '未知' ? item('♂', '定为公', '性别待定 → 公', 'male') : ''}
        ${p.gender === '未知' ? item('♀', '定为母', '性别待定 → 母', 'female') : ''}
        ${item('🚑', '记异常', '生病记录 + 药费计入硬性成本', 'exception')}
        ${unres ? item('✅', '恢复', `「${unres.note}」已好转，可补记药费`, 'resolve') : ''}
        ${item('💀', '记死亡', '标记死亡，所在配对自动结束', 'dead')}
        ${item('📤', '出售', '写销售记录并计入收入', 'sell')}
        ${item('🏷', '留种', '设为种鸽，等待配对', 'keep')}
        ${item('🕐', '待定', '暂列青年鸽，公母可后改', 'pending')}
        ${cur ? item('🥚', '配对详情', '查看该配对完整信息', 'pair') : ''}
        ${p.archived ? item('📂', '复活归档', '恢复到正常列表', 'unarchive') : item('📦', '归档', '从列表隐藏但保留档案', 'archive')}
        ${item('📄', '完整档案', '进入鸽子完整页面', 'full')}
      </div>
    `, [{ label: '取消', style: 'btn-secondary' }]);

    document.querySelectorAll('.pg-action').forEach(btn => {
      const act = btn.dataset.act;
      if (act === 'edit') btn.onclick = () => { Utils.closeModal(); PigeonsPage.openForm(id); };
      if (act === 'full') btn.onclick = () => { Utils.closeModal(); PigeonsPage.showDetail(id); };
      if (act === 'pair') btn.onclick = () => { if (cur) this.showPairCardDetail(cur.id); };
      if (act === 'exception') btn.onclick = () => { Utils.closeModal(); this._recordException(id); };
      if (act === 'resolve') btn.onclick = () => { Utils.closeModal(); this._resolveException(id); };
      if (act === 'male' || act === 'female') btn.onclick = () => {
        const list = Storage.getPigeons();
        const x = list.find(z => z.id === id);
        x.gender = act === 'male' ? '公' : '母';
        x.pending = false;
        Storage.setPigeons(list);
        Utils.closeModal();
        Utils.toast(`已定为${x.gender}`);
        this.showPigeonCardDetail(id);
      };
      if (act === 'dead') btn.onclick = () => {
        Utils.openModal('记死亡 · ' + (p.code || ''), `
          <p style="font-size:13px;line-height:1.8">
            确认 <b>${p.code}</b>（${p.gender}）死亡？<br>
            ${cur ? `所在配对 <b>${Feeding.pairTitle(cur)}</b> 将自动结束，幸存的一只变成单鸽（可重新配对）。` : '该鸽未在配对中。'}
          </p>
        `, [
          { label: '取消', style: 'btn-secondary' },
          { label: '确认死亡', style: 'btn-danger', onClick: () => {
            const list = Storage.getPigeons();
            const x = list.find(z => z.id === id);
            x.status = 'dead';
            x.deadDate = Utils.today();
            x.archived = true;  // 死亡自动归档，编号加「.」表示已不在群、可复用（重名退役自动递增 A1001.2）
            x.code = Utils.retireCode(x.code, id);
            Storage.setPigeons(list);
            if (cur) {
              const breeds = Storage.getBreeds();
              const b = breeds.find(z => z.id === cur.id);
              if (b) {
                b.status = 'failed';
                b.notes = [b.notes, `${p.code} 死亡，配对结束`].filter(Boolean).join('；');
                Storage.setBreeds(breeds);
              }
            }
            Utils.closeModal();
            Utils.toast('已记死亡' + (cur ? '，配对已结束' : ''));
            if (typeof Notify !== 'undefined') Notify.refresh();
            App.switchTab('pigeons');
          }}
        ]);
      };
      if (act === 'archive') btn.onclick = () => {
        const list = Storage.getPigeons();
        list.find(z => z.id === id).archived = true;
        Storage.setPigeons(list);
        Utils.closeModal();
        Utils.toast('已归档 · 到鸽子页「归档」标签可找回');
        if (typeof Notify !== 'undefined') Notify.refresh();
        App.switchTab('pigeons');
      };
      if (act === 'unarchive') btn.onclick = () => {
        const list = Storage.getPigeons();
        list.find(z => z.id === id).archived = false;
        Storage.setPigeons(list);
        Utils.closeModal();
        Utils.toast('已复活归档');
        this.showPigeonCardDetail(id);
      };
      if (act === 'keep') btn.onclick = () => {
        const list = Storage.getPigeons();
        const x = list.find(z => z.id === id);
        x.pending = false;
        x.notes = (x.notes ? x.notes + ' · ' : '') + '留种';
        Storage.setPigeons(list);
        Utils.closeModal();
        Utils.toast('已留种');
        this.showPigeonCardDetail(id);
      };
      if (act === 'pending') btn.onclick = () => {
        const list = Storage.getPigeons();
        const x = list.find(z => z.id === id);
        x.pending = true;
        x.status = 'young';
        x.notes = (x.notes ? x.notes + ' · ' : '') + '待定（公母可后改）';
        Storage.setPigeons(list);
        Utils.closeModal();
        Utils.toast('已列为待定青年鸽');
        this.showPigeonCardDetail(id);
      };
      if (act === 'sell') btn.onclick = () => {
        Utils.closeModal();
        Utils.openModal('出售鸽子', `
          <div class="form-group">
            <div class="form-row"><label class="form-label">出售日期</label>
              <input class="form-input" type="date" id="ps-date" value="${Utils.today()}" /></div>
            <div class="form-row"><label class="form-label">单价 (¥)</label>
              <input class="form-input" type="number" step="0.1" id="ps-price" placeholder="如 45" /></div>
            <div class="form-row"><label class="form-label">买家</label>
              <input class="form-input" id="ps-buyer" placeholder="选填" /></div>
          </div>
        `, [
          { label: '取消', style: 'btn-secondary' },
          { label: '确认出售并入账', style: 'btn-primary', keepOpen: true, onClick: () => {
            const price = Number(document.getElementById('ps-price').value) || 0;
            if (price <= 0) { Utils.toast('请填写售价'); return; }
            const sales = Storage.getSales();
            sales.push({
              id: Utils.uid('s'), pigeonIds: [id], breedId: null,
              saleDate: document.getElementById('ps-date').value,
              count: 1, weight: p.weight || 0, price, total: price,
              buyer: document.getElementById('ps-buyer').value.trim(),
              prevStatuses: { [id]: p.status },
              notes: `出售 ${p.code}`
            });
            Storage.setSales(sales);
            const list = Storage.getPigeons();
            const x = list.find(z => z.id === id);
            x.status = 'sold';
            x.archived = true;  // 出售自动归档，编号加「.」表示已出栏、编号可复用（重名退役自动递增）
            x.code = Utils.retireCode(x.code, id);
            Storage.setPigeons(list);
            Utils.closeModal();
            Utils.toast(`已出售 ${p.code}，收入 ${Utils.fmtMoney(price)}（编号变为 ${x.code}，可复用）`);
          }}
        ]);
      };
    });
  },

  // ============================================================
  // 🥚 配对卡片（编号 + 状态 + 预计节点 + 淘汰 + 吃用 + 成绩）
  // ============================================================
  _pairCardHTML(b) {
    const male = Utils.pigeonById(b.maleId);
    const female = Utils.pigeonById(b.femaleId);
    const upcoming = Utils.upcomingNodes(b, 3);
    const maleRetire = Utils.retireInfo(male?.dob);
    const femaleRetire = Utils.retireInfo(female?.dob);
    const cost = Utils.pairCost(b);
    const todayCost = Utils.pairTodayCost(b);
    const lossTotal = Utils.pairLossTotal(b);
    const unres = Utils.pairHasUnresolved(b)
      ? (Utils.unresolvedException(b.maleId) || Utils.unresolvedException(b.femaleId))
      : null;

    const ph = this._pairStatusKey(b);
    const meta = this._phaseMeta(ph);
    const sib = this._siblingNest(b);
    const sibPh = sib ? this._pairStatusKey(sib) : null;
    const sibMeta = sib ? this._phaseMeta(sibPh) : null;
    const phaseLabel = ph === 'laying' ? `🥚产蛋中·${b.eggCount || 0}枚` : meta.label;
    const startDate = (ph === 'brooding' || ph === 'tosell') ? b.hatchDate
      : ph === 'incubating' ? (b.secondEggDate || b.layDate)
      : ph === 'laying' ? b.layDate
      : b.pairDate;
    const phaseDays = startDate ? Utils.daysBetween(startDate, Utils.today()) : null;
    const penShort = (Utils.penName(b.penId) || '未设鸽舍').split('·')[0];

    const eggs = b.eggCount || 0;
    const hatched = b.hatchCount || 0;
    const alive = b.surviveCount || 0;
    const perBird = cost / Math.max(alive || hatched || 1, 1);
    const rate = eggs > 0 ? Math.round(alive / eggs * 100) : 0;
    const ageTxt = p => p?.dob
      ? `${Utils.ageDays(p.dob)} 天（${Math.max(1, Math.floor(Utils.ageDays(p.dob) / 30))} 月）`
      : '—';

    const expectedHTML = upcoming.length === 0
      ? `<div style="font-size:12.5px;color:var(--ios-gray3);line-height:2">暂无待办节点</div>`
      : upcoming.map(n => `
          <div style="font-size:13px;color:#b0741a;line-height:2;font-weight:500">
            预计${n.label} ${Utils.fmtMonthDay(n.date)}
            <span style="color:var(--ios-gray3);font-weight:400">（${n.daysUntil < 0 ? '已过期' + (-n.daysUntil) + '天，待补记' : n.daysUntil === 0 ? '今天' : '还有 ' + n.daysUntil + ' 天'}）</span>
          </div>`).join('');

    const retireRow = (label, info) => {
      if (!info) return '';
      const c = info.overdue ? 'var(--ios-red)' : info.months <= 6 ? '#c0392b' : 'var(--ios-gray)';
      return `<div style="font-size:12.5px;color:${c};line-height:2">⏰ ${label}淘汰 ${info.date}（${info.overdue ? '已超 ' + info.remainTxt : '还有 ' + info.remainTxt}）</div>`;
    };

    return `
      <div class="home-big-card tappable" data-pair-card="${b.id}" style="background:#fff;padding:14px 16px;border-radius:16px">
        <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span style="font-size:17px;font-weight:800;letter-spacing:0.3px">${male?.code || '?'} <span style="font-size:13px;color:var(--ios-blue)">♂</span></span>
          <span style="font-size:14px;color:var(--ios-gray3);font-weight:600">+</span>
          <span style="font-size:17px;font-weight:800;letter-spacing:0.3px">${female?.code || '?'} <span style="font-size:13px;color:#ff2d55">♀</span></span>
          ${male?.family ? `<span style="font-size:10px;font-weight:600;color:var(--ios-purple);background:rgba(175,82,222,0.12);padding:2px 6px;border-radius:5px">家号 ${male.family}</span>` : ''}
          <span style="font-size:10px;font-weight:700;color:var(--ios-blue);background:rgba(0,122,255,0.12);padding:3px 7px;border-radius:6px">${penShort}</span>
          ${b.cageNo ? `<span style="font-size:10px;font-weight:700;color:#c25e0e;background:rgba(255,149,0,0.14);padding:3px 7px;border-radius:6px">${b.cageNo}号笼</span>` : ''}
          <span style="font-size:11px;font-weight:700;color:#fff;background:${meta.color};padding:3px 9px;border-radius:6px">${phaseLabel}</span>
          ${sib ? `<span style="font-size:11px;font-weight:700;color:#fff;background:${sibMeta.color};padding:3px 9px;border-radius:6px">＋${sibMeta.label}</span>` : ''}
          <span style="margin-left:auto;font-size:11px;color:var(--ios-gray)">${phaseDays !== null && phaseDays >= 0 ? phaseLabel + '第 ' + phaseDays + ' 天' : ''}</span>
        </div>

        ${sib ? `<div style="font-size:12px;color:#b0741a;margin-top:5px">🪺 连蛋带仔：另一窝${sibPh === 'incubating' || sibPh === 'laying' ? '孵化中' : '带仔中'}（${sib.layDate ? '下蛋 ' + Utils.fmtMonthDay(sib.layDate) : '配对 ' + Utils.fmtMonthDay(sib.pairDate)}${(sibPh === 'brooding' || sibPh === 'tosell') ? ` · 本窝已吃 ${Utils.fmtMoney(Utils.pairCost(sib))}` : ''}）</div>` : ''}

        <div style="margin-top:6px">${expectedHTML}</div>
        ${unres ? `<div style="font-size:13px;color:var(--ios-red);line-height:2;font-weight:600">🚑 未恢复：${unres.note}（${(Utils.pigeonById(unres.pigeonId) || {}).code || '?'}）</div>` : ''}

        <div style="margin-top:2px">
          ${retireRow('公', maleRetire)}
          ${retireRow('母', femaleRetire)}
        </div>

        <div style="font-size:13px;font-weight:700;color:var(--ios-text);margin-top:8px">
          本窝 ${Utils.fmtMoney(cost)}${cost === 0 && sib ? '<span style="font-size:11px;color:var(--ios-gray);font-weight:500">（旧窝出栏后开始算）</span>' : ''} · 每只 ${Utils.fmtMoney(perBird)} · 今日吃用 ${Utils.fmtMoney(todayCost)}
        </div>
        ${lossTotal > 0 ? `<div style="font-size:12px;color:var(--ios-red);margin-top:3px">繁殖损失 ${Utils.fmtMoney(lossTotal)}（${(b.losses || []).map(l => l.reason).join('、')}）</div>` : ''}

        <div style="font-size:12px;color:var(--ios-gray);margin-top:4px">
          成绩：${eggs} 枚蛋 · 出壳 ${hatched} 只 · 成活 ${alive} 只 · 成活率 ${rate}%
        </div>

        ${(() => {
          const evs = [];
          if (b.pairDate) evs.push([b.pairDate, '配对']);
          if (b.layDate) evs.push([b.layDate, '下蛋']);
          if (b.secondEggDate) evs.push([b.secondEggDate, '补蛋']);
          if (b.candledDate) evs.push([b.candledDate, '照蛋']);
          if (b.hatchDate) evs.push([b.hatchDate, '出壳']);
          (b.losses || []).forEach(l => evs.push([l.date, l.reason]));
          evs.sort((x, y) => String(y[0]).localeCompare(String(x[0])));
          return evs[0] ? `<div style="font-size:12px;color:var(--ios-gray3);margin-top:3px">上次操作：${evs[0][1]} ${String(evs[0][0]).slice(5)}</div>` : '';
        })()}

        ${(() => {
          const cyc = Utils.pairCycleDays(b.maleId, b.femaleId);
          return cyc ? `<div style="font-size:12px;color:var(--ios-gray);margin-top:3px">🔁 周期 ${cyc} 天/窝 · 一年约 ${Math.floor(365 / cyc)} 窝</div>` : '';
        })()}

        <div style="font-size:12.5px;color:#b0741a;margin-top:4px">🐣 公 ${ageTxt(male)} · 母 ${ageTxt(female)}</div>
      </div>
    `;
  },

  // ============================================================
  // 📤 出栏计划大卡（明天/本周/在养 + 上月/本月/下月小卡片）
  // ============================================================
  _salePlanBigCard() {
    const tmr = Utils.expectedTomorrow();
    const week = Utils.expectedThisWeek();
    const inStockYoung = Utils.inStockYoung();
    const last = Utils.lastMonthCompare();
    const thisM = Utils.thisMonthCompare();
    const nextM = Utils.nextMonthExpected();

    const topBox = (label, bigNum, sub, colorVal) => `
      <div style="flex:1;min-width:0;text-align:center;padding:8px 4px;background:rgba(255,255,255,0.6);border-radius:10px">
        <div style="font-size:10px;color:var(--ios-gray3);margin-bottom:2px">${label}</div>
        <div style="font-size:21px;font-weight:800;color:${colorVal||'var(--ios-text)'};letter-spacing:-0.5px;line-height:1.1">${bigNum}</div>
        ${sub ? `<div style="font-size:9px;color:var(--ios-gray3);margin-top:2px">${sub}</div>` : ''}
      </div>
    `;

    const monthCard = (title, expected, actual, hasActual, accent) => {
      const exp = Number(expected).toFixed(0);
      if (!hasActual) {
        return this._miniCard(
          title,
          `<div style="font-size:15px;font-weight:800;color:${accent};line-height:1.5">预计 ${exp}</div>`,
          '生产中'
        );
      }
      const ok = Number(actual) >= Number(expected);
      return this._miniCard(
        title,
        `<div style="font-size:11.5px;font-weight:800;line-height:1.5;white-space:nowrap;letter-spacing:-0.2px">
          <span style="color:${accent}">预计${exp}</span>
          <span style="color:var(--ios-gray3);margin:0 2px">·</span>
          <span style="color:${ok ? 'var(--ios-green)' : 'var(--ios-red)'}">实际${Number(actual).toFixed(0)}</span>
        </div>`,
        ok ? '达标' : '未达标'
      );
    };

    return `
      <div class="home-big-card tappable" data-route="breed" style="background:linear-gradient(140deg,#fef3c7 0%,#fff7ed 70%,#fef9c3 100%)">
        <div class="card-hint-arrow">›</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,149,0,0.2);display:flex;align-items:center;justify-content:center;font-size:16px">📤</div>
          <div style="font-size:14px;font-weight:700">出栏计划</div>
          <div style="font-size:10px;color:var(--ios-gray3);margin-left:auto">${Utils.farmCycleDays()}天/轮</div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:10px">
          ${topBox('明天预计', tmr + '只', '', 'var(--ios-orange)')}
          ${topBox('本周预计', week.expected + '只', '本周已出 ' + week.actual, 'var(--ios-blue)')}
          ${topBox('在养', inStockYoung + '只', '幼鸽+育肥', 'var(--ios-green)')}
        </div>

        <div style="display:flex;gap:8px">
          ${monthCard(`上月 ${last.ym.slice(5)}月`, last.expected, last.actual, true, 'var(--ios-orange)')}
          ${monthCard(`本月 ${thisM.ym.slice(5)}月`, thisM.expected, 0, false, 'var(--ios-blue)')}
          ${monthCard(`下月 ${nextM.ym.slice(5)}月`, nextM.expected, 0, false, 'var(--ios-purple)')}
        </div>
      </div>
    `;
  },

  // ============================================================
  // 🎯 配对计划大卡（计划/现有/还差 小卡片）
  // ============================================================
  _pairPlanBigCard() {
    const current = Storage.getPairPlans()[0];

    if (!current) {
      return `
        <div class="home-big-card tappable" data-pair-plan="1" style="background:linear-gradient(140deg,#e0e7ff 0%,#f0abfc 100%);padding:18px;cursor:pointer">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
            <div style="width:32px;height:32px;border-radius:10px;background:rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:18px">🎯</div>
            <div style="flex:1">
              <div style="font-size:14px;font-weight:700">配对计划</div>
              <div style="font-size:11px;color:var(--ios-gray3)">输入目标对数，按现有数据预测达成时间</div>
            </div>
            <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--ios-purple)">+</div>
          </div>
          <div style="text-align:center;padding:10px 0;color:var(--ios-gray)">点击设置计划</div>
        </div>
      `;
    }

    const p = Utils.pairPlanProgress(current);
    const foot = p.remaining === 0
      ? '目标已完成'
      : p.shortage > 0
        ? `还缺 ${p.shortage} 对种鸽`
        : `约 ${p.daysToReach} 天达成`;

    return `
      <div class="home-big-card tappable" data-pair-plan="1" style="background:linear-gradient(140deg,#ede9fe 0%,#ddd6fe 80%)">
        <div class="card-hint-arrow">›</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:8px;background:rgba(139,92,246,0.25);display:flex;align-items:center;justify-content:center;font-size:16px">🎯</div>
          <div style="font-size:14px;font-weight:700">配对计划</div>
          <div style="font-size:10px;color:var(--ios-gray3);margin-left:auto">按现有数据预测</div>
        </div>

        <div style="display:flex;gap:8px">
          ${this._miniCard('计划对数',
            `<div style="font-size:22px;font-weight:800;color:#6b21a8;line-height:1.2">${p.target}<span style="font-size:11px;font-weight:600"> 对</span></div>`,
            '目标配对数')}
          ${this._miniCard('现有对数',
            `<div style="font-size:22px;font-weight:800;color:var(--ios-green);line-height:1.2">${p.current}<span style="font-size:11px;font-weight:600"> 对</span></div>`,
            `完成 ${p.progress}%`)}
          ${this._miniCard('还差对数',
            `<div style="font-size:22px;font-weight:800;color:${p.remaining > 0 ? 'var(--ios-orange)' : 'var(--ios-green)'};line-height:1.2">${p.remaining}<span style="font-size:11px;font-weight:600"> 对</span></div>`,
            foot)}
        </div>
        <div style="font-size:10.5px;color:var(--ios-gray3);margin-top:8px;text-align:center">
          现有种鸽最多可配 <b>${p.maxPairs}</b> 对${p.shortage > 0 ? ` · 还缺 ${p.shortage} 对` : ''}
        </div>
      </div>
    `;
  },

  // ============================================================
  // 🔄 老龄化淘汰大卡（超阈值/临近/健康 小卡片）
  // ============================================================
  _agingBigCard() {
    const list = Utils.agingCheck();
    const overdue = list.filter(p => p.overDue);
    const soon = list.filter(p => !p.overDue && p.monthsLeft <= 6);
    const healthy = list.filter(p => p.monthsLeft > 6);
    const th = Storage.getAgingConfig().breederMaxMonths;

    const rowHtml = (p) => {
      const isUrgent = p.overDue;
      const ri = Utils.retireInfo(p.dob, th);
      return `
        <div class="list-item" style="padding:8px 14px">
          <div class="list-item-icon" style="background:${isUrgent?'rgba(255,59,48,0.12)':'rgba(255,149,0,0.12)'}">${isUrgent?'🚨':'⚠️'}</div>
          <div class="list-item-content">
            <div class="list-item-title">${p.code} · ${p.breed || '未登记'}</div>
            <div class="list-item-sub">${p.gender} · ${p.ageMonths}个月${ri ? ` · ${ri.overdue?'已超龄':'剩'+ri.remainTxt}` : ''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:${isUrgent?'var(--ios-red)':'var(--ios-orange)'};font-size:12px">${isUrgent?'建议淘汰':'临近'}</div>
          </div>
        </div>
      `;
    };

    let detail = '';
    if (overdue.length || soon.length) {
      detail = `
        <div style="display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,0.4);border-radius:12px;padding:4px 0;margin-top:10px">
          ${overdue.map(rowHtml).join('')}
          ${soon.map(rowHtml).join('')}
        </div>
      `;
    }

    return `
      <div class="home-big-card" style="background:${overdue.length>0?'linear-gradient(140deg,#fee2e2,#fef3c7)':'linear-gradient(140deg,#dcfce7,#ecfccb)'}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div style="width:28px;height:28px;border-radius:8px;background:${overdue.length>0?'rgba(255,59,48,0.2)':'rgba(52,199,89,0.2)'};display:flex;align-items:center;justify-content:center;font-size:16px">🔄</div>
          <div style="font-size:14px;font-weight:700">老龄化淘汰</div>
          <div style="font-size:10px;color:var(--ios-gray3);margin-left:auto">阈值 ${th} 月</div>
        </div>

        <div style="display:flex;gap:8px">
          ${this._miniCard('超阈值',
            `<div style="font-size:22px;font-weight:800;color:${overdue.length?'var(--ios-red)':'var(--ios-green)'};line-height:1.2">${overdue.length}<span style="font-size:11px;font-weight:600"> 只</span></div>`,
            overdue.length ? '建议淘汰' : '无')}
          ${this._miniCard('临近淘汰',
            `<div style="font-size:22px;font-weight:800;color:${soon.length?'var(--ios-orange)':'var(--ios-green)'};line-height:1.2">${soon.length}<span style="font-size:11px;font-weight:600"> 只</span></div>`,
            '6个月内')}
          ${this._miniCard('健康种鸽',
            `<div style="font-size:22px;font-weight:800;color:var(--ios-green);line-height:1.2">${healthy.length}<span style="font-size:11px;font-weight:600"> 只</span></div>`,
            `共 ${list.length} 只`)}
        </div>

        ${detail}
      </div>
    `;
  },

  // ============================================================
  // 🌾 饲料库存横滑胶囊
  // ============================================================
  _stockChips() {
    const feeds = Storage.getFeeds();
    const TH_URGENT = 3, TH_WARN = 7;
    const chips = feeds.map(f => {
      const qty = (Storage.getStock().find(x => x.feedId === f.id) || {}).qty || 0;
      const days = Utils.daysUntilOut(f.id);

      let color, bg;
      if (days === Infinity) { color = 'var(--ios-gray)'; bg = 'var(--ios-gray5)'; }
      else if (days <= TH_URGENT) { color = 'var(--ios-red)'; bg = 'rgba(255,59,48,0.12)'; }
      else if (days <= TH_WARN) { color = 'var(--ios-orange)'; bg = 'rgba(255,149,0,0.12)'; }
      else { color = 'var(--ios-green)'; bg = 'rgba(52,199,89,0.12)'; }

      const showDays = days === Infinity
        ? '<span style="font-size:10px;color:var(--ios-gray3)">未消耗</span>'
        : `${days}<span style="font-size:10px;color:var(--ios-gray3)">天</span>`;

      return `
        <div class="stock-chip tappable" data-route="stock" style="background:${bg}">
          <span style="font-size:12.5px;font-weight:700;color:var(--ios-text2)">${f.name}</span>
          <span style="font-size:10.5px;color:var(--ios-gray)">${Math.round(qty * 10) / 10}${f.unit} · <span style="font-size:13px;font-weight:800;color:${color}">${showDays}</span></span>
        </div>
      `;
    }).join('');

    // 脚环胶囊
    const ring = Storage.getRingStock();
    const ringQty = Number(ring.qty) || 0;
    const ringColor = ringQty > 0 ? 'var(--ios-green)' : 'var(--ios-red)';
    const ringBg = ringQty > 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)';
    const ringChip = `
      <div class="stock-chip tappable" data-route="stock" style="background:${ringBg}">
        <span style="font-size:12.5px;font-weight:700;color:var(--ios-text2)">脚环</span>
        <span style="font-size:10.5px;color:var(--ios-gray)">${ringQty} 个 · <span style="font-size:13px;font-weight:800;color:${ringColor}">${Utils.fmtMoney(ringQty * (Number(ring.price) || 0))}</span></span>
      </div>
    `;

    return `
      <div class="section-header" style="padding:4px 16px">
        <h2 class="section-title" style="font-size:14px">🌾 饲料库存</h2>
      </div>
      <div class="stock-chip-row">
        ${chips}
        ${ringChip}
      </div>
    `;
  },

  // ============================================================
  // 配对计划设置弹窗
  // ============================================================
  openPairPlanForm() {
    const current = Storage.getPairPlans()[0] || null;
    const targetPairs = current?.targetPairs || Utils.currentPairedCount() + 4;
    const deadlineDate = current?.deadlineDate || '';
    const pv = Utils.pairPlanProgress({ targetPairs });

    Utils.openModal('🎯 设置配对计划', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">目标对数</label>
          <input class="form-input" type="number" id="pp-target" value="${targetPairs}" placeholder="例如：10" />
        </div>
        <div class="form-row">
          <label class="form-label">截止日期（选填）</label>
          <input class="form-input" type="date" id="pp-deadline" value="${deadlineDate}" />
        </div>
        <div style="font-size:11px;color:var(--ios-gray);margin-top:4px;padding:8px;background:var(--ios-gray5);border-radius:8px">
          💡 现有已配对 <b>${pv.current}</b> 对，现有种鸽最多可配 <b>${pv.maxPairs}</b> 对<br/>
          目标 <b>${targetPairs}</b> 对 → ${pv.shortage > 0
            ? `还缺 <b>${pv.shortage}</b> 对种鸽`
            : pv.remaining > 0
              ? `还差 <b>${pv.remaining}</b> 对，约 <b>${pv.daysToReach}</b> 天达成`
              : '目标已达成'}<br/>
          达成时间按近期实际配对速度估算，鸽子不够会提示补种鸽
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        const t = Number(document.getElementById('pp-target').value);
        const d = document.getElementById('pp-deadline').value;
        if (!t || t <= 0) { Utils.toast('请输入目标对数'); return; }
        Storage.setPairPlans([{
          id: current?.id || Utils.uid('pp'),
          targetPairs: t,
          deadlineDate: d || null,
          createdAt: current?.createdAt || Utils.today(),
          updatedAt: Utils.today()
        }]);
        Utils.toast('✓ 计划已保存');
        this.render();
      }},
      current ? { label: '删除计划', style: 'btn-danger', onClick: () => {
        Storage.setPairPlans([]);
        Utils.toast('已删除计划');
        this.render();
      }} : null
    ].filter(Boolean));
  },

  // ============================================================
  // 卡片详情（首页配对卡片点击）
  // ============================================================
  showPairCardDetail(id) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;

    const m = Utils.pigeonById(b.maleId);
    const f = Utils.pigeonById(b.femaleId);
    const today = Utils.today();
    const recipe = Feeding.recipeForPair(b, today, Feeding.currentMeal());
    const amLog = Feeding.logFor(today, 'am', 'pair', b.id);
    const pmLog = Feeding.logFor(today, 'pm', 'pair', b.id);
    const nodes = Utils.upcomingNodes(b, 3);
    const mR = m ? Utils.retireInfo(m.dob) : null;
    const fR = f ? Utils.retireInfo(f.dob) : null;
    const cost = Utils.pairCost(b);
    const todayCost = Utils.pairTodayCost(b);

    const ph = this._pairStatusKey(b);
    const meta = this._phaseMeta(ph);
    const startDate = (ph === 'brooding' || ph === 'tosell') ? b.hatchDate
      : ph === 'incubating' ? (b.secondEggDate || b.layDate)
      : ph === 'laying' ? b.layDate
      : b.pairDate;
    const phaseDays = startDate ? Utils.daysBetween(startDate, today) : null;
    const penName = Utils.penName(b.penId) || '未设鸽舍';
    const eggs = b.eggCount || 0;
    const hatched = b.hatchCount || 0;
    const alive = b.surviveCount || 0;
    const perBird = cost / Math.max(alive || hatched || 1, 1);
    const rate = eggs > 0 ? Math.round(alive / eggs * 100) : 0;
    const ageTxt = p => p?.dob
      ? `${Utils.ageDays(p.dob)} 天（约 ${Math.max(1, Math.floor(Utils.ageDays(p.dob) / 30))} 个月）`
      : '—';

    const retireLine = (label, info) => {
      if (!info) return '';
      const c = info.overdue ? 'var(--ios-red)' : info.months <= 6 ? '#c0392b' : 'var(--ios-gray)';
      return `<div style="font-size:12.5px;color:${c};line-height:2">⏰ ${label}淘汰 ${info.date}（${info.overdue ? '已超 ' + info.remainTxt : '还有 ' + info.remainTxt}）</div>`;
    };

    const expected = nodes.length ? nodes.map(n => `
      <div style="font-size:13px;color:#b0741a;line-height:2;font-weight:500">
        预计${n.label} ${Utils.fmtMonthDay(n.date)}
        <span style="color:var(--ios-gray3);font-weight:400">（${n.daysUntil < 0 ? '已过期' + (-n.daysUntil) + '天，待补记' : n.daysUntil <= 0 ? '今天' : '还有 ' + n.daysUntil + ' 天'}）</span>
      </div>`).join('') : `<div style="font-size:12.5px;color:var(--ios-gray3);line-height:2">暂无待办节点</div>`;

    const mealTxt = recipe
      ? (recipe.unit === 'day' ? `${recipe.grams}g/天` : `${recipe.grams}g/餐`)
      : '—';



    Utils.openModal('卡片详情', `
      <div style="padding:2px 16px 10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="min-width:0">
            <div style="font-size:23px;font-weight:800;letter-spacing:0.3px;line-height:1.25">
              <span id="pd-m" style="cursor:pointer">${m?.code || '?'} <span style="font-size:15px;color:var(--ios-blue)">♂</span></span>
              <span style="font-size:15px;color:var(--ios-gray3);font-weight:600;margin:0 2px">+</span>
              <span id="pd-f" style="cursor:pointer">${f?.code || '?'} <span style="font-size:15px;color:#ff2d55">♀</span></span>
            </div>
            <div style="font-size:12px;color:var(--ios-gray3);margin-top:5px">${m?.breed || '—'} / ${f?.breed || '—'} · ${penName}</div>
            <div style="font-size:11px;color:var(--ios-gray3);margin-top:2px">点编号可看个体档案</div>
          </div>
          <button id="pd-ops" style="flex-shrink:0;background:#1c1c1e;color:#fff;border:0;border-radius:10px;padding:9px 15px;font-size:13px;font-weight:600">操作</button>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-top:14px">
          <span style="font-size:12px;font-weight:700;color:#fff;background:${meta.color};padding:4px 11px;border-radius:7px">${meta.label}</span>
          ${phaseDays !== null && phaseDays >= 0 ? `<span style="font-size:12px;color:var(--ios-gray)">${meta.label}第 ${phaseDays} 天</span>` : ''}
        </div>

        <div style="margin-top:10px">${expected}</div>
        <div style="margin-top:2px">${retireLine('公', mR)}${retireLine('母', fR)}</div>

        <div style="font-size:13.5px;font-weight:700;margin-top:10px">
          本窝 ${Utils.fmtMoney(cost)} · 每只 ${Utils.fmtMoney(perBird)} · 今日吃用 ${Utils.fmtMoney(todayCost)}
        </div>
        <div style="font-size:12px;color:var(--ios-gray);margin-top:4px">
          成绩：${eggs} 枚蛋 · 出壳 ${hatched} 只 · 成活 ${alive} 只 · 成活率 ${rate}%
        </div>
        <div style="font-size:12.5px;color:#b0741a;margin-top:4px">🐣 公 ${ageTxt(m)} · 母 ${ageTxt(f)}</div>

        <div style="margin-top:12px;background:var(--ios-gray6);border-radius:12px;padding:8px 14px">
          ${this._infoRow2('配对日期', Utils.formatDate(b.pairDate))}
          ${this._infoRow2('家号', m?.family || '未登记')}
          ${this._infoRow2('笼号', b.cageNo ? `${b.cageNo} 号笼` : '未设')}
          ${this._infoRow2('下蛋日期', Utils.formatDate(b.layDate))}
          ${this._infoRow2('第 2 个蛋', Utils.formatDate(b.secondEggDate))}
          ${this._infoRow2('照蛋结果', b.candledDate ? `${b.fertileCount} 枚受精 · ${Utils.formatDate(b.candledDate)}` : '未照蛋', b.candledDate && b.fertileCount === 0 ? 'var(--ios-red)' : null)}
          ${this._infoRow2('出壳日期', Utils.formatDate(b.hatchDate))}
          ${this._infoRow2('出雏 / 成活', `${hatched} / ${alive} 只`)}
          ${Utils.pairLossTotal(b) > 0 ? this._infoRow2('繁殖损失', `${Utils.fmtMoney(Utils.pairLossTotal(b))}（${(b.losses || []).map(l => l.reason).join('、')}）`, 'var(--ios-red)') : ''}
          ${(() => {
            const sib = this._siblingNest(b);
            if (!sib) return '';
            const sp = this._phaseMeta(this._pairStatusKey(sib));
            return this._infoRow2('另一窝', `${sp.label}${sib.layDate ? ' · 下蛋 ' + Utils.fmtMonthDay(sib.layDate) : ''}${(sib.hatchCount || sib.surviveCount) ? ` · ${sib.surviveCount || 0} 只` : ''}`, '#b0741a');
          })()}
        </div>

        <div style="margin-top:10px;background:rgba(255,149,0,0.09);border-radius:12px;padding:8px 12px">
          <div style="display:flex;justify-content:space-between;font-size:12px">
            <span style="color:var(--ios-gray)">投喂状态</span>
            <b style="color:var(--ios-orange)">${recipe ? recipe.label : '—'}</b>
          </div>
          <div style="font-size:12px;color:var(--ios-text2);margin-top:3px">
            每餐 <b>${mealTxt}</b> · ${recipe ? Feeding.ratioText(recipe.ratio) : '—'}
          </div>
          ${recipe ? `<div style="font-size:11px;color:var(--ios-gray);margin-top:2px">
            玉米 ${recipe.ingredient.corn}g · 豌豆 ${recipe.ingredient.pea}g · 高粱 ${recipe.ingredient.sorghum}g
          </div>` : ''}
          <div style="font-size:11px;color:var(--ios-gray);margin-top:4px">
            早餐 <b style="color:${amLog ? 'var(--ios-green)' : 'var(--ios-gray3)'}">${amLog ? '✓ 已投' : '待投'}</b>
            · 晚餐 <b style="color:${pmLog ? 'var(--ios-green)' : 'var(--ios-gray3)'}">${pmLog ? '✓ 已投' : '待投'}</b>
          </div>
        </div>
      </div>
    `, [
      { label: '档案', style: 'btn-primary', onClick: () => {
        Utils.closeModal();
        this.showPairArchive(b.id);
      }},
      { label: '关闭', style: 'btn-secondary' }
    ]);

    document.getElementById('pd-ops').onclick = () => this._pairActions(b.id);
    document.getElementById('pd-m').onclick = () => { if (m) { Utils.closeModal(); this.showPigeonCardDetail(m.id); } };
    document.getElementById('pd-f').onclick = () => { if (f) { Utils.closeModal(); this.showPigeonCardDetail(f.id); } };
  },

  /** 详情弹窗信息行：标签灰在左，值加粗在右（与投喂状态块同风格） */
  _infoRow2(label, val, color) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;line-height:2.1">
        <span style="color:var(--ios-gray);flex-shrink:0">${label}</span>
        <span style="font-weight:700;text-align:right;${color ? 'color:' + color : ''}">${val || '—'}</span>
      </div>`;
  },

  /** 时间线渲染（档案页共用）：图标 + 文本，右侧灰色日期 */
  _timelineHTML(evs) {
    if (!evs.length) return `<div style="font-size:13px;color:var(--ios-gray3);padding:10px 16px">暂无记录</div>`;
    return evs.map(ev => `
      <div class="list-item" style="padding:10px 16px">
        <div style="font-size:17px;width:26px;text-align:center;flex-shrink:0">${ev.icon}</div>
        <div class="list-item-content">
          <div class="list-item-title" style="font-size:14px;${ev.red ? 'color:var(--ios-red)' : ''}">${ev.text}</div>
        </div>
        <span style="font-size:12px;color:var(--ios-gray3);flex-shrink:0">${Utils.fmtMonthDay(ev.date)}<span style="font-size:10px"> ${String(ev.date).slice(0, 4)}年</span></span>
      </div>
    `).join('');
  },

  /** 配对完整档案页：这一对的所有窝次 / 基本信息 / 异常 / 投喂 / 时间线（只显示有记录的项） */
  showPairArchive(breedId) {
    const b = Storage.getBreeds().find(x => x.id === breedId);
    if (!b) return;
    App.openDetail(() => {});
    document.getElementById('nav-title').textContent = '配对档案';
    document.getElementById('nav-action').hidden = true;

    const m = Utils.pigeonById(b.maleId), f = Utils.pigeonById(b.femaleId);
    // 这一对（同公同母）的全部窝，按配对日期升序编窝次
    const nests = Storage.getBreeds()
      .filter(x => x.maleId === b.maleId && x.femaleId === b.femaleId)
      .sort((a, c) => String(a.pairDate || '').localeCompare(String(c.pairDate || '')));
    const cyc = Utils.pairCycleDays(b.maleId, b.femaleId);
    const lossTotal = nests.reduce((s, x) => s + Utils.pairLossTotal(x), 0);
    const statusTxt = b.status === 'failed'
      ? { text: '失败', color: 'var(--ios-red)' }
      : Utils.breedStatusInfo(b);

    // 投喂记录（这一对全部窝，最近 10 条）
    const nestIds = nests.map(x => x.id);
    const feedLogs = Storage.getFeedingLog()
      .filter(l => l.targetType === 'pair' && nestIds.includes(l.targetId))
      .sort((x, y) => (y.date + (y.meal || '')).localeCompare(x.date + (x.meal || '')))
      .slice(0, 10);

    // 异常记录（两只）
    const exs = Storage.getExceptions()
      .filter(e => e.pigeonId === b.maleId || e.pigeonId === b.femaleId)
      .sort((a, c) => String(c.date).localeCompare(String(a.date)));

    const timeline = Utils.timelineFor({ breedId: b.id });

    // 基本信息行（只显示已填/有记录的）
    const baseRows = [
      ['鸽舍', Utils.penName(b.penId)],
      b.cageNo ? ['笼号', `${b.cageNo} 号笼`] : null,
      (m?.family || f?.family) ? ['家号', m?.family || f?.family] : null,
      b.pairDate ? ['配对日期', Utils.formatDate(b.pairDate)] : null,
      ['当前阶段', statusTxt.text],
      cyc ? ['繁殖周期', `约 ${cyc} 天/窝 · 一年约 ${Math.round(365 / cyc)} 窝`] : null,
      lossTotal > 0 ? ['累计繁殖投入', `${Utils.fmtMoney(lossTotal)}（${nests.filter(x => Utils.pairLossTotal(x) > 0).length} 窝有损失）`, 'var(--ios-red)'] : null
    ].filter(Boolean);

    // 窝次块
    const nestBlock = (x, idx) => {
      const statMap = {
        paired: '已配对', hatching: '孵化中', fledged: '带仔', weaned: '育肥中',
        sold: x.resolution === 'keep' ? '已留种' : x.resolution === 'pending' ? '转待定' : '已出栏',
        failed: '失败'
      };
      // 窝成本（连蛋带仔规则：窗口化核算）
      const w = Utils.nestCostWindow(x);
      const nc = Utils.coupleCost(x.maleId, x.femaleId, w.start, w.end);
      const nestAlive = x.surviveCount || x.hatchCount || 0;
      const rows = [
        x.layDate ? ['下蛋日期', Utils.formatDate(x.layDate) + ((x.eggCount != null && x.eggCount !== '') ? ` · ${x.eggCount} 枚` : '')] : null,
        x.secondEggDate ? ['第 2 个蛋', Utils.formatDate(x.secondEggDate)] : null,
        x.candledDate ? ['照蛋结果', `${x.fertileCount} 枚受精 · ${Utils.formatDate(x.candledDate)}`, x.fertileCount === 0 ? 'var(--ios-red)' : null] : null,
        x.hatchDate ? ['出壳日期', Utils.formatDate(x.hatchDate)] : null,
        (x.hatchCount || x.surviveCount) ? ['出雏 / 成活', `${x.hatchCount || 0} / ${x.surviveCount || 0} 只`] : null,
        x.status === 'failed'
          ? (nc > 0 ? ['失败前已吃', `${Utils.fmtMoney(nc)}（损失不转下一窝）`, 'var(--ios-red)'] : null)
          : (!w.start ? ['吃用成本', '旧窝出栏后起算（当前 ¥0）'] : (nc > 0 ? ['本窝吃用', `${Utils.fmtMoney(nc)}${nestAlive > 0 ? ` · 每只 ${Utils.fmtMoney(nc / nestAlive)}` : ''}`] : null)),
        Utils.pairLossTotal(x) > 0 ? ['繁殖损失', `${Utils.fmtMoney(Utils.pairLossTotal(x))}（${(x.losses || []).map(l => l.reason).join('、')}）`, 'var(--ios-red)'] : null,
        x.notes ? ['备注', x.notes] : null
      ].filter(Boolean);
      return `
        <div style="display:flex;align-items:baseline;justify-content:space-between;padding:14px 2px 6px">
          <div style="font-size:14px;font-weight:700">🪺 第 ${idx + 1} 窝 <span style="font-size:12px;color:var(--ios-gray3);font-weight:500">配对 ${Utils.formatDate(x.pairDate)}</span></div>
          <span style="font-size:11px;font-weight:700;color:#fff;background:${x.status === 'failed' ? 'var(--ios-red)' : x.status === 'sold' ? 'var(--ios-gray)' : 'var(--ios-green)'};padding:3px 8px;border-radius:5px">${statMap[x.status] || x.status || ''}</span>
        </div>
        ${rows.length ? `<div style="background:var(--ios-gray6);border-radius:12px;padding:8px 14px">${rows.map(r => this._infoRow2(r[0], r[1], r[2])).join('')}</div>` : `<div style="font-size:12.5px;color:var(--ios-gray3);padding:4px 2px 8px">本窝暂无进展记录</div>`}
      `;
    };

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section" style="padding-top:12px">
        <div class="card" style="text-align:center">
          <div style="display:flex;justify-content:center;align-items:center;gap:18px">
            <div style="text-align:center">
              <div style="font-size:36px;color:var(--ios-blue);line-height:1.2">♂</div>
              <div style="font-weight:700;font-size:16px">${m?.code || '?'}</div>
            </div>
            <div style="font-size:20px;color:var(--ios-gray3)">×</div>
            <div style="text-align:center">
              <div style="font-size:36px;color:var(--ios-orange);line-height:1.2">♀</div>
              <div style="font-weight:700;font-size:16px">${f?.code || '?'}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:10px">
            ${(m?.family || f?.family) ? `<span style="font-size:11px;font-weight:700;color:var(--ios-purple);background:rgba(175,82,222,0.12);padding:3px 9px;border-radius:6px">家号 ${m?.family || f?.family}</span>` : ''}
            <span style="font-size:11px;font-weight:700;color:var(--ios-blue);background:rgba(0,122,255,0.12);padding:3px 9px;border-radius:6px">${Utils.penName(b.penId)}</span>
            ${b.cageNo ? `<span style="font-size:11px;font-weight:700;color:var(--ios-orange);background:rgba(255,149,0,0.14);padding:3px 9px;border-radius:6px">${b.cageNo} 号笼</span>` : ''}
            <span style="font-size:11px;font-weight:700;color:#fff;background:${statusTxt.color};padding:3px 9px;border-radius:6px">${statusTxt.text}</span>
          </div>
          <div style="font-size:12px;color:var(--ios-gray);margin-top:10px">共 ${nests.length} 窝记录${(() => {
            const yr = String(new Date().getFullYear());
            const yNests = nests.filter(x => String(x.pairDate || x.layDate || '').startsWith(yr));
            const yFail = yNests.filter(x => x.status === 'failed').length;
            if (!yNests.length) return cyc ? ` · 周期约 ${cyc} 天/窝` : '';
            return ` · 今年 ${yNests.length} 窝${yFail ? `（失败 ${yFail}）` : ''}${cyc ? ` · 周期约 ${cyc} 天/窝` : ''}`;
          })()}${lossTotal > 0 ? ` · 损失投入 ${Utils.fmtMoney(lossTotal)}` : ''}</div>
        </div>

        <div class="section-header" style="padding-left:0"><h2 class="section-title" style="font-size:18px">📖 基本信息</h2></div>
        <div style="background:var(--ios-gray6);border-radius:12px;padding:8px 14px">
          ${baseRows.map(r => this._infoRow2(r[0], r[1], r[2])).join('')}
        </div>

        <div class="section-header" style="padding-left:0"><h2 class="section-title" style="font-size:18px">🪺 窝次记录（${nests.length} 窝）</h2></div>
        ${nests.map((x, i) => nestBlock(x, i)).join('')}

        ${exs.length ? `
          <div class="section-header" style="padding-left:0"><h2 class="section-title" style="font-size:18px">🚑 异常记录</h2></div>
          <div class="list-group">
            ${exs.map(e => {
              const p = Utils.pigeonById(e.pigeonId);
              return `
                <div class="list-item" style="cursor:default">
                  <div class="list-item-icon" style="background:${e.resolved ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)'}">${e.resolved ? '✅' : '🚑'}</div>
                  <div class="list-item-content">
                    <div class="list-item-title" style="${e.resolved ? '' : 'color:var(--ios-red)'}">${p?.code || ''} · ${e.note}</div>
                    <div class="list-item-sub">${e.date}${e.resolved ? ` · 已恢复 ${e.resolveDate || ''}` : ' · 未恢复'}${(e.cost || e.resolveCost) ? ` · 药费 ${Utils.fmtMoney((e.cost || 0) + (e.resolveCost || 0))}` : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${feedLogs.length ? `
          <div class="section-header" style="padding-left:0"><h2 class="section-title" style="font-size:18px">🍽 投喂记录（最近 ${feedLogs.length} 条）</h2></div>
          <div class="list-group">
            ${feedLogs.map(l => `
              <div class="list-item" style="cursor:default">
                <div class="list-item-icon" style="background:rgba(255,149,0,0.12)">${l.meal === 'pm' ? '🌇' : '🌅'}</div>
                <div class="list-item-content">
                  <div class="list-item-title" style="font-size:14px">${l.meal === 'pm' ? '晚餐' : '早餐'} · 投喂 ${l.total}g</div>
                </div>
                <span style="font-size:12px;color:var(--ios-gray3);flex-shrink:0">${Utils.fmtMonthDay(l.date)} · ${Utils.fmtMoney(l.cost)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section-header" style="padding-left:0"><h2 class="section-title" style="font-size:18px">📅 养殖时间线</h2></div>
        <div class="list-group" style="margin-bottom:30px">${this._timelineHTML(timeline)}</div>
      </div>
    `;

    if (typeof Notify !== 'undefined') Notify.refresh();
  },

  /** 记异常：生病记录 + 药费（算进硬性成本，同时记入账目支出） */
  _recordException(id) {
    const p = Utils.pigeonById(id);
    if (!p) return;
    Utils.openModal('记异常 · ' + p.code, `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">发生日期</label>
          <input class="form-input" type="date" id="ex-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">症状 / 情况</label>
          <input class="form-input" id="ex-note" placeholder="如：感冒流涕 / 拉稀 / 外伤" />
        </div>
        <div class="form-row">
          <label class="form-label">药费 (¥)</label>
          <input class="form-input" type="number" step="0.1" id="ex-cost" placeholder="0（没有就填 0）" />
        </div>
        <div style="font-size:11px;color:var(--ios-gray3)">药费计入这只鸽子的硬性成本，同时记一笔「药费」支出</div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '记录异常', style: 'btn-primary', keepOpen: true, onClick: () => {
        const note = document.getElementById('ex-note').value.trim();
        if (!note) { Utils.toast('请填写症状'); return; }
        const cost = Number(document.getElementById('ex-cost').value) || 0;
        const date = document.getElementById('ex-date').value || Utils.today();

        const exs = Storage.getExceptions();
        exs.push({ id: Utils.uid('ex'), pigeonId: id, date, note, cost, resolved: false, resolveDate: null, resolveCost: 0 });
        Storage.setExceptions(exs);

        if (cost > 0) {
          const accs = Storage.getAccounts();
          accs.push({ id: Utils.uid('a'), type: 'expense', category: '药费', amount: cost, date, title: `异常药费 ${p.code}`, note });
          Storage.setAccounts(accs);
        }
        Utils.closeModal();
        Utils.toast(cost > 0 ? `已记异常 · 药费 ${Utils.fmtMoney(cost)} 计入支出` : '已记异常');
        this.showPigeonCardDetail(id);
      }}
    ]);
  },

  /** 恢复：标记好转，可补记药费 */
  _resolveException(id) {
    const p = Utils.pigeonById(id);
    const ex = Utils.unresolvedException(id);
    if (!p || !ex) return;
    Utils.openModal('恢复 · ' + p.code, `
      <div style="font-size:13px;color:var(--ios-gray);margin-bottom:10px">
        异常「${ex.note}」（${ex.date}）标记为已恢复。
      </div>
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">恢复日期</label>
          <input class="form-input" type="date" id="rs-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">补记药费 (¥)</label>
          <input class="form-input" type="number" step="0.1" id="rs-cost" placeholder="0（后续治疗花的药费）" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认恢复', style: 'btn-primary', keepOpen: true, onClick: () => {
        const cost = Number(document.getElementById('rs-cost').value) || 0;
        const date = document.getElementById('rs-date').value || Utils.today();
        const exs = Storage.getExceptions();
        const x = exs.find(e => e.id === ex.id);
        if (x) { x.resolved = true; x.resolveDate = date; x.resolveCost = cost; }
        Storage.setExceptions(exs);
        if (cost > 0) {
          const accs = Storage.getAccounts();
          accs.push({ id: Utils.uid('a'), type: 'expense', category: '药费', amount: cost, date, title: `恢复补记药费 ${p.code}`, note: ex.note });
          Storage.setAccounts(accs);
        }
        Utils.closeModal();
        Utils.toast(cost > 0 ? '已恢复 · 补记药费已入账' : '已恢复');
        this.showPigeonCardDetail(id);
      }}
    ]);
  },

  /** 配对卡片的「操作」菜单（功能都收在这里） */
  _pairActions(id) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;
    const recipe = Feeding.recipeForPair(b, Utils.today(), Feeding.currentMeal());

    const ph0 = this._pairStatusKey(b);
    const canAbort = ph0 === 'incubating';
    const lossTotal0 = Utils.pairLossTotal(b);
    const sib0 = this._siblingNest(b);

    const item = (icon, title, sub, act) => `
      <button class="pair-action" data-act="${act}" style="width:100%;display:flex;align-items:center;gap:12px;background:#fff;border:0;border-bottom:0.5px solid var(--ios-separator);padding:14px 16px;text-align:left;cursor:pointer">
        <span style="font-size:19px;width:24px;text-align:center">${icon}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:15px;font-weight:600;color:var(--ios-text)">${title}</span>
          <span style="display:block;font-size:11px;color:var(--ios-gray3);margin-top:2px">${sub}</span>
        </span>
        <span style="color:var(--ios-gray3);font-size:15px">›</span>
      </button>`;

    Utils.openModal('操作', `
      <div style="margin:-6px 0 8px;border-top:0.5px solid var(--ios-separator);border-radius:12px;overflow:hidden">
        ${item('🍽', '调整投喂', recipe ? `当前 ${recipe.label} · ${recipe.grams}g/餐` : '该配对已停用', 'feed')}
        ${item('🌅', '今日投喂', '查看两餐明细并记录投喂', 'today')}
        ${item('📖', '配对完整档案', '所有窝次 · 异常 · 投喂 · 时间线', 'breed')}
        ${(ph0 === 'brooding' || ph0 === 'tosell') && !sib0 ? item('🥚', '记下一窝下蛋', '连蛋带仔：边带仔边开新窝', 'nextlay') : ''}
        ${sib0 ? item('🪺', '另一窝 · ' + this._phaseMeta(this._pairStatusKey(sib0)).label, '查看 / 操作同对的另一窝', 'sib') : ''}
        ${item('🏠', '设置笼号', b.cageNo ? `当前 ${b.cageNo} 号笼` : '未设置，点此填写', 'cage')}
        ${canAbort ? item('🚫', '孵化作废', '蛋不要了，算繁殖损失回空怀', 'abort') : ''}
        ${canAbort ? item('💥', '啄蛋', '蛋被啄坏，算繁殖损失回空怀', 'peck') : ''}
      </div>
      ${lossTotal0 > 0 ? `<div style="font-size:12px;color:var(--ios-red);padding:0 4px 6px">繁殖损失合计 ${Utils.fmtMoney(lossTotal0)}</div>` : ''}
    `, [{ label: '取消', style: 'btn-secondary' }]);

    document.querySelectorAll('.pair-action').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.act;
        if (act === 'feed') {
          if (!recipe) { Utils.toast('该配对已停用'); return; }
          FeedingPage.openOverrideModal('pair', b.id, Feeding.pairTitle(b), recipe, () => this.showPairCardDetail(b.id));
        } else if (act === 'today') {
          Utils.closeModal();
          FeedingPage.showPairDetail(b.id);
        } else if (act === 'cage') {
          Utils.closeModal();
          Utils.openModal('设置笼号 · ' + Feeding.pairTitle(b), `
            <div class="form-group">
              <div class="form-row">
                <label class="form-label">笼号</label>
                <input class="form-input" id="cage-no" value="${b.cageNo || ''}" placeholder="如 12（几号笼）" />
              </div>
            </div>
          `, [
            { label: '取消', style: 'btn-secondary' },
            { label: '保存', style: 'btn-primary', keepOpen: true, onClick: () => {
              const no = document.getElementById('cage-no').value.trim();
              const breeds = Storage.getBreeds();
              breeds.find(x => x.id === b.id).cageNo = no;
              Storage.setBreeds(breeds);
              Utils.closeModal();
              Utils.toast(no ? `已设为 ${no} 号笼` : '已清除笼号');
              this.render(); // 刷新卡片显示
            }}
          ]);
        } else if (act === 'abort') {
          Utils.closeModal();
          BreedPage.abortHatch(b.id);
        } else if (act === 'peck') {
          Utils.closeModal();
          BreedPage.peckEgg(b.id);
        } else if (act === 'breed') {
          Utils.closeModal();
          this.showPairArchive(b.id);
        } else if (act === 'nextlay') {
          Utils.closeModal();
          BreedPage.openNextLay(b.id);
        } else if (act === 'sib') {
          Utils.closeModal();
          this.showPairCardDetail(sib0.id);
        }
      };
    });
  }
};
