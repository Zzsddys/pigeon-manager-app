/**
 * 繁殖配对 / 孵化追踪 / 出栏
 * 流程：配对 → 下蛋 → 孵化 → 出壳 → 育雏 → 出栏
 */
const BreedPage = {
  render() {
    document.getElementById('nav-title').textContent = '繁殖';
    const action = document.getElementById('nav-action');
    action.hidden = false;
    action.textContent = '配对';
    action.onclick = () => this.openPairForm();
    document.getElementById('nav-back').hidden = true;

    const breeds = Storage.getBreeds();
    const pigeons = Storage.getPigeons();
    const content = document.getElementById('page-content');

    const stages = [
      { key: 'paired',   label: '已配对', color: 'tag-blue' },
      { key: 'hatching', label: '孵化中', color: 'tag-orange' },
      { key: 'fledged',  label: '已出雏', color: 'tag-green' },
      { key: 'fattening',label: '育肥中', color: 'tag-purple' },
      { key: 'sold',     label: '已出栏', color: 'tag-gray' },
      { key: 'failed',   label: '失败',   color: 'tag-red' }
    ];

    content.innerHTML = `
      <div class="section">
        <div class="section-subtitle">配对、产蛋、孵化、出栏全流程追踪</div>
        ${breeds.length === 0 ? this._empty() : this._listHTML(breeds)}
      </div>
      <div style="height: 40px"></div>
      <button class="fab" id="fab-pair">+</button>
    `;

    document.getElementById('fab-pair').onclick = () => this.openPairForm();

    // 点列表项 → 详情
    document.querySelectorAll('[data-breed-id]').forEach(el => {
      el.addEventListener('click', () => this.showDetail(el.dataset.breedId));
    });
  },

  _empty() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🥚</div>
        <div class="empty-title">还没有配对记录</div>
        <div class="empty-desc">点右上角「配对」开始繁殖</div>
      </div>
    `;
  },

  _listHTML(breeds) {
    const statusMap = {
      paired:    { t:'已配对',   cls:'tag-blue' },
      hatching:  { t:'孵化中',   cls:'tag-orange' },
      fledged:   { t:'已出雏',   cls:'tag-green' },
      fattening: { t:'育肥中',   cls:'tag-purple' },
      sold:      { t:'已出栏',   cls:'tag-gray' },
      failed:    { t:'失败',     cls:'tag-red' }
    };

    // 按状态分组显示
    return breeds.map(b => {
      const m = Utils.pigeonById(b.maleId);
      const f = Utils.pigeonById(b.femaleId);
      const s = statusMap[b.status] || { t:b.status, cls:'tag-gray' };

      // 计算进度
      let progressText = '';
      let progressPct = 0;
      if (b.status === 'paired') {
        progressText = `已配对 · 等待下蛋`;
        progressPct = 15;
      } else if (b.status === 'hatching') {
        const days = Utils.daysBetween(b.layDate, Utils.today());
        progressText = `孵化第 ${days} 天 / 18 天`;
        progressPct = Math.min(Math.round(days / 18 * 100), 95);
      } else if (b.status === 'fledged') {
        const days = Utils.daysBetween(b.hatchDate, Utils.today());
        progressText = `育雏第 ${days} 天 / 28 天`;
        progressPct = Math.min(30 + Math.round(days / 28 * 70), 98);
      } else if (b.status === 'fattening') {
        progressText = '育肥中';
        progressPct = 99;
      } else if (b.status === 'sold') {
        progressText = '✓ 已出栏';
        progressPct = 100;
      } else {
        progressText = '✗ 失败';
      }

      return `
        <div class="card" data-breed-id="${b.id}" style="cursor:pointer">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:15px;font-weight:600">
                <span style="color:var(--ios-blue)">♂ ${m?.code||'?'}</span>
                <span style="color:var(--ios-gray3);margin:0 6px">×</span>
                <span style="color:var(--ios-orange)">♀ ${f?.code||'?'}</span>
              </div>
              <div style="font-size:12px;color:var(--ios-gray);margin-top:2px">
                ${Utils.penName(b.penId)} · 配对 ${b.pairDate}
              </div>
            </div>
            <span class="tag ${s.cls}">${s.t}</span>
          </div>
          ${progressText ? `
            <div style="margin-top:10px">
              <div style="font-size:12px;color:var(--ios-gray3)">${progressText}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width:${progressPct}%;background:${b.status==='failed'?'var(--ios-red)':'var(--ios-blue)'}"></div>
              </div>
            </div>
          ` : ''}
          ${b.hatchCount > 0 ? `<div style="margin-top:8px;font-size:13px;color:var(--ios-text2)">🥚 ${b.hatchCount} 枚蛋 · 存活 ${b.surviveCount}/${b.hatchCount}</div>` : ''}
        </div>
      `;
    }).join('');
  },

  // ========== 详情 ==========
  showDetail(id) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;
    const m = Utils.pigeonById(b.maleId);
    const f = Utils.pigeonById(b.femaleId);

    document.getElementById('nav-title').textContent = `${m?.code||'?'} × ${f?.code||'?'}`;
    document.getElementById('nav-action').hidden = true;
    App.openDetail(() => {});

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section">
        <div class="card" style="text-align:center">
          <div style="display:flex;justify-content:center;align-items:center;gap:16px">
            <div style="font-size:48px">♂️</div>
            <div style="font-size:24px;color:var(--ios-gray3)">×</div>
            <div style="font-size:48px">♀️</div>
          </div>
          <div style="display:flex;justify-content:center;gap:16px;margin-top:8px">
            <div><div style="font-weight:600">${m?.code||'?'}</div><div style="font-size:12px;color:var(--ios-gray)">${m?.breed||''}</div></div>
            <div><div style="font-weight:600">${f?.code||'?'}</div><div style="font-size:12px;color:var(--ios-gray)">${f?.breed||''}</div></div>
          </div>
        </div>

        <div class="list-group">
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">鸽舍</div></div><div class="list-item-value">${Utils.penName(b.penId)}</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">配对日期</div></div><div class="list-item-value">${b.pairDate||'-'}</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">下蛋日期</div></div><div class="list-item-value">${b.layDate||'-'}</div></div>
          ${b.status === 'hatching' ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">已下蛋数</div></div><div class="list-item-value">${b.eggCount != null ? b.eggCount : b.hatchCount} 枚</div></div>` : ''}
          ${b.candledDate ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">照蛋结果</div></div><div class="list-item-value">${b.fertileCount} 枚受精 · ${b.candledDate}</div></div>` : ''}
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">出壳日期</div></div><div class="list-item-value">${b.hatchDate||'-'}</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">出雏数</div></div><div class="list-item-value">${b.hatchCount} 只</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">存活数</div></div><div class="list-item-value">${b.surviveCount} 只</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">备注</div></div><div class="list-item-value" style="color:var(--ios-gray3);text-align:right;max-width:50%">${b.notes||'无'}</div></div>
        </div>

        <div style="padding: 12px 16px; display:flex; gap:10px; flex-wrap:wrap">
          ${this._nextActionButtons(b)}
          <button class="btn btn-secondary" id="btn-pair-archive" style="flex:1;min-width:120px">📖 完整档案</button>
        </div>
      </div>
    `;

    document.getElementById('btn-pair-archive').onclick = () => HomePage.showPairArchive(b.id);

    if (typeof Notify !== 'undefined') Notify.refresh();
  },

  _nextActionButtons(b) {
    const actions = [];
    if (b.status === 'paired') {
      actions.push({ label: '📝 登记下蛋', fn: () => this.advanceToLay(b.id) });
    }
    if (b.status === 'paired' || b.status === 'hatching') {
      actions.push({ label: '🐣 登记出壳', fn: () => this.advanceToHatch(b.id) });
    }
    if (b.status === 'hatching' && Number(b.eggCount != null ? b.eggCount : b.hatchCount) === 1) {
      actions.push({ label: '🥚 补记第2个蛋', fn: () => this.markSecondEgg(b.id) });
    }
    if (b.status === 'hatching' && !b.candledDate) {
      actions.push({ label: '🔦 照蛋', fn: () => this.openCandle(b.id) });
    }
    if (b.status === 'hatching' && Number(b.eggCount != null ? b.eggCount : b.hatchCount) > 0) {
      actions.push({ label: '🚫 孵化作废', style: 'btn-danger-outline', fn: () => this.abortHatch(b.id) });
      actions.push({ label: '💥 啄蛋', style: 'btn-danger-outline', fn: () => this.peckEgg(b.id) });
    }
    if (b.status === 'hatching' || b.status === 'fledged') {
      actions.push({ label: '🐥 登记出雏数', fn: () => this.editSurviveCount(b.id) });
    }
    if (b.status === 'fledged') {
      actions.push({ label: '📤 出售 / 留种 / 待定', fn: () => this.resolveSell(b.id) });
    }
    if (b.status === 'fledged' || b.status === 'weaned') {
      actions.push({ label: '🥚 记下一窝下蛋', fn: () => this.openNextLay(b.id) });
    }
    if (b.status !== 'sold' && b.status !== 'failed') {
      actions.push({ label: '✗ 标记失败', style:'btn-danger-outline', fn: () => this.markFailed(b.id) });
    }
    window._breedDetailActions = actions;
    return actions.map(a =>
      `<button class="btn ${a.style||'btn-secondary'}" style="flex:1;min-width:120px" data-act="${actions.indexOf(a)}">${a.label}</button>`
    ).join('');
  },

  // ========== 配对表单 ==========
  openPairForm() {
    const pigeons = Storage.getPigeons();
    const males = pigeons.filter(p => p.gender === '公' && p.status === 'breeder' && !p.archived);
    const females = pigeons.filter(p => p.gender === '母' && p.status === 'breeder' && !p.archived);
    const pens = Storage.getPens();

    Utils.openModal('新配对', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">♂ 公鸽</label>
          <select class="form-select" id="f-male">
            <option value="">请选择…</option>
            ${males.map(p => `<option value="${p.id}">${p.code} · ${p.breed}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">♀ 母鸽</label>
          <select class="form-select" id="f-female">
            <option value="">请选择…</option>
            ${females.map(p => `<option value="${p.id}">${p.code} · ${p.breed}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">鸽舍</label>
          <select class="form-select" id="f-pen">
            ${pens.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">笼号</label>
          <input class="form-input" id="f-cage" placeholder="如 12（几号笼，选填）" />
        </div>
        <div class="form-row">
          <label class="form-label">配对日期</label>
          <input class="form-input" type="date" id="f-pairDate" value="${Utils.today()}" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确定配对', style: 'btn-primary', keepOpen: true, onClick: () => {
        const maleId = document.getElementById('f-male').value;
        const femaleId = document.getElementById('f-female').value;
        if (!maleId || !femaleId) { Utils.toast('请选择公鸽和母鸽'); return; }

        const mP = Utils.pigeonById(maleId);
        const fP = Utils.pigeonById(femaleId);
        if (!mP || !fP) { Utils.toast('鸽子不存在'); return; }
        if (mP.gender === '未知' || fP.gender === '未知') { Utils.toast('性别待定的鸽子不能配对，请先定公/定母'); return; }
        if (mP.family && fP.family && mP.family === fP.family) {
          Utils.toast(`同家号 ${mP.family} 不能配对（同一父系）`);
          return;
        }

        const chk = Utils.inbreedingCheck(maleId, femaleId, 4);
        if (chk.related) {
          const common = Utils.pigeonById(chk.commonId);
          Utils.toast(`近亲禁止配对：4 代内有共同祖先 ${common ? common.code : '?'}`);
          return;
        }

        const list = Storage.getBreeds();
        list.push({
          id: Utils.uid('b'),
          maleId, femaleId,
          penId: document.getElementById('f-pen').value,
          cageNo: document.getElementById('f-cage').value.trim(),
          pairDate: document.getElementById('f-pairDate').value,
          layDate: null, hatchDate: null, fledgeDate: null,
          hatchCount: 2, surviveCount: 0,
          status: 'paired',
          pigeonIds: [],
          notes: ''
        });
        Storage.setBreeds(list);
        Utils.closeModal();
        Utils.toast('配对已创建（4 代内无近亲）');
        App.switchTab('breed');
      }}
    ]);
  },

  // ========== 状态推进 ==========
  advanceToLay(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    Utils.openModal('登记下蛋', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">下蛋日期</label>
          <input class="form-input" type="date" id="lay-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">蛋数</label>
          <input class="form-input" type="number" id="lay-count" value="2" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        b.layDate = document.getElementById('lay-date').value;
        b.hatchCount = Number(document.getElementById('lay-count').value) || 2;
        b.eggCount = b.hatchCount;
        b.secondEggDate = b.eggCount >= 2 ? b.layDate : null;
        b.status = 'hatching';
        Storage.setBreeds(breeds);
        Utils.toast('已登记下蛋，开始孵化');
        this.showDetail(id);
      }}
    ]);
  },

  markSecondEgg(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    Utils.openModal('补记第2个蛋', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">第2个蛋日期</label>
          <input class="form-input" type="date" id="second-egg-date" value="${Utils.today()}" />
        </div>
      </div>
      <div style="font-size:12px;color:var(--ios-gray);line-height:1.7">记录后该对种鸽的投喂配比从「45/35/20」恢复为「70/15/15」。</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认', style: 'btn-primary', onClick: () => {
        b.eggCount = 2;
        b.secondEggDate = document.getElementById('second-egg-date').value;
        b.hatchCount = Math.max(2, Number(b.hatchCount) || 0);
        Storage.setBreeds(breeds);
        Utils.toast('已记录第2个蛋，投喂恢复 70/15/15');
        this.showDetail(id);
      }}
    ]);
  },

  // ========== 照蛋（下完第 2 个蛋后第 5 天） ==========
  openCandle(id) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;
    const total = Number(b.eggCount != null ? b.eggCount : b.hatchCount) || 2;

    Utils.openModal('🔦 照蛋 · ' + Feeding.pairTitle(b), `
      <div style="font-size:13px;color:var(--ios-gray);line-height:1.7;margin-bottom:12px">
        本窝共 ${total} 枚蛋。未受精的蛋可入库（能卖）或算繁殖损失；全部无受精则这窝回到空怀。
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" data-candle="all">🥚 全部受精（${total} 枚继续孵化）</button>
        ${total > 1 ? `<button class="btn btn-secondary" data-candle="one">🥚 一枚受精（${total - 1} 枚入库）</button>` : ''}
        <button class="btn btn-secondary" data-candle="none">✗ 无受精（${total} 枚 · 选入库或算损失）</button>
      </div>
    `, [{ label: '取消', style: 'btn-secondary' }]);

    document.querySelectorAll('[data-candle]').forEach(el => {
      el.onclick = () => {
        const r = el.dataset.candle;
        if (r === 'none') { this._candleNoneChoice(id, total); return; }
        this._applyCandle(id, r === 'all' ? total : total - 1, false);
      };
    });
  },

  /** 无受精后的处理选择：入库（能卖）或算繁殖损失 */
  _candleNoneChoice(id, total) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;
    const lossAmount = Utils.pairCost(b);

    Utils.openModal('无受精蛋处理', `
      <div style="font-size:13px;color:var(--ios-gray);line-height:1.7;margin-bottom:12px">
        ${total} 枚蛋无受精。这窝将回到空怀。<br>
        算损失金额：已投入吃用 <b style="color:var(--ios-red)">${Utils.fmtMoney(lossAmount)}</b>（公母各分摊一半计入硬性成本）
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-secondary" id="cnd-stock">📦 入库（${total} 枚可卖，不算损失）</button>
        <button class="btn btn-danger" id="cnd-loss">✗ 算繁殖损失（${Utils.fmtMoney(lossAmount)}）</button>
      </div>
    `, [{ label: '取消', style: 'btn-secondary' }]);

    document.getElementById('cnd-stock').onclick = () => this._applyCandle(id, 0, false);
    document.getElementById('cnd-loss').onclick = () => this._applyCandle(id, 0, true);
  },

  _applyCandle(id, fertile, lossMode) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    if (!b) return;
    const total = Number(b.eggCount != null ? b.eggCount : b.hatchCount) || 2;
    const infertile = Math.max(0, total - fertile);

    b.candledDate = Utils.today();
    b.candledResult = fertile === total ? 'all' : fertile === 0 ? 'none' : 'partial';
    b.fertileCount = fertile;

    if (infertile > 0 && !lossMode) {
      const egg = Storage.getEggStock();
      egg.qty = Number(egg.qty || 0) + infertile;
      egg.logs = egg.logs || [];
      egg.logs.push({
        date: Utils.today(),
        count: infertile,
        breedId: id,
        source: 'candling',
        note: '照蛋未受精'
      });
      Storage.setEggStock(egg);
    }

    if (fertile === 0) {
      // 全部无受精 → 这窝回到空怀，重新配对
      b.eggCount = 0;
      b.layDate = null;
      b.secondEggDate = null;
      b.hatchCount = 0;
      b.surviveCount = 0;
      b.status = 'paired';
      if (lossMode) {
        this._recordBreedLoss(b, '无受精算损失');
        b.notes = [b.notes, `照蛋无受精，${total} 枚蛋算繁殖损失 ${Utils.fmtMoney(Utils.pairLossTotal(b))}`].filter(Boolean).join('；');
      } else {
        b.notes = [b.notes, `照蛋无受精，${total} 枚蛋已入库`].filter(Boolean).join('；');
      }
    }

    Storage.setBreeds(breeds);
    Utils.closeModal();

    if (fertile === 0) {
      Utils.toast(lossMode
        ? `无受精 · 算繁殖损失 ${Utils.fmtMoney(Utils.pairLossTotal(b))}，这窝回到空怀`
        : `无受精 · ${total} 枚蛋已入库，这窝回到空怀`);
    } else {
      Utils.toast(`照蛋完成 · ${fertile} 枚受精${infertile > 0 && !lossMode ? `，${infertile} 枚已入库` : ''}`);
    }

    this.showDetail(id);
  },

  /** 记一笔繁殖损失（已投入吃用，公母各分摊一半） */
  _recordBreedLoss(b, reason) {
    b.losses = b.losses || [];
    b.losses.push({
      id: Utils.uid('loss'),
      date: Utils.today(),
      amount: Utils.pairCost(b),
      reason
    });
  },

  /** 孵化作废 / 啄蛋：蛋不要了，算繁殖损失并清掉产蛋 */
  _abortEggs(id, reason, title) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    if (!b) return;
    const total = Number(b.eggCount != null ? b.eggCount : b.hatchCount) || 2;
    const lossAmount = Utils.pairCost(b);

    Utils.openModal(`${title} · ${Feeding.pairTitle(b)}`, `
      <div style="font-size:13px;color:var(--ios-gray);line-height:1.8;margin-bottom:12px">
        ${total} 枚蛋按<b>${reason}</b>处理：清掉产蛋、这窝回到空怀。<br>
        算繁殖损失：<b style="color:var(--ios-red)">${Utils.fmtMoney(lossAmount)}</b>
        （已投入吃用，公母各分摊 ${Utils.fmtMoney(lossAmount / 2)} 计入硬性成本）
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: `确认${title}`, style: 'btn-danger', onClick: () => {
        this._recordBreedLoss(b, reason);
        b.eggCount = 0;
        b.layDate = null;
        b.secondEggDate = null;
        b.hatchCount = 0;
        b.surviveCount = 0;
        b.status = 'paired';
        b.notes = [b.notes, `${reason}，损失 ${Utils.fmtMoney(Utils.pairLossTotal(b))}`].filter(Boolean).join('；');
        Storage.setBreeds(breeds);
        Utils.closeModal();
        Utils.toast(`${title}完成 · 损失 ${Utils.fmtMoney(Utils.pairLossTotal(b))}`);
        if (typeof Notify !== 'undefined') Notify.refresh();
        this.showDetail(id);
      }}
    ]);
  },

  abortHatch(id) { this._abortEggs(id, '孵化作废', '孵化作废'); },
  peckEgg(id)    { this._abortEggs(id, '啄蛋', '啄蛋'); },

  advanceToHatch(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    Utils.openModal('登记出壳', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">出壳日期</label>
          <input class="form-input" type="date" id="hatch-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">存活数</label>
          <input class="form-input" type="number" id="survive" value="${b.hatchCount}" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        b.hatchDate = document.getElementById('hatch-date').value;
        b.surviveCount = Number(document.getElementById('survive').value) || 0;
        b.status = 'fledged';
        Storage.setBreeds(breeds);
        Utils.toast('已登记出壳');
        this.showDetail(id);
      }}
    ]);
  },

  editSurviveCount(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    Utils.openModal('调整出雏数', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">总蛋数</label>
          <input class="form-input" type="number" id="hc" value="${b.hatchCount}" />
        </div>
        <div class="form-row">
          <label class="form-label">存活数</label>
          <input class="form-input" type="number" id="sc" value="${b.surviveCount}" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '保存', style: 'btn-primary', onClick: () => {
        b.hatchCount = Number(document.getElementById('hc').value) || 0;
        b.surviveCount = Number(document.getElementById('sc').value) || 0;
        Storage.setBreeds(breeds);
        Utils.toast('已保存');
        this.showDetail(id);
      }}
    ]);
  },

  /** 出栏待办：出售 / 留种 / 待定 三选 */
  resolveSell(id) {
    const b = Storage.getBreeds().find(x => x.id === id);
    if (!b) return;
    const m = Utils.pigeonById(b.maleId);
    const f = Utils.pigeonById(b.femaleId);
    const cnt = b.surviveCount || b.hatchCount || 0;
    const days = b.hatchDate ? Utils.daysBetween(b.hatchDate, Utils.today()) : 0;

    const opt = (icon, title, sub, act) => `
      <button class="sell-opt" data-act="${act}" style="width:100%;display:flex;align-items:center;gap:12px;background:#fff;border:0;border-bottom:0.5px solid var(--ios-separator);padding:14px 16px;text-align:left;cursor:pointer">
        <span style="font-size:20px;width:26px;text-align:center">${icon}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:15px;font-weight:600">${title}</span>
          <span style="display:block;font-size:11px;color:var(--ios-gray3);margin-top:2px">${sub}</span>
        </span>
        <span style="color:var(--ios-gray3)">›</span>
      </button>`;

    Utils.openModal('可出栏处理', `
      <div style="font-size:12px;color:var(--ios-gray3);margin-bottom:10px">
        ${m?.code || '?'} ♂ × ${f?.code || '?'} ♀ · 带仔 ${days} 天 · 共 ${cnt} 只
      </div>
      <div style="border-radius:12px;overflow:hidden;border:0.5px solid var(--ios-separator)">
        ${opt('📤', '出售', '写销售记录，直接入账', 'sell')}
        ${opt('🏷', '留种', '转为青年鸽，必须上脚环编号', 'keep')}
        ${opt('🕐', '待定', '转为青年鸽，编号必填，公母可后改', 'pending')}
      </div>
    `, [{ label: '取消', style: 'btn-secondary' }]);

    document.querySelectorAll('.sell-opt').forEach(btn => {
      btn.onclick = () => {
        const act = btn.dataset.act;
        if (act === 'sell') { Utils.closeModal(); this.advanceToSold(id); }
        else { this.toYoung(id, act); }
      };
    });
  },

  /** 留种 / 待定：转为青年鸽并上脚环编号 */
  toYoung(id, mode) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    if (!b) return;
    const m = Utils.pigeonById(b.maleId);
    const cnt = Math.max(b.surviveCount || b.hatchCount || 0, 1);
    const rs = Storage.getRingStock();

    const rows = Array.from({ length: cnt }).map((_, i) => `
      <div class="form-row">
        <label class="form-label">${i + 1}号编号 *</label>
        <input class="form-input" id="ty-code-${i}" placeholder="脚环编号（不可重复）" />
      </div>
      <div class="form-row">
        <label class="form-label">性别</label>
        <select class="form-select" id="ty-gender-${i}">
          <option value="未知">待定</option>
          <option value="公">公</option>
          <option value="母">母</option>
        </select>
      </div>`).join('');

    // 出栏转留种/待定必须上脚环：库存不够直接拦下
    if ((Number(rs.qty) || 0) < cnt) {
      Utils.toast(`脚环库存不足（剩 ${rs.qty} 个，本次需要 ${cnt} 个），请先到库存页入库脚环`);
      return;
    }

    Utils.openModal(mode === 'keep' ? '留种 · 上脚环' : '待定 · 上脚环', `
      <div style="font-size:12px;color:var(--ios-gray3);margin-bottom:8px">
        共 ${cnt} 只 · 脚环库存 ${rs.qty} 个 · 编号不能重复
      </div>
      <div class="form-group">${rows}</div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认转青年鸽', style: 'btn-primary', keepOpen: true, onClick: () => {
        const codes = [];
        const genders = [];
        for (let i = 0; i < cnt; i++) {
          const c = document.getElementById(`ty-code-${i}`).value.trim();
          if (!c) { Utils.toast(`请填写第 ${i + 1} 只编号`); return; }
          if (codes.includes(c) || Utils.codeExists(c)) { Utils.toast(`编号 ${c} 重复`); return; }
          codes.push(c);
          genders.push(document.getElementById(`ty-gender-${i}`).value);
        }

        const list = Storage.getPigeons();
        const nestShare = Math.round(Utils.pairCost(b) / cnt * 100) / 100;
        codes.forEach((c, i) => list.push({
          id: Utils.uid('pg'), code: c, gender: genders[i],
          breed: m?.breed || '王鸽', penId: b.penId,
          dob: Utils.today(), status: 'young', weight: 0,
          source: 'bred', sireId: b.maleId, damId: b.femaleId,
          family: m?.family || '',
          nestCostInherited: nestShare,
          pending: mode === 'pending',
          notes: mode === 'keep' ? '留种' : '待定（公母可后改）'
        }));
        Storage.setPigeons(list);

        const stock = Storage.getRingStock();
        if ((Number(stock.qty) || 0) < cnt) { Utils.toast('脚环库存不足，请先入库'); return; }
        stock.qty = Math.max(stock.qty - cnt, 0);
        stock.logs = stock.logs || [];
        stock.logs.unshift({ date: Utils.today(), count: -cnt, note: `${mode === 'keep' ? '留种' : '待定'}上环 ${codes.join(',')}` });
        Storage.setRingStock(stock);

        // 脚环费自动进账单
        const accs = Storage.getAccounts();
        accs.push({
          id: Utils.uid('a'), type: 'expense', category: '脚环',
          title: `脚环 · ${mode === 'keep' ? '留种' : '待定'}上环 ${cnt} 只`,
          amount: (Number(stock.price) || 1.5) * cnt,
          date: Utils.today(), note: codes.join(','), link: { kind: 'ring-use', ringQty: cnt }
        });
        Storage.setAccounts(accs);

        b.status = 'sold';
        b.resolution = mode;
        b.fledgeDate = Utils.today();
        b.notes = (b.notes ? b.notes + ' · ' : '') + (mode === 'keep' ? '留种' : '待定') + ` ${cnt} 只`;
        Storage.setBreeds(breeds);

        Utils.closeModal();
        Utils.toast(`已转 ${cnt} 只青年鸽`);
        if (typeof Notify !== 'undefined') Notify.refresh();
        App.switchTab('pigeons');
      }}
    ]);
  },

  // ========== 连蛋带仔：带仔期间记下一窝下蛋 ==========
  openNextLay(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    if (!b) return;
    // 防重复：这一对已有进行中的新窝
    const exists = breeds.some(x =>
      x.id !== id && x.maleId === b.maleId && x.femaleId === b.femaleId &&
      x.status !== 'sold' && x.status !== 'failed');
    if (exists) { Utils.toast('这一对已有进行中的新窝，不用重复开窝'); return; }

    Utils.openModal('记下一窝下蛋 · ' + Feeding.pairTitle(b), `
      <div style="font-size:12px;color:var(--ios-gray3);margin-bottom:8px">
        连蛋带仔：旧窝（${b.hatchDate ? '出壳 ' + b.hatchDate : '配对 ' + b.pairDate}）还在养，新窝吃用等旧窝出栏后才开始算
      </div>
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">下蛋日期</label>
          <input class="form-input" type="date" id="nl-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">蛋数</label>
          <input class="form-input" type="number" id="nl-eggs" value="2" min="1" max="3" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '开新窝', style: 'btn-primary', onClick: () => {
        const layDate = document.getElementById('nl-date').value;
        const eggs = Number(document.getElementById('nl-eggs').value) || 2;
        if (!layDate) { Utils.toast('请选下蛋日期'); return; }

        const list = Storage.getBreeds();
        const cur = list.find(x => x.id === id);
        if (!cur) return;
        // 再查一次防重复
        if (list.some(x => x.id !== id && x.maleId === cur.maleId && x.femaleId === cur.femaleId &&
            x.status !== 'sold' && x.status !== 'failed')) {
          Utils.toast('这一对已有进行中的新窝'); return;
        }
        list.push({
          id: Utils.uid('b'),
          maleId: cur.maleId, femaleId: cur.femaleId,
          penId: cur.penId, cageNo: cur.cageNo,      // 继承笼号
          pairDate: layDate,                          // 新窝起点 = 下蛋日
          layDate, eggCount: eggs,
          secondEggDate: null, candledDate: null, fertileCount: 0,
          hatchDate: null, hatchCount: 0, surviveCount: 0,
          status: 'hatching', pigeonIds: [], losses: [],
          notes: '连蛋带仔'
        });
        Storage.setBreeds(list);
        Utils.closeModal();
        Utils.toast(`已开新窝：${layDate} 下蛋 ${eggs} 枚（继承 ${cur.cageNo ? cur.cageNo + ' 号笼' : '笼号'}）`);
        if (typeof Notify !== 'undefined') Notify.refresh();
        App.switchTab('breed');
      }}
    ]);
  },

  advanceToSold(id) {
    const breeds = Storage.getBreeds();
    const b = breeds.find(x => x.id === id);
    Utils.openModal('标记出栏', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">出栏日期</label>
          <input class="form-input" type="date" id="sell-date" value="${Utils.today()}" />
        </div>
        <div class="form-row">
          <label class="form-label">出栏数</label>
          <input class="form-input" type="number" id="sell-count" value="${b.surviveCount}" />
        </div>
        <div class="form-row">
          <label class="form-label">总重 (kg)</label>
          <input class="form-input" type="number" step="0.1" id="sell-weight" placeholder="选填" />
        </div>
        <div class="form-row">
          <label class="form-label">单价 (¥/只)</label>
          <input class="form-input" type="number" step="0.1" id="sell-price" placeholder="选填" />
        </div>
        <div class="form-row">
          <label class="form-label">买家</label>
          <input class="form-input" id="sell-buyer" placeholder="选填" />
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认出栏 + 记收入', style: 'btn-primary', onClick: () => {
        const count = Number(document.getElementById('sell-count').value) || b.surviveCount;
        const price = Number(document.getElementById('sell-price').value) || 0;
        const total = count * price;

        b.status = 'sold';
        b.fledgeDate = document.getElementById('sell-date').value;
        Storage.setBreeds(breeds);

        // 同时写入销售记录
        const sales = Storage.getSales();
        sales.push({
          id: Utils.uid('s'),
          breedId: id,
          saleDate: document.getElementById('sell-date').value,
          count,
          weight: Number(document.getElementById('sell-weight').value) || 0,
          price, total,
          buyer: document.getElementById('sell-buyer').value.trim(),
          notes: ''
        });
        Storage.setSales(sales);

        Utils.toast('✓ 已标记出栏');
        App.switchTab('profit');
      }}
    ]);
  },

  markFailed(id) {
    Utils.openModal('标记失败', '<p>确认将此配对标记为失败吗？</p>', [
      { label: '取消', style: 'btn-secondary' },
      { label: '确认', style: 'btn-danger', onClick: () => {
        const breeds = Storage.getBreeds();
        const b = breeds.find(x => x.id === id);
        b.status = 'failed';
        Storage.setBreeds(breeds);
        Utils.toast('已标记为失败');
        this.showDetail(id);
      }}
    ]);
  }
};

// 详情页里的动态按钮绑定（因为 innerHTML 后需要重新绑定）
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  // 查找最近的 breed 详情
  // 这里简化处理：点击后执行页面上最后一次 showDetail 的 breed
  // 由于 JS 模块内无法直接访问，这里用 window 全局
  if (window._breedDetailActions) {
    const idx = Number(btn.dataset.act);
    window._breedDetailActions[idx].fn();
  }
});
