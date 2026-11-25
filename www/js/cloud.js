/**
 * 云端同步层 - LeanCloud REST（免 SDK，纯 fetch）
 *
 * 原理：
 * - 所有业务数据打包成一个 JSON（farm state），存到云端一个记录里
 * - 本机每次修改先写 localStorage（离线可用），再延迟 3 秒自动上传
 * - 打开应用时自动比对时间戳：云端更新则下载覆盖，本机更新则上传
 * - 未配置云端时完全本地运行，不影响任何功能
 *
 * 配置：设置弹窗里填 LeanCloud 的 AppID / RESTKey（三台手机填同一组即共用数据）
 */
const Cloud = {
  CFG: 'pigeon_cloud_cfg',
  META: 'pigeon_cloud_meta',

  /* ---------- 配置 ---------- */
  cfg() {
    try { return JSON.parse(localStorage.getItem(this.CFG) || 'null'); } catch (e) { return null; }
  },
  isConfigured() {
    const c = this.cfg();
    return !!(c && c.appId && c.appKey);
  },
  saveCfg(appId, appKey, space, region) {
    const cfg = {
      appId: appId.trim(),
      appKey: appKey.trim(),
      space: (space || 'default').trim(),
      region: region || 'cn',
      lastPushAt: null, lastPullAt: null, lastError: null
    };
    localStorage.setItem(this.CFG, JSON.stringify(cfg));
    localStorage.removeItem(this.META); // 换配置后重新握手
    return cfg;
  },
  clearCfg() {
    localStorage.removeItem(this.CFG);
    localStorage.removeItem(this.META);
  },

  /* ---------- API 地址 ---------- */
  apiBase() {
    const c = this.cfg();
    if (!c) return null;
    const prefix = c.appId.slice(0, 8).toLowerCase();
    return c.region === 'intl'
      ? `https://${prefix}.api.lncldglobal.com/1.1`
      : `https://${prefix}.lc-cn-n1-shared.lcapp.cn/1.1`;
  },
  _headers() {
    const c = this.cfg();
    return {
      'X-LC-Id': c.appId,
      'X-LC-Key': c.appKey,
      'Content-Type': 'application/json'
    };
  },

  /* ---------- 本地数据时间戳 ---------- */
  touchLocal() {
    localStorage.setItem('pigeon_data_ts', String(Date.now()));
  },
  localTs() { return Number(localStorage.getItem('pigeon_data_ts') || 0); },
  meta() {
    try { return JSON.parse(localStorage.getItem(this.META) || '{}'); } catch (e) { return {}; }
  },
  _setMeta(m) { localStorage.setItem(this.META, JSON.stringify(m)); },

  /* ---------- 打包 / 解包 ---------- */
  collect() {
    const data = {};
    Object.values(Storage.KEYS).forEach(k => { data[k] = Storage.get(k); });
    return {
      farm: JSON.stringify({ v: 2, ts: this.localTs(), data }),
      ts: this.localTs(),
      device: this._deviceName(),
      space: (this.cfg() || {}).space || 'default'
    };
  },
  _deviceName() {
    let n = localStorage.getItem('pigeon_device_name');
    if (!n) {
      n = '设备-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      localStorage.setItem('pigeon_device_name', n);
    }
    return n;
  },
  _applyCloud(record) {
    try {
      const payload = JSON.parse(record.farm);
      Object.keys(payload.data || {}).forEach(k => {
        localStorage.setItem(k, JSON.stringify(payload.data[k]));
      });
      this._setMeta({ objectId: record.objectId, ts: payload.ts || record.ts });
      return true;
    } catch (e) {
      console.error('云端数据解析失败', e);
      return false;
    }
  },

  /* ---------- 自动同步（Storage.set 后延迟触发） ---------- */
  schedule() {
    if (!this.isConfigured()) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push().catch(() => {}), 3000);
  },

  /* ---------- 核心：上传 ---------- */
  async push(silent) {
    if (!this.isConfigured()) throw new Error('未配置云端');
    const c = this.cfg();
    const meta = this.meta();
    const body = this.collect();

    let objectId = meta.objectId;
    if (!objectId) {
      // 先查云端有没有这条记录（别的设备可能已经建了）
      const q = await fetch(`${this.apiBase()}/classes/FarmState?order=-updatedAt&limit=1`, {
        headers: this._headers()
      });
      const jr = await q.json();
      const hit = (jr.results || []).find(r => r.space === c.space);
      if (hit) objectId = hit.objectId;
    }

    let res;
    if (objectId) {
      res = await fetch(`${this.apiBase()}/classes/FarmState/${objectId}`, {
        method: 'PUT', headers: this._headers(), body: JSON.stringify(body)
      });
    } else {
      res = await fetch(`${this.apiBase()}/classes/FarmState`, {
        method: 'POST', headers: this._headers(), body: JSON.stringify(body)
      });
    }
    if (!res.ok) throw new Error(`上传失败 HTTP ${res.status}`);
    const saved = await res.json();

    this._setMeta({ objectId: saved.objectId || objectId, ts: body.ts });
    c.lastPushAt = Date.now(); c.lastError = null;
    localStorage.setItem(this.CFG, JSON.stringify(c));
    if (!silent) Utils.toast('已上传到云端 ✓');
    return true;
  },

  /* ---------- 核心：下载 ---------- */
  async pull(silent) {
    if (!this.isConfigured()) throw new Error('未配置云端');
    const c = this.cfg();
    const q = await fetch(
      `${this.apiBase()}/classes/FarmState?where=${encodeURIComponent(JSON.stringify({ space: c.space }))}&order=-updatedAt&limit=1`,
      { headers: this._headers() }
    );
    if (!q.ok) throw new Error(`连接失败 HTTP ${q.status}`);
    const jr = await q.json();
    const hit = (jr.results || [])[0];
    if (!hit) throw new Error('云端还没有数据');

    const cloudTs = (() => { try { return JSON.parse(hit.farm).ts || 0; } catch (e) { return 0; } })();
    const localTs = this.localTs();
    if (localTs > cloudTs && !silent) {
      Utils.toast(`本机数据更新（${new Date(localTs).toLocaleString()}），未覆盖`);
      return false;
    }
    if (!this._applyCloud(hit)) throw new Error('云端数据解析失败');
    c.lastPullAt = Date.now(); c.lastError = null;
    localStorage.setItem(this.CFG, JSON.stringify(c));
    if (!silent) Utils.toast('已从云端恢复 ✓');
    return true;
  },

  /** 启动时静默双向同步：云端新则下载，本机新则上传 */
  async syncOnBoot() {
    if (!this.isConfigured()) return;
    try {
      const c = this.cfg();
      const q = await fetch(
        `${this.apiBase()}/classes/FarmState?where=${encodeURIComponent(JSON.stringify({ space: c.space }))}&order=-updatedAt&limit=1`,
        { headers: this._headers() }
      );
      if (!q.ok) throw new Error(`HTTP ${q.status}`);
      const jr = await q.json();
      const hit = (jr.results || []).find(r => r.space === c.space);
      if (!hit) { await this.push(true); return; }

      const cloudTs = (() => { try { return JSON.parse(hit.farm).ts || 0; } catch (e) { return 0; } })();
      if (cloudTs > this.localTs()) {
        this._applyCloud(hit);
        c.lastPullAt = Date.now();
      } else {
        await this.push(true);
      }
      c.lastError = null;
      localStorage.setItem(this.CFG, JSON.stringify(c));
    } catch (e) {
      const c = this.cfg() || {};
      c.lastError = String(e.message || e);
      localStorage.setItem(this.CFG, JSON.stringify(c));
    }
  },

  /** 重新渲染当前页面（同步后刷新界面） */
  rerender() {
    if (typeof App !== 'undefined' && App.currentTab) App.switchTab(App.currentTab, false);
  }
};
