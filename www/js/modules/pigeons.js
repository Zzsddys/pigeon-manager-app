/**
 * 鸽子管理 · 列表 / 添加 / 详情 / 编辑
 */
const PigeonsPage = {
  render() {
    document.getElementById('nav-title').textContent = '鸽子';
    const action = document.getElementById('nav-action');
    action.hidden = false;
    action.textContent = '添加';
    action.onclick = () => this.openForm(null);
    document.getElementById('nav-back').hidden = true;

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section">
        <div class="section-subtitle">共 ${Storage.getPigeons().length} 只 · 种鸽 / 育雏 / 育肥</div>
        ${this._filterTabs()}
        <div id="pigeon-list">${this._listHTML('all')}</div>
      </div>
    `;

    // filter 切换
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('pigeon-list').innerHTML = this._listHTML(btn.dataset.filter);
        this._bindListClicks();
      });
    });

    this._bindListClicks();
  },

  _bindListClicks() {
    document.querySelectorAll('#pigeon-list [data-id]').forEach(el => {
      if (el._clickBound) return;
      el._clickBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => PigeonsPage.showDetail(el.dataset.id));
    });
  },

  _filterTabs() {
    const tabs = [
      { k: 'all', label: '全部' },
      { k: 'breeder', label: '种鸽' },
      { k: 'young', label: '幼鸽' },
      { k: 'fatten', label: '育肥' },
      { k: 'archived', label: '归档' }
    ];
    return `
      <div style="display:flex;gap:8px;padding:8px 0;">
        ${tabs.map((t,i)=>`<button class="btn" data-filter="${t.k}" style="flex:none;padding:6px 14px;height:32px;font-size:13px;border-radius:16px;background:${i===0?'var(--ios-blue)':'var(--ios-gray6)'};color:${i===0?'#fff':'var(--ios-text)'};flex:0 0 auto;">${t.label}</button>`).join('')}
      </div>
    `;
  },

  _listHTML(filter) {
    let list = Storage.getPigeons();
    if (filter === 'archived') {
      // 归档：手动归档 + 已出栏 + 死亡，都放一起方便管理
      list = list.filter(p => p.archived || p.status === 'sold' || p.status === 'dead');
    } else {
      list = list.filter(p => !p.archived && p.status !== 'sold' && p.status !== 'dead');
      if (filter !== 'all') list = list.filter(p => p.status === filter);
    }

    if (list.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🐦</div>
          <div class="empty-title">还没有鸽子</div>
          <div class="empty-desc">点右上角「添加」创建第一只</div>
        </div>
      `;
    }

    const statusMap = {
      breeder: { label: '种鸽', cls: 'tag-purple' },
      young:   { label: '幼鸽', cls: 'tag-blue' },
      fatten:  { label: '育肥', cls: 'tag-orange' },
      sold:    { label: '已出栏', cls: 'tag-gray' },
      dead:    { label: '死亡', cls: 'tag-red' }
    };

    return list.map(p => {
      const s = p.status === 'sold' ? statusMap.sold
        : p.status === 'dead' ? statusMap.dead
        : p.archived ? { label: '已归档', cls: 'tag-gray' }
        : (statusMap[p.status] || { label: p.status, cls: 'tag-gray' });
      const age = p.dob ? Utils.ageDays(p.dob) + '天' : '-';
      return `
        <div class="list-item" data-id="${p.id}">
          <div class="list-item-icon" style="background:${p.gender==='公'?'rgba(0,122,255,0.12)':'rgba(255,149,0,0.12)'}">
            ${p.gender==='公'?'♂️':p.gender==='母'?'♀️':'🐥'}
          </div>
          <div class="list-item-content">
            <div class="list-item-title">${p.code} · ${p.breed}${p.family ? ` <span style="font-size:10px;color:var(--ios-gray);background:rgba(118,118,128,0.14);padding:1px 5px;border-radius:4px;margin-left:2px">家号 ${p.family}</span>` : ''}${Utils.unresolvedException(p.id) ? ` <span style="font-size:10px;color:#fff;background:var(--ios-red);padding:1px 5px;border-radius:4px;margin-left:2px">🚑 异常</span>` : ''}</div>
            <div class="list-item-sub">${Utils.penName(p.penId)} · ${age} · ${p.weight||0}g</div>
          </div>
          <span class="tag ${s.cls}">${s.label}</span>
          <span class="list-item-arrow">›</span>
        </div>
      `;
    }).join('');
  },

  // ========== 详情 ==========
  showDetail(id) {
    const p = Utils.pigeonById(id);
    if (!p) return;
    App.openDetail(() => {
      document.getElementById('nav-title').textContent = p.code;
      document.getElementById('nav-action').hidden = false;
      document.getElementById('nav-action').textContent = '编辑';
      document.getElementById('nav-action').onclick = () => PigeonsPage.openForm(id);
    });

    const age = p.dob ? Utils.ageDays(p.dob) + ' 天' : '-';
    const breedRecords = Storage.getBreeds().filter(b => b.maleId === id || b.femaleId === id)
      .sort((a, b) => String(a.pairDate || '').localeCompare(String(b.pairDate || '')));
    const sales = Storage.getSales().filter(s => (s.pigeonIds || []).includes(id))
      .sort((a, b) => String(b.saleDate || '').localeCompare(String(a.saleDate || '')));
    const curPair = breedRecords.find(b => b.status !== 'sold' && b.status !== 'failed');
    const partner = curPair ? Utils.pigeonById(curPair.maleId === id ? curPair.femaleId : curPair.maleId) : null;
    const timeline = Utils.timelineFor({ pigeonId: id });

    const content = document.getElementById('page-content');
    content.innerHTML = `
      <div class="section">
        <div style="text-align:center;padding:20px 0">
          <div style="font-size:64px;">${p.gender==='公'?'♂️':p.gender==='母'?'♀️':'🐥'}</div>
          <div style="font-size:22px;font-weight:700;margin-top:8px">${p.code}${p.family ? ` <span style="font-size:12px;color:var(--ios-gray);background:rgba(118,118,128,0.14);padding:2px 7px;border-radius:5px;vertical-align:3px">家号 ${p.family}</span>` : ''}</div>
          <div style="font-size:15px;color:var(--ios-gray)">${p.breed || '未登记品种'} · ${p.gender || '性别未定'} · ${age} · 第 ${Utils.generationOf(id)} 代</div>
        </div>

        <div class="list-group">
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">所在鸽舍</div></div><div class="list-item-value">${Utils.penName(p.penId)}</div></div>
          ${p.dob ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">出生日期</div></div><div class="list-item-value">${p.dob}</div></div>` : ''}
          ${p.weight ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">体重</div></div><div class="list-item-value">${p.weight} g</div></div>` : ''}
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">状态</div></div><div class="list-item-value">${p.status === 'breeder' ? '种鸽' : p.status === 'young' ? '青年鸽' : p.status === 'sold' ? '已出栏' : p.status === 'dead' ? '死亡' : p.status}${p.pending ? ' · 待定' : ''}${p.archived ? ' · 已归档' : ''}</div></div>
          ${p.family ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">家号</div></div><div class="list-item-value">${p.family}</div></div>` : ''}
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">来源</div></div><div class="list-item-value">${p.source === 'purchased' ? '外购' + (p.purchasePrice ? ` · ${Utils.fmtMoney(p.purchasePrice)}` : '') : '自繁'}</div></div>
          ${(p.sireId || p.damId) ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">血统</div></div><div class="list-item-value" style="text-align:right">♂${Utils.pigeonById(p.sireId)?.code || '—'} × ♀${Utils.pigeonById(p.damId)?.code || '—'}</div></div>` : ''}
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">配对情况</div></div><div class="list-item-value" style="text-align:right">${partner ? `${p.gender === '公' ? '♀' : '♂'} ${partner.code}${curPair.cageNo ? ' · ' + curPair.cageNo + ' 号笼' : ''}${curPair.penId ? ' · ' + Utils.penName(curPair.penId) : ''}` : '未配对'}</div></div>
          ${p.notes ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">备注</div></div><div class="list-item-value" style="text-align:right;color:var(--ios-gray3);max-width:40%">${p.notes}</div></div>` : ''}
        </div>

        ${(() => {
          // 祖谱：按代分层，编号可点击跳转到对应个人档案
          const anc = Utils.ancestorsOf(id, 4);
          if (anc.size === 0) return '';
          const genNames = { 1: '父母', 2: '祖代', 3: '曾祖', 4: '高祖' };
          const genNum = Utils.generationOf(id);
          const groups = {};
          anc.forEach((g, aid) => { (groups[g] = groups[g] || []).push(aid); });
          return `
            <div class="section-header"><h2 class="section-title">🧬 祖谱（本鸽第 ${genNum} 代 · 点编号跳转档案）</h2></div>
            <div class="list-group">
              ${[1, 2, 3, 4].filter(g => groups[g]).map(g => `
                <div class="list-item" style="cursor:default">
                  <div class="list-item-content">
                    <div class="list-item-title" style="font-size:14px">${genNames[g]}<span style="font-size:11px;color:var(--ios-gray3);font-weight:500">（往上第 ${g} 层）</span></div>
                    <div class="list-item-sub" style="margin-top:4px">
                      ${groups[g].map(aid => {
                        const a = Utils.pigeonById(aid);
                        const off = a.status === 'sold' || a.status === 'dead' || a.archived;
                        return `<button class="anc-link" data-anc="${aid}" style="border:0;background:rgba(0,122,255,0.1);color:var(--ios-blue);font-size:12px;font-weight:600;padding:2px 7px;border-radius:5px;margin:2px 6px 2px 0;cursor:pointer">${a.gender === '公' ? '♂' : a.gender === '母' ? '♀' : '🐥'} ${a.code}<span style="font-weight:500">（第 ${Utils.generationOf(aid)} 代）</span>${off ? '<span style="color:var(--ios-gray3);font-weight:400">已不在群</span>' : ''}</button>`;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        })()}

        ${breedRecords.length ? `
          <div class="section-header"><h2 class="section-title">🪺 繁殖记录（${breedRecords.length} 窝）</h2></div>
          <div class="list-group">
            ${breedRecords.map((b, i) => {
              const m = Utils.pigeonById(b.maleId), f = Utils.pigeonById(b.femaleId);
              const eggsN = b.eggCount || 0;
              const fertile = b.candledDate ? (b.fertileCount || 0) : null;
              const hatched = b.hatchCount || 0;
              const rate = eggsN > 0 ? Math.round((b.surviveCount || 0) / eggsN * 100) : 0;
              const isSold = b.status === 'sold';
              const statTxt = isSold ? (b.resolution === 'keep' ? '已留种' : b.resolution === 'pending' ? '转待定' : '已出栏') : b.status === 'failed' ? '失败' : '进行中';
              return `
                <div class="list-item" data-nest-id="${b.id}">
                  <div class="list-item-content">
                    <div class="list-item-title">第 ${i + 1} 窝 · ${m?.code||'?'} ♂ × ${f?.code||'?'} ♀ <span style="font-size:11px;color:var(--ios-gray);font-weight:500">${statTxt}</span></div>
                    <div class="list-item-sub">配对 ${b.pairDate || '-'}${b.layDate ? ` · 下蛋 ${b.layDate}` : ''}${fertile != null ? ` · 受精 ${fertile}` : ''}${hatched ? ` · 出壳 ${hatched}` : ''}${eggsN ? ` · 成活率 ${rate}%` : ''}${Utils.pairLossTotal(b) > 0 ? ` · 损失 ${Utils.fmtMoney(Utils.pairLossTotal(b))}` : ''}</div>
                  </div>
                  <span class="list-item-arrow">›</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${(() => {
          const children = Storage.getPigeons().filter(c => c.sireId === id || c.damId === id);
          if (children.length === 0) return '';
          return `
            <div class="section-header"><h2 class="section-title">🐥 乳鸽记录（这只的后代）</h2></div>
            <div class="list-group">
              ${children.map(c => {
                const sale = Storage.getSales().find(x => (x.pigeonIds || []).includes(c.id));
                return `
                  <div class="list-item">
                    <div class="list-item-content">
                      <div class="list-item-title">${c.code || '未编号'} · ${c.status === 'young' ? '青年鸽' : c.status === 'breeder' ? '种鸽' : c.status === 'sold' ? '已出栏' : c.status}</div>
                      <div class="list-item-sub">硬性成本 ${Utils.fmtMoney(Utils.pigeonHardCost(c.id))}${sale ? ` · 售价 ${Utils.fmtMoney(sale.total)}` : ''}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        })()}

        <div class="section-header"><h2 class="section-title">💰 硬性成本明细</h2></div>
        <div class="list-group">
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">买价成本</div></div><div class="list-item-value">${Utils.fmtMoney(p.purchasePrice || 0)}</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">药费成本</div></div><div class="list-item-value">${Utils.fmtMoney(Utils.pigeonMedCost(id))}</div></div>
          <div class="list-item"><div class="list-item-content"><div class="list-item-title">繁殖损失分摊</div></div><div class="list-item-value">${Utils.fmtMoney(Utils.pigeonLossCost(id))}</div></div>
          ${p.nestCostInherited ? `<div class="list-item"><div class="list-item-content"><div class="list-item-title">窝成本转入（留种继承）</div></div><div class="list-item-value">${Utils.fmtMoney(p.nestCostInherited)}</div></div>` : ''}
          <div class="list-item"><div class="list-item-content"><div class="list-item-title"><b>硬性成本合计</b></div></div><div class="list-item-value"><b style="color:var(--ios-red)">${Utils.fmtMoney(Utils.pigeonHardCost(id))}</b></div></div>
        </div>

        ${(() => {
          const exs = Storage.getExceptions().filter(e => e.pigeonId === id)
            .sort((a, b) => String(b.date).localeCompare(String(a.date)));
          if (exs.length === 0) return '';
          return `
            <div class="section-header"><h2 class="section-title">🚑 异常记录</h2></div>
            <div class="list-group">
              ${exs.map(e => `
                <div class="list-item">
                  <div class="list-item-icon" style="background:${e.resolved ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)'}">${e.resolved ? '✅' : '🚑'}</div>
                  <div class="list-item-content">
                    <div class="list-item-title" style="${e.resolved ? '' : 'color:var(--ios-red)'}">${e.note}</div>
                    <div class="list-item-sub">${e.date}${e.resolved ? ` · 已恢复 ${e.resolveDate || ''}` : ' · 未恢复'}${(e.cost || e.resolveCost) ? ` · 药费 ${Utils.fmtMoney((e.cost || 0) + (e.resolveCost || 0))}` : ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        })()}

        ${sales.length ? `
          <div class="section-header"><h2 class="section-title">📤 售出记录</h2></div>
          <div class="list-group">
            ${sales.map(s => `
              <div class="list-item" style="cursor:default">
                <div class="list-item-icon" style="background:rgba(52,199,89,0.12)">📤</div>
                <div class="list-item-content">
                  <div class="list-item-title">${s.count || 1} 只 · 收入 ${Utils.fmtMoney(s.total || 0)}${s.price ? `（单价 ${Utils.fmtMoney(s.price)}）` : ''}</div>
                  <div class="list-item-sub">${s.saleDate || '-'}${s.buyer ? ` · 买家 ${s.buyer}` : ''}${s.weight ? ` · ${s.weight}kg` : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section-header"><h2 class="section-title">📅 养殖时间线</h2></div>
        <div class="list-group">
          ${timeline.length ? timeline.map(ev => `
            <div class="list-item" style="cursor:default">
              <div style="font-size:17px;width:26px;text-align:center;flex-shrink:0">${ev.icon}</div>
              <div class="list-item-content">
                <div class="list-item-title" style="font-size:14px;${ev.red ? 'color:var(--ios-red)' : ''}">${ev.text}</div>
              </div>
              <span style="font-size:12px;color:var(--ios-gray3);flex-shrink:0">${Utils.fmtMonthDay(ev.date)}<span style="font-size:10px"> ${String(ev.date).slice(0, 4)}年</span></span>
            </div>
          `).join('') : `<div style="font-size:13px;color:var(--ios-gray3);padding:12px 16px">暂无记录</div>`}
        </div>

        <div style="padding:20px 16px 40px;display:flex;gap:10px">
          ${p.archived ? `<button class="btn btn-primary" id="btn-unarchive" style="flex:1">📂 复活归档</button>` : `<button class="btn btn-secondary" id="btn-archive" style="flex:1">📦 归档</button>`}
          <button class="btn btn-danger-outline" id="btn-delete" style="flex:1">删除此鸽子</button>
        </div>
      </div>
    `;

    // 点窝次记录 → 进入该配对的完整档案
    document.querySelectorAll('[data-nest-id]').forEach(el => {
      el.addEventListener('click', () => HomePage.showPairArchive(el.dataset.nestId));
    });

    // 点祖谱编号 → 跳转到对应鸽子档案
    document.querySelectorAll('[data-anc]').forEach(el => {
      el.addEventListener('click', () => PigeonsPage.showDetail(el.dataset.anc));
    });

    const archiveBtn = document.getElementById('btn-archive');
    if (archiveBtn) archiveBtn.onclick = () => {
      Utils.openModal('归档确认', `<p style="font-size:13px;line-height:1.8">把 <b>${p.code}</b> 归档？<br>归档后从正常列表隐藏、不参与投喂和配对，档案保留，随时可复活。</p>`, [
        { label: '取消', style: 'btn-secondary' },
        { label: '确认归档', style: 'btn-primary', onClick: () => {
          const list = Storage.getPigeons();
          list.find(x => x.id === id).archived = true;
          Storage.setPigeons(list);
          Utils.toast('已归档');
          App.switchTab('pigeons');
        }}
      ]);
    };
    const unarchiveBtn = document.getElementById('btn-unarchive');
    if (unarchiveBtn) unarchiveBtn.onclick = () => {
      const list = Storage.getPigeons();
      list.find(x => x.id === id).archived = false;
      Storage.setPigeons(list);
      Utils.toast('已复活归档');
      this.showDetail(id);
    };

    document.getElementById('btn-delete').onclick = () => {
      Utils.openModal('确认删除', '<p>确定要删除鸽子 <b>'+p.code+'</b> 吗？此操作不可撤销。</p>', [
        { label: '取消', style: 'btn-secondary' },
        { label: '删除', style: 'btn-danger', onClick: () => {
          const list = Storage.getPigeons().filter(x => x.id !== id);
          Storage.setPigeons(list);
          Utils.toast('已删除');
          App.switchTab('pigeons');
        }}
      ]);
    };
  },

  // ========== 表单（新增 / 编辑） ==========
  openForm(id) {
    const isEdit = !!id;
    const p = isEdit ? Utils.pigeonById(id) : {
      code: '', family: '', gender: '未知', breed: '王鸽', penId: Storage.getPens()[0]?.id || '',
      dob: Utils.today(), status: 'young', weight: '', notes: '',
      source: 'bred', sireId: '', damId: '', purchasePrice: ''
    };
    const pens = Storage.getPens();
    const statuses = [
      { v: 'breeder', t: '种鸽' },
      { v: 'young',   t: '幼鸽' },
      { v: 'young_pending', t: '幼鸽 · 待定（公母后选）' },
      { v: 'fatten',  t: '育肥' }
    ];
    const genders = [
      { v: '公', t: '公' },
      { v: '母', t: '母' },
      { v: '未知', t: '待定' }
    ];
    const all = Storage.getPigeons().filter(x => x.id !== id);
    const males = all.filter(x => x.gender === '公' && !x.archived);
    const females = all.filter(x => x.gender === '母' && !x.archived);
    const ringStock = Storage.getRingStock();

    // 登记必须有脚环库存
    if (!isEdit && (Number(ringStock.qty) || 0) <= 0) {
      Utils.toast('脚环库存为 0，请先到「库存」页入库脚环，再登记鸽子');
      return;
    }

    // 品种 / 家号候选项（历史值）
    const pigeonsAll = Storage.getPigeons();
    const breedOptions = [...new Set(pigeonsAll.map(x => x.breed).filter(Boolean))];
    const familyOptions = [...new Set(pigeonsAll.map(x => x.family).filter(Boolean))];

    const statusVal = (isEdit ? p.status : 'young') + ((p.pending && p.status === 'young') ? '_pending' : '');

    Utils.openModal(isEdit ? '编辑鸽子档案' : '添加鸽子（上脚环）', `
      <div class="form-group">
        <div class="form-row">
          <label class="form-label">编号（脚环）*</label>
          <input class="form-input" id="f-code" value="${p.code}" placeholder="如 Z005（脚环号，不可重复）" />
        </div>
        <div class="form-row">
          <label class="form-label">家号</label>
          <input class="form-input" id="f-family" value="${p.family || ''}" list="family-list" placeholder="如 A1（父系家族标签）" />
          <datalist id="family-list">${familyOptions.map(f => `<option value="${f}"></option>`).join('')}</datalist>
        </div>
        <div class="form-row">
          <label class="form-label">来源</label>
          <select class="form-select" id="f-source">
            <option value="bred" ${(p.source||'bred')==='bred'?'selected':''}>自繁</option>
            <option value="purchased" ${p.source==='purchased'?'selected':''}>外购</option>
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">买价 (¥)</label>
          <input class="form-input" type="number" step="0.1" id="f-price" value="${p.purchasePrice || ''}" placeholder="外购才填，算硬性成本" />
        </div>
        <div class="form-row">
          <label class="form-label">品种</label>
          <input class="form-input" id="f-breed" value="${p.breed}" list="breed-list" placeholder="王鸽 / 石岐鸽…" />
          <datalist id="breed-list">${breedOptions.map(b => `<option value="${b}"></option>`).join('')}</datalist>
        </div>
        <div class="form-row">
          <label class="form-label">性别</label>
          <select class="form-select" id="f-gender">
            ${genders.map(g => `<option value="${g.v}" ${p.gender===g.v?'selected':''}>${g.t}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">鸽舍</label>
          <select class="form-select" id="f-pen">
            ${pens.map(pn => `<option value="${pn.id}" ${p.penId===pn.id?'selected':''}>${pn.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">出生日期</label>
          <input class="form-input" type="date" id="f-dob" value="${p.dob}" />
        </div>
        <div class="form-row">
          <label class="form-label">体重 (g)</label>
          <input class="form-input" type="number" id="f-weight" value="${p.weight}" placeholder="0" />
        </div>
        <div class="form-row">
          <label class="form-label">状态</label>
          <select class="form-select" id="f-status">
            ${statuses.map(s => `<option value="${s.v}" ${statusVal===s.v?'selected':''}>${s.t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-group">
        <div style="font-size:12px;color:var(--ios-gray3);padding:0 0 6px 2px">血统（用于配对查 4 代，非自繁可不填）</div>
        <div class="form-row">
          <label class="form-label">父鸽</label>
          <select class="form-select" id="f-sire">
            <option value="">未登记</option>
            ${males.map(x => `<option value="${x.id}" ${p.sireId===x.id?'selected':''}>${x.code} · ${x.breed}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label class="form-label">母鸽</label>
          <select class="form-select" id="f-dam">
            <option value="">未登记</option>
            ${females.map(x => `<option value="${x.id}" ${p.damId===x.id?'selected':''}>${x.code} · ${x.breed}</option>`).join('')}
          </select>
        </div>
        <div style="font-size:11px;color:var(--ios-gray3);padding:2px 2px 0">
          脚环库存：${ringStock.qty} 个 · ${isEdit ? '编辑不消耗脚环' : '登记消耗 1 个脚环，费用自动记账'}
        </div>
      </div>

      <div class="form-group">
        <div class="form-row" style="flex-direction:column;align-items:flex-start">
          <label class="form-label" style="margin-bottom:6px">备注</label>
          <textarea class="form-textarea" id="f-notes" placeholder="选填">${p.notes||''}</textarea>
        </div>
      </div>
    `, [
      { label: '取消', style: 'btn-secondary' },
      { label: isEdit ? '保存' : '登记并上环', style: 'btn-primary', keepOpen: true, onClick: () => {
        const rawStatus = document.getElementById('f-status').value;
        const data = {
          code:   document.getElementById('f-code').value.trim(),
          family: document.getElementById('f-family').value.trim(),
          source: document.getElementById('f-source').value,
          purchasePrice: Number(document.getElementById('f-price').value) || 0,
          breed:  document.getElementById('f-breed').value.trim(),
          gender: document.getElementById('f-gender').value,
          penId:  document.getElementById('f-pen').value,
          dob:    document.getElementById('f-dob').value,
          weight: Number(document.getElementById('f-weight').value) || 0,
          status: rawStatus === 'young_pending' ? 'young' : rawStatus,
          sireId: document.getElementById('f-sire').value,
          damId:  document.getElementById('f-dam').value,
          notes:  document.getElementById('f-notes').value.trim()
        };
        const pendingFlag = rawStatus === 'young_pending';
        if (!data.code) { Utils.toast('请填写编号（脚环号）'); return; }
        if (Utils.codeExists(data.code, id)) { Utils.toast('编号已存在，不能重复（出栏/死亡的编号带「.」，可复用原名）'); return; }
        if (data.sireId && data.damId && data.sireId === data.damId) { Utils.toast('父鸽和母鸽不能相同'); return; }

        const list = Storage.getPigeons();
        if (isEdit) {
          Object.assign(list.find(x => x.id === id), data, { pending: pendingFlag });
          Utils.toast('档案已保存');
        } else {
          list.push({ id: Utils.uid('pg'), ...data, pending: pendingFlag });
          // 消耗 1 个脚环 + 脚环费自动进账单
          const rs = Storage.getRingStock();
          rs.qty = Math.max((Number(rs.qty) || 0) - 1, 0);
          rs.logs = rs.logs || [];
          rs.logs.unshift({ date: Utils.today(), count: -1, note: `戴环 ${data.code}` });
          Storage.setRingStock(rs);
          const accs = Storage.getAccounts();
          accs.push({
            id: Utils.uid('a'), type: 'expense', category: '脚环',
            title: `脚环 · 登记 ${data.code}`, amount: Number(rs.price) || 1.5,
            date: Utils.today(), note: '', link: { kind: 'ring-use', ringQty: 1 }
          });
          Storage.setAccounts(accs);
          Utils.toast(`已登记并上环 ${data.code}，脚环费已记账`);
        }
        Storage.setPigeons(list);
        Utils.closeModal();
        if (isEdit) this.showDetail(id);
        else App.switchTab('pigeons');
      }}
    ]);
  }
};
