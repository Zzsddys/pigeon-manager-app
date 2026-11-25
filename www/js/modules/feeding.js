/**
 * 投喂系统 · 页面
 * 今日两餐 + 分类配方设置 + 每对单独投喂/调整
 */
const FeedingPage = {
  /* ============================================================
     主页面
     ============================================================ */
  render() {
    document.getElementById('nav-title').textContent = '投喂';
    document.getElementById('nav-action').hidden = true;
    document.getElementById('nav-back').hidden = true;

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section" style="padding-bottom:0">
        ${this._mealCards()}
        <div style="font-size:11px;color:var(--ios-gray);padding:10px 4px 0;line-height:1.7">
          一天 2 餐（早餐 08:00 / 晚餐 18:00）· 配方克数按「玉米 / 豌豆 / 高粱」拆分，投喂后自动扣库存、计入吃用金额。
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title" style="font-size:16px">⚙️ 配方设置</h2>
        <span style="font-size:11px;color:var(--ios-gray3)">点击可调整</span>
      </div>
      <div style="padding:0 12px;display:flex;flex-direction:column;gap:8px">
        ${this._recipeCards()}
      </div>

      <div class="section-header">
        <h2 class="section-title" style="font-size:16px">🐥 青年鸽群</h2>
        <span style="font-size:11px;color:var(--ios-gray3)">出栏后 / 未配对</span>
      </div>
      <div style="padding:0 12px;display:flex;flex-direction:column;gap:10px">
        ${this._youngGroupCard()}
      </div>

      <div class="section-header">
        <h2 class="section-title" style="font-size:16px">🧾 最近投喂</h2>
      </div>
      <div style="padding:0 12px 100px">
        ${this._recentLogsHTML()}
      </div>
    `;

    this._bindMain();
  },

  _bindMain() {
    document.querySelectorAll('[data-meal-feed]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this._feedWholeMeal(el.dataset.mealFeed);
      });
    });
    document.querySelectorAll('[data-meal-confirm]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const n = AutoEngine.confirmMeal(Utils.today(), el.dataset.mealConfirm);
        Utils.toast(`✓ 已确认喂了 ${n} 条记录`);
        this.render();
      });
    });
    document.querySelectorAll('[data-meal-refund]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const meal = el.dataset.mealRefund;
        Utils.openModal(`没喂退回 · ${Feeding.MEAL_LABEL[meal]}`, `
          <p style="font-size:13px;line-height:1.8">这餐是<b>自动扣料</b>的。确认实际没喂吗？<br>
          整餐记录将撤销，饲料<b style="color:var(--ios-green)">自动退回库存</b>。</p>
        `, [
          { label: '取消', style: 'btn-secondary' },
          { label: '确认退回', style: 'btn-danger', onClick: () => {
            const n = AutoEngine.refundMeal(Utils.today(), meal);
            Utils.closeModal();
            Utils.toast(`已退回 ${n} 条记录，饲料退回库存`);
            this.render();
          }}
        ]);
      });
    });
    document.querySelectorAll('[data-recipe]').forEach(el => {
      el.addEventListener('click', () => this.showRecipeDetail(el.dataset.recipe));
    });
    const y = document.getElementById('young-group-card');
    if (y) y.addEventListener('click', () => this.showYoungDetail());
  },

  /* ============================================================
     今日两餐
     ============================================================ */
  _mealCards() {
    const sum = Feeding.todaySummary();
    return `
      <div style="display:flex;gap:10px">
        ${this._mealCard('am', '🌅', sum.am)}
        ${this._mealCard('pm', '🌇', sum.pm)}
      </div>
    `;
  },

  _mealCard(meal, icon, s) {
    const pct = s.needGram > 0 ? Math.min(100, Math.round(s.fedGram / s.needGram * 100)) : 0;
    const allDone = s.totalCount > 0 && s.doneCount >= s.totalCount;
    const hasAuto = AutoEngine.todayAuto(meal);
    return `
      <div class="card" style="flex:1;min-width:0;padding:12px 12px 10px;margin:0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:14px;font-weight:700">${icon} ${Feeding.MEAL_LABEL[meal]}
            <span style="font-size:10px;font-weight:500;color:var(--ios-gray3);margin-left:3px">${meal === 'am' ? '08:00' : '18:00'}</span>
          </div>
          ${hasAuto
            ? `<span class="tag tag-blue" style="font-size:10px;padding:2px 6px">⏱ 自动扣料</span>`
            : `<span class="tag ${allDone ? 'tag-green' : 'tag-orange'}" style="font-size:10px;padding:2px 6px">${allDone ? '已完成' : s.doneCount + '/' + s.totalCount}</span>`}
        </div>
        <div style="font-size:12px;color:var(--ios-gray)">应投 <b style="color:var(--ios-text)">${s.needGram}</b> g</div>
        <div style="font-size:12px;color:var(--ios-gray);margin-top:2px">已投 ${s.fedGram} g · ${Utils.fmtMoney(s.fedCost)}</div>
        <div style="height:5px;background:var(--ios-gray5);border-radius:3px;margin:8px 0 9px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${allDone ? 'var(--ios-green)' : 'var(--ios-orange)'};border-radius:3px"></div>
        </div>
        ${hasAuto ? `
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" data-meal-confirm="${meal}" style="flex:1;height:32px;font-size:13px;padding:0;border-radius:8px">✅ 确认喂了</button>
            <button class="btn btn-secondary" data-meal-refund="${meal}" style="flex:1;height:32px;font-size:13px;padding:0;border-radius:8px;color:var(--ios-red)">↩️ 没喂退回</button>
          </div>
        ` : `
          <button class="btn btn-primary" data-meal-feed="${meal}" style="width:100%;height:32px;font-size:13px;padding:0;border-radius:8px">
            ${allDone ? '查看 / 补投' : '一键投喂'}
          </button>
        `}
      </div>
    `;
  },

  /* ============================================================
     配方卡片
     ============================================================ */
  _recipeCards() {
    const cfg = Feeding.cfg();
    const baseCards = Object.keys(cfg.base).map(k => {
      const r = Feeding.buildRecipe(cfg.base[k], cfg.base[k].label);
      return this._recipeCard('base:' + k, cfg.base[k].label, r, 'perMeal', '种鸽/青年');
    }).join('');
    const chickCards = cfg.chick.map(st => {
      const r = Feeding.buildRecipe(st, st.label);
      return this._recipeCard('chick:' + st.id, st.label, r, 'perDay', '带仔');
    }).join('');
    return baseCards + chickCards;
  },

  _recipeCard(key, label, r, mode, tag) {
    const main = mode === 'perMeal'
      ? `${r.grams} g <span style="font-size:10px;font-weight:400;color:var(--ios-gray)">/餐</span>`
      : `${r.grams} g <span style="font-size:10px;font-weight:400;color:var(--ios-gray)">/天（${r.perMeal}g/餐）</span>`;
    return `
      <div class="card" data-recipe="${key}" style="margin:0;padding:11px 13px;display:flex;align-items:center;gap:12px;cursor:pointer">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,149,0,0.12);display:flex;align-items:center;justify-content:center;font-size:17px">🌾</div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:14px;font-weight:600">${label}</span>
            <span class="tag tag-gray" style="font-size:9.5px;padding:1px 5px">${tag}</span>
          </div>
          <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">${Feeding.ratioText(r.ratio)} · 玉米 ${r.ingredient.corn}g · 豌豆 ${r.ingredient.pea}g · 高粱 ${r.ingredient.sorghum}g</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:15px;font-weight:700;color:var(--ios-orange)">${main}</div>
          <div style="font-size:10px;color:var(--ios-gray3)">¥${r.cost.toFixed(2)}/餐</div>
        </div>
        <span class="list-item-arrow">›</span>
      </div>
    `;
  },

  /* ============================================================
     青年鸽群卡片
     ============================================================ */
  _youngGroupCard() {
    const sum = Feeding.todaySummary();
    const amMap = {};
    sum.am.targets.forEach(t => { amMap[t.type + ':' + t.id] = t; });
    const pmMap = {};
    sum.pm.targets.forEach(t => { pmMap[t.type + ':' + t.id] = t; });

    const group = Feeding.youngGroup();
    if (group.count === 0) {
      return `<div style="font-size:12px;color:var(--ios-gray3);padding:4px 2px">暂无青年鸽</div>`;
    }
    let groupHTML = '';
    if (group.count > 0) {
      const am = amMap['young:young'];
      const pm = pmMap['young:young'];
      const g = am ? am.recipe : Feeding.recipeForYoung(Utils.today(), 'am');
      const totalGram = Feeding.r1(g.perMeal * group.count);
      groupHTML = `
        <div class="card" id="young-group-card" style="margin:0;padding:12px 13px;cursor:pointer;background:linear-gradient(140deg,#f0fdf4,#ecfdf5)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:14px;font-weight:700">青年鸽群（${group.count}只）</div>
            <span class="tag tag-green">青年鸽</span>
          </div>
          <div style="font-size:12px;color:var(--ios-text2);margin-top:6px">
            每只 <b>${g.perMeal}g</b>/餐 · 群合计 <b>${totalGram}g</b>/餐
          </div>
          <div style="font-size:11px;color:var(--ios-gray);margin-top:3px">
            含育肥、未配对种鸽 · ${Feeding.ratioText(g.ratio)}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:7px;border-top:0.5px solid rgba(52,199,89,0.18)">
            <div style="font-size:11px;color:var(--ios-gray)">
              今日 早餐 <b style="color:${am && am.fed ? 'var(--ios-green)' : 'var(--ios-gray3)'}">${am && am.fed ? '✓' : '待'}</b>
              · 晚餐 <b style="color:${pm && pm.fed ? 'var(--ios-green)' : 'var(--ios-gray3)'}">${pm && pm.fed ? '✓' : '待'}</b>
            </div>
            <span class="tag tag-green" style="font-size:10px">${group.count} 只</span>
          </div>
        </div>
      `;
    }
    return groupHTML;
  },

  _statusColor(label) {
    if (label.indexOf('带仔') === 0) return { color: 'var(--ios-green)', bg: 'rgba(52,199,89,0.12)' };
    if (label.indexOf('下1个蛋') === 0) return { color: 'var(--ios-orange)', bg: 'rgba(255,149,0,0.12)' };
    if (label.indexOf('孵化') === 0) return { color: 'var(--ios-purple)', bg: 'rgba(175,82,222,0.12)' };
    if (label.indexOf('出栏') === 0) return { color: 'var(--ios-gray)', bg: 'rgba(118,118,128,0.12)' };
    return { color: 'var(--ios-blue)', bg: 'rgba(0,122,255,0.12)' };
  },

  _recentLogsHTML() {
    const logs = Feeding.recentLogs(12);
    if (!logs.length) {
      return `<div class="empty-state" style="padding:24px 0"><div class="empty-icon">🧾</div><div class="empty-title">还没有投喂记录</div><div class="empty-desc">点上面的「一键投喂」或进配对详情投喂</div></div>`;
    }
    return `
      <div class="list-group">
        ${logs.map(l => `
          <div class="list-item" style="cursor:default">
            <div class="list-item-icon" style="background:rgba(255,149,0,0.12);font-size:15px">${l.meal === 'am' ? '🌅' : '🌇'}</div>
            <div class="list-item-content">
              <div class="list-item-title">${l.title}</div>
              <div class="list-item-sub">${l.date} · ${Feeding.MEAL_LABEL[l.meal]} · ${l.label} · ${l.total}g</div>
            </div>
            <div class="list-item-value" style="color:var(--ios-orange);font-weight:600">${Utils.fmtMoney(l.cost)}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /* ============================================================
     一键投喂
     ============================================================ */
  _feedWholeMeal(meal) {
    const s = Feeding.todaySummary()[meal];
    const pending = s.targets.filter(t => !t.fed);
    if (pending.length === 0) {
      Utils.openModal(`${Feeding.MEAL_LABEL[meal]}已全部投喂`, `
        <p style="padding:4px 0">今天${Feeding.MEAL_LABEL[meal]}的 ${s.totalCount} 个目标都已投喂完成。</p>
        <div class="list-group" style="margin-top:10px">
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">已投总量</div></div><div class="list-item-value">${s.fedGram} g</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">折算金额</div></div><div class="list-item-value">${Utils.fmtMoney(s.fedCost)}</div></div>
        </div>
      `, [{ label: '关闭', style: 'btn-secondary' }]);
      return;
    }
    const grams = Feeding.r1(pending.reduce((s2, t) => s2 + t.perMeal, 0));
    const cost = Feeding.r2(pending.reduce((s2, t) => s2 + t.cost, 0));
    Utils.openModal(`一键投喂 · ${Feeding.MEAL_LABEL[meal]}`, `
      <div class="card" style="margin:0 0 10px;background:var(--ios-gray6);box-shadow:none">
        <div style="font-size:13px">待投喂目标 <b>${pending.length}</b> 个</div>
        <div style="font-size:13px;margin-top:4px">合计 <b>${grams} g</b> · 约 <b style="color:var(--ios-orange)">${Utils.fmtMoney(cost)}</b></div>
      </div>
      <div style="font-size:12px;color:var(--ios-gray);line-height:1.7">将按各配对当前状态的标准配方分别投喂，并自动扣减玉米/豌豆/高粱库存。</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认投喂', style: 'btn-primary', onClick: () => {
        pending.forEach(t => Feeding.feed(t, Utils.today(), meal));
        Utils.toast(`✓ ${Feeding.MEAL_LABEL[meal]}已投喂 ${pending.length} 个目标`);
        this.render();
      }}
    ]);
  },

  /* ============================================================
     配对详情
     ============================================================ */
  showPairDetail(breedId, push = true) {
    const b = Storage.getBreeds().find(x => x.id === breedId);
    if (!b) return;
    if (push) App.openDetail(() => {});
    document.getElementById('nav-title').textContent = Feeding.pairTitle(b);
    document.getElementById('nav-action').hidden = true;
    this._renderPairDetail(b);
  },

  _renderPairDetail(b) {
    const today = Utils.today();
    const recipe = Feeding.recipeForPair(b, today, Feeding.currentMeal());
    if (!recipe) {
      document.getElementById('page-content').innerHTML = '<div class="empty-state"><div class="empty-icon">🐦</div><div class="empty-title">该配对已停用</div></div>';
      return;
    }
    const c = this._statusColor(recipe.label);
    const curMeal = Feeding.currentMeal();
    const ov = Feeding.activeOverride('pair', b.id, today, curMeal);
    const pendingOv = Feeding.pendingOverride('pair', b.id, today, curMeal);
    const hasOv = Feeding.overrideList('pair', b.id).length > 0;
    const logs = Storage.getFeedingLog()
      .filter(l => l.targetType === 'pair' && l.targetId === b.id)
      .sort((x, y) => (y.date + y.meal).localeCompare(x.date + x.meal));
    const totalCost = Feeding.costOfPair(b.id, b.pairDate || '0000-01-01', today);
    const todayCost = Feeding.costOfPair(b.id, today, today);

    const m = Utils.pigeonById(b.maleId);
    const f = Utils.pigeonById(b.femaleId);

    const mealRow = (meal) => {
      const log = Feeding.logFor(today, meal, 'pair', b.id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid var(--ios-separator)">
          <div style="width:38px;height:38px;border-radius:10px;background:${meal === 'am' ? 'rgba(255,149,0,0.12)' : 'rgba(88,86,214,0.12)'};display:flex;align-items:center;justify-content:center;font-size:17px">${meal === 'am' ? '🌅' : '🌇'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600">${Feeding.MEAL_LABEL[meal]}</div>
            <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">${log ? `已投 ${log.total}g · ${Utils.fmtMoney(log.cost)}` : `计划 ${recipe.perMeal}g · 约 ${Utils.fmtMoney(recipe.cost)}`}</div>
          </div>
          <button class="btn ${log ? 'btn-secondary' : 'btn-primary'}" data-feed-meal="${meal}" style="flex:0 0 auto;height:32px;font-size:13px;padding:0 14px;border-radius:8px">
            ${log ? '已投喂' : '投喂'}
          </button>
        </div>
      `;
    };

    document.getElementById('page-content').innerHTML = `
      <div class="section" style="padding-bottom:0">
        <div class="card" style="background:linear-gradient(140deg,#fafaf9,#fefce8);margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
            <div>
              <div style="font-size:16px;font-weight:700">
                <span style="color:var(--ios-blue)">♂ ${m ? m.code : '?'}</span>
                <span style="color:var(--ios-gray3);margin:0 5px">×</span>
                <span style="color:var(--ios-orange)">♀ ${f ? f.code : '?'}</span>
              </div>
              <div style="font-size:11px;color:var(--ios-gray);margin-top:3px">${Utils.penName(b.penId)} · 配对 ${b.pairDate || '-'}</div>
            </div>
            <span class="tag" style="color:${c.color};background:${c.bg}">${recipe.label}</span>
          </div>

          <div style="display:flex;gap:8px;margin-top:12px">
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">每餐总量</div>
              <div style="font-size:18px;font-weight:800;color:var(--ios-orange);line-height:1.25">${recipe.perMeal}<span style="font-size:11px;font-weight:500">g</span></div>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">配比 玉米/豌豆/高粱</div>
              <div style="font-size:14px;font-weight:700;line-height:1.7">${Feeding.ratioText(recipe.ratio)}</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--ios-text2);margin-top:10px;padding-top:9px;border-top:0.5px solid rgba(0,0,0,0.07)">
            <span>玉米 <b>${recipe.ingredient.corn}g</b></span>
            <span>豌豆 <b>${recipe.ingredient.pea}g</b></span>
            <span>高粱 <b>${recipe.ingredient.sorghum}g</b></span>
            <span style="color:var(--ios-orange)">≈ ${Utils.fmtMoney(recipe.cost)}</span>
          </div>
          ${ov ? `<div style="font-size:10.5px;color:var(--ios-purple);background:rgba(175,82,222,0.1);border-radius:8px;padding:6px 8px;margin-top:8px">当前单独配方：${ov.grams}g/${ov.unit === 'day' ? '天' : '餐'} · ${ov.corn}/${ov.pea}/${ov.sorghum} · ${ov.effectiveText}</div>` : ''}
          ${pendingOv ? `<div style="font-size:10.5px;color:var(--ios-orange);background:rgba(255,149,0,0.1);border-radius:8px;padding:6px 8px;margin-top:8px">待生效：${pendingOv.grams}g/${pendingOv.unit === 'day' ? '天' : '餐'} · ${pendingOv.corn}/${pendingOv.pea}/${pendingOv.sorghum} · ${pendingOv.effectiveText}</div>` : ''}
        </div>

        <div class="card" style="padding:4px 16px">
          ${mealRow('am')}
          <div style="border-bottom:none">${mealRow('pm').replace('border-bottom:0.5px solid var(--ios-separator)', 'border-bottom:none')}</div>
        </div>

        <div class="card" style="padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:14px;font-weight:600">单独配方</div>
              <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">只对这一对生效，可选生效时机</div>
            </div>
            <span class="tag ${ov ? 'tag-purple' : pendingOv ? 'tag-orange' : 'tag-gray'}">${ov ? '已自定义' : pendingOv ? '待生效' : '跟随默认'}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-primary" id="btn-pair-override" style="flex:1;height:36px;font-size:14px">调整配方</button>
            ${hasOv ? '<button class="btn btn-secondary" id="btn-pair-reset" style="flex:0 0 96px;height:36px;font-size:14px">恢复默认</button>' : ''}
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:4px">
          <div style="flex:1;background:var(--ios-card);border-radius:12px;padding:11px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
            <div style="font-size:10px;color:var(--ios-gray3)">本窝累计吃用</div>
            <div style="font-size:16px;font-weight:700;color:var(--ios-orange);margin-top:2px">${Utils.fmtMoney(totalCost)}</div>
          </div>
          <div style="flex:1;background:var(--ios-card);border-radius:12px;padding:11px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
            <div style="font-size:10px;color:var(--ios-gray3)">今日吃用</div>
            <div style="font-size:16px;font-weight:700;color:var(--ios-blue);margin-top:2px">${Utils.fmtMoney(todayCost)}</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title" style="font-size:16px">🧾 投喂记录</h2>
        <span style="font-size:11px;color:var(--ios-gray3)">最近 ${Math.min(logs.length, 20)} 条</span>
      </div>
      <div style="padding:0 12px 40px">
        ${logs.length ? `<div class="list-group">${logs.slice(0, 20).map(l => `
          <div class="list-item" style="cursor:default">
            <div class="list-item-icon" style="background:rgba(255,149,0,0.12);font-size:15px">${l.meal === 'am' ? '🌅' : '🌇'}</div>
            <div class="list-item-content">
              <div class="list-item-title">${l.date} · ${Feeding.MEAL_LABEL[l.meal]}</div>
              <div class="list-item-sub">${l.label} · ${l.total}g · 玉米${l.ingredient.corn} 豌豆${l.ingredient.pea} 高粱${l.ingredient.sorghum}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:600;color:var(--ios-orange)">${Utils.fmtMoney(l.cost)}</div>
              <button data-undo="${l.id}" style="background:none;border:none;color:var(--ios-red);font-size:11px;padding:2px 0;cursor:pointer">撤销</button>
            </div>
          </div>
        `).join('')}</div>` : `<div class="empty-state" style="padding:20px 0"><div class="empty-icon">🧾</div><div class="empty-title">还没有投喂记录</div></div>`}
      </div>
    `;

    document.querySelectorAll('[data-feed-meal]').forEach(el => {
      el.addEventListener('click', () => {
        const meal = el.dataset.feedMeal;
        const target = Feeding.targetsFor(today, meal).find(t => t.type === 'pair' && t.id === b.id);
        if (target) this.openFeedModal(target, meal, () => this.showPairDetail(b.id, false));
      });
    });
    const btnOv = document.getElementById('btn-pair-override');
    if (btnOv) btnOv.onclick = () => this.openOverrideModal('pair', b.id, Feeding.pairTitle(b), recipe, () => this.showPairDetail(b.id, false));
    const btnReset = document.getElementById('btn-pair-reset');
    if (btnReset) btnReset.onclick = () => {
      Utils.openModal('恢复默认配方', `<p>确定让 <b>${Feeding.pairTitle(b)}</b> 恢复使用默认配方吗？</p>`, [
        { label: '取消', style: 'btn-secondary' },
        { label: '恢复', style: 'btn-danger', onClick: () => {
          Feeding.clearOverride('pair', b.id);
          Utils.toast('已恢复默认配方');
          this.showPairDetail(b.id, false);
        }}
      ]);
    };
    document.querySelectorAll('[data-undo]').forEach(el => {
      el.addEventListener('click', () => {
        if (Feeding.undo(el.dataset.undo)) {
          Utils.toast('已撤销，库存已退回');
          this.showPairDetail(b.id, false);
        }
      });
    });
  },

  /* ============================================================
     青年鸽群详情
     ============================================================ */
  showYoungDetail(push = true) {
    if (push) App.openDetail(() => {});
    document.getElementById('nav-title').textContent = '青年鸽群';
    document.getElementById('nav-action').hidden = true;
    const group = Feeding.youngGroup();
    const today = Utils.today();
    const recipe = Feeding.recipeForYoung(today, Feeding.currentMeal());
    const scaled = Feeding.scaleRecipe(recipe, group.count);
    const curMeal = Feeding.currentMeal();
    const ov = Feeding.activeOverride('young', 'young', today, curMeal);
    const pendingOv = Feeding.pendingOverride('young', 'young', today, curMeal);
    const hasOv = Feeding.overrideList('young', 'young').length > 0;
    const todayCost = Storage.getFeedingLog()
      .filter(l => l.date === today && l.targetType === 'young')
      .reduce((s, l) => s + Number(l.cost || 0), 0);

    const mealRow = (meal) => {
      const log = Feeding.logFor(today, meal, 'young', 'young');
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid var(--ios-separator)">
          <div style="width:38px;height:38px;border-radius:10px;background:${meal === 'am' ? 'rgba(255,149,0,0.12)' : 'rgba(88,86,214,0.12)'};display:flex;align-items:center;justify-content:center;font-size:17px">${meal === 'am' ? '🌅' : '🌇'}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:14px;font-weight:600">${Feeding.MEAL_LABEL[meal]}</div>
            <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">${log ? `已投 ${log.total}g · ${Utils.fmtMoney(log.cost)}` : `计划 ${scaled.perMeal}g · 约 ${Utils.fmtMoney(scaled.cost)}`}</div>
          </div>
          <button class="btn ${log ? 'btn-secondary' : 'btn-primary'}" data-feed-meal="${meal}" style="flex:0 0 auto;height:32px;font-size:13px;padding:0 14px;border-radius:8px">${log ? '已投喂' : '投喂'}</button>
        </div>
      `;
    };

    document.getElementById('page-content').innerHTML = `
      <div class="section">
        <div class="card" style="background:linear-gradient(140deg,#f0fdf4,#ecfdf5)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:16px;font-weight:700">青年鸽群</div>
            <span class="tag tag-green">${group.count} 只</span>
          </div>
          <div style="font-size:11px;color:var(--ios-gray);margin-top:3px">幼鸽 + 育肥 + 未配对种鸽，统一按青年鸽配方</div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">每只每餐</div>
              <div style="font-size:18px;font-weight:800;color:var(--ios-green)">${recipe.perMeal}<span style="font-size:11px">g</span></div>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">全群每餐</div>
              <div style="font-size:18px;font-weight:800;color:var(--ios-orange)">${scaled.perMeal}<span style="font-size:11px">g</span></div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--ios-text2);margin-top:10px;padding-top:9px;border-top:0.5px solid rgba(0,0,0,0.07)">
            <span>玉米 <b>${scaled.ingredient.corn}g</b></span>
            <span>豌豆 <b>${scaled.ingredient.pea}g</b></span>
            <span>高粱 <b>${scaled.ingredient.sorghum}g</b></span>
          </div>
          ${ov ? `<div style="font-size:10.5px;color:var(--ios-purple);background:rgba(175,82,222,0.1);border-radius:8px;padding:6px 8px;margin-top:8px">当前单独配方：每只 ${ov.grams}g/${ov.unit === 'day' ? '天' : '餐'} · ${ov.corn}/${ov.pea}/${ov.sorghum} · ${ov.effectiveText}</div>` : ''}
          ${pendingOv ? `<div style="font-size:10.5px;color:var(--ios-orange);background:rgba(255,149,0,0.1);border-radius:8px;padding:6px 8px;margin-top:8px">待生效：每只 ${pendingOv.grams}g/${pendingOv.unit === 'day' ? '天' : '餐'} · ${pendingOv.corn}/${pendingOv.pea}/${pendingOv.sorghum} · ${pendingOv.effectiveText}</div>` : ''}
        </div>

        <div class="card" style="padding:4px 16px">
          ${mealRow('am')}
          <div>${mealRow('pm').replace('border-bottom:0.5px solid var(--ios-separator)', 'border-bottom:none')}</div>
        </div>

        <div class="card" style="padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:14px;font-weight:600">群体配方</div>
              <div style="font-size:11px;color:var(--ios-gray);margin-top:2px">调整后对整群生效</div>
            </div>
            <div style="font-size:13px;color:var(--ios-orange);font-weight:600">今日 ${Utils.fmtMoney(todayCost)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn btn-primary" id="btn-group-override" style="flex:1;height:36px;font-size:14px">调整配方</button>
            ${hasOv ? '<button class="btn btn-secondary" id="btn-group-reset" style="flex:0 0 96px;height:36px;font-size:14px">恢复默认</button>' : ''}
          </div>
        </div>

        <div class="section-header" style="padding:8px 4px">
          <h2 class="section-title" style="font-size:15px">群成员</h2>
        </div>
        <div class="list-group">
          ${group.list.map(p => `
            <div class="list-item" style="cursor:default">
              <div class="list-item-icon" style="background:rgba(52,199,89,0.12)">${p.gender === '公' ? '♂️' : p.gender === '母' ? '♀️' : '🐥'}</div>
              <div class="list-item-content">
                <div class="list-item-title">${p.code} · ${p.breed}</div>
                <div class="list-item-sub">${Utils.penName(p.penId)} · ${Utils.ageDays(p.dob)}天 · ${p.status === 'fattening' ? '育肥待出栏' : p.status === 'breeder' ? '未配对种鸽' : '青年鸽'}</div>
              </div>
              <span class="tag tag-gray">${p.weight || 0}g</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('[data-feed-meal]').forEach(el => {
      el.addEventListener('click', () => {
        const meal = el.dataset.feedMeal;
        const target = Feeding.targetsFor(today, meal).find(t => t.type === 'young');
        if (target) this.openFeedModal(target, meal, () => this.showYoungDetail(false));
      });
    });
    const b1 = document.getElementById('btn-group-override');
    if (b1) b1.onclick = () => this.openOverrideModal('young', 'young', '青年鸽群', recipe, () => this.showYoungDetail(false));
    const b2 = document.getElementById('btn-group-reset');
    if (b2) b2.onclick = () => {
      Utils.openModal('恢复默认配方', '<p>确定让青年鸽群恢复默认配方吗？</p>', [
        { label: '取消', style: 'btn-secondary' },
        { label: '恢复', style: 'btn-danger', onClick: () => {
          Feeding.clearOverride('young', 'young');
          Utils.toast('已恢复默认配方');
          this.showYoungDetail(false);
        }}
      ]);
    };
  },

  /* ============================================================
     投喂弹窗（当餐可临时调整）
     ============================================================ */
  openFeedModal(target, meal, onDone) {
    const today = Utils.today();
    const existing = Feeding.logFor(today, meal, target.type, target.id);

    if (existing) {
      const canUndo = existing.date === today;
      Utils.openModal(`${target.title} · ${Feeding.MEAL_LABEL[meal]}`, `
        <div class="card" style="margin:0;background:var(--ios-gray6);box-shadow:none">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:13px;font-weight:600">已投喂</span>
            <span class="tag tag-green">已完成</span>
          </div>
          <div style="font-size:12px;color:var(--ios-gray);margin-top:8px;line-height:1.8">
            时间：${existing.date} ${Feeding.MEAL_LABEL[existing.meal]}<br>
            总量：${existing.total}g · ${Feeding.ratioText(existing.ratio)}<br>
            玉米 ${existing.ingredient.corn}g · 豌豆 ${existing.ingredient.pea}g · 高粱 ${existing.ingredient.sorghum}g<br>
            折算：<b style="color:var(--ios-orange)">${Utils.fmtMoney(existing.cost)}</b>
          </div>
        </div>
      `, [
        { label: '关闭', style: 'btn-secondary' },
        canUndo ? { label: '撤销本次投喂', style: 'btn-danger', onClick: () => {
          Feeding.undo(existing.id);
          Utils.toast('已撤销，库存已退回');
          if (onDone) onDone(); else this.render();
        }} : null
      ].filter(Boolean));
      return;
    }

    const recipe = target.recipe;
    const count = target.count || 1;
    window.__fdLackConfirm = false;

    Utils.openModal(`投喂 · ${Feeding.MEAL_LABEL[meal]}`, `
      <div class="card" style="margin:0 0 10px;background:var(--ios-gray6);box-shadow:none">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:14px;font-weight:700">${target.title}</div>
          <span class="tag tag-green">${target.label}</span>
        </div>
        ${count > 1 ? `<div style="font-size:11px;color:var(--ios-gray);margin-top:3px">按每只计算，共 ${count} 只</div>` : ''}
      </div>
      <div class="form-group" style="margin:0 0 10px">
        <div class="form-row">
          <label class="form-label">投喂量 (g)</label>
          <input class="form-input" type="number" step="0.1" id="fd-grams" value="${recipe.grams}" />
        </div>
        <div class="form-row">
          <label class="form-label">计量方式</label>
          <select class="form-select" id="fd-unit">
            <option value="meal" ${recipe.unit === 'meal' ? 'selected' : ''}>克 / 餐</option>
            <option value="day" ${recipe.unit === 'day' ? 'selected' : ''}>克 / 天</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">玉米 %</label>
          <input class="form-input" type="number" id="fd-corn" value="${recipe.ratio.corn}" />
        </div>
        <div class="form-row">
          <label class="form-label">豌豆 %</label>
          <input class="form-input" type="number" id="fd-pea" value="${recipe.ratio.pea}" />
        </div>
        <div class="form-row">
          <label class="form-label">高粱 %</label>
          <input class="form-input" type="number" id="fd-sorghum" value="${recipe.ratio.sorghum}" />
        </div>
      </div>
      <div id="fd-preview" style="margin:0 16px;background:rgba(0,122,255,0.06);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.8;color:var(--ios-text2)"></div>
      <div id="fd-stock" style="margin:8px 16px 4px;font-size:11px;color:var(--ios-red)"></div>
      <div style="font-size:11px;color:var(--ios-gray);margin:8px 16px 4px;line-height:1.6">本次调整仅对这一次投喂生效，不会改变这对鸽子的长期配方。</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认投喂', style: 'btn-primary', keepOpen: true, onClick: () => {
        const grams = Number(document.getElementById('fd-grams').value);
        const unit = document.getElementById('fd-unit').value;
        const corn = Number(document.getElementById('fd-corn').value);
        const pea = Number(document.getElementById('fd-pea').value);
        const sorghum = Number(document.getElementById('fd-sorghum').value);
        if (!grams || grams <= 0) { Utils.toast('请输入投喂量'); return; }
        if (corn + pea + sorghum !== 100) { Utils.toast('三种比例合计需为 100%'); return; }
        const custom = { grams, unit, corn, pea, sorghum };
        const lack = Feeding.stockCheck(Feeding.scaleRecipe(Feeding.buildRecipe(custom, target.label), count).ingredient);
        if (lack.length) {
          const names = lack.map(l => `${l.name}缺${Feeding.r1((l.need - l.qty) * 1000)}g`).join('、');
          if (!window.__fdLackConfirm) {
            window.__fdLackConfirm = true;
            const el = document.getElementById('fd-stock');
            if (el) el.innerHTML = `⚠️ 库存不足：${names}。再点一次「确认投喂」将允许库存为负。`;
            return;
          }
          window.__fdLackConfirm = false;
        }
        Feeding.feed(target, today, meal, custom);
        Utils.closeModal();
        Utils.toast(`✓ 已投喂 ${Feeding.r1((unit === 'day' ? grams / 2 : grams) * count)}g`);
        if (onDone) onDone(); else this.render();
      }}
    ]);

    this._bindPreview('fd', 'fd-preview', null, count);
  },

  /* ============================================================
     配方详情 / 编辑
     ============================================================ */
  showRecipeDetail(key, push = true) {
    if (push) App.openDetail(() => {});
    this._renderRecipeDetail(key);
  },

  _recipeSource(key) {
    const cfg = Feeding.cfg();
    const [type, id] = key.split(':');
    if (type === 'base') return { cfg, type, id, src: cfg.base[id], isDefault: Feeding.DEFAULT_BASE[id] };
    return { cfg, type, id, src: cfg.chick.find(x => x.id === id), isDefault: Feeding.DEFAULT_CHICK.find(x => x.id === id) };
  },

  _renderRecipeDetail(key) {
    const info = this._recipeSource(key);
    if (!info.src) return;
    const r = Feeding.buildRecipe(info.src, info.src.label);
    document.getElementById('nav-title').textContent = info.src.label;
    document.getElementById('nav-action').hidden = true;

    document.getElementById('page-content').innerHTML = `
      <div class="section">
        <div class="card" style="background:linear-gradient(140deg,#fff7ed,#fef3c7);margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:16px;font-weight:700">${info.src.label}</div>
            <span class="tag tag-orange">${info.type === 'base' ? (info.id === 'young' ? '青年鸽' : '种鸽') : '带仔'}</span>
          </div>
          <div style="display:flex;gap:8px;margin-top:12px">
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">投喂量</div>
              <div style="font-size:18px;font-weight:800;color:var(--ios-orange)">${r.grams}<span style="font-size:11px">g</span><span style="font-size:10px;font-weight:400;color:var(--ios-gray)">/${r.unit === 'day' ? '天' : '餐'}</span></div>
            </div>
            <div style="flex:1;background:rgba(255,255,255,0.75);border-radius:10px;padding:8px;text-align:center">
              <div style="font-size:10px;color:var(--ios-gray3)">每餐成本</div>
              <div style="font-size:18px;font-weight:800;color:var(--ios-blue)">${Utils.fmtMoney(r.cost)}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--ios-text2);margin-top:10px;padding-top:9px;border-top:0.5px solid rgba(0,0,0,0.07)">
            <span>玉米 <b>${r.ingredient.corn}g</b></span>
            <span>豌豆 <b>${r.ingredient.pea}g</b></span>
            <span>高粱 <b>${r.ingredient.sorghum}g</b></span>
            <span style="color:var(--ios-gray)">${Feeding.ratioText(r.ratio)}</span>
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <div class="form-row">
            <label class="form-label">投喂量 (g)</label>
            <input class="form-input" type="number" step="0.1" id="rc-grams" value="${info.src.grams}" />
          </div>
          <div class="form-row">
            <label class="form-label">计量方式</label>
            <select class="form-select" id="rc-unit">
              <option value="meal" ${info.src.unit === 'meal' ? 'selected' : ''}>克 / 餐</option>
              <option value="day" ${info.src.unit === 'day' ? 'selected' : ''}>克 / 天</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">玉米 %</label>
            <input class="form-input" type="number" id="rc-corn" value="${info.src.corn}" />
          </div>
          <div class="form-row">
            <label class="form-label">豌豆 %</label>
            <input class="form-input" type="number" id="rc-pea" value="${info.src.pea}" />
          </div>
          <div class="form-row">
            <label class="form-label">高粱 %</label>
            <input class="form-input" type="number" id="rc-sorghum" value="${info.src.sorghum}" />
          </div>
        </div>

        <div id="rc-preview" style="margin:12px 0 0;background:rgba(0,122,255,0.06);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.8;color:var(--ios-text2)"></div>

        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-primary" id="rc-save" style="flex:1">保存配方</button>
          <button class="btn btn-secondary" id="rc-reset" style="flex:0 0 100px">恢复默认</button>
        </div>
        <div style="font-size:11px;color:var(--ios-gray);padding:12px 4px;line-height:1.7">
          保存后，所有处于「${info.src.label}」状态的鸽子立即按新配方计算；已经投喂过的记录不受影响。
          ${info.type === 'chick' ? '<br>带仔配方按「整窝每天」计量，系统会自动分成早晚两餐。' : ''}
        </div>
      </div>
    `;

    this._bindPreview('rc', 'rc-preview', null, 1);

    document.getElementById('rc-save').onclick = () => {
      const data = {
        grams: Number(document.getElementById('rc-grams').value),
        unit: document.getElementById('rc-unit').value,
        corn: Number(document.getElementById('rc-corn').value),
        pea: Number(document.getElementById('rc-pea').value),
        sorghum: Number(document.getElementById('rc-sorghum').value)
      };
      if (!data.grams || data.grams <= 0) { Utils.toast('请输入投喂量'); return; }
      if (data.corn + data.pea + data.sorghum !== 100) { Utils.toast('三种比例合计需为 100%'); return; }

      const cfg = Feeding.cfg();
      if (info.type === 'base') Object.assign(cfg.base[info.id], data);
      else {
        const st = cfg.chick.find(x => x.id === info.id);
        Object.assign(st, data);
      }
      Feeding.saveCfg(cfg);
      Utils.toast('✓ 配方已保存');
      App.goBack();
    };

    document.getElementById('rc-reset').onclick = () => {
      const d = info.isDefault;
      if (!d) return;
      document.getElementById('rc-grams').value = d.grams;
      document.getElementById('rc-unit').value = d.unit;
      document.getElementById('rc-corn').value = d.corn;
      document.getElementById('rc-pea').value = d.pea;
      document.getElementById('rc-sorghum').value = d.sorghum;
      this._refreshPreview('rc', 'rc-preview', 1);
      Utils.toast('已填入默认值，点保存生效');
    };
  },

  /* ============================================================
     单独调整（含生效时机）
     ============================================================ */
  openOverrideModal(type, id, title, currentRecipe, onDone) {
    const today = Utils.today();
    const nowMeal = Feeding.currentMeal();
    const active = Feeding.activeOverride(type, id, today, nowMeal);
    const ov = active || {
      grams: currentRecipe.grams,
      unit: currentRecipe.unit,
      corn: currentRecipe.ratio.corn,
      pea: currentRecipe.ratio.pea,
      sorghum: currentRecipe.ratio.sorghum
    };
    const cur = ov;
    const hour = new Date().getHours();
    const defaultEff = hour < 11 ? 'am' : hour < 18 ? 'pm' : 'next';
    let eff = active ? (active.effective || defaultEff) : defaultEff;

    Utils.openModal('单独调整配方', `
      <div style="margin:0 16px 10px;background:var(--ios-gray6);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--ios-text2)">
        调整对象：<b>${title}</b>
      </div>
      <div class="form-group" style="margin:0 0 10px">
        <div class="form-row">
          <label class="form-label">投喂量 (g)</label>
          <input class="form-input" type="number" step="0.1" id="ov-grams" value="${cur.grams}" />
        </div>
        <div class="form-row">
          <label class="form-label">计量方式</label>
          <select class="form-select" id="ov-unit">
            <option value="meal" ${cur.unit === 'meal' ? 'selected' : ''}>克 / 餐</option>
            <option value="day" ${cur.unit === 'day' ? 'selected' : ''}>克 / 天</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">玉米 %</label>
          <input class="form-input" type="number" id="ov-corn" value="${cur.corn}" />
        </div>
        <div class="form-row">
          <label class="form-label">豌豆 %</label>
          <input class="form-input" type="number" id="ov-pea" value="${cur.pea}" />
        </div>
        <div class="form-row">
          <label class="form-label">高粱 %</label>
          <input class="form-input" type="number" id="ov-sorghum" value="${cur.sorghum}" />
        </div>
      </div>

      <div style="margin:0 16px 6px;font-size:13px;font-weight:600;color:var(--ios-text2)">生效时机</div>
      <div id="ov-eff" style="display:flex;gap:6px;margin:0 16px 6px;background:var(--ios-gray6);border-radius:10px;padding:4px">
        ${[['am', '早上'], ['pm', '中午'], ['next', '晚上']].map(([v, t]) => `
          <button data-eff="${v}" style="flex:1;height:34px;border:none;border-radius:8px;font-size:13px;font-weight:600;background:${eff === v ? '#fff' : 'transparent'};color:${eff === v ? 'var(--ios-blue)' : 'var(--ios-gray)'};box-shadow:${eff === v ? '0 1px 3px rgba(0,0,0,0.12)' : 'none'}">${t}</button>
        `).join('')}
      </div>
      <div id="ov-eff-text" style="margin:0 16px 8px;font-size:11px;color:var(--ios-gray);line-height:1.6"></div>

      <div id="ov-preview" style="margin:0 16px;background:rgba(0,122,255,0.06);border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.8;color:var(--ios-text2)"></div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存调整', style: 'btn-primary', keepOpen: true, onClick: () => {
        const grams = Number(document.getElementById('ov-grams').value);
        const unit = document.getElementById('ov-unit').value;
        const corn = Number(document.getElementById('ov-corn').value);
        const pea = Number(document.getElementById('ov-pea').value);
        const sorghum = Number(document.getElementById('ov-sorghum').value);
        if (!grams || grams <= 0) { Utils.toast('请输入投喂量'); return; }
        if (corn + pea + sorghum !== 100) { Utils.toast('三种比例合计需为 100%'); return; }

        Feeding.saveOverride(type, id, {
          grams, unit, corn, pea, sorghum,
          effective: eff,
          effectiveKey: Feeding.effectiveKey(eff),
          effectiveText: Feeding.effectiveText(eff),
          updatedAt: new Date().toISOString()
        });
        Utils.closeModal();
        Utils.toast('✓ 已保存，' + Feeding.effectiveText(eff));
        if (onDone) onDone(); else this.render();
      }}
    ]);

    const effText = () => { document.getElementById('ov-eff-text').textContent = Feeding.effectiveText(eff); };
    effText();
    document.querySelectorAll('#ov-eff [data-eff]').forEach(btn => {
      btn.onclick = () => {
        eff = btn.dataset.eff;
        document.querySelectorAll('#ov-eff [data-eff]').forEach(b => {
          const on = b.dataset.eff === eff;
          b.style.background = on ? '#fff' : 'transparent';
          b.style.color = on ? 'var(--ios-blue)' : 'var(--ios-gray)';
          b.style.boxShadow = on ? '0 1px 3px rgba(0,0,0,0.12)' : 'none';
        });
        effText();
      };
    });
    this._bindPreview('ov', 'ov-preview', null, 1);
  },

  /* ============================================================
     输入预览
     ============================================================ */
  _bindPreview(prefix, previewId, extra, count) {
    const update = () => this._refreshPreview(prefix, previewId, count);
    ['grams', 'unit', 'corn', 'pea', 'sorghum'].forEach(k => {
      const el = document.getElementById(prefix + '-' + k);
      if (!el) return;
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });
    update();
  },

  _refreshPreview(prefix, previewId, count) {
    const val = k => {
      const el = document.getElementById(prefix + '-' + k);
      return el ? el.value : '';
    };
    const box = document.getElementById(previewId);
    if (!box) return;
    const grams = Number(val('grams')) || 0;
    const unit = val('unit') || 'meal';
    const corn = Number(val('corn')) || 0;
    const pea = Number(val('pea')) || 0;
    const sorghum = Number(val('sorghum')) || 0;
    const sum = corn + pea + sorghum;
    const r = Feeding.buildRecipe({ grams, unit, corn, pea, sorghum }, '');
    const s = Feeding.scaleRecipe(r, count || 1);
    const ratioWarn = sum !== 100
      ? `<span style="color:var(--ios-red);font-weight:600">合计 ${sum}%，需等于 100%</span>`
      : `<span style="color:var(--ios-green)">配比正常</span>`;
    box.innerHTML = `
      玉米 <b>${s.ingredient.corn}g</b> · 豌豆 <b>${s.ingredient.pea}g</b> · 高粱 <b>${s.ingredient.sorghum}g</b><br>
      每餐合计 <b>${s.perMeal}g</b> · 折合 <b style="color:var(--ios-orange)">${Utils.fmtMoney(s.cost)}</b>${count > 1 ? `（${count}只）` : ''}<br>
      ${ratioWarn}
    `;
  }
};
