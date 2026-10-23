/* ============================================================
   我的花园页面
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const Spr = global.WG.sprite;
  const page = {};
  let gardenScene = null;

  function plotHtml(plot) {
    const cs = S.cropState(plot);
    const seed = plot.seedId ? D.SEED_MAP[plot.seedId] : null;
    if (cs.status === 'locked') {
      return '<div class="plot locked" data-plot="' + plot.id + '">' +
        '<div class="plot-top"><span class="plot-idx">' + (plot.id + 1) + '</span></div>' +
        '<div class="plot-empty-plus" style="font-size:22px">🔒</div>' +
        '<div class="plot-empty-txt">花园 Lv' + nextUnlockLevel(plot.id) + ' 解锁</div></div>';
    }
    if (cs.status === 'empty') {
      return '<div class="plot empty ' + plot.type + '" data-plot="' + plot.id + '">' +
        '<div class="plot-top"><span class="plot-idx">' + (plot.id + 1) + '</span>' +
        '<span style="font-size:9.5px;color:#a9b1a4">' + (plot.type === 'veg' ? '菜地' : '花圃') + '</span></div>' +
        '<div class="plot-empty-plus">＋</div>' +
        '<div class="plot-empty-txt">点击播种</div></div>';
    }

    const isMature = cs.status === 'mature';
    const isWither = cs.status === 'withered';
    let badge = '';
    if (isMature) badge = '<span class="plot-badge harvest">可收获</span>';
    else if (isWither) badge = '<span class="plot-badge wither">已枯萎</span>';
    else if (seed.tier === 3) badge = '<span class="plot-badge" style="background:#dd8f2c">珍稀</span>';
    else if (seed.tier === 2) badge = '<span class="plot-badge" style="background:#6aa9d6">稀有</span>';

    // 状态图标：变异 / 杂草 / 虫害
    let statusIcons = '';
    if (plot.mutated) statusIcons += '<span class="plot-status-ic" title="✨变异·积分翻倍">✨</span>';
    if (plot.weed) statusIcons += '<span class="plot-status-ic" title="🌿杂草·减缓生长15%">🌿</span>';
    if (plot.pest) statusIcons += '<span class="plot-status-ic" title="🐛虫害·减缓生长15%">🐛</span>';

    let timer = '';
    if (isMature) timer = '<div class="plot-timer">余 ' + U.fmtTime(cs.harvestLeft) + ' 收获</div>';
    else if (isWither) timer = '<div class="plot-timer">超时未收获</div>';
    else timer = '<div class="plot-timer">剩余 <span data-ts="' + plot.matureAt + '">' + U.fmtTime(cs.remain) + '</span></div>';

    const prog = (!isMature && !isWither)
      ? '<div class="plot-progress"><i data-start="' + plot.plantedAt + '" data-end="' + plot.matureAt + '" style="width:' + cs.pct + '%"></i></div>'
      : '<div class="plot-progress"><i style="width:100%;' + (isWither ? 'background:#b9bfb4' : 'background:linear-gradient(90deg,#f8dc9a,#e8a93c)') + '"></i></div>';

    return '<div class="plot ' + plot.type + (isMature ? ' mature' : '') + (isWither ? ' withered' : '') + (cs.status === 'seed' ? ' seed' : '') +
      (plot.mutated ? ' mutated' : '') + '" data-plot="' + plot.id + '">' +
      '<div class="plot-top"><span class="plot-idx">' + (plot.id + 1) + '</span>' + badge + statusIcons + '</div>' +
      '<div class="plot-ic">' + seed.icon + '</div>' +
      '<div class="plot-name">' + seed.name + '</div>' +
      timer + prog +
      '</div>';
  }

  function nextUnlockLevel(plotId) {
    for (let i = 0; i < D.GARDEN_LEVELS.length; i++) {
      if (D.GARDEN_LEVELS[i].plots > plotId) return D.GARDEN_LEVELS[i].lv;
    }
    return 15;
  }

  page.render = function (root) {
    const st = S.get();
    const g = st.garden;
    const def = S.gardenDef();
    const next = S.nextGardenLevel();
    const shieldLeft = g.shieldUntil > U.now() ? (g.shieldUntil - U.now()) / 1000 : 0;
    const cols = U.$('#view').clientWidth > 1100 ? 6 : 5;
    const weather = S.todayWeather();
    const scholarLeft = S.scholarActive() ? (st.learn.scholarBuffUntil - U.now()) / 1000 : 0;
    const weedCount = st.garden.plots.filter(function (p) { return p.weed; }).length;
    const pestCount = st.garden.plots.filter(function (p) { return p.pest; }).length;
    const ck = S.checkinInfo();

    const pct = next ? U.clamp(g.exp / next.exp * 100, 0, 100) : 100;

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🌻 我的花园</div>' +
      '<div class="page-sub">播种 · 浇水 · 收获 · 偷菜，全靠单词积分养成</div><div class="spacer"></div>' +
      '<span class="weather-chip" style="background:' + weather.color + '22;border-color:' + weather.color + '55">' +
        weather.icon + ' ' + weather.name + ' · ' + weather.desc + '</span>' +
      (scholarLeft > 0 ? '<span class="weather-chip" style="background:#fff0e0;border-color:#f0b96a">🎓 学霸暴击 ' + U.fmtDur(scholarLeft) + '</span>' : '') +
      '<button class="btn btn-sm" id="gBag">🎒 花园背包</button>' +
      '<button class="btn btn-sm" id="gAlbum">📖 作物图鉴</button>' +
      '<button class="btn btn-sm" id="gDeco">🎨 花园装扮</button></div>' +

      '<div class="garden-hero">' +
      '<div class="garden-hero-title">' + st.profile.avatar + ' ' + U.esc(st.profile.nickname || '我的花园') +
      '<span class="lv-tag">花园 Lv' + g.level + '</span>' +
      (shieldLeft > 0 ? '<span class="shield-on">🛡️ 防护中 ' + U.fmtDur(shieldLeft) + '</span>' : '') +
      '</div>' +
      '<div class="garden-hero-meta">' +
      '<div class="gm"><b>' + U.fmtNum(g.exp) + '</b><span>花园经验' + (next ? ' / ' + next.exp : '') + '</span></div>' +
      '<div class="gm"><b>' + g.todayHarvest + '</b><span>今日收获</span></div>' +
      '<div class="gm"><b>' + g.todayHelp + '/' + S.helpLimit() + '</b><span>今日互助</span></div>' +
      '<div class="gm"><b>' + Math.max(0, S.stealLimit() - (st.steals.total || 0)) + '</b><span>剩余偷菜次数</span></div>' +
      '<div class="gm"><b>' + S.unlockedPlots() + '/30</b><span>已解锁地块</span></div>' +
      (weedCount || pestCount ? '<div class="gm"><b>' + weedCount + '🌿 ' + pestCount + '🐛</b><span>待清理</span></div>' : '') +
      '</div>' +
      '<div class="bar green" style="margin-top:12px;max-width:460px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="bar-meta" style="max-width:460px"><span>下一等级：' + (next ? 'Lv' + next.lv + ' · ' + next.perk : '已满级，专属荣誉铭牌已解锁') + '</span><span>' + Math.floor(pct) + '%</span></div>' +
      '</div>' +

      '<div class="canvas-stage" style="height:160px"><canvas id="gardenCanvas" width="800" height="160"></canvas></div>' +

      '<div class="plot-legend">' +
      '<span><i class="legend-dot" style="background:#cfe6b6"></i>蔬菜种植区</span>' +
      '<span><i class="legend-dot" style="background:#f8ccd7"></i>花卉种植区</span>' +
      '<span><i class="legend-dot" style="background:#ffd88a"></i>可收获</span>' +
      '<span><i class="legend-dot" style="background:#c9cec3"></i>已枯萎</span>' +
      '<span>✨变异</span><span>🌿杂草</span><span>🐛虫害</span>' +
      '<span style="margin-left:auto">作物加速 ' + S.buffs().grow + '%</span>' +
      '</div>' +

      '<div class="plots-wrap" style="--cols:' + cols + '">' +
      st.garden.plots.map(plotHtml).join('') +
      '</div>' +

      '<div class="toolbar">' +
      '<button class="btn btn-gold btn-sm checkin-btn' + (ck.signed ? ' signed' : ' pulse') + '" id="gCheckin">' +
        '📅 每日签到' + (ck.signed ? '<span class="tb-badge ok">已签</span>' : '<span class="tb-badge">待签</span>') + '</button>' +
      '<button class="btn btn-primary btn-sm" id="gSowAll">🌾 一键播种</button>' +
      '<button class="btn btn-blue btn-sm" id="gWaterAll">💧 一键浇水</button>' +
      '<button class="btn btn-sm" id="gFertAll">🌱 一键施肥</button>' +
      '<button class="btn btn-sm" id="gWeedAll">🌿 一键除草' + (weedCount ? '（' + weedCount + '）' : '') + '</button>' +
      '<button class="btn btn-sm" id="gPestAll">🐛 一键除虫' + (pestCount ? '（' + pestCount + '）' : '') + '</button>' +
      '<button class="btn btn-gold btn-sm" id="gHarvestAll">🧺 一键收获</button>' +
      '<button class="btn btn-sm" id="gShield">🛡️ 守护卡</button>' +
      '<button class="btn btn-sm" id="gBlindbox">🎁 每日盲盒</button>' +
      '<div class="tb-label">浇水/施肥各缩短 12% 生长（上限 3 次）· 杂草/虫害各减缓 15%，清理后恢复</div>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🌱</span>可种植作物一览' +
      '<span class="ct-more" id="gGoShop">去商城兑换种子 →</span></div>' +
      '<div class="seed-grid">' + D.SEEDS.map(function (s) {
        const ok = S.seedUnlocked(s.id);
        return '<div class="seed-opt' + (ok ? '' : ' dis') + '" data-seedinfo="' + s.id + '">' +
          '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
          '<div class="so-ms">' + D.TIER_NAME[s.tier] + '·' + (s.type === 'veg' ? '蔬菜' : '花卉') + '</div>' +
          '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
          '<div class="so-pt' + (ok ? ' learn' : '') + '">' + (ok ? '📚 ' + s.cost : '花园 Lv' + s.unlockLevel) + '</div></div>';
      }).join('') + '</div></div>';

    UI._matSnapshot = st.garden.plots.map(function (p) { return p.seedId ? S.cropState(p).status : 'empty'; }).join(',');

    bind(root);
  };

  function bind(root) {
    // 初始化花园 Canvas 场景层
    initGardenScene(root);

    U.$$('.plot', root).forEach(function (el) {
      el.addEventListener('click', function () { openPlot(Number(el.dataset.plot)); });
    });
    U.$('#gBag', root).addEventListener('click', bagModal);
    U.$('#gDeco', root).addEventListener('click', decoModal);
    U.$('#gAlbum', root).addEventListener('click', albumModal);
    U.$('#gCheckin', root).addEventListener('click', function () { UI.checkinModal(); });
    U.$('#gSowAll', root).addEventListener('click', function () { sowModal(null); });
    U.$('#gWaterAll', root).addEventListener('click', function () {
      const r = S.waterAll();
      U.toast(r.ok ? '一键浇水完成，共 ' + r.count + ' 块地' : '没有可浇水的作物或浇水壶不足', r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
    U.$('#gFertAll', root).addEventListener('click', function () {
      const r = S.fertilizeAll();
      U.toast(r.ok ? '一键施肥完成，共 ' + r.count + ' 块地' : '没有可施肥的作物或肥料不足', r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
    U.$('#gWeedAll', root).addEventListener('click', function () {
      const r = S.clearWeedAll();
      U.toast(r.ok ? '一键除草完成，共清理 ' + r.count + ' 块地' : '没有需要除草的地块', r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
    U.$('#gPestAll', root).addEventListener('click', function () {
      const r = S.clearPestAll();
      U.toast(r.ok ? '一键除虫完成，共清理 ' + r.count + ' 块地' : '没有需要除虫的地块', r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
    U.$('#gHarvestAll', root).addEventListener('click', function (e) {
      const r = S.harvestAll();
      if (!r.count) { U.toast('还没有成熟或枯萎的作物', 'bad'); return; }
      U.floatText(e.target, '+' + U.fmtNum(r.points) + ' 积分', 'green');
      U.toast('一键收获 ' + r.count + ' 块地：+' + U.fmtNum(r.points) + ' 积分 +' + r.exp + ' 花园经验' +
        (r.items.length ? '，' + r.items.slice(0, 3).join('、') : '') + (r.withered ? '（含枯萎 ' + r.withered + ' 块）' : ''), 'gold');
      UI.refresh();
    });
    U.$('#gShield', root).addEventListener('click', function () {
      const r = S.useShield();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      UI.refresh();
    });
    U.$('#gBlindbox', root).addEventListener('click', blindBoxModal);
    U.$('#gGoShop', root).addEventListener('click', function () { UI.go('shop'); });
    U.$$('[data-seedinfo]', root).forEach(function (el) {
      el.addEventListener('click', function () { seedInfo(el.dataset.seedinfo); });
    });
  }

  function seedInfo(seedId) {
    const s = D.SEED_MAP[seedId];
    const ok = S.seedUnlocked(seedId);
    U.modal({
      title: s.name + ' · ' + D.TIER_NAME[s.tier] + (s.type === 'veg' ? '蔬菜' : '花卉'),
      icon: s.icon,
      body: '<div style="line-height:2">' +
        '<div>生长时长：<b>' + U.fmtDur(s.growSec) + '</b>（含加速后约 ' + U.fmtDur(s.growSec * (1 - S.buffs().grow / 100)) + '）</div>' +
        '<div>兑换价格：<b>' + s.cost + ' 积分</b></div>' +
        '<div>收获收益：<b>' + s.points + ' 积分</b> + ' + s.exp + ' 花园经验</div>' +
        '<div>回收价值：约 ' + Math.round(s.price * 0.6) + ' 积分</div>' +
        (s.drop ? '<div>额外掉落：<b>' + (D.ITEMS[s.drop] ? D.ITEMS[s.drop].name : s.drop) + '</b>（' + (s.tier === 3 ? '必定' : '约 70%') + ' 概率）</div>' : '') +
        '<div>解锁条件：' + (ok ? '<span style="color:#4f9e57">已解锁</span>' : '花园 Lv' + s.unlockLevel) + '</div>' +
        '</div>',
      footer: '<button class="btn" data-close>关闭</button>' + (ok ? '<button class="btn btn-primary" data-close id="siPlant">去播种</button>' : ''),
      onMount: function (box, close) {
        const b = U.$('#siPlant', box);
        if (b) b.addEventListener('click', function () { close(); sowModal(seedId); });
      }
    });
  }

  function openPlot(idx) {
    const st = S.get();
    const plot = st.garden.plots[idx];
    if (!plot) return;
    const cs = S.cropState(plot);
    if (cs.status === 'locked') {
      U.toast('该地块需要花园 Lv' + nextUnlockLevel(idx) + ' 解锁', 'bad');
      return;
    }
    if (cs.status === 'empty') { sowModal(null, idx); return; }

    const seed = D.SEED_MAP[plot.seedId];
    const actions = [];
    if (cs.status === 'growing' || cs.status === 'seed') {
      actions.push('<button class="btn btn-blue btn-sm" data-a="water"' + (S.inv('water') <= 0 || plot.water >= 3 ? ' disabled' : '') + '>💧 浇水 ×' + plot.water + '</button>');
      actions.push('<button class="btn btn-sm" data-a="fert"' + (S.inv('fertilizer') <= 0 || plot.fert >= 3 ? ' disabled' : '') + '>🌱 施肥 ×' + plot.fert + '</button>');
      actions.push('<button class="btn btn-gold btn-sm" data-a="speed"' + (S.inv('speedup') <= 0 ? ' disabled' : '') + '>⚡ 加速剂</button>');
      if (plot.weed) actions.push('<button class="btn btn-sm" data-a="weed">🌿 除草</button>');
      if (plot.pest) actions.push('<button class="btn btn-sm" data-a="pest">🐛 除虫</button>');
      actions.push('<button class="btn btn-sm" data-a="clear" style="color:#c05a44">🧹 铲地</button>');
    }
    if (cs.status === 'mature') actions.push('<button class="btn btn-primary btn-sm" data-a="harvest">🧺 立即收获</button>');
    if (cs.status === 'withered') actions.push('<button class="btn btn-sm" data-a="harvest">清理枯萎作物</button>');

    const warnLine = (plot.weed || plot.pest) ? '<div style="color:#c67b3f;font-size:11.5px;margin-top:6px">' +
      (plot.weed ? '🌿 杂草减缓 15% ' : '') + (plot.pest ? '🐛 虫害减缓 15% ' : '') + '· 清理后恢复生长速度</div>' : '';
    const mutLine = plot.mutated ? '<div style="color:#d4940a;font-size:11.5px;margin-top:4px">✨ 变异作物：收获时积分翻倍、经验 1.5 倍，掉落稀有种子</div>' : '';

    U.modal({
      title: ('第 ' + (idx + 1) + ' 块 · ' + (plot.type === 'veg' ? '蔬菜区' : '花卉区')),
      icon: seed.icon,
      body: '<div style="text-align:center;line-height:2">' +
        '<div style="font-size:34px">' + seed.icon + '</div>' +
        '<div style="font-size:17px;font-weight:800">' + seed.name + '<span class="tag" style="margin-left:6px">' + D.TIER_NAME[seed.tier] + '</span>' +
        (plot.mutated ? '<span class="tag" style="margin-left:4px;background:#fff3dc;color:#d4940a">✨变异</span>' : '') + '</div>' +
        '<div style="color:#8b968c;font-size:12px">' +
        (cs.status === 'mature' ? '已成熟，剩余 <b>' + U.fmtTime(cs.harvestLeft) + '</b> 后枯萎' :
          cs.status === 'withered' ? '已枯萎，仅可获得少量花园经验' :
            '生长进度 ' + cs.pct.toFixed(0) + '%，剩余 <span data-ts="' + plot.matureAt + '">' + U.fmtTime(cs.remain) + '</span>') +
        '</div>' +
        '<div style="color:#8b968c;font-size:12px">预计收益：' + seed.points + ' 积分 + ' + seed.exp + ' 花园经验</div>' +
        warnLine + mutLine +
        '</div>' +
        (actions.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:16px">' + actions.join('') + '</div>' : ''),
      footer: '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        U.$$('[data-a]', box).forEach(function (b) {
          b.addEventListener('click', function () {
            const act = b.dataset.a;
            let r;
            if (act === 'water') r = S.water(idx);
            else if (act === 'fert') r = S.fertilize(idx);
            else if (act === 'speed') r = S.speedup(idx);
            else if (act === 'weed') r = S.clearWeed(idx);
            else if (act === 'pest') r = S.clearPest(idx);
            else if (act === 'clear') r = S.clearPlot(idx);
            else r = S.harvest(idx);
            U.toast(r.msg || (r.ok ? '操作成功' : '操作失败'), r.ok ? 'good' : 'bad');
            if (r.ok && act === 'harvest') {
              const g = r.gained;
              if (g && g.points) U.floatText(b, '+' + g.points + ' 积分', 'green');
            }
            close();
            UI.refresh();
          });
        });
      }
    });
  }

  function sowModal(preselect, plotIdx) {
    const st = S.get();
    const typeFilter = (plotIdx != null) ? st.garden.plots[plotIdx].type : null;
    const list = D.SEEDS.filter(function (s) { return !typeFilter || s.type === typeFilter; });
    const seedId = preselect || st.garden.lastSeed;

    U.modal({
      title: plotIdx != null ? ('第 ' + (plotIdx + 1) + ' 块地 · 选择种子') : '一键播种 · 选择种子',
      icon: '🌾',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">' +
        (plotIdx != null ? '该地块为' + (typeFilter === 'veg' ? '蔬菜区' : '花卉区') + '，只能种植对应类型作物。' : '将自动在所有空余地块播种同类型作物。') +
        '播种消耗 📚 学习积分（背单词获得），若背包已有种子则优先使用库存。当前学习积分：<b style="color:#3d8fc0">' + U.fmtNum(st.learnPoints) + '</b></div>' +
        '<div class="seed-grid" id="soGrid">' + list.map(function (s) {
          const ok = S.seedUnlocked(s.id);
          const have = S.inv('seed_' + s.id);
          const canPay = st.learnPoints >= s.cost || have > 0;
          return '<div class="seed-opt' + (ok && canPay ? '' : ' dis') + '" data-pick="' + s.id + '" style="' + (s.id === seedId ? 'border-color:#7cc47f;background:#f4fceb' : '') + '">' +
            '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
            '<div class="so-ms">' + D.TIER_NAME[s.tier] + (have ? ' · 库存 ' + have : '') + '</div>' +
            '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
            '<div class="so-pt' + (ok ? ' learn' : '') + '">' + (ok ? (have ? '使用库存' : '📚 ' + s.cost + (canPay ? '' : ' · 不足')) : '花园 Lv' + s.unlockLevel) + '</div></div>';
        }).join('') + '</div>' +
        (S.inv('water') + S.inv('fertilizer') > 0 ? '<div style="font-size:11px;color:#8b968c;margin-top:10px">提示：你还有 ' + S.inv('water') + ' 个浇水壶、' + S.inv('fertilizer') + ' 份肥料，播种后可缩短生长时间。</div>' : ''),
      footer: '<button class="btn" data-close>取消</button>',
      onMount: function (box, close) {
        U.$$('[data-pick]', box).forEach(function (el) {
          el.addEventListener('click', function () {
            if (el.classList.contains('dis')) { U.toast('该种子尚未解锁，或学习积分不足（去单词中心背单词赚取）', 'bad'); return; }
            const sid = el.dataset.pick;
            if (plotIdx != null) {
              const r = S.plant(plotIdx, sid);
              U.toast(r.msg, r.ok ? 'good' : 'bad');
              if (r.ok) { close(); UI.refresh(); }
            } else {
              const r = S.sowAll(sid);
              U.toast(r.msg, r.ok ? 'good' : 'bad');
              if (r.ok) { close(); UI.refresh(); }
            }
          });
        });
      }
    });
  }

  function bagModal() {
    const st = S.get();
    const seeds = D.SEEDS.filter(function (s) { return S.inv('seed_' + s.id) > 0; });
    const crops = Object.keys(st.inventory).filter(function (k) { return k.indexOf('crop_') === 0 && st.inventory[k] > 0; });
    const others = Object.keys(st.inventory).filter(function (k) {
      return k.indexOf('crop_') !== 0 && k.indexOf('seed_') !== 0 && st.inventory[k] > 0 && D.ITEMS[k];
    });
    let recyclable = 0, cropCount = 0;
    crops.forEach(function (k) {
      const seed = D.SEED_MAP[k.replace('crop_', '')];
      if (seed) { recyclable += Math.round(seed.price * 0.6) * st.inventory[k]; cropCount += st.inventory[k]; }
    });
    if (st.inventory.decoShard) { recyclable += 6 * st.inventory.decoShard; cropCount += st.inventory.decoShard; }

    U.modal({
      title: '花园背包', icon: '🎒',
      body:
        '<div class="card-title" style="margin-bottom:8px"><span class="ct-ic">🌰</span>种子库存</div>' +
        (seeds.length ? '<div class="bag-grid">' + seeds.map(function (s) {
          return '<div class="bag-item"><div class="bi-ic">' + s.icon + '</div><div class="bi-nm">' + s.name + '种子</div>' +
            '<div class="bi-ct">×' + S.inv('seed_' + s.id) + '</div><div class="bi-price">' + D.TIER_NAME[s.tier] + '</div></div>';
        }).join('') + '</div>' : U.empty('暂无种子，去商城兑换吧', '🌰')) +
        '<div class="section-gap"></div>' +
        '<div class="card-title" style="margin-bottom:8px"><span class="ct-ic">🧺</span>收获作物' +
        (cropCount ? '<span class="ct-more" id="bagRecycle">一键回收（+' + recyclable + ' 积分）</span>' : '') + '</div>' +
        (crops.length ? '<div class="bag-grid">' + crops.map(function (k) {
          const seed = D.SEED_MAP[k.replace('crop_', '')];
          return '<div class="bag-item"><div class="bi-ic">' + (seed ? seed.icon : '🧺') + '</div>' +
            '<div class="bi-nm">' + (seed ? seed.name : '作物') + '</div><div class="bi-ct">×' + st.inventory[k] + '</div>' +
            '<div class="bi-price">回收 ' + (seed ? Math.round(seed.price * 0.6) : 0) + ' 积分/个</div></div>';
        }).join('') + '</div>' : U.empty('还没有收获的作物', '🧺')) +
        '<div class="section-gap"></div>' +
        '<div class="card-title" style="margin-bottom:8px"><span class="ct-ic">🎁</span>道具与材料</div>' +
        (others.length ? '<div class="bag-grid">' + others.map(function (k) {
          const it = D.ITEMS[k];
          return '<div class="bag-item"><div class="bi-ic">' + it.icon + '</div><div class="bi-nm">' + it.name + '</div>' +
            '<div class="bi-ct">×' + st.inventory[k] + '</div></div>';
        }).join('') + '</div>' : U.empty('暂无道具', '🎁')),
      footer: '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        const r = U.$('#bagRecycle', box);
        if (r) r.addEventListener('click', function () {
          const res = S.recycleAll();
          U.toast(res.ok ? '回收 ' + res.count + ' 个作物，获得 ' + res.points + ' 积分' : res.msg, res.ok ? 'gold' : 'bad');
          if (res.ok) { close(); UI.refresh(); }
        });
      }
    });
  }

  function decoModal() {
    const st = S.get();
    const owned = st.garden.decorations || [];
    U.modal({
      title: '花园装扮', icon: '🎨',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">收获稀有/珍稀花卉、在商城兑换装饰即可点亮收藏，装扮可提升花园经验。</div>' +
        '<div class="bag-grid">' + Object.keys(D.ITEMS).filter(function (k) { return D.ITEMS[k].cat === 'deco'; }).map(function (k) {
          const it = D.ITEMS[k];
          const has = owned.indexOf(k) >= 0;
          return '<div class="bag-item" style="' + (has ? 'border-color:#bfe0b4;background:#f7fcef' : 'opacity:.6') + '">' +
            '<div class="bi-ic">' + it.icon + '</div><div class="bi-nm">' + it.name + '</div>' +
            '<div class="bi-ct">' + (has ? '已拥有' : '未解锁') + '</div></div>';
        }).join('') + '</div>' +
        '<div class="section-gap"></div><div style="font-size:11.5px;color:#8b968c">装饰碎片来源：收获稀有花卉。也可通过商城积分兑换限定皮肤。</div>',
      footer: '<button class="btn" data-close>关闭</button>'
    });
  }

  function albumModal() {
    const st = S.get();
    const album = st.garden.album || {};
    const total = D.SEEDS.length;
    const collected = Object.keys(album).length;
    const pct = Math.round(collected / total * 100);
    U.modal({
      title: '作物图鉴（' + collected + '/' + total + '）', icon: '📖',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">收获作物自动收录图鉴，收集全部作物解锁「园艺大师」荣誉。</div>' +
        '<div class="bar green" style="margin-bottom:12px"><i style="width:' + pct + '%"></i></div>' +
        '<div class="bag-grid">' + D.SEEDS.map(function (s) {
          const n = album[s.id] || 0;
          const has = n > 0;
          return '<div class="bag-item" style="' + (has ? '' : 'opacity:.45;filter:grayscale(1)') + '">' +
            '<div class="bi-ic">' + s.icon + '</div><div class="bi-nm">' + s.name + '</div>' +
            '<div class="bi-ct">' + (has ? '×' + n : '未收录') + '</div>' +
            '<div class="bi-price">' + D.TIER_NAME[s.tier] + '·' + (s.type === 'veg' ? '蔬菜' : '花卉') + '</div></div>';
        }).join('') + '</div>',
      footer: '<button class="btn" data-close>关闭</button>'
    });
  }

  function blindBoxModal() {
    const info = S.blindBoxInfo();
    U.modal({
      title: '每日盲盒', icon: '🎁',
      body: '<div style="text-align:center;padding:10px 0">' +
        '<div style="font-size:56px">🎁</div>' +
        '<div style="font-size:15px;font-weight:800;margin-top:8px">' + (info.used ? '今日盲盒已开启' : '今日盲盒待开启') + '</div>' +
        '<div style="font-size:12px;color:#8b968c;margin-top:6px;line-height:1.8">奖励池：积分 5~20 · 普通/稀有种子 · 浇水壶/肥料/宠物粮 · 珍稀种子（低概率）</div>' +
        '</div>',
      footer: '<button class="btn" data-close>关闭</button>' +
        '<button class="btn btn-gold" id="bbOpen" ' + (info.used ? 'disabled' : '') + '>' +
        (info.used ? '明天再来' : '开启盲盒') + '</button>',
      onMount: function (box, close) {
        const b = U.$('#bbOpen', box);
        if (!b || info.used) return;
        b.addEventListener('click', function () {
          const r = S.openBlindBox();
          if (!r.ok) { U.toast(r.msg, 'bad'); return; }
          close();
          UI.refresh();
          U.modal({
            title: '盲盒开出惊喜', icon: '🎁',
            body: '<div class="ck-win"><div class="ck-win-ic" style="font-size:56px">' + r.reward.icon + '</div>' +
              '<div class="ck-win-nm">获得 ' + U.esc(r.reward.name) + '</div>' +
              '<div class="ck-win-sub">明天还能再来开一次哦</div></div>',
            footer: '<button class="btn btn-primary" data-close>收下</button>'
          });
        });
      }
    });
  }

  function initGardenScene(root) {
    const cvs = U.$('#gardenCanvas', root);
    if (!cvs || !Spr) return;
    if (gardenScene) { gardenScene.stop(); gardenScene = null; }

    gardenScene = new Spr.Scene(cvs, { bgFn: Spr.BACKGROUNDS.garden });

    // 几朵装饰花（ripe 状态，会微晃 + 闪光）
    const sunFlower = Spr.makeSprite(gardenScene, 'sunflower', {
      x: gardenScene.size.w * 0.18, y: gardenScene.size.h * 0.72, scale: 0.6, state: 'ripe', tag: 'deco'
    });
    sunFlower && gardenScene.addSprite(sunFlower);
    const rose = Spr.makeSprite(gardenScene, 'rose', {
      x: gardenScene.size.w * 0.52, y: gardenScene.size.h * 0.76, scale: 0.55, state: 'ripe', tag: 'deco'
    });
    rose && gardenScene.addSprite(rose);

    // 如果玩家花园有成熟作物，画几朵 ripe 作物（用 tomato）
    const ripePlots = S.get().garden.plots.filter(function (p) {
      const cs = S.cropState(p);
      return cs.status === 'mature';
    });
    if (ripePlots.length > 0) {
      const tomato = Spr.makeSprite(gardenScene, 'tomato', {
        x: gardenScene.size.w * 0.78, y: gardenScene.size.h * 0.74, scale: 0.5, state: 'ripe', tag: 'deco'
      });
      tomato && gardenScene.addSprite(tomato);
    } else {
      const cabbage = Spr.makeSprite(gardenScene, 'cabbage', {
        x: gardenScene.size.w * 0.78, y: gardenScene.size.h * 0.72, scale: 0.5, state: 'grow', tag: 'deco'
      });
      cabbage && gardenScene.addSprite(cabbage);
    }

    // 激活宠物 → 在花园里走动
    const pet = S.activePet();
    if (pet) {
      const pc = Spr.CREATURE_LIBRARY[pet.speciesId];
      if (pc) {
        const sheets = Spr.buildCreatureSheets({
          emoji: pc.emoji, states: pc.frames, size: pc.size
        });
        const petSprite = new Spr.Sprite(gardenScene, {
          sheets: sheets, frames: pc.frames,
          initState: 'idle',
          x: gardenScene.size.w * 0.35, y: gardenScene.size.h * 0.72,
          vx: 30, vy: 0, facing: 1,
          scale: 0.55, frameTime: 200,
          size: pc.size, tag: 'pet',
          onClick: function () {
            petSprite.say(pet.name + '说：今天花园好美~', 2200);
            petSprite.setState('happy', 800);
            petSprite.emote('❤️', 1000);
            gardenScene.burst(petSprite.x, petSprite.y - 20, {
              icons: ['❤️', '✨'], count: 5, life: 850
            });
          }
        });
        gardenScene.addSprite(petSprite);
        // 走走停停，偶尔看向指针
        gardenScene.addMachine(new Spr.StateMachine(petSprite, Spr.BEHAVIORS.pet({
          fullness: pet.fullness, speed: 40
        })));
      }
    }

    gardenScene.start();
  }

global.WG.ui.pages.garden = page;
})(window);
