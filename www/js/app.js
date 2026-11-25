/**
 * 主入口 · Tab 切换 + 全局搜索 + 导入导出
 */
const App = {
  currentTab: 'home',
  stack: [], // 页面栈：{ type: 'tab'|'detail', tab, detailRenderer, detailContext }

  init() {
    // 1. 初始化数据（首次运行写种子）
    Storage.initIfEmpty();
    Feeding.ensureDefaults();
    SeedData.ensureFeedingTest();

    // 2. Tab 切换
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    // 3. 全局返回按钮
    document.getElementById('nav-back').addEventListener('click', () => this.goBack());

    // 3.1 通知中心
    const bell = document.getElementById('nav-bell');
    if (bell) bell.addEventListener('click', () => Notify.openCenter());

    // 4. 导入导出 / 重置
    this._setupTopBarButtons();

    // 4. 自动引擎：补历史 + 今日到点自动扣料（在首次渲染前跑，保证数字最新）
    AutoEngine.run();
    AutoEngine.startTimer();

    // 5. 默认渲染首页
    this.switchTab('home');

    // 6. 点击遮罩关闭 modal
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'modal') Utils.closeModal();
    });

    // 7. 云端同步：启动时静默双向同步
    if (Cloud.isConfigured()) {
      Cloud.syncOnBoot().then(() => {
        const c = Cloud.cfg();
        if (c && c.lastPullAt) { Cloud.rerender(); console.log('☁️ 已从云端同步'); }
        else if (c && c.lastError) console.warn('☁️ 云端同步失败：' + c.lastError);
      });
    }

    console.log('🐦 鸽管家 已就绪');
  },

  switchTab(tab, push = true) {
    // Tab 是根页面：切换时重置页面栈，避免首页出现「返回」
    this.stack = [{ tab, isDetail: false }];
    this.currentTab = tab;
    this._updateNavChrome();

    // 回到顶部
    document.getElementById('page-content').scrollTop = 0;

    // 渲染对应模块
    switch (tab) {
      case 'home':      HomePage.render(); break;
      case 'pigeons':   PigeonsPage.render(); break;
      case 'breed':     BreedPage.render(); break;
      case 'feeding':   FeedingPage.render(); break;
      case 'stock':     StockPage.render(); break;
      case 'profit':    ProfitPage.render(); break;
    }

    // 每次渲染后刷新待办提醒
    if (typeof Notify !== 'undefined') Notify.refresh();
  },

  /** 进入详情页（鸽子详情 / 繁殖详情等） */
  openDetail(rendererFn) {
    // 把当前 tab 压栈，再进详情
    this.stack.push({ tab: this.currentTab, isDetail: true });
    document.getElementById('page-content').innerHTML = ''; // 清空
    rendererFn();
    this._updateNavChrome();
  },

  /** 返回上一级 */
  goBack() {
    if (this.stack.length === 0) return;
    this.stack.pop(); // 弹出当前页
    if (this.stack.length === 0) {
      this.switchTab('home', false);
      return;
    }
    const top = this.stack[this.stack.length - 1];
    this.switchTab(top.tab, false);
  },

  _pushTab(tab) {
    // 不连续压相同 tab
    const last = this.stack[this.stack.length - 1];
    if (!last || last.tab !== tab || last.isDetail) {
      this.stack.push({ tab, isDetail: false });
    }
  },

  _updateNavChrome() {
    const navBack = document.getElementById('nav-back');
    const hasHistory = this.stack.length > 1;
    navBack.hidden = !hasHistory;
    if (hasHistory) navBack.onclick = () => this.goBack();
    else navBack.onclick = null;

    // Tab bar active
    document.querySelectorAll('.tab-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === this.currentTab);
    });
  },

  // ========== 搜索 ==========
  searchPigeons(keyword) {
    const list = Storage.getPigeons();
    const kw = keyword.toLowerCase().trim();
    const hits = list.filter(p =>
      !p.archived && (   // 出售/死亡/归档的鸽子不在搜索里，只在归档标签或档案跳转里找
        (p.code && p.code.toLowerCase().includes(kw)) ||
        (p.breed && p.breed.toLowerCase().includes(kw)) ||
        (p.notes && p.notes.toLowerCase().includes(kw))
      )
    );
    // 临时渲染搜索结果到当前页面
    const content = document.getElementById('page-content');
    if (hits.length === 0) {
      content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">没找到</div><div class="empty-desc">换个关键词试试</div></div>`;
      return;
    }
    content.innerHTML = `
      <div style="padding:8px 16px 0">
        <div style="font-size:13px;color:var(--ios-gray);margin-bottom:8px">找到 ${hits.length} 只</div>
      </div>
      <div class="list-group">
        ${hits.map(p => `
          <div class="list-item" data-id="${p.id}">
            <div class="list-item-icon">${p.gender==='公'?'♂️':p.gender==='母'?'♀️':'🐥'}</div>
            <div class="list-item-content">
              <div class="list-item-title">${p.code} · ${p.breed}</div>
              <div class="list-item-sub">${Utils.penName(p.penId)} · ${p.status}</div>
            </div>
            <span class="list-item-arrow">›</span>
          </div>
        `).join('')}
      </div>
    `;
    // 点搜索结果 → 鸽子详情
    content.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', () => PigeonsPage.showDetail(el.dataset.id));
    });
  },

  // ========== 顶部按钮：导入 / 导出 / 重置 ==========
  _setupTopBarButtons() {
    // 不放在顶部 nav，而是放在首页底部 FAB 下方的设置入口
    // 这里用一个固定位置的设置按钮
    const fabSettings = document.createElement('button');
    fabSettings.className = 'fab';
    fabSettings.id = 'fab-settings';
    fabSettings.textContent = '⚙️';
    fabSettings.style.bottom = '140px';
    fabSettings.style.right = '20px';
    fabSettings.style.width = '44px';
    fabSettings.style.height = '44px';
    fabSettings.style.fontSize = '20px';
    fabSettings.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
    fabSettings.style.background = '#fff';
    fabSettings.style.color = 'var(--ios-blue)';
    fabSettings.style.border = '1px solid var(--ios-gray5)';
    document.querySelector('.app-shell').appendChild(fabSettings);

    fabSettings.addEventListener('click', () => {
      const cc = Cloud.cfg();
      const ac = AutoEngine.cfg();
      const hc = Storage.getHealthCfg();
      const fmtT = t => t ? new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
      const statusTxt = !cc
        ? '<span style="color:var(--ios-gray3)">未配置 · 数据仅存本机</span>'
        : Cloud.isConfigured()
          ? `<span style="color:var(--ios-green)">● 已连接</span>　上次上传 ${fmtT(cc.lastPushAt)} · 上次下载 ${fmtT(cc.lastPullAt)}${cc.lastError ? `<br><span style="color:var(--ios-red)">⚠ ${cc.lastError}</span>` : ''}`
          : '<span style="color:var(--ios-gray3)">配置不完整</span>';

      Utils.openModal('⚙️ 设置与数据', `
        <div class="form-group">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">🪨 保健砂 / 💊 多维</div>
          <div class="form-row">
            <label class="form-label">保健砂用量（克/天）</label>
            <input class="form-input" type="number" id="hc-grit" value="${hc.gritDailyGrams}" />
          </div>
          <div class="form-row">
            <label class="form-label">每包克数</label>
            <input class="form-input" type="number" id="hc-pack" value="${hc.gritPackGrams}" />
          </div>
          <div class="form-row">
            <label class="form-label">多维提醒周期（天）</label>
            <input class="form-input" type="number" id="hc-vdays" value="${hc.vitaminDays}" />
          </div>
          <div style="font-size:11px;color:var(--ios-gray3);margin-bottom:6px">
            上次保健砂：${hc.lastGritDate || '未记录'} · 上次多维：${hc.lastVitaminDate || '未记录'}
          </div>
          <button class="btn btn-primary" id="act-health-save" style="width:100%">保存保健砂/多维设置</button>
        </div>

        <div class="form-group">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">🤖 自动引擎</div>
          <div style="font-size:11.5px;color:var(--ios-gray3);margin-bottom:8px">
            到点（早餐 08:00 / 晚餐 18:00）自动扣料并标记「自动」，可在投喂页确认喂了或没喂退回；最近缺的餐次自动补记
          </div>
          <div class="form-row">
            <label class="form-label">自动扣料 / 补历史</label>
            <select class="form-select" id="auto-enabled">
              <option value="on" ${(ac.enabled !== false) ? 'selected' : ''}>开启（推荐）</option>
              <option value="off" ${ac.enabled === false ? 'selected' : ''}>关闭（全部手动投喂）</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">自动补历史天数</label>
            <input class="form-input" type="number" id="auto-days" value="${ac.backfillDays || 7}" placeholder="7" />
          </div>
          <button class="btn btn-primary" id="act-auto-save" style="width:100%;margin-top:6px">保存自动引擎设置</button>
        </div>

        <div class="form-group">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px">☁️ 云端同步（三台手机共用数据）</div>
          <div style="font-size:11.5px;color:var(--ios-gray3);margin-bottom:8px">多台手机填同一组 AppID/RESTKey 即共用同一套数据；修改后自动上传，打开时自动拉取</div>
          <div style="background:var(--ios-gray6);border-radius:10px;padding:8px 12px;font-size:12px;margin-bottom:10px">${statusTxt}</div>
          <div class="form-row">
            <label class="form-label">AppID</label>
            <input class="form-input" id="cloud-appid" value="${cc?.appId || ''}" placeholder="LeanCloud AppID" />
          </div>
          <div class="form-row">
            <label class="form-label">REST Key</label>
            <input class="form-input" id="cloud-key" value="${cc?.appKey || ''}" placeholder="LeanCloud REST API Key" />
          </div>
          <div class="form-row">
            <label class="form-label">空间名</label>
            <input class="form-input" id="cloud-space" value="${cc?.space || 'default'}" placeholder="default（多个鸽场用不同名字）" />
          </div>
          <div class="form-row">
            <label class="form-label">服务器</label>
            <select class="form-select" id="cloud-region">
              <option value="cn" ${(cc?.region || 'cn') === 'cn' ? 'selected' : ''}>国内版 leancloud.cn（推荐）</option>
              <option value="intl" ${cc?.region === 'intl' ? 'selected' : ''}>国际版 leancloud.app</option>
            </select>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <button class="btn btn-primary" id="act-cloud-save" style="flex:1">保存配置</button>
            <button class="btn btn-secondary" id="act-cloud-push" style="flex:1">立即上传</button>
            <button class="btn btn-secondary" id="act-cloud-pull" style="flex:1">从云端恢复</button>
          </div>
          <div style="font-size:11px;color:var(--ios-gray3);margin-top:6px">同步规则：按最后修改时间取新的一份（本机修改过但还没上传时，点「立即上传」强制覆盖云端）</div>
        </div>

        <div class="form-group">
          <div class="form-item">
            <div class="list-item" id="act-export">
              <div class="list-item-icon" style="background:rgba(0,122,255,0.12)">📤</div>
              <div class="list-item-content">
                <div class="list-item-title">导出全部数据</div>
                <div class="list-item-sub">下载 JSON 备份，换手机时导入</div>
              </div>
              <span class="list-item-arrow">›</span>
            </div>
          </div>
          <div class="form-item">
            <div class="list-item" id="act-import">
              <div class="list-item-icon" style="background:rgba(52,199,89,0.12)">📥</div>
              <div class="list-item-content">
                <div class="list-item-title">从 JSON 导入</div>
                <div class="list-item-sub">从之前备份的 JSON 文件恢复</div>
              </div>
              <span class="list-item-arrow">›</span>
            </div>
          </div>
          <div class="form-item">
            <div class="list-item" id="act-reset">
              <div class="list-item-icon" style="background:rgba(255,59,48,0.12)">🔄</div>
              <div class="list-item-content">
                <div class="list-item-title" style="color:var(--ios-red)">重置为示例数据</div>
                <div class="list-item-sub" style="color:var(--ios-red)">⚠️ 会清空现有数据，不可恢复</div>
              </div>
              <span class="list-item-arrow" style="color:var(--ios-red)">›</span>
            </div>
          </div>
        </div>
        <input type="file" id="file-input" accept=".json" hidden />
      `, [
        { label: '关闭', style: 'btn-secondary' }
      ]);

      // 绑定：保健砂/多维
      document.getElementById('act-health-save').onclick = () => {
        hc.gritDailyGrams = Number(document.getElementById('hc-grit').value) || 0;
        hc.gritPackGrams = Number(document.getElementById('hc-pack').value) || 500;
        hc.vitaminDays = Number(document.getElementById('hc-vdays').value) || 7;
        Storage.setHealthCfg(hc);
        Utils.toast('✓ 已保存');
        Notify.refresh();
      };

      // 绑定：自动引擎
      document.getElementById('act-auto-save').onclick = () => {
        const enabled = document.getElementById('auto-enabled').value === 'on';
        const days = Math.min(Math.max(Number(document.getElementById('auto-days').value) || 7, 0), 30);
        AutoEngine.saveCfg({ enabled, backfillDays: days });
        Utils.toast(enabled ? '自动引擎已开启' : '自动引擎已关闭');
        AutoEngine.run();
      };

      // 绑定：云端
      document.getElementById('act-cloud-save').onclick = () => {
        const appId = document.getElementById('cloud-appid').value.trim();
        const appKey = document.getElementById('cloud-key').value.trim();
        if (!appId || !appKey) { Utils.toast('请填写 AppID 和 REST Key'); return; }
        Cloud.saveCfg(appId, appKey,
          document.getElementById('cloud-space').value,
          document.getElementById('cloud-region').value);
        Utils.toast('配置已保存，正在连接云端…');
        Cloud.syncOnBoot().then(() => { Cloud.rerender(); this._reopenSettings(); });
      };
      document.getElementById('act-cloud-push').onclick = () => {
        Cloud.push().then(() => setTimeout(() => this._reopenSettings(), 800))
          .catch(e => Utils.toast('上传失败：' + e.message));
      };
      document.getElementById('act-cloud-pull').onclick = () => {
        Cloud.pull().then(ok => {
          if (ok) { Cloud.rerender(); this._reopenSettings(); }
        }).catch(e => Utils.toast('恢复失败：' + e.message));
      };

      // 绑定
      document.getElementById('act-export').onclick = () => {
        const json = Storage.exportAll();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `鸽管家_备份_${Utils.today()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        Utils.toast('✓ 已导出');
      };

      document.getElementById('act-import').onclick = () => {
        document.getElementById('file-input').click();
      };

      document.getElementById('file-input').addEventListener('change', e => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const ok = Storage.importAll(reader.result);
          if (ok) { Utils.toast('✓ 导入成功'); Utils.closeModal(); App.switchTab(App.currentTab); }
          else Utils.toast('导入失败，文件格式不对');
        };
        reader.readAsText(f);
      });

      document.getElementById('act-reset').onclick = () => {
        Utils.openModal('确认重置', '<p>这将<b>清空所有现有数据</b>，恢复为示例数据。操作不可撤销！</p>', [
          { label: '取消', style: 'btn-secondary' },
          { label: '确认重置', style: 'btn-danger', onClick: () => {
            localStorage.removeItem('pigeon_inited');
            Storage.clearAll();
            Storage.initIfEmpty();
            Feeding.ensureDefaults();
            SeedData.ensureFeedingTest();
            Utils.toast('✓ 已重置');
            Utils.closeModal();
            App.switchTab('home');
          }}
        ]);
      };
    });
  },

  /** 设置操作后重新打开设置弹窗（刷新状态显示） */
  _reopenSettings() {
    if (document.getElementById('modal').classList.contains('show') ||
        document.getElementById('modal').style.display !== 'none') {
      Utils.closeModal();
      setTimeout(() => document.getElementById('fab-settings').click(), 60);
    }
  }
};

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
