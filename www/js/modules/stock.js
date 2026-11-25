/**
 * 饲料 / 库存 / 消耗记录
 * 成本自动累计，实时更新库存
 */
const StockPage = {
  render() {
    document.getElementById('nav-title').textContent = '库存';
    const action = document.getElementById('nav-action');
    action.hidden = false;
    action.textContent = '+ 消耗';
    action.onclick = () => this.openFeedLogForm();
    document.getElementById('nav-back').hidden = true;

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">🍽 今日饲料消耗</h2>
        </div>
        ${this._todayCard()}
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">🌾 饲料库存</h2>
          <button class="nav-action" id="btn-add-feed" style="font-size:14px">+ 新饲料</button>
        </div>
        ${this._stockHTML()}
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">🥚 鸽蛋库存</h2>
          <button class="nav-action" id="btn-egg-out" style="font-size:14px">出库</button>
        </div>
        ${this._eggHTML()}
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">🔖 脚环库存</h2>
          <button class="nav-action" id="btn-ring-in" style="font-size:14px">+ 入库</button>
        </div>
        ${this._ringHTML()}
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">📉 最近消耗</h2>
        </div>
        ${this._feedLogHTML()}
      </div>
    `;

    document.getElementById('btn-add-feed').onclick = () => this.openFeedForm();
    document.getElementById('btn-egg-out').onclick = () => this.openEggOutForm();
    document.getElementById('btn-ring-in').onclick = () => this.openRingInForm();
  },

  /** 今日饲料消耗卡：吃了多少克、用了多少钱、玉米/豌豆/高粱比例、逐条明细 */
  _todayCard() {
    const today = Utils.today();
    const logs = Storage.getFeedingLog().filter(l => l.date === today);
    const grams = logs.reduce((s, l) => s + (Number(l.total) || 0), 0);
    const cost = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
    const meal = m => logs.filter(l => l.meal === m);
    const am = meal('am'), pm = meal('pm');

    // 三种料的克数与比例
    const ing = logs.reduce((s, l) => {
      const i = l.ingredient || {};
      return {
        corn: s.corn + (Number(i.corn) || 0),
        pea: s.pea + (Number(i.pea) || 0),
        sorghum: s.sorghum + (Number(i.sorghum) || 0)
      };
    }, { corn: 0, pea: 0, sorghum: 0 });
    const tot = ing.corn + ing.pea + ing.sorghum;
    const pct = n => tot > 0 ? Math.round(n / tot * 100) : 0;
    const seg = (name, n, color) => `
      <div style="width:${pct(n)}%;background:${color};min-width:${pct(n) > 0 ? '2px' : '0'}" title="${name}"></div>`;
    const ingRow = (name, n, color) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;line-height:2.1">
        <span style="display:flex;align-items:center;gap:6px;color:var(--ios-gray);flex-shrink:0"><span style="width:8px;height:8px;border-radius:2px;background:${color};display:inline-block"></span>${name}</span>
        <span style="font-weight:700;text-align:right">${Utils.fmtG(n)} g · ${pct(n)}%</span>
      </div>`;

    // 逐条明细（按 早→晚、时间倒序，含料比）
    const detail = logs.slice().reverse().map(l => {
      const i = l.ingredient || {};
      const t = (Number(i.corn) || 0) + (Number(i.pea) || 0) + (Number(i.sorghum) || 0);
      const p = n => t > 0 ? Math.round(n / t * 100) : 0;
      return `
      <div class="list-item" style="padding:9px 14px;cursor:default">
        <div class="list-item-icon" style="background:rgba(255,149,0,0.12);font-size:14px">${l.meal === 'pm' ? '🌇' : '🌅'}</div>
        <div class="list-item-content">
          <div class="list-item-title" style="font-size:13.5px">${l.title || '投喂'} · 共 ${Utils.fmtG(l.total)}g</div>
          <div class="list-item-sub">玉米 ${Utils.fmtG(i.corn)}g(${p(i.corn)}%) / 豌豆 ${Utils.fmtG(i.pea)}g(${p(i.pea)}%) / 高粱 ${Utils.fmtG(i.sorghum)}g(${p(i.sorghum)}%)</div>
        </div>
        <span style="font-size:12px;color:var(--ios-gray);flex-shrink:0"><b style="color:var(--ios-orange)">${Utils.fmtMoney(l.cost)}</b></span>
      </div>
    `; }).join('');

    return `
      <div class="card" style="margin:0;background:linear-gradient(140deg,#fff7ed,#fefce8)">
        <div style="display:flex;align-items:baseline;gap:8px">
          <div style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:var(--ios-orange)">${Utils.fmtG(grams)}<span style="font-size:13px;font-weight:500">g</span></div>
          <div style="font-size:14px;font-weight:700;color:var(--ios-red)">${Utils.fmtMoney(cost)}</div>
          <span style="margin-left:auto;font-size:11px;color:var(--ios-gray3)">${logs.length} 条投喂</span>
        </div>
        <div style="display:flex;gap:8px;margin-top:10px">
          ${this._mealBox('🌅 早餐', am)}
          ${this._mealBox('🌇 晚餐', pm)}
        </div>

        <div style="margin-top:12px;font-size:12px;color:var(--ios-gray3)">今日配比（${Utils.fmtG(tot)} g）</div>
        <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;margin-top:6px;background:var(--ios-gray5)">
          ${seg('玉米', ing.corn, '#f59e0b')}
          ${seg('豌豆', ing.pea, '#22c55e')}
          ${seg('高粱', ing.sorghum, '#6366f1')}
        </div>
        <div style="margin-top:4px;background:var(--ios-gray6);border-radius:12px;padding:6px 12px">
          ${ingRow('玉米', ing.corn, '#f59e0b')}
          ${ingRow('豌豆', ing.pea, '#22c55e')}
          ${ingRow('高粱', ing.sorghum, '#6366f1')}
        </div>
      </div>

      ${logs.length ? `
        <div class="section-header" style="padding-top:14px"><h2 class="section-title" style="font-size:17px">📋 今日投喂明细</h2></div>
        <div class="list-group">${detail}</div>
      ` : ''}
    `;
  },

  _mealBox(label, arr) {
    return `
      <div style="flex:1;text-align:center;background:rgba(255,255,255,0.7);border-radius:10px;padding:8px 4px">
        <div style="font-size:10px;color:var(--ios-gray3)">${label}</div>
        <div style="font-size:15px;font-weight:800;color:var(--ios-orange)">${Utils.fmtG(arr.reduce((s, l) => s + (Number(l.total) || 0), 0))}<span style="font-size:10px;font-weight:500">g</span></div>
        <div style="font-size:10px;color:var(--ios-gray)">${Utils.fmtMoney(arr.reduce((s, l) => s + (Number(l.cost) || 0), 0))} · ${arr.length} 餐</div>
      </div>`;
  },

  _ringHTML() {
    const ring = Storage.getRingStock();
    const qty = Number(ring.qty) || 0;
    const price = Number(ring.price) || 1.5;
    const logs = (ring.logs || []).slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 5);

    return `
      <div class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px">${qty}
              <span style="font-size:13px;font-weight:500;color:var(--ios-gray)">个</span>
            </div>
            <div style="font-size:12px;color:var(--ios-gray);margin-top:2px">
              估值 ${Utils.fmtMoney(qty * price)} · ${Utils.fmtMoney(price)}/个
            </div>
          </div>
          <span class="tag tag-blue" style="font-size:10px">新增鸽子自动戴环</span>
        </div>
      </div>
      ${logs.length ? `
        <div class="list-group" style="margin-top:10px">
          ${logs.map(l => `
            <div class="list-item">
              <div class="list-item-icon" style="background:rgba(0,122,255,0.12)">🔖</div>
              <div class="list-item-content">
                <div class="list-item-title">${Number(l.count) < 0 ? '戴环' : '入库'}</div>
                <div class="list-item-sub">${l.date}${l.note ? ' · ' + l.note : ''}</div>
              </div>
              <div class="list-item-value" style="color:${Number(l.count) < 0 ? 'var(--ios-red)' : 'var(--ios-green)'}">
                ${Number(l.count) > 0 ? '+' : ''}${l.count} 个
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div style="font-size:12px;color:var(--ios-gray3);padding:8px 16px">还没有脚环入库记录</div>`}
    `;
  },

  openRingInForm() {
    const ring = Storage.getRingStock();
    Utils.openModal('脚环入库', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">数量 (个)</label>
          <input class="form-input" type="number" id="ring-count" placeholder="如 100" />
        </div>
        <div class="form-row">
          <label class="form-label">单价 (¥/个)</label>
          <input class="form-input" type="number" step="0.1" id="ring-price" value="${ring.price || 1.5}" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认入库', style: 'btn-primary', keepOpen: true, onClick: () => {
        const count = Number(document.getElementById('ring-count').value) || 0;
        if (count <= 0) { Utils.toast('请输入入库数量'); return; }
        const price = Number(document.getElementById('ring-price').value) || ring.price || 1.5;
        ring.qty = (Number(ring.qty) || 0) + count;
        ring.price = price;
        ring.logs = ring.logs || [];
        ring.logs.unshift({ date: Utils.today(), count, price, note: '采购入库' });
        Storage.setRingStock(ring);
        Utils.closeModal();
        Utils.toast(`已入库 ${count} 个脚环`);
        this.render();
      }}
    ]);
  },

  _eggHTML() {
    const egg = Storage.getEggStock();
    const qty = Number(egg.qty) || 0;
    const price = Number(egg.price) || 4;
    const logs = (egg.logs || []).slice()
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 5);

    return `
      <div class="card" style="margin:0">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px">${qty}
              <span style="font-size:13px;font-weight:500;color:var(--ios-gray)">枚</span>
            </div>
            <div style="font-size:12px;color:var(--ios-gray);margin-top:2px">
              估值 ${Utils.fmtMoney(qty * price)} · ${Utils.fmtMoney(price)}/枚
            </div>
          </div>
          <span class="tag tag-green" style="font-size:10px">照蛋未受精自动入库</span>
        </div>
      </div>
      ${logs.length ? `
        <div class="list-group" style="margin-top:10px">
          ${logs.map(l => `
            <div class="list-item">
              <div class="list-item-icon" style="background:rgba(255,149,0,0.12)">🥚</div>
              <div class="list-item-content">
                <div class="list-item-title">${l.source === 'out' ? '出库' : '照蛋入库'}</div>
                <div class="list-item-sub">${l.date}${l.note ? ' · ' + l.note : ''}</div>
              </div>
              <div class="list-item-value" style="color:${Number(l.count) < 0 ? 'var(--ios-red)' : 'var(--ios-green)'}">
                ${Number(l.count) > 0 ? '+' : ''}${l.count} 枚
              </div>
            </div>
          `).join('')}
        </div>
      ` : `<div style="font-size:12px;color:var(--ios-gray3);padding:8px 16px">还没有入库记录，照蛋无受精时会自动加到这里</div>`}
    `;
  },

  openEggOutForm() {
    const egg = Storage.getEggStock();
    Utils.openModal('🥚 鸽蛋出库', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">出库数量 (枚)</label>
          <input class="form-input" type="number" id="eg-out" placeholder="0" />
        </div>
        <div class="form-row">
          <label class="form-label">说明</label>
          <input class="form-input" id="eg-note" placeholder="卖蛋 / 自用…" />
        </div>
      </div>
      <div style="font-size:12px;color:var(--ios-gray)">当前库存 ${egg.qty || 0} 枚</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认出库', style: 'btn-primary', onClick: () => {
        const n = Number(document.getElementById('eg-out').value) || 0;
        if (n <= 0) { Utils.toast('请输入出库数量'); return; }
        const cur = Storage.getEggStock();
        cur.qty = Math.max(0, Number(cur.qty || 0) - n);
        cur.logs = cur.logs || [];
        cur.logs.push({
          date: Utils.today(),
          count: -n,
          source: 'out',
          note: document.getElementById('eg-note').value.trim() || '出库'
        });
        Storage.setEggStock(cur);
        Utils.toast(`已出库 ${n} 枚`);
        this.render();
      }}
    ]);
  },

  _stockHTML() {
    const feeds = Storage.getFeeds();
    const stock = Storage.getStock();
    if (feeds.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">🌾</div><div class="empty-title">还没有饲料</div><div class="empty-desc">点右上角「+ 新饲料」添加</div></div>`;
    }

    const rows = feeds.map(f => {
      const s = stock.find(x => x.feedId === f.id);
      const qty = s ? Number(s.qty) : 0;
      const left = Notify.stockDaysLeft(f.id);
      const low = qty <= 0 || left.daysLeft < Notify.STOCK_WARN_DAYS;
      const value = (qty * f.price).toFixed(2);
      const daysText = left.perDay > 0
        ? ` · ${left.daysLeft < 1 ? '不足 1 天' : '约 ' + (Math.floor(left.daysLeft * 10) / 10) + ' 天用量'}`
        : '';
      return `
        <div class="list-item" data-feed-id="${f.id}">
          <div class="list-item-icon" style="background:${low?'rgba(255,59,48,0.12)':'rgba(52,199,89,0.12)'}">
            ${low?'⚠️':'🌾'}
          </div>
          <div class="list-item-content">
            <div class="list-item-title">${f.name}</div>
            <div class="list-item-sub">${Utils.fmtMoney(f.price)}/${f.unit} · 总价值 ${Utils.fmtMoney(value)}${daysText}</div>
          </div>
          <div class="list-item-value" style="color:${low?'var(--ios-red)':'inherit'};font-weight:600">${Utils.fmtG(qty)} ${f.unit}</div>
          <span class="list-item-arrow">›</span>
        </div>
      `;
    }).join('');

    const totalValue = feeds.reduce((sum, f) => {
      const s = stock.find(x => x.feedId === f.id);
      return sum + (s ? s.qty * f.price : 0);
    }, 0);

    return `
      <div class="list-group">${rows}</div>
      <div style="text-align:right;padding:4px 16px;color:var(--ios-gray);font-size:13px">
        库存总价值：${Utils.fmtMoney(totalValue)}
      </div>
    `;
  },

  _feedLogHTML() {
    // 手动消耗记录（库存页「+ 消耗」）
    const manual = Storage.getFeedLog().map(l => ({
      date: l.date,
      icon: '📋',
      bg: 'rgba(0,122,255,0.12)',
      title: `${Utils.feedName(l.feedId)} · ${Utils.fmtG(l.qty)} kg`,
      sub: `${l.date} · ${Utils.penName(l.penId)}`,
      amount: Number(l.price || 0) * Number(l.qty || 0)
    }));

    // 投喂系统消耗：按「日期 + 餐」汇总成一条
    const groups = {};
    Storage.getFeedingLog().forEach(l => {
      const k = `${l.date}:${l.meal}`;
      if (!groups[k]) {
        groups[k] = { date: l.date, meal: l.meal, count: 0, gram: 0, cost: 0,
          ing: { corn: 0, pea: 0, sorghum: 0 } };
      }
      const g = groups[k];
      g.count += 1;
      g.gram += Number(l.total || 0);
      g.cost += Number(l.cost || 0);
      ['corn', 'pea', 'sorghum'].forEach(x => { g.ing[x] += Number((l.ingredient || {})[x] || 0); });
    });
    const feeding = Object.keys(groups).map(k => {
      const g = groups[k];
      const r1 = v => Math.round(v * 10) / 10;
      return {
        date: g.date,
        icon: '🌽',
        bg: 'rgba(255,149,0,0.12)',
        title: `投喂 · ${Feeding.MEAL_LABEL[g.meal] || g.meal} · ${g.count} 笼`,
        sub: `${g.date} · 玉米 ${r1(g.ing.corn)}g / 豌豆 ${r1(g.ing.pea)}g / 高粱 ${r1(g.ing.sorghum)}g（共 ${r1(g.gram)}g）`,
        amount: g.cost
      };
    });

    const logs = manual.concat(feeding)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .slice(0, 15);

    if (logs.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📉</div><div class="empty-title">还没有消耗记录</div><div class="empty-desc">点右上角「+ 消耗」记录饲喂</div></div>`;
    }
    return `
      <div class="list-group">
        ${logs.map(l => `
            <div class="list-item">
              <div class="list-item-icon" style="background:${l.bg};color:var(--ios-blue)">${l.icon}</div>
              <div class="list-item-content">
                <div class="list-item-title">${l.title}</div>
                <div class="list-item-sub">${l.sub}</div>
              </div>
              <div class="list-item-value" style="color:var(--ios-red)">-${Utils.fmtMoney(l.amount)}</div>
            </div>
          `).join('')}
      </div>
    `;
  },

  // ========== 新增饲料种类 ==========
  openFeedForm() {
    Utils.openModal('新增饲料', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">名称</label>
          <input class="form-input" id="fd-name" placeholder="玉米 / 小麦…" />
        </div>
        <div class="form-row">
          <label class="form-label">单价 (¥)</label>
          <input class="form-input" type="number" step="0.1" id="fd-price" placeholder="0" />
        </div>
        <div class="form-row">
          <label class="form-label">单位</label>
          <select class="form-select" id="fd-unit">
            <option value="kg">kg</option>
            <option value="斤">斤</option>
            <option value="袋">袋</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">初始库存</label>
          <input class="form-input" type="number" id="fd-qty" value="0" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '添加', style: 'btn-primary', onClick: () => {
        const name = document.getElementById('fd-name').value.trim();
        const price = Number(document.getElementById('fd-price').value) || 0;
        const unit = document.getElementById('fd-unit').value;
        const qty = Number(document.getElementById('fd-qty').value) || 0;
        if (!name) { Utils.toast('请输入名称'); return; }

        const feeds = Storage.getFeeds();
        const newFeed = { id: Utils.uid('f'), name, price, unit };
        feeds.push(newFeed);
        Storage.setFeeds(feeds);

        const stock = Storage.getStock();
        const entry = { feedId: newFeed.id, qty, updatedAt: Utils.today() };
        if (qty > 0) entry.batches = [{ id: Utils.uid('bt'), date: Utils.today(), qty, price, note: '初始库存' }];
        stock.push(entry);
        Storage.setStock(stock);

        Utils.toast('已添加');
        this.render();
      }}
    ]);
  },

  // ========== 记录消耗 ==========
  openFeedLogForm() {
    const feeds = Storage.getFeeds();
    if (feeds.length === 0) {
      Utils.toast('请先添加饲料种类');
      return;
    }
    const pens = Storage.getPens();

    Utils.openModal('记录饲喂消耗', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">日期</label>
          <input class="form-input" type="date" id="fl-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">饲料</label>
          <select class="form-select" id="fl-feed">
            ${feeds.map(f => `<option value="${f.id}" data-price="${f.price}" data-unit="${f.unit}">${f.name} (${f.price}元/${f.unit})</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">数量</label>
          <input class="form-input" type="number" step="0.1" id="fl-qty" placeholder="如 5.0" />
        </div>
        <div class="form-row">
          <label class="form-label">鸽舍</label>
          <select class="form-select" id="fl-pen">
            <option value="">全部</option>
            ${pens.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存并扣库存', style: 'btn-primary', onClick: () => {
        const feedId = document.getElementById('fl-feed').value;
        const opt = document.querySelector(`#fl-feed option[value="${feedId}"]`);
        const price = Number(opt.dataset.price);
        const qty = Number(document.getElementById('fl-qty').value);
        if (!qty || qty <= 0) { Utils.toast('请输入数量'); return; }

        // 1. 写消耗日志
        const logs = Storage.getFeedLog();
        logs.push({
          id: Utils.uid('fl'),
          date: document.getElementById('fl-date').value,
          feedId, qty, price,
          penId: document.getElementById('fl-pen').value,
          notes: '日常饲喂'
        });
        Storage.setFeedLog(logs);

        // 2. 扣减库存（先进先出）
        Feeding.adjustBatches(feedId, qty, -1);

        Utils.toast('已记录 · 成本 ' + Utils.fmtMoney(qty * price));
        this.render();
      }}
    ]);
  },

  // ========== 点击库存项 → 补库 ==========
  showStockDetail(feedId) {
    const feeds = Storage.getFeeds();
    const f = feeds.find(x => x.id === feedId);
    const stock = Storage.getStock();
    const s = stock.find(x => x.feedId === feedId);
    const logs = Storage.getFeedLog().filter(l => l.feedId === feedId).sort((a,b)=>b.date.localeCompare(a.date)).slice(0, 10);

    const e = Feeding._stockEntry(feedId);
    const batches = (e.batches || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    document.getElementById('nav-title').textContent = f.name;
    document.getElementById('nav-action').hidden = true;
    App.openDetail(() => {});

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section">
        <div class="card" style="text-align:center">
          <div style="font-size:48px">🌾</div>
          <div style="font-size:22px;font-weight:700;margin-top:8px">${Utils.fmtG(e.qty)} ${f.unit}</div>
          <div style="font-size:13px;color:var(--ios-gray)">${Utils.fmtMoney(f.price)} / ${f.unit}</div>
          <div style="font-size:15px;color:var(--ios-blue);margin-top:6px">总价值 ${Utils.fmtMoney(e.qty*f.price)}</div>
        </div>

        <div style="display:flex;gap:10px;padding:0 16px;flex-wrap:wrap">
          <button class="btn btn-primary" id="btn-add" style="flex:1">入库 +</button>
          <button class="btn btn-secondary" id="btn-take" style="flex:1">📋 盘点修正</button>
          <button class="btn btn-secondary" id="btn-edit" style="flex:1">编辑价格</button>
          <button class="btn btn-danger-outline" id="btn-del-feed" style="flex:1">🗑 删除</button>
        </div>

        <div class="section-header"><h2 class="section-title">📦 批次（先进先出）</h2></div>
        ${batches.length ? `
          <div class="list-group">
            ${batches.map(b => `
              <div class="list-item">
                <div class="list-item-icon" style="background:rgba(0,122,255,0.12)">📦</div>
                <div class="list-item-content">
                  <div class="list-item-title">${Utils.fmtG(b.qty)} ${f.unit}${b.price ? ' · ' + Utils.fmtMoney(b.price) + '/' + f.unit : ''}</div>
                  <div class="list-item-sub">${b.date}${b.note ? ' · ' + b.note : ''} · 价值 ${Utils.fmtMoney(b.qty * (b.price || f.price))}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `<div style="font-size:12px;color:var(--ios-gray3);padding:8px 16px">暂无批次，入库后会按批次记录</div>`}

        ${logs.length ? `
          <div class="section-header"><h2 class="section-title">最近消耗</h2></div>
          <div class="list-group">
            ${logs.map(l => `
              <div class="list-item">
                <div class="list-item-content">
                  <div class="list-item-title">${l.date}</div>
                  <div class="list-item-sub">${Utils.fmtG(l.qty)} ${f.unit} · ${Utils.penName(l.penId)}</div>
                </div>
                <div class="list-item-value">${Utils.fmtMoney(l.qty * l.price)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-take').onclick = () => {
      Utils.openModal('盘点修正 · ' + f.name, `
        <div style="font-size:13px;color:var(--ios-gray);margin-bottom:10px">
          当前系统库存 <b>${Utils.fmtG(e.qty)} ${f.unit}</b>。数一数实际还剩多少，填进去：
        </div>
        <div class="form-group">
          <div class="form-row">
            <label class="form-label">实际数量 (${f.unit})</label>
            <input class="form-input" type="number" step="0.1" id="tk-qty" value="${e.qty}" />
          </div>
        </div>
      `, [
        { label: '取消', style: 'btn-secondary' },
        { label: '确认修正', style: 'btn-primary', onClick: () => {
          const actual = Number(document.getElementById('tk-qty').value);
          if (isNaN(actual) || actual < 0) { Utils.toast('请输入有效数量'); return; }
          Feeding.stockTake(feedId, actual);
          Utils.toast('已修正');
          this.showStockDetail(feedId);
        }}
      ]);
    };

    document.getElementById('btn-del-feed').onclick = () => {
      Utils.openModal('删除饲料 · ' + f.name, `
        <p style="font-size:13px;line-height:1.8">
          确认删除 <b>${f.name}</b>？<br>
          删除后不再出现在库存和首页胶囊里；历史消耗记录保留（显示为「已删饲料」）。<br>
          当前库存 ${e.qty} ${f.unit} 会一并清除。
        </p>
      `, [
        { label: '取消', style: 'btn-secondary' },
        { label: '确认删除', style: 'btn-danger', onClick: () => {
          Storage.setFeeds(Storage.getFeeds().filter(x => x.id !== feedId));
          Storage.setStock(Storage.getStock().filter(x => x.feedId !== feedId));
          Utils.toast('已删除 ' + f.name);
          App.goBack();
        }}
      ]);
    };

    document.getElementById('btn-add').onclick = () => {
      Utils.openModal('入库 ' + f.name, `
        <div class="form-group">
          <div class="form-row">
            <label class="form-label">入库日期</label>
            <input class="form-input" type="date" id="in-date" value="${Utils.today()}" />
          </div>
          <div class="form-row">
            <label class="form-label">入库数量</label>
            <input class="form-input" type="number" step="0.1" id="in-qty" placeholder="+" />
          </div>
          <div class="form-row">
            <label class="form-label">入库单价</label>
            <input class="form-input" type="number" step="0.1" id="in-price" value="${f.price}" />
          </div>
        </div>
      `, [
        { label: '取消', style: 'btn-secondary' },
        { label: '确定', style: 'btn-primary', onClick: () => {
          const qty = Number(document.getElementById('in-qty').value);
          if (!qty) { Utils.toast('请输入数量'); return; }
          const p = Number(document.getElementById('in-price').value);
          // 入库 → 新批次（先进先出）
          Feeding.adjustBatches(feedId, qty, 1, document.getElementById('in-date').value, p, '入库');
          // 同时更新单价
          const feeds2 = Storage.getFeeds();
          const ff = feeds2.find(x => x.id === feedId);
          if (ff) ff.price = p;
          Storage.setFeeds(feeds2);
          Utils.toast('✓ 已入库 +' + qty + ' ' + f.unit);
          this.showStockDetail(feedId);
        }}
      ]);
    };

    document.getElementById('btn-edit').onclick = () => {
      Utils.openModal('编辑价格', `
        <div class="form-group">
          <div class="form-row">
            <label class="form-label">单价</label>
            <input class="form-input" type="number" step="0.1" id="ep" value="${f.price}" />
          </div>
        </div>
      `, [
        { label: '取消', style: 'btn-secondary' },
        { label: '保存', style: 'btn-primary', onClick: () => {
          const feeds2 = Storage.getFeeds();
          feeds2.find(x => x.id === feedId).price = Number(document.getElementById('ep').value);
          Storage.setFeeds(feeds2);
          Utils.toast('已更新');
          this.showStockDetail(feedId);
        }}
      ]);
    };
  }
};

// 库存列表点击跳转
document.addEventListener('click', e => {
  const item = e.target.closest('[data-feed-id]');
  if (item && Storage.getFeeds().length) {
    StockPage.showStockDetail(item.dataset.feedId);
  }
});
