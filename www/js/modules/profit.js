/**
 * 盈利 Tab · 完整账目系统
 * 统一口径：收入 = 销售 + 手动收入 | 支出 = 饲料 + 手动支出
 */
const ProfitPage = {
  render() {
    document.getElementById('nav-title').textContent = '盈利';
    const action = document.getElementById('nav-action');
    action.hidden = false;
    action.textContent = '+ 账目';
    action.onclick = () => this.openAccountForm();
    document.getElementById('nav-back').hidden = true;

    const content = document.getElementById('page-content');
    this._billTab = this._billTab || 'ledger';
    content.innerHTML = `
      <div class="section">
        ${this._bigProfit()}
      </div>

      <div class="section" style="padding-top:0">
        <div style="display:flex;gap:10px">
          <button class="bill-tab" id="bill-tab-ledger" style="flex:1;border:0;border-radius:14px;padding:14px 12px;text-align:left;cursor:pointer;font-family:inherit"></button>
          <button class="bill-tab" id="bill-tab-eat" style="flex:1;border:0;border-radius:14px;padding:14px 12px;text-align:left;cursor:pointer;font-family:inherit"></button>
        </div>
        <div id="bill-content" style="margin-top:12px"></div>
      </div>

      <div class="section-header">
        <h2 class="section-title">🗂 全部流水</h2>
        <div style="display:flex;gap:6px">
          <button class="btn" id="btn-filter-all" style="height:28px;font-size:12px;padding:0 10px;border-radius:14px;background:var(--ios-blue);color:#fff;flex:0 0 auto">全部</button>
          <button class="btn" id="btn-filter-income" style="height:28px;font-size:12px;padding:0 10px;border-radius:14px;background:var(--ios-gray6);flex:0 0 auto">收入</button>
          <button class="btn" id="btn-filter-expense" style="height:28px;font-size:12px;padding:0 10px;border-radius:14px;background:var(--ios-gray6);flex:0 0 auto">支出</button>
        </div>
      </div>
      <div id="account-list">${this._accountListHTML('all')}</div>

      <div style="height: 90px"></div>
      <button class="fab" id="fab-income" style="left:20px;right:auto;background:var(--ios-green)">+</button>
      <button class="fab" id="fab-expense" style="background:var(--ios-red)">−</button>
    `;

    document.getElementById('bill-tab-ledger').onclick = () => { this._billTab = 'ledger'; this._renderBillTab(); };
    document.getElementById('bill-tab-eat').onclick = () => { this._billTab = 'eat'; this._renderBillTab(); };
    this._renderBillTab();

    // 筛选
    document.getElementById('btn-filter-all').onclick = () => {
      ['all','income','expense'].forEach(k => {
        const el = document.getElementById('btn-filter-' + k);
        el.style.background = k === 'all' ? 'var(--ios-blue)' : 'var(--ios-gray6)';
        el.style.color = k === 'all' ? '#fff' : 'var(--ios-text)';
      });
      document.getElementById('account-list').innerHTML = this._accountListHTML('all');
    };
    document.getElementById('btn-filter-income').onclick = () => {
      ['all','income','expense'].forEach(k => {
        const el = document.getElementById('btn-filter-' + k);
        el.style.background = k === 'income' ? 'var(--ios-blue)' : 'var(--ios-gray6)';
        el.style.color = k === 'income' ? '#fff' : 'var(--ios-text)';
      });
      document.getElementById('account-list').innerHTML = this._accountListHTML('income');
    };
    document.getElementById('btn-filter-expense').onclick = () => {
      ['all','income','expense'].forEach(k => {
        const el = document.getElementById('btn-filter-' + k);
        el.style.background = k === 'expense' ? 'var(--ios-blue)' : 'var(--ios-gray6)';
        el.style.color = k === 'expense' ? '#fff' : 'var(--ios-text)';
      });
      document.getElementById('account-list').innerHTML = this._accountListHTML('expense');
    };

    // FAB
    document.getElementById('fab-income').onclick = () => this.openAccountForm('income');
    document.getElementById('fab-expense').onclick = () => this.openAccountForm('expense');
  },

  /** 顶部两张账单卡：总账单（钱进出）/ 月账单（吃用消耗） */
  _renderBillTab() {
    const month = Utils.aggregateMonth();
    const eatMonth = Storage.getFeedingLog()
      .filter(l => (l.date || '').startsWith(Utils.currentMonth()))
      .reduce((s, l) => s + (Number(l.cost) || 0), 0);

    const card = (id, active, icon, title, sub, line1, line2, c1, c2) => `
      <div style="font-size:15px;font-weight:800;color:${active ? '#fff' : 'var(--ios-text)'}">${icon} ${title}</div>
      <div style="font-size:10.5px;color:${active ? 'rgba(255,255,255,0.75)' : 'var(--ios-gray3)'};margin-top:2px">${sub}</div>
      <div style="margin-top:10px;font-size:12px;font-weight:600;color:${active ? '#fff' : 'var(--ios-text2)'}">
        <span style="color:${active ? '#fff' : c1}">${line1}</span>
        <span style="margin-left:8px;color:${active ? 'rgba(255,255,255,0.85)' : c2}">${line2}</span>
      </div>
      <div style="margin-top:8px;font-size:10px;color:${active ? 'rgba(255,255,255,0.65)' : 'var(--ios-gray3)'}">${active ? '▾ 下面就是明细' : '点这里查看'}</div>`;

    const ledgerBtn = document.getElementById('bill-tab-ledger');
    const eatBtn = document.getElementById('bill-tab-eat');
    const act = this._billTab;

    ledgerBtn.style.background = act === 'ledger' ? 'linear-gradient(135deg,#34c759,#059669)' : '#fff';
    ledgerBtn.style.boxShadow = act === 'ledger' ? '0 2px 8px rgba(52,199,89,0.3)' : '0 1px 2px rgba(0,0,0,0.04)';
    ledgerBtn.innerHTML = card('ledger', act === 'ledger', '💰', '总账单', '卖了啥 · 真正的钱进出',
      `本月收入 ${Utils.fmtMoney(month.income)}`, `支出 ${Utils.fmtMoney(month.expense)}`,
      'var(--ios-green)', 'var(--ios-red)');

    eatBtn.style.background = act === 'eat' ? 'linear-gradient(135deg,#ff9500,#ea580c)' : '#fff';
    eatBtn.style.boxShadow = act === 'eat' ? '0 2px 8px rgba(255,149,0,0.3)' : '0 1px 2px rgba(0,0,0,0.04)';
    eatBtn.innerHTML = card('eat', act === 'eat', '🍽', '月账单', '鸽子吃用 · 消耗明细',
      `本月吃用 ${Utils.fmtMoney(eatMonth)}`, `${Storage.getFeedingLog().filter(l => (l.date || '').startsWith(Utils.currentMonth())).length} 笔`,
      'var(--ios-orange)', 'var(--ios-gray)');

    const box = document.getElementById('bill-content');
    if (act === 'ledger') {
      box.innerHTML = `<div class="section-header" style="padding-top:4px"><h2 class="section-title" style="font-size:18px">💰 总账明细（年 → 月 → 账单）</h2></div><div id="ledger">${this._ledgerHTML()}</div>`;
    } else {
      box.innerHTML = `<div class="section-header" style="padding-top:4px"><h2 class="section-title" style="font-size:18px">🍽 月账单 · 吃用明细（年 → 月 → 天）</h2></div><div id="eat-detail">${this._eatDetailHTML()}</div>`;
    }
  },

  _bigProfit() {
    const all = Utils.aggregateAll();
    const month = Utils.aggregateMonth();

    const profitRate = all.income > 0 ? ((all.profit / all.income) * 100).toFixed(1) : '0.0';
    const fmt = v => (v >= 0 ? '+' : '') + Utils.fmtMoney(v).slice(1);
    const color = v => v >= 0 ? 'var(--ios-green)' : 'var(--ios-red)';

    return `
      <div class="card" style="padding:20px;background:linear-gradient(135deg,${all.profit>=0?'#e8f5e9 0%,#ecfeff':'#ffebee 0%,#fff3e0'})">
        <div style="text-align:center">
          <div style="font-size:12px;color:var(--ios-gray);margin-bottom:4px">累计净利润</div>
          <div style="font-size:36px;font-weight:800;letter-spacing:-1px;color:${color(all.profit)}">${fmt(all.profit)}</div>
          <div style="font-size:13px;color:var(--ios-gray);margin-top:4px">
            收入 ${Utils.fmtMoney(all.income)} · 支出 ${Utils.fmtMoney(all.expense)}
          </div>
        </div>
        <div style="margin-top:16px;display:flex;justify-content:center;gap:20px;padding-top:14px;border-top:0.5px solid var(--ios-separator)">
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--ios-gray3)">本月净利润</div>
            <div style="font-size:16px;font-weight:700;color:${color(month.profit)}">${fmt(month.profit)}</div>
            <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">${Utils.currentMonth()}</div>
          </div>
          <div style="border-left:1px solid var(--ios-gray5)"></div>
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--ios-gray3)">利润率</div>
            <div style="font-size:16px;font-weight:700">${profitRate}%</div>
            <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">ROI</div>
          </div>
          <div style="border-left:1px solid var(--ios-gray5)"></div>
          <div style="text-align:center">
            <div style="font-size:11px;color:var(--ios-gray3)">手动账目</div>
            <div style="font-size:16px;font-weight:700">${Storage.getAccounts().length}</div>
            <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">条</div>
          </div>
        </div>
      </div>
    `;
  },

  _accountListHTML(filter) {
    // 把所有来源的账目扁平化：
    // 1. sales → income 条目（来源: 'sale'）
    // 2. accounts → income/expense（来源: 'manual'）
    // 3. feed_log → expense（来源: 'feed'）
    const entries = [];

    Storage.getSales().forEach(s => {
      entries.push({
        id: 'sale_' + s.id, type: 'income', category: '销售',
        amount: Number(s.total || 0), date: s.saleDate,
        title: (s.buyer || '销售') + (s.count ? ` · ${s.count}只` : ''),
        note: s.notes || '', source: 'sale'
      });
    });
    Storage.getAccounts().forEach(a => {
      entries.push({
        id: 'acct_' + a.id, type: a.type, category: a.category,
        amount: Number(a.amount || 0), date: a.date,
        title: a.title, note: a.note || '', source: 'manual',
        rawId: a.id
      });
    });
    Storage.getFeedLog().forEach(l => {
      entries.push({
        id: 'feed_' + l.id, type: 'expense', category: '饲料',
        amount: Number(l.price || 0) * Number(l.qty || 0), date: l.date,
        title: Utils.feedName(l.feedId) + ` · ${l.qty}${l.price ? '' : ''}`,
        note: l.notes || '', source: 'feed'
      });
    });
    // 投喂系统消耗（按天汇总成一条，避免记录过多）
    const feedByDay = {};
    Storage.getFeedingLog().forEach(l => {
      if (!l.date) return;
      if (!feedByDay[l.date]) feedByDay[l.date] = { amount: 0, count: 0, gram: 0 };
      feedByDay[l.date].amount += Number(l.cost || 0);
      feedByDay[l.date].count += 1;
      feedByDay[l.date].gram += Number(l.total || 0);
    });
    Object.keys(feedByDay).forEach(date => {
      const d = feedByDay[date];
      entries.push({
        id: 'feeding_' + date, type: 'expense', category: '饲料',
        amount: Math.round(d.amount * 100) / 100, date,
        title: `投喂消耗 · ${d.count} 次`,
        note: `共 ${Math.round(d.gram * 10) / 10} g`, source: 'feeding'
      });
    });

    let filtered = entries;
    if (filter !== 'all') filtered = entries.filter(e => e.type === filter);

    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    if (filtered.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📒</div><div class="empty-title">暂无${filter==='income'?'收入':'支出'}账目</div><div class="empty-desc">点右下角 + 记一笔</div></div>`;
    }

    // 同日期分组
    const groups = {};
    filtered.forEach(e => {
      const d = e.date || '未知';
      if (!groups[d]) groups[d] = [];
      groups[d].push(e);
    });

    const catColor = (cat, type) => {
      if (type === 'income') return 'rgba(52,199,89,0.12)';
      const map = { '饲料': 'rgba(255,149,0,0.12)', '药品': 'rgba(255,59,48,0.12)',
                    '人工': 'rgba(175,82,222,0.12)', '水电': 'rgba(0,122,255,0.12)',
                    '设备': 'rgba(255,204,0,0.15)', '维修': 'rgba(142,142,147,0.15)' };
      return map[cat] || 'rgba(142,142,147,0.15)';
    };

    let html = '';
    Object.keys(groups).sort().reverse().forEach(d => {
      const dayTotal = groups[d].reduce((s, e) => s + (e.type === 'income' ? e.amount : -e.amount), 0);
      html += `
        <div style="padding:12px 16px 4px;display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:var(--ios-gray3)">${d}</div>
          <div style="font-size:12px;font-weight:600;color:${dayTotal>=0?'var(--ios-green)':'var(--ios-red)'}">
            ${dayTotal>=0?'+':''}${Utils.fmtMoney(dayTotal)}
          </div>
        </div>
        <div class="list-group" style="margin:0 16px 8px">
          ${groups[d].map(e => `
            <div class="list-item" data-source="${e.source}" data-raw-id="${e.rawId||''}" data-id="${e.id}">
              <div class="list-item-icon" style="background:${catColor(e.category,e.type)};font-size:16px">
                ${e.type==='income'?'↑':'↓'}
              </div>
              <div class="list-item-content">
                <div class="list-item-title">${e.title}</div>
                <div class="list-item-sub">
                  <span class="tag tag-gray" style="margin-right:4px">${e.category}</span>
                  ${e.source === 'feed' || e.source === 'feeding' ? '自动' : e.source === 'sale' ? '销售' : '手动'}
                </div>
              </div>
              <div style="font-weight:700;color:${e.type==='income'?'var(--ios-green)':'var(--ios-red)'}">
                ${e.type==='income'?'+':'-'}${Utils.fmtMoney(e.amount)}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });

    // 绑定删除（仅手动账目可删，走统一联动删除）
    setTimeout(() => {
      document.querySelectorAll('#account-list [data-source="manual"]').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          ProfitPage.confirmDeleteAccount(el.dataset.rawId);
        });
      });
      // 销售记录点击 → 详情 / 退回鸽子
      document.querySelectorAll('#account-list [data-source="sale"]').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => ProfitPage.showSaleDetail(el.dataset.rawId));
      });
    }, 0);

    return html;
  },

  // ========== 总账明细（年 → 月 → 账单）==========
  // 总账单 = 真实钱进出：卖鸽子 / 卖鸽蛋 / 买饲料 / 脚环 / 手动账目
  // 吃用消耗（早餐晚餐扣料）不算钱进出，只在「月账单」里看
  _ledgerEntries() {
    const entries = [];
    Storage.getSales().forEach(s => {
      entries.push({
        id: 'sale_' + s.id, type: 'income', category: '销售',
        amount: Number(s.total || 0), date: s.saleDate,
        title: (s.buyer || '销售') + (s.count ? ` · ${s.count}只` : ''), source: 'sale', rawId: s.id
      });
    });
    Storage.getAccounts().forEach(a => {
      entries.push({
        id: 'acct_' + a.id, type: a.type, category: a.category,
        amount: Number(a.amount || 0), date: a.date,
        title: a.title, source: 'manual', rawId: a.id, link: a.link
      });
    });
    return entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  },

  _ledgerHTML() {
    const entries = this._ledgerEntries();
    if (entries.length === 0) {
      return `<div class="empty-state"><div class="empty-icon">📒</div><div class="empty-title">暂无账目</div><div class="empty-desc">点右下角 + 记一笔</div></div>`;
    }

    // 年 → 月 → 账单
    const years = {};
    entries.forEach(e => {
      const y = (e.date || '未知').slice(0, 4);
      const m = (e.date || '未知').slice(0, 7);
      years[y] = years[y] || {};
      years[y][m] = years[y][m] || [];
      years[y][m].push(e);
    });

    const sum = list => {
      const inc = list.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const exp = list.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      return { inc, exp, profit: inc - exp };
    };

    let html = '';
    Object.keys(years).sort().reverse().forEach(y => {
      const yList = Object.values(years[y]).flat();
      const ys = sum(yList);
      html += `
        <div style="margin:0 16px 8px;background:#fff;border-radius:12px;border:0.5px solid var(--ios-separator);overflow:hidden">
          <div class="ledger-yr" data-yr="${y}" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer">
            <span style="font-size:15px;font-weight:800">${y} 年 <span style="font-size:11px;color:var(--ios-gray3)">▾ 展开</span></span>
            <span style="font-size:12px">
              <span style="color:var(--ios-green)">↑${Utils.fmtMoney(ys.inc)}</span>
              <span style="color:var(--ios-red)">↓${Utils.fmtMoney(ys.exp)}</span>
              <b style="color:${ys.profit >= 0 ? 'var(--ios-green)' : 'var(--ios-red)'}">${ys.profit >= 0 ? '+' : ''}${Utils.fmtMoney(ys.profit)}</b>
            </span>
          </div>
          <div class="ledger-months" data-for="${y}" hidden>
            ${Object.keys(years[y]).sort().reverse().map(m => {
              const ms = sum(years[y][m]);
              return `
                <div style="border-top:0.5px solid var(--ios-separator)">
                  <div class="ledger-mo" data-mo="${m}" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--ios-gray6);cursor:pointer">
                    <span style="font-size:13px;font-weight:700">${m} <span style="font-size:10px;color:var(--ios-gray3);font-weight:400">▾ 账单</span></span>
                    <span style="font-size:11px">
                      <span style="color:var(--ios-green)">↑${Utils.fmtMoney(ms.inc)}</span>
                      <span style="color:var(--ios-red)">↓${Utils.fmtMoney(ms.exp)}</span>
                      <b>${ms.profit >= 0 ? '+' : ''}${Utils.fmtMoney(ms.profit)}</b>
                    </span>
                  </div>
                  <div class="ledger-bills" data-for="${m}" hidden>
                    ${years[y][m].map(e => `
                      <div data-src="${e.source}" data-rid="${e.rawId}" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 14px;border-top:0.5px solid var(--ios-separator);cursor:pointer">
                        <div style="min-width:0;flex:1">
                          <div style="font-size:13px;font-weight:600">${e.title}</div>
                          <div style="font-size:11px;color:var(--ios-gray3)">${e.date} · ${e.category}${e.source === 'sale' ? ' · 销售记录' : e.source === 'feed' ? ' · 投喂消耗' : ''} · 点看详情</div>
                        </div>
                        <span style="font-weight:700;color:${e.type === 'income' ? 'var(--ios-green)' : 'var(--ios-red)'}">${e.type === 'income' ? '+' : '-'}${Utils.fmtMoney(e.amount)}</span>
                        ${e.source === 'manual' ? `<button class="btn btn-danger-outline ledger-del" data-del="${e.rawId}" style="height:26px;font-size:11px;padding:0 10px;flex:0 0 auto">删</button>` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    setTimeout(() => {
      document.querySelectorAll('.ledger-yr').forEach(el => {
        el.onclick = () => {
          const box = document.querySelector(`.ledger-months[data-for="${el.dataset.yr}"]`);
          box.hidden = !box.hidden;
        };
      });
      document.querySelectorAll('.ledger-mo').forEach(el => {
        el.onclick = () => {
          const box = document.querySelector(`.ledger-bills[data-for="${el.dataset.mo}"]`);
          box.hidden = !box.hidden;
        };
      });
      document.querySelectorAll('.ledger-del').forEach(el => {
        el.onclick = ev => { ev.stopPropagation(); ProfitPage.confirmDeleteAccount(el.dataset.del); };
      });
      // 点账单 → 查看详情（吃用 / 手动 / 销售）
      document.querySelectorAll('#ledger [data-src]').forEach(el => {
        el.addEventListener('click', () => ProfitPage.showBillDetail(el.dataset.src, el.dataset.rid));
      });
    }, 0);

    return html;
  },

  /** 账单详情：吃用（克数明细）/ 手动账目 / 销售 */
  showBillDetail(source, rawId) {
    if (source === 'sale') { this.showSaleDetail(rawId); return; }

    if (source === 'feed') {
      const l = Storage.getFeedingLog().find(x => x.id === rawId);
      if (!l) { Utils.toast('该投喂记录已被撤销'); return; }
      const ing = l.ingredient || {};
      const ratio = l.ratio || {};
      Utils.openModal('吃用账单', `
        <div style="margin:0 0 8px;background:var(--ios-gray6);border-radius:12px;padding:8px 14px">
          ${this._infoRow('投喂对象', l.title || '—')}
          ${this._infoRow('日期', `${l.date} ${l.meal === 'pm' ? '晚餐' : '早餐'}`)}
          ${this._infoRow('配方', l.label || '—')}
          ${this._infoRow('总投喂量', `${l.total} g`)}
        </div>
        <div class="list-group" style="margin-bottom:4px">
          <div class="list-item" style="cursor:default"><div class="list-item-content"><div class="list-item-title">玉米</div></div><div class="list-item-value">${ing.corn || 0} g${ratio.corn != null ? `（${ratio.corn}%）` : ''}</div></div>
          <div class="list-item" style="cursor:default"><div class="list-item-content"><div class="list-item-title">豌豆</div></div><div class="list-item-value">${ing.pea || 0} g${ratio.pea != null ? `（${ratio.pea}%）` : ''}</div></div>
          <div class="list-item" style="cursor:default"><div class="list-item-content"><div class="list-item-title">高粱</div></div><div class="list-item-value">${ing.sorghum || 0} g${ratio.sorghum != null ? `（${ratio.sorghum}%）` : ''}</div></div>
          <div class="list-item" style="cursor:default"><div class="list-item-content"><div class="list-item-title"><b>折算金额</b></div></div><div class="list-item-value"><b style="color:var(--ios-red)">${Utils.fmtMoney(l.cost)}</b></div></div>
        </div>
        ${l.auto ? `<div style="font-size:12px;color:#b0741a;padding:0 4px">🤖 自动扣料${l.autoReason ? `（${l.autoReason}）` : ''}</div>` : ''}
      `, [{ label: '关闭', style: 'btn-secondary' }]);
      return;
    }

    // 手动账目详情
    const acc = Storage.getAccounts().find(a => a.id === rawId);
    if (!acc) return;
    const link = acc.link || {};
    let linkHTML = '';
    if (link.kind === 'feed-buy') {
      const f = Storage.getFeeds().find(x => x.id === link.feedId);
      linkHTML = this._infoRow('关联', `饲料入库：${f ? f.name : '饲料'} ${link.qty}${f ? f.unit || 'kg' : ''}（删账会退回库存）`);
    } else if (link.kind === 'egg-sell') {
      linkHTML = this._infoRow('关联', `卖鸽蛋 ${link.qty} 枚（删账会退回蛋库存）`);
    } else if (link.kind === 'ring-use') {
      linkHTML = this._infoRow('关联', `消耗脚环 ${link.ringQty || 1} 个`);
    }
    Utils.openModal('账单详情', `
      <div style="margin:0 0 8px;background:var(--ios-gray6);border-radius:12px;padding:8px 14px">
        ${this._infoRow('内容', acc.title)}
        ${this._infoRow('类型', `${acc.type === 'income' ? '收入' : '支出'} · ${acc.category}`, acc.type === 'income' ? 'var(--ios-green)' : 'var(--ios-red)')}
        ${this._infoRow('日期', acc.date)}
        ${this._infoRow('金额', Utils.fmtMoney(acc.amount), acc.type === 'income' ? 'var(--ios-green)' : 'var(--ios-red)')}
        ${linkHTML}
        ${acc.note ? this._infoRow('备注', acc.note) : ''}
      </div>
    `, [{ label: '关闭', style: 'btn-secondary' }]);
  },

  _infoRow(label, val, color) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:13px;line-height:2.1">
        <span style="color:var(--ios-gray);flex-shrink:0">${label}</span>
        <span style="font-weight:700;text-align:right;${color ? 'color:' + color : ''}">${val || '—'}</span>
      </div>`;
  },

  /** 月账单 · 吃用明细：年 → 月 → 日 → 点日展开当天吃用详情 */
  _eatDetailHTML() {
    const byDay = {};
    Storage.getFeedingLog().forEach(l => {
      if (!l.date) return;
      byDay[l.date] = byDay[l.date] || { amount: 0, gram: 0, count: 0, logs: [] };
      byDay[l.date].amount += Number(l.cost || 0);
      byDay[l.date].gram += Number(l.total || 0);
      byDay[l.date].count += 1;
      byDay[l.date].logs.push(l);
    });
    Storage.getFeedLog().forEach(l => {
      byDay[l.date] = byDay[l.date] || { amount: 0, gram: 0, count: 0, logs: [] };
      byDay[l.date].amount += Number(l.price || 0) * Number(l.qty || 0);
      byDay[l.date].gram += Number(l.qty || 0) * 1000;
      byDay[l.date].count += 1;
      byDay[l.date].logs.push({ manual: true, feedId: l.feedId, qty: l.qty, unit: l.unit || 'kg', penId: l.penId, cost: Number(l.price || 0) * Number(l.qty || 0) });
    });
    const days = Object.keys(byDay).sort().reverse();
    if (days.length === 0) {
      return `<div style="font-size:12px;color:var(--ios-gray3);padding:4px 16px 8px">还没有吃用记录</div>`;
    }

    // 年 → 月 分组
    const months = {};
    days.forEach(d => {
      const m = d.slice(0, 7);
      months[m] = months[m] || [];
      months[m].push(d);
    });
    const years = {};
    Object.keys(months).forEach(m => {
      const y = m.slice(0, 4);
      years[y] = years[y] || [];
      years[y].push(m);
    });

    // 当天一条吃用记录的明细行（含料比）
    const dayLogRow = l => {
      if (l.manual) {
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 14px 9px 28px;border-top:0.5px solid var(--ios-separator)">
            <div style="min-width:0;flex:1">
              <div style="font-size:12.5px;font-weight:600">📋 ${Utils.feedName(l.feedId)} · 手动消耗 ${Utils.fmtG(l.qty)}${l.unit || 'kg'}</div>
              <div style="font-size:10.5px;color:var(--ios-gray3)">${Utils.penName(l.penId)}</div>
            </div>
            <span style="font-weight:600;color:var(--ios-orange);font-size:12px">-${Utils.fmtMoney(l.cost)}</span>
          </div>
        `;
      }
      const ing = l.ingredient || {};
      const tot = (Number(ing.corn) || 0) + (Number(ing.pea) || 0) + (Number(ing.sorghum) || 0);
      const p = n => tot > 0 ? Math.round(n / tot * 100) : 0;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 14px 9px 28px;border-top:0.5px solid var(--ios-separator)">
          <div style="min-width:0;flex:1">
            <div style="font-size:12.5px;font-weight:600">${l.meal === 'pm' ? '🌇' : '🌅'} ${l.title || '投喂'} · ${l.meal === 'pm' ? '晚餐' : '早餐'}</div>
            <div style="font-size:10.5px;color:var(--ios-gray3)">共 ${Utils.fmtG(l.total)}g · 玉米 ${Utils.fmtG(ing.corn)}g(${p(ing.corn)}%) / 豌豆 ${Utils.fmtG(ing.pea)}g(${p(ing.pea)}%) / 高粱 ${Utils.fmtG(ing.sorghum)}g(${p(ing.sorghum)}%)</div>
          </div>
          <span style="font-weight:600;color:var(--ios-orange);font-size:12px">-${Utils.fmtMoney(l.cost)}</span>
        </div>
      `;
    };

    let html = '';
    Object.keys(years).sort().reverse().forEach(y => {
      const yTotal = years[y].flat().reduce((s, m) => s + months[m].reduce((s2, d) => s2 + byDay[d].amount, 0), 0);
      const yGram = years[y].flat().reduce((s, m) => s + months[m].reduce((s2, d) => s2 + byDay[d].gram, 0), 0);
      html += `
        <div style="margin:0 16px 8px;background:#fff;border-radius:12px;border:0.5px solid var(--ios-separator);overflow:hidden">
          <div class="eat-yr" data-yr="${y}" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;cursor:pointer">
            <span style="font-size:15px;font-weight:800">${y} 年 <span style="font-size:11px;color:var(--ios-gray3)">▾ 展开月份</span></span>
            <span style="font-size:12px;color:var(--ios-orange)">吃用 <b>${Utils.fmtMoney(yTotal)}</b> · ${Utils.fmtG(yGram)}g</span>
          </div>
          <div class="eat-months" data-for="${y}" hidden>
            ${years[y].sort().reverse().map(m => {
              const mTotal = months[m].reduce((s, d) => s + byDay[d].amount, 0);
              const mGram = months[m].reduce((s, d) => s + byDay[d].gram, 0);
              return `
                <div style="border-top:0.5px solid var(--ios-separator)">
                  <div class="eat-mo" data-mo="${m}" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--ios-gray6);cursor:pointer">
                    <span style="font-size:13px;font-weight:700">${m} <span style="font-size:10px;color:var(--ios-gray3);font-weight:400">▾ 展开按天</span></span>
                    <span style="font-size:12px;color:var(--ios-orange)">${Utils.fmtMoney(mTotal)} · ${Utils.fmtG(mGram)}g</span>
                  </div>
                  <div class="eat-days" data-for="${m}" hidden>
                    ${months[m].map(d => `
                      <div style="border-top:0.5px solid var(--ios-separator)">
                        <div class="eat-day" data-date="${d}" style="display:flex;justify-content:space-between;align-items:center;padding:9px 14px;cursor:pointer">
                          <div style="font-size:12.5px;font-weight:600">${d} <span style="font-size:10px;color:var(--ios-gray3);font-weight:400">${byDay[d].count} 次 · 共 ${Utils.fmtG(byDay[d].gram)}g · ▾ 点看当天详情</span></div>
                          <span style="font-weight:600;color:var(--ios-orange)">-${Utils.fmtMoney(byDay[d].amount)}</span>
                        </div>
                        <div class="eat-day-detail" data-for="${d}" hidden style="background:var(--ios-gray6)">
                          ${byDay[d].logs.slice().reverse().map(dayLogRow).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    setTimeout(() => {
      document.querySelectorAll('.eat-yr').forEach(el => {
        el.onclick = () => {
          const box = document.querySelector(`.eat-months[data-for="${el.dataset.yr}"]`);
          box.hidden = !box.hidden;
        };
      });
      document.querySelectorAll('.eat-mo').forEach(el => {
        el.onclick = () => {
          const box = document.querySelector(`.eat-days[data-for="${el.dataset.mo}"]`);
          box.hidden = !box.hidden;
        };
      });
      document.querySelectorAll('.eat-day').forEach(el => {
        el.onclick = () => {
          const box = document.querySelector(`.eat-day-detail[data-for="${el.dataset.date}"]`);
          if (box) box.hidden = !box.hidden;
        };
      });
    }, 0);

    return html;
  },

  /** 删账确认 + 联动（买料退库存 / 卖蛋退蛋 / 其他只删账） */
  confirmDeleteAccount(rawId) {
    const acc = Storage.getAccounts().find(a => a.id === rawId);
    if (!acc) return;
    const link = acc.link || {};

    let impactHTML = '';
    if (link.kind === 'feed-buy') {
      const feeds = Storage.getFeeds();
      const f = feeds.find(x => x.id === link.feedId);
      impactHTML = `<div style="font-size:13px;color:var(--ios-orange);margin-top:10px;background:rgba(255,149,0,0.1);border-radius:10px;padding:10px 12px">
        ↩️ 删除后 <b>${f ? f.name : '饲料'} ${link.qty}${f ? f.unit : 'kg'}</b> 将退回库存（作为新批次）
      </div>`;
    } else if (link.kind === 'egg-sell') {
      impactHTML = `<div style="font-size:13px;color:var(--ios-orange);margin-top:10px;background:rgba(255,149,0,0.1);border-radius:10px;padding:10px 12px">
        ↩️ 删除后 <b>${link.qty} 枚鸽蛋</b> 将退回蛋库存
      </div>`;
    } else {
      impactHTML = `<div style="font-size:12px;color:var(--ios-gray3);margin-top:10px">仅删除这条账，不影响库存和鸽子</div>`;
    }

    Utils.openModal('删除账单', `
      <div class="list-group" style="margin-bottom:4px">
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${acc.title}</div>
            <div class="list-item-sub">${acc.type === 'income' ? '收入' : '支出'} · ${acc.category} · ${acc.date}</div>
          </div>
          <div style="color:${acc.type === 'income' ? 'var(--ios-green)' : 'var(--ios-red)'};font-weight:700">
            ${acc.type === 'income' ? '+' : '-'}${Utils.fmtMoney(acc.amount)}
          </div>
        </div>
      </div>
      ${impactHTML}
      <div style="font-size:12px;color:var(--ios-red);margin-top:10px">⚠️ 删除后不可恢复，请确认</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认删除', style: 'btn-danger', onClick: () => {
        // 联动退回
        if (link.kind === 'feed-buy') {
          Feeding.adjustBatches(link.feedId, link.qty, 1, acc.date, link.price, '删账退回');
        } else if (link.kind === 'egg-sell') {
          const egg = Storage.getEggStock();
          egg.qty = Number(egg.qty || 0) + Number(link.qty || 0);
          egg.logs = egg.logs || [];
          egg.logs.unshift({ date: acc.date, count: Number(link.qty || 0), source: 'delete-refund', note: '删卖蛋账退回' });
          Storage.setEggStock(egg);
        }
        Storage.setAccounts(Storage.getAccounts().filter(a => a.id !== rawId));
        Utils.toast('已删除' + (link.kind ? '并退回' : ''));
        this.render();
      }}
    ]);
  },

  /** 销售记录详情 + 退回鸽子（74 退回） */
  showSaleDetail(saleId) {
    const s = Storage.getSales().find(x => x.id === saleId);
    if (!s) return;
    const ids = s.pigeonIds || [];
    const pigeons = ids.map(id => Utils.pigeonById(id)).filter(Boolean);
    const returned = !!s.returned;

    const pigeonRows = pigeons.length ? `
      <div style="font-size:12px;color:var(--ios-gray3);margin:10px 0 6px">涉及鸽子：</div>
      <div class="list-group" style="margin:0">
        ${pigeons.map(p => `
          <div class="list-item"><div class="list-item-content">
            <div class="list-item-title">${p.code} · ${p.breed || ''}</div>
            <div class="list-item-sub">当前状态：${p.status === 'sold' ? '已出栏' : p.status}</div>
          </div></div>
        `).join('')}
      </div>` : `<div style="font-size:12px;color:var(--ios-gray3);margin-top:10px">本条销售未绑定个体（乳鸽未上环直接出栏），无法退回</div>`;

    Utils.openModal('销售记录', `
      <div class="list-group" style="margin-bottom:4px">
        <div class="list-item">
          <div class="list-item-content">
            <div class="list-item-title">${s.buyer || '销售'}${s.count ? ` · ${s.count}只` : ''}</div>
            <div class="list-item-sub">${s.saleDate} · 收入${returned ? ' · 已退回' : ''}</div>
          </div>
          <div style="color:var(--ios-green);font-weight:700">+${Utils.fmtMoney(s.total)}</div>
        </div>
      </div>
      ${pigeonRows}
      ${returned ? `<div style="font-size:12px;color:var(--ios-gray3);margin-top:10px">此记录已退回，如需彻底删除请直接删除记录</div>` : ''}
    `, [
      ...(pigeons.length && !returned ? [{
        label: '↩️ 退回鸽子（撤销收入）', style: 'btn-primary', onClick: () => {
          const list = Storage.getPigeons();
          ids.forEach(pid => {
            const x = list.find(z => z.id === pid);
            if (x) {
              x.status = (s.prevStatuses && s.prevStatuses[pid]) || 'young';
              x.archived = false;
            }
          });
          Storage.setPigeons(list);
          Storage.setSales(Storage.getSales().filter(x => x.id !== saleId));
          Utils.toast('已退回鸽子，收入已撤销');
          this.render();
        }
      }] : []),
      ...(pigeons.length && returned ? [{
        label: '删除这条销售记录', style: 'btn-danger', onClick: () => {
          Storage.setSales(Storage.getSales().filter(x => x.id !== saleId));
          Utils.toast('已删除');
          this.render();
        }
      }] : []),
      { label: '关闭', style: 'btn-secondary' }
    ]);
  },

  // ========== 添加账目 ==========
  openAccountForm(presetType) {
    const isIncome = presetType === 'income';
    let curType = isIncome ? 'income' : 'expense';

    const incomeCats = ['销售', '卖蛋', '其他收入'];
    const expenseCats = ['买料', '药品', '人工', '水电', '设备', '维修', '运费', '其他支出'];
    const feeds = Storage.getFeeds();

    Utils.openModal(isIncome ? '+ 收入' : '− 支出', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">日期</label>
          <input class="form-input" type="date" id="ac-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">金额</label>
          <input class="form-input" type="number" step="0.01" id="ac-amount" placeholder="¥ 0.00" />
        </div>
        <div class="form-row">
          <label class="form-label">分类</label>
          <select class="form-select" id="ac-cat">
            ${(isIncome ? incomeCats : expenseCats).map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div id="ac-link-feed" style="display:none">
          <div class="form-row">
            <label class="form-label">饲料</label>
            <select class="form-select" id="ac-feed">
              ${feeds.map(f => `<option value="${f.id}">${f.name}（${Utils.fmtMoney(f.price)}/${f.unit}）</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">数量</label>
            <input class="form-input" type="number" step="0.1" id="ac-feed-qty" placeholder="多少 ${feeds[0]?.unit || 'kg'}" />
          </div>
          <div style="font-size:11px;color:var(--ios-gray3);margin:-6px 0 8px">保存后自动入库为一批次；删这条账时自动退回库存</div>
        </div>
        <div id="ac-link-egg" style="display:none">
          <div class="form-row">
            <label class="form-label">卖蛋数量（枚）</label>
            <input class="form-input" type="number" id="ac-egg-qty" placeholder="当前库存 ${Storage.getEggStock().qty} 枚" />
          </div>
          <div style="font-size:11px;color:var(--ios-gray3);margin:-6px 0 8px">保存后自动从鸽蛋库存扣减；删这条账时自动退回</div>
        </div>
        <div class="form-row">
          <label class="form-label">类型</label>
          <div style="display:flex;gap:8px">
            <button class="btn" id="type-income" style="flex:1;height:34px;font-size:14px;border-radius:8px;background:${isIncome?'var(--ios-green)':'var(--ios-gray6)'};color:${isIncome?'#fff':'var(--ios-text)'};font-weight:600">收入</button>
            <button class="btn" id="type-expense" style="flex:1;height:34px;font-size:14px;border-radius:8px;background:${!isIncome?'var(--ios-red)':'var(--ios-gray6)'};color:${!isIncome?'#fff':'var(--ios-text)'};font-weight:600">支出</button>
          </div>
        </div>
      </div>
      <div class="form-group">
        <div class="form-row" style="flex-direction:column;align-items:flex-start">
          <label class="form-label" style="margin-bottom:6px">标题</label>
          <input class="form-input" id="ac-title" placeholder="如：买玉米 500 斤、卖鸽蛋" style="text-align:left" />
        </div>
        <div class="form-row" style="flex-direction:column;align-items:flex-start">
          <label class="form-label" style="margin-bottom:6px">备注（选填）</label>
          <textarea class="form-textarea" id="ac-note" placeholder="详细说明"></textarea>
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        const type = curType;
        const cat = document.getElementById('ac-cat').value;
        const amount = Number(document.getElementById('ac-amount').value);
        const title = document.getElementById('ac-title').value.trim();
        if (!amount || amount <= 0) { Utils.toast('请输入金额'); return; }
        if (!title) { Utils.toast('请输入标题'); return; }

        // 联动：买料 → 自动入库批次；卖蛋 → 自动扣蛋库存
        let link = null;
        if (type === 'expense' && cat === '买料') {
          const feedId = document.getElementById('ac-feed').value;
          const qty = Number(document.getElementById('ac-feed-qty').value);
          const f = Storage.getFeeds().find(x => x.id === feedId);
          if (!feedId) { Utils.toast('请选择饲料'); return; }
          if (!qty || qty <= 0) { Utils.toast('请输入数量'); return; }
          const price = amount / qty; // 用金额反推单价，保证账实一致
          const e = Feeding.adjustBatches(feedId, qty, 1, document.getElementById('ac-date').value, price, '买料入库');
          link = { kind: 'feed-buy', feedId, qty, price, batchId: e.batches[e.batches.length - 1].id };
        }
        if (type === 'income' && cat === '卖蛋') {
          const qty = Number(document.getElementById('ac-egg-qty').value);
          const egg = Storage.getEggStock();
          if (!qty || qty <= 0) { Utils.toast('请输入卖蛋数量'); return; }
          if (qty > Number(egg.qty || 0)) { Utils.toast(`蛋库存只有 ${egg.qty} 枚`); return; }
          egg.qty = Number(egg.qty || 0) - qty;
          egg.logs = egg.logs || [];
          egg.logs.unshift({ date: document.getElementById('ac-date').value, count: -qty, source: 'sell', note: title });
          Storage.setEggStock(egg);
          link = { kind: 'egg-sell', qty };
        }

        const accounts = Storage.getAccounts();
        accounts.push({
          id: Utils.uid('a'),
          type,
          category: cat,
          amount,
          date: document.getElementById('ac-date').value,
          title,
          note: document.getElementById('ac-note').value.trim(),
          link
        });
        Storage.setAccounts(accounts);
        Utils.toast('✓ 已保存' + (link ? '（库存已联动）' : ''));
        this.render();
      }}
    ]);

    // 分类切换：显示/隐藏联动区块
    const toggleLink = () => {
      const cat = document.getElementById('ac-cat').value;
      document.getElementById('ac-link-feed').style.display = (cat === '买料') ? '' : 'none';
      document.getElementById('ac-link-egg').style.display = (cat === '卖蛋') ? '' : 'none';
    };
    setTimeout(() => {
      document.getElementById('ac-cat').onchange = toggleLink;
      toggleLink();
    }, 0);

    // 类型切换按钮
    setTimeout(() => {
      document.getElementById('type-income').onclick = () => {
        curType = 'income';
        document.getElementById('type-income').style.background = 'var(--ios-green)';
        document.getElementById('type-income').style.color = '#fff';
        document.getElementById('type-expense').style.background = 'var(--ios-gray6)';
        document.getElementById('type-expense').style.color = 'var(--ios-text)';
        // 重设分类选项
        const cat = document.getElementById('ac-cat');
        cat.innerHTML = incomeCats.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('ac-link-feed').style.display = 'none';
        document.getElementById('ac-link-egg').style.display = cat.value === '卖蛋' ? '' : 'none';
      };
      document.getElementById('type-expense').onclick = () => {
        curType = 'expense';
        document.getElementById('type-expense').style.background = 'var(--ios-red)';
        document.getElementById('type-expense').style.color = '#fff';
        document.getElementById('type-income').style.background = 'var(--ios-gray6)';
        document.getElementById('type-income').style.color = 'var(--ios-text)';
        const cat = document.getElementById('ac-cat');
        cat.innerHTML = expenseCats.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('ac-link-egg').style.display = 'none';
        document.getElementById('ac-link-feed').style.display = cat.value === '买料' ? '' : 'none';
      };
    }, 0);
  },

  // ========== 销售记录（保留原来的单独添加入口） ==========
  openSaleForm() {
    // 这个保留旧逻辑但同时也写入 accounts
    Utils.openModal('新增销售', `
      <div class="form-group">
        <div class="form-row"><label class="form-label">日期</label><input class="form-input" type="date" id="s-date" value="${Utils.today()}" /></div>
        <div class="form-row"><label class="form-label">数量</label><input class="form-input" type="number" id="s-count" placeholder="只" /></div>
        <div class="form-row"><label class="form-label">单价</label><input class="form-input" type="number" step="0.5" id="s-price" placeholder="¥/只" /></div>
        <div class="form-row"><label class="form-label">总金额</label><input class="form-input" type="number" step="0.01" id="s-total" placeholder="自动" /></div>
        <div class="form-row"><label class="form-label">买家</label><input class="form-input" id="s-buyer" placeholder="市场/餐厅..." /></div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        const count = Number(document.getElementById('s-count').value) || 0;
        const price = Number(document.getElementById('s-price').value) || 0;
        const total = Number(document.getElementById('s-total').value) || count * price;
        const buyer = document.getElementById('s-buyer').value.trim();
        if (!total) { Utils.toast('请输入金额'); return; }
        const sales = Storage.getSales();
        sales.push({ id: Utils.uid('s'), saleDate: document.getElementById('s-date').value, count, price, total, buyer, weight: 0, notes: '' });
        Storage.setSales(sales);
        Utils.toast('✓ 销售已记');
        this.render();
      }}
    ]);
    const count = document.getElementById('s-count');
    const price = document.getElementById('s-price');
    const total = document.getElementById('s-total');
    [count, price].forEach(el => el.addEventListener('input', () => {
      if (count.value && price.value) total.value = (Number(count.value) * Number(price.value)).toFixed(2);
    }));
  }
};
