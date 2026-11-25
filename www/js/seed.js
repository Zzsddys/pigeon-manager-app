/**
 * 示例种子数据 - 首次打开自动写入
 */
const SeedData = {
  write() {
    // 鸽舍
    Storage.setPens([
      { id: 'p1', name: '1号舍·种鸽区', type: 'breeding', capacity: 40 },
      { id: 'p2', name: '2号舍·育雏区', type: 'young', capacity: 60 },
      { id: 'p3', name: '3号舍·育肥区', type: 'fatten', capacity: 50 }
    ]);

    // 饲料种类（只保留实际使用的 4 种）
    Storage.setFeeds([
      { id: 'f1', name: '玉米', price: 2.8, unit: 'kg' },
      { id: 'f3', name: '豌豆', price: 4.5, unit: 'kg' },
      { id: 'f5', name: '保健砂', price: 1.2, unit: 'kg' },
      { id: 'f6', name: '高粱', price: 3.6, unit: 'kg' }
    ]);

    // 饲料库存
    Storage.setStock([
      { feedId: 'f1', qty: 200, updatedAt: this._daysAgo(2) },
      { feedId: 'f3', qty: 80,  updatedAt: this._daysAgo(5) },
      { feedId: 'f5', qty: 50,  updatedAt: this._daysAgo(10) },
      { feedId: 'f6', qty: 60,  updatedAt: this._daysAgo(3) }
    ]);

    // 种鸽
    Storage.setPigeons([
      { id: 'pg1', code: 'Z001', family: 'A1', gender: '公', breed: '王鸽', penId: 'p1', dob: this._daysAgo(400), status: 'breeder', weight: 620, notes: 'A+级种公' },
      { id: 'pg2', code: 'Z002', family: 'B1', gender: '母', breed: '王鸽', penId: 'p1', dob: this._daysAgo(380), status: 'breeder', weight: 580, notes: '配对 Z001' },
      { id: 'pg3', code: 'Z003', family: 'C1', gender: '公', breed: '石岐鸽', penId: 'p1', dob: this._daysAgo(500), status: 'breeder', weight: 550, notes: '' },
      { id: 'pg4', code: 'Z004', family: 'D1', gender: '母', breed: '石岐鸽', penId: 'p1', dob: this._daysAgo(480), status: 'breeder', weight: 520, notes: '配对 Z003' },
      { id: 'pg5', code: 'Y001', family: 'A1', gender: '未知', breed: '王鸽', penId: 'p2', dob: this._daysAgo(45), status: 'young',  weight: 320, notes: '育雏中' },
      { id: 'pg6', code: 'Y002', family: 'A1', gender: '未知', breed: '王鸽', penId: 'p2', dob: this._daysAgo(45), status: 'young',  weight: 310, notes: '' },
      { id: 'pg7', code: 'Y003', gender: '未知', breed: '石岐鸽', penId: 'p2', dob: this._daysAgo(30), status: 'young',  weight: 280, notes: '' },
      { id: 'pg8', code: 'Y004', gender: '未知', breed: '石岐鸽', penId: 'p2', dob: this._daysAgo(30), status: 'young',  weight: 275, notes: '' }
    ]);

    // 异常记录示例（Z003 感冒未恢复，用于演示异常/药费/硬性成本）
    Storage.setExceptions([
      { id: 'ex1', pigeonId: 'pg3', date: this._daysAgo(3), note: '感冒流涕', cost: 12, resolved: false, resolveDate: null, resolveCost: 0 }
    ]);

    // 繁殖记录
    Storage.setBreeds([
      {
        id: 'b1', maleId: 'pg1', femaleId: 'pg2', penId: 'p1',
        pairDate: this._daysAgo(180), layDate: this._daysAgo(170),
        hatchDate: this._daysAgo(148), fledgeDate: this._daysAgo(21),
        hatchCount: 2, surviveCount: 2, status: 'fledged',
        pigeonIds: ['pg5', 'pg6'], notes: '顺利出雏'
      },
      {
        id: 'b2', maleId: 'pg1', femaleId: 'pg2', penId: 'p1',
        pairDate: this._daysAgo(20), layDate: this._daysAgo(14),
        hatchDate: this._daysAgo(-2), fledgeDate: null,
        hatchCount: 2, surviveCount: 0, status: 'hatching',
        pigeonIds: [], notes: '蛋在孵化中'
      },
      {
        id: 'b3', maleId: 'pg3', femaleId: 'pg4', penId: 'p1',
        pairDate: this._daysAgo(10), layDate: null,
        hatchDate: null, fledgeDate: null,
        hatchCount: 0, surviveCount: 0, status: 'paired',
        pigeonIds: [], notes: '刚配对'
      }
    ]);

    // 饲料消耗记录（最近30天）
    const feedLog = [];
    for (let i = 0; i < 15; i++) {
      feedLog.push({
        id: 'fl' + i,
        date: this._daysAgo(i),
        feedId: 'f4',
        qty: (Math.random() * 10 + 20).toFixed(1),
        price: 5.8,
        penId: null,
        notes: '日常饲喂'
      });
    }
    Storage.setFeedLog(feedLog);

    // 出栏/销售记录
    Storage.setSales([
      {
        id: 's1', pigeonIds: ['pg5'], saleDate: this._daysAgo(60),
        weight: 500, price: 18, total: 18, buyer: '市场收购',
        notes: '王鸽青年鸽'
      },
      {
        id: 's2', pigeonIds: ['pg6'], saleDate: this._daysAgo(60),
        weight: 480, price: 18, total: 18, buyer: '市场收购',
        notes: ''
      },
      {
        id: 's3', pigeonIds: [], saleDate: this._daysAgo(5),
        weight: 0, price: 0, total: 648, buyer: '餐厅批量',
        notes: '批量出栏36只'
      }
    ]);

    // 配对计划 — 示例种子
    Storage.setPairPlans([
      {
        id: 'pp1', targetPairs: 6,
        deadlineDate: this._daysAgo(-15),
        createdAt: this._daysAgo(60), updatedAt: this._daysAgo(5)
      }
    ]);

    // 账目（手动收入/支出）— 示例种子
    Storage.setAccounts([
      { id: 'a1', type: 'income',  category: '销售',   amount: 360,  date: this._daysAgo(30), title: '零售10只成年鸽',      note: '' },
      { id: 'a2', type: 'expense', category: '药品',   amount: 280,  date: this._daysAgo(25), title: '新城疫疫苗 500羽',    note: '种鸽全群免疫' },
      { id: 'a3', type: 'expense', category: '人工',   amount: 1200, date: this._daysAgo(20), title: '兼职饲养员 10天',     note: '' },
      { id: 'a4', type: 'expense', category: '水电',   amount: 156,  date: this._daysAgo(15), title: '鸽舍水电 10月',       note: '' },
      { id: 'a5', type: 'income',  category: '其他收入', amount: 50, date: this._daysAgo(10), title: '鸽粪卖给种花户',      note: '' },
      { id: 'a6', type: 'expense', category: '设备',   amount: 880,  date: this._daysAgo(8),  title: '新购自动饮水器 10套', note: '' },
      { id: 'a7', type: 'expense', category: '维修',   amount: 200,  date: this._daysAgo(3),  title: '鸽舍铁丝网修补',      note: '' }
    ]);
  },

  /* ============================================================
     投喂系统测试数据（真实养殖场景，只写入一次）
     覆盖：空怀 / 下1个蛋 / 孵化2蛋 / 带仔各阶段 / 出栏后空怀 / 青年鸽群
     ============================================================ */
  ensureFeedingTest() {
    if (localStorage.getItem('pigeon_feeding_test_v1')) return;

    const pigeons = Storage.getPigeons();
    const breeds = Storage.getBreeds();

    const plan = [
      { m: 'Z101', f: 'Z102', breed: '王鸽',   egg: 0, status: 'paired',   pair: -18, label: '空怀待配' },
      { m: 'Z103', f: 'Z104', breed: '石岐鸽', egg: 1, status: 'hatching', pair: -22, lay: -1, label: '已下1个蛋' },
      { m: 'Z105', f: 'Z106', breed: '白羽王', egg: 2, status: 'hatching', pair: -30, lay: -5, lay2: -3, label: '已下2个蛋·孵化' },
      { m: 'Z107', f: 'Z108', breed: '王鸽',   egg: 2, status: 'fledged',  pair: -45, lay: -23, hatch: -1,  survive: 2, label: '带仔1天' },
      { m: 'Z109', f: 'Z110', breed: '石岐鸽', egg: 2, status: 'fledged',  pair: -48, lay: -26, hatch: -4,  survive: 2, label: '带仔4天' },
      { m: 'Z111', f: 'Z112', breed: '白羽王', egg: 2, status: 'fledged',  pair: -52, lay: -30, hatch: -8,  survive: 2, label: '带仔8天' },
      { m: 'Z113', f: 'Z114', breed: '王鸽',   egg: 2, status: 'fledged',  pair: -57, lay: -35, hatch: -13, survive: 1, label: '带仔13天' },
      { m: 'Z115', f: 'Z116', breed: '石岐鸽', egg: 2, status: 'fledged',  pair: -62, lay: -40, hatch: -18, survive: 2, label: '带仔18天' },
      { m: 'Z117', f: 'Z118', breed: '白羽王', egg: 2, status: 'fledged',  pair: -67, lay: -45, hatch: -23, survive: 2, label: '带仔23天' },
      { m: 'Z119', f: 'Z120', breed: '王鸽',   egg: 0, status: 'sold',     pair: -95, lay: -75, hatch: -55, fledge: -20, survive: 2, label: '出栏后空怀' }
    ];

    plan.forEach((p, i) => {
      const mid = 'tfz' + (i * 2 + 1);
      const fid = 'tfz' + (i * 2 + 2);
      const fam = String.fromCharCode(65 + i) + '1'; // A1 B1 C1…
      if (!pigeons.some(x => x.id === mid)) {
        pigeons.push({ id: mid, code: p.m, family: fam, gender: '公', breed: p.breed, penId: 'p1', dob: this._daysAgo(520 + i * 21), status: 'breeder', weight: 620 + (i % 4) * 15, notes: '配对 ' + p.f });
        pigeons.push({ id: fid, code: p.f, family: String.fromCharCode(75 + i) + '1', gender: '母', breed: p.breed, penId: 'p1', dob: this._daysAgo(480 + i * 17), status: 'breeder', weight: 560 + (i % 3) * 18, notes: '配对 ' + p.m });
      }
      if (!breeds.some(b => b.id === 'tb' + (i + 1))) {
        breeds.push({
          id: 'tb' + (i + 1), maleId: mid, femaleId: fid, penId: 'p1',
          pairDate: this._daysAgo(-p.pair),
          layDate: p.lay ? this._daysAgo(-p.lay) : null,
          secondEggDate: p.lay2 ? this._daysAgo(-p.lay2) : null,
          hatchDate: p.hatch ? this._daysAgo(-p.hatch) : null,
          fledgeDate: p.fledge ? this._daysAgo(-p.fledge) : null,
          eggCount: p.egg, hatchCount: p.egg,
          surviveCount: p.survive || 0,
          status: p.status, pigeonIds: [],
          notes: p.label, feedingSeed: true
        });
      }
    });

    // 青年鸽（育雏区）
    const youngSeeds = [
      ['TY001', 28, 360], ['TY002', 33, 375], ['TY003', 38, 392], ['TY004', 42, 405],
      ['TY005', 47, 418], ['TY006', 52, 430], ['TY007', 58, 445], ['TY008', 63, 452]
    ];
    youngSeeds.forEach(([code, days, weight]) => {
      if (!pigeons.some(x => x.code === code)) {
        pigeons.push({ id: 'tfy_' + code, code, gender: '未知', breed: code.endsWith('8') ? '石岐鸽' : '王鸽', penId: 'p2', dob: this._daysAgo(days), status: 'young', weight, notes: '青年鸽' });
      }
    });

    // 育肥待出栏（育肥区）
    const fatSeeds = [
      ['TF001', 72, 480], ['TF002', 76, 492], ['TF003', 80, 505], ['TF004', 84, 515]
    ];
    fatSeeds.forEach(([code, days, weight]) => {
      if (!pigeons.some(x => x.code === code)) {
        pigeons.push({ id: 'tff_' + code, code, gender: '未知', breed: '白羽王', penId: 'p3', dob: this._daysAgo(days), status: 'fattening', weight, notes: '育肥待出栏' });
      }
    });

    // 未配对种鸽（按青年鸽标准投喂）
    // Z131/Z132 预填同一个家号 A1，用于演示「同家号禁止配对」
    [['Z131', '公', 'A1'], ['Z132', '母', 'A1']].forEach(([code, gender, fam], i) => {
      if (!pigeons.some(x => x.code === code)) {
        pigeons.push({ id: 'tfu_' + code, code, family: fam, gender, breed: '王鸽', penId: 'p1', dob: this._daysAgo(300 + i * 30), status: 'breeder', weight: gender === '公' ? 590 : 530, notes: '未配对，按青年鸽投喂' });
      }
    });

    Storage.setPigeons(pigeons);
    Storage.setBreeds(breeds);

    // 生成最近 7 天的真实投喂记录（今天留给用户操作测试）
    this._seedFeedingLogs();

    localStorage.setItem('pigeon_feeding_test_v1', '1');
  },

  _seedFeedingLogs() {
    if (typeof Feeding === 'undefined') return;
    for (let i = 7; i >= 1; i--) {
      const date = this._daysAgo(i);
      ['am', 'pm'].forEach(meal => {
        Feeding.targetsFor(date, meal).forEach(t => Feeding.feed(t, date, meal));
      });
    }
  },

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  },

  _buildAccounts() {
    return [
      { id: 'a1', type: 'income',  category: '销售',     amount: 360,  date: this._daysAgo(30), title: '零售10只成年鸽',    note: '' },
      { id: 'a2', type: 'expense', category: '药品',     amount: 280,  date: this._daysAgo(25), title: '新城疫疫苗 500羽',  note: '种鸽全群免疫' },
      { id: 'a3', type: 'expense', category: '人工',     amount: 1200, date: this._daysAgo(20), title: '兼职饲养员 10天',   note: '' },
      { id: 'a4', type: 'expense', category: '水电',     amount: 156,  date: this._daysAgo(15), title: '鸽舍水电 10月',     note: '' },
      { id: 'a5', type: 'income',  category: '其他收入', amount: 50,   date: this._daysAgo(10), title: '鸽粪卖给种花户',    note: '' },
      { id: 'a6', type: 'expense', category: '设备',     amount: 880,  date: this._daysAgo(8),  title: '新购自动饮水器 10套', note: '' },
      { id: 'a7', type: 'expense', category: '维修',     amount: 200,  date: this._daysAgo(3),  title: '鸽舍铁丝网修补',    note: '' }
    ];
  }
};
