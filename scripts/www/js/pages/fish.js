/* ============================================================
   鱼塘页面
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const Spr = global.WG.sprite;
  let fishScene = null;
  const page = {};

  function pondHtml(pond) {
    const cs = S.fishState(pond);
    const fish = pond.fishId ? D.FISH_MAP[pond.fishId] : null;
    if (cs.status === 'locked') {
      return '<div class="pond locked" data-pond="' + pond.id + '">' +
        '<div class="pond-idx">' + (pond.id + 1) + '</div>' +
        '<div class="pond-empty-plus" style="font-size:22px">🔒</div>' +
        '<div class="pond-empty-txt">鱼池 Lv' + nextUnlockLevel(pond.id) + ' 解锁</div></div>';
    }
    if (cs.status === 'empty') {
      return '<div class="pond empty" data-pond="' + pond.id + '">' +
        '<div class="pond-idx">' + (pond.id + 1) + '</div>' +
        '<div class="pond-empty-plus">＋</div>' +
        '<div class="pond-empty-txt">点击放鱼</div></div>';
    }
    const isMature = cs.status === 'mature';
    const isEscaped = cs.status === 'escaped';
    let badge = '';
    if (isMature) badge = '<span class="pond-badge harvest">可收获</span>';
    else if (isEscaped) badge = '<span class="pond-badge wither">已逃走</span>';
    else if (fish.tier === 3) badge = '<span class="pond-badge" style="background:#dd8f2c">珍稀</span>';
    else if (fish.tier === 2) badge = '<span class="pond-badge" style="background:#6aa9d6">稀有</span>';

    let timer = '';
    if (isMature) timer = '<div class="pond-timer">余 ' + U.fmtTime(cs.harvestLeft) + ' 收获</div>';
    else if (isEscaped) timer = '<div class="pond-timer">超时未收获</div>';
    else timer = '<div class="pond-timer">剩余 <span data-ts="' + pond.matureAt + '">' + U.fmtTime(cs.remain) + '</span></div>';

    const prog = (!isMature && !isEscaped)
      ? '<div class="pond-progress"><i data-start="' + pond.stockedAt + '" data-end="' + pond.matureAt + '" style="width:' + cs.pct + '%"></i></div>'
      : '<div class="pond-progress"><i style="width:100%;' + (isEscaped ? 'background:#b9bfb4' : 'background:linear-gradient(90deg,#9fd6ef,#5aa9d6)') + '"></i></div>';

    return '<div class="pond' + (isMature ? ' mature' : '') + (isEscaped ? ' escaped' : '') + '" data-pond="' + pond.id + '">' +
      '<div class="pond-top"><span class="pond-idx">' + (pond.id + 1) + '</span>' + badge +
      (pond.feed ? '<span class="plot-status-ic" title="已投喂 ' + pond.feed + ' 次">🍽️</span>' : '') + '</div>' +
      '<div class="pond-ic">' + fish.icon + '</div>' +
      '<div class="pond-name">' + fish.name + '</div>' +
      timer + prog + '</div>';
  }

  function nextUnlockLevel(pondId) {
    for (let i = 0; i < D.FISH_POND_LEVELS.length; i++) {
      if (D.FISH_POND_LEVELS[i].slots > pondId) return D.FISH_POND_LEVELS[i].lv;
    }
    return 10;
  }

  page.render = function (root) {
    const st = S.get();
    const f = st.fish;
    const def = S.fishDef();
    const next = S.nextFishLevel();
    const cols = U.$('#view').clientWidth > 1100 ? 6 : 5;
    const shieldLeft = f.shieldUntil > U.now() ? (f.shieldUntil - U.now()) / 1000 : 0;
    const matureCount = f.ponds.filter(function (p) { return S.fishState(p).status === 'mature'; }).length;
    const pct = next ? U.clamp(f.exp / next.exp * 100, 0, 100) : 100;

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🐟 欢乐鱼塘</div>' +
      '<div class="page-sub">放养鱼苗 · 投喂加速 · 收获鲜鱼，还能去好友家捞鱼</div><div class="spacer"></div>' +
      (shieldLeft > 0 ? '<span class="weather-chip" style="background:#e0f0ff;border-color:#7bc4e8">🛡️ 防护中 ' + U.fmtDur(shieldLeft) + '</span>' : '') +
      '<button class="btn btn-sm" id="fBag">🎒 鱼塘背包</button></div>' +

      '<div class="garden-hero">' +
      '<div class="garden-hero-title">🌊 我的鱼塘<span class="lv-tag">鱼池 Lv' + f.level + '</span></div>' +
      '<div class="garden-hero-meta">' +
      '<div class="gm"><b>' + U.fmtNum(f.exp) + '</b><span>鱼池经验' + (next ? ' / ' + next.exp : '') + '</span></div>' +
      '<div class="gm"><b>' + f.todayHarvest + '</b><span>今日收获</span></div>' +
      '<div class="gm"><b>' + S.fishSlots() + '/12</b><span>已解锁鱼池</span></div>' +
      (matureCount ? '<div class="gm"><b style="color:#5aa9d6">' + matureCount + '</b><span>可收获</span></div>' : '') +
      '</div>' +
      '<div class="bar blue" style="margin-top:12px;max-width:460px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="bar-meta" style="max-width:460px"><span>下一等级：' + (next ? 'Lv' + next.lv + ' · ' + next.perk : '已满级，专属荣誉铭牌已解锁') + '</span><span>' + Math.floor(pct) + '%</span></div>' +
      '</div>' +      '<div class="canvas-stage" style="height:150px"><canvas id="fishCanvas" width="800" height="150"></canvas></div>' +



      '<div class="plots-wrap" style="--cols:' + cols + '">' +
      f.ponds.map(pondHtml).join('') +
      '</div>' +

      '<div class="toolbar">' +
      '<button class="btn btn-blue btn-sm" id="fStockAll">🐟 一键放鱼</button>' +
      '<button class="btn btn-sm" id="fFeedAll">🍽️ 一键投喂</button>' +
      '<button class="btn btn-gold btn-sm" id="fHarvestAll">🧺 一键收获' + (matureCount ? '（' + matureCount + '）' : '') + '</button>' +
      '<button class="btn btn-sm" id="fSpeedAll">🫧 增氧剂</button>' +
      '<button class="btn btn-sm" id="fShield">🛡️ 防护网</button>' +
      '<div class="tb-label">投喂鱼食缩短 12% 生长（每池上限 3 次）· 超时未收获鱼会逃走</div>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🐟</span>可放养鱼种一览' +
      '<span class="ct-more" id="fGoShop">去商城兑换鱼苗 →</span></div>' +
      '<div class="seed-grid">' + D.FISH_SPECIES.map(function (s) {
        const ok = S.fishUnlocked(s.id);
        return '<div class="seed-opt' + (ok ? '' : ' dis') + '" data-fishinfo="' + s.id + '">' +
          '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
          '<div class="so-ms">' + D.TIER_NAME[s.tier] + ' · 鱼种</div>' +
          '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
          '<div class="so-pt' + (ok ? ' learn' : '') + '">' + (ok ? '📚 ' + s.cost : '鱼池 Lv' + s.unlockLevel) + '</div></div>';
      }).join('') + '</div></div>';

    bind(root);
  };

  function bind(root) {
    initFishScene(root);
    U.$$('.pond', root).forEach(function (el) {
      el.addEventListener('click', function () { openPond(Number(el.dataset.pond)); });
    });
    U.$('#fBag', root).addEventListener('click', bagModal);
    U.$('#fGoShop', root).addEventListener('click', function () { UI.go('shop'); });
    U.$$('[data-fishinfo]', root).forEach(function (el) {
      el.addEventListener('click', function () { fishInfo(el.dataset.fishinfo); });
    });
    U.$('#fStockAll', root).addEventListener('click', function () { stockModal(null); });
    U.$('#fFeedAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.fish.ponds.forEach(function (p) {
        if (p.fishId && (S.fishState(p).status === 'fry' || S.fishState(p).status === 'growing') && p.feed < 3 && S.inv('fishFood') > 0) {
          if (S.feedFish(p.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '一键投喂完成，共 ' + cnt + ' 个鱼池' : '没有可投喂的鱼池或鱼食不足', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#fHarvestAll', root).addEventListener('click', function () {
      const r = S.harvestAllFish();
      U.toast(r.count ? '收获 ' + r.count + ' 条鱼，积分 +' + r.points + (r.escaped ? '，' + r.escaped + ' 条已逃走' : '') : '没有可收获的鱼', r.count ? 'good' : 'bad');
      if (r.count) UI.refresh();
    });
    U.$('#fSpeedAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.fish.ponds.forEach(function (p) {
        if (p.fishId && S.fishState(p).status !== 'mature' && S.inv('fishSpeed') > 0) {
          if (S.speedFish(p.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '增氧剂已对 ' + cnt + ' 个鱼池使用' : '没有可用增氧剂', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#fShield', root).addEventListener('click', function () {
      const r = S.fishShield();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
  }

  function openPond(pondIdx) {
    const pond = S.state.fish.ponds[pondIdx];
    if (pondIdx >= S.fishSlots()) { U.toast('鱼池尚未解锁', 'bad'); return; }
    const cs = S.fishState(pond);
    if (cs.status === 'empty') { stockModal(pondIdx); return; }
    const fish = D.FISH_MAP[pond.fishId];
    let actions = '';
    if (cs.status === 'mature' || cs.status === 'escaped') {
      actions = '<button class="btn btn-gold" id="pondHarvest">🧺 收获</button>';
    } else {
      actions = '<button class="btn" id="pondFeed">🍽️ 投喂（' + pond.feed + '/3）</button>' +
        '<button class="btn" id="pondSpeed">🫧 增氧剂</button>';
    }
    U.modal({
      title: '鱼池 ' + (pondIdx + 1) + ' · ' + fish.name, icon: fish.icon,
      body: '<div style="padding:4px 2px;line-height:1.8">' +
        '<div>状态：' + (cs.status === 'mature' ? '✅ 已成熟' : cs.status === 'escaped' ? '💨 已逃走' : '🌊 生长中（' + Math.floor(cs.pct) + '%）') + '</div>' +
        '<div>预计产出：' + fish.points + ' 积分，鱼池经验 +' + fish.exp + '</div>' +
        (cs.remain ? '<div>剩余时间：' + U.fmtTime(cs.remain) + '</div>' : '') +
        (fish.drop ? '<div>稀有掉落：' + (D.ITEMS[fish.drop] ? D.ITEMS[fish.drop].name : fish.drop) + '</div>' : '') +
        '</div>',
      footer: actions + '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        const h = U.$('#pondHarvest', box);
        if (h) h.addEventListener('click', function () {
          const r = S.harvestFish(pondIdx);
          U.toast(r.ok ? ('收获 ' + fish.name + '，积分 +' + r.gained.points) : r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const fd = U.$('#pondFeed', box);
        if (fd) fd.addEventListener('click', function () {
          const r = S.feedFish(pondIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const sp = U.$('#pondSpeed', box);
        if (sp) sp.addEventListener('click', function () {
          const r = S.speedFish(pondIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
      }
    });
  }

  function fishInfo(fishId) {
    const s = D.FISH_MAP[fishId];
    if (!s) return;
    const ok = S.fishUnlocked(fishId);
    U.modal({
      title: s.name + ' · ' + D.TIER_NAME[s.tier] + '鱼种',
      icon: s.icon,
      body: '<div style="line-height:2">' +
        '<div>生长时长：<b>' + U.fmtDur(s.growSec) + '</b>（含加速后约 ' + U.fmtDur(s.growSec * (1 - S.buffs().grow / 100)) + '）</div>' +
        '<div>放养价格：<b>' + s.cost + ' 积分</b></div>' +
        '<div>收获收益：<b>' + s.points + ' 积分</b> + ' + s.exp + ' 鱼池经验</div>' +
        '<div>回收价值：约 ' + Math.round(s.price * 0.6) + ' 积分</div>' +
        (s.drop ? '<div>额外掉落：<b>' + (D.ITEMS[s.drop] ? D.ITEMS[s.drop].name : s.drop) + '</b>（' + (s.tier === 3 ? '必定' : '约 70%') + ' 概率）</div>' : '') +
        '<div>解锁条件：' + (ok ? '<span style="color:#4f9e57">已解锁</span>' : '鱼池 Lv' + s.unlockLevel) + '</div>' +
        '</div>',
      footer: '<button class="btn" data-close>关闭</button>' +
        (ok ? '<button class="btn btn-primary" data-close id="fiStock">去放养</button>' : ''),
      onMount: function (box, close) {
        const b = U.$('#fiStock', box);
        if (b) b.addEventListener('click', function () { close(); stockModal(null); });
      }
    });
  }

  function stockModal(pondIdx) {
    const st = S.get();
    const list = D.FISH_SPECIES.filter(function (s) { return S.fishUnlocked(s.id); });
    U.modal({
      title: pondIdx != null ? ('鱼池 ' + (pondIdx + 1) + ' · 选择鱼苗') : '一键放鱼 · 选择鱼苗',
      icon: '🐟',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">投放消耗 📚 学习积分（背单词获得），成熟后收获可获得更多积分与鱼池经验。当前学习积分：<b style="color:#3d8fc0">' + U.fmtNum(st.learnPoints) + '</b></div>' +
        '<div class="seed-grid" id="fStockGrid">' + list.map(function (s) {
          const canPay = st.learnPoints >= s.cost;
          return '<div class="seed-opt' + (canPay ? '' : ' dis') + '" data-stockfish="' + s.id + '">' +
            '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
            '<div class="so-ms">' + D.TIER_NAME[s.tier] + '</div>' +
            '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
            '<div class="so-pt learn">📚 ' + s.cost + (canPay ? '' : ' · 不足') + '</div></div>';
        }).join('') + '</div>',
      footer: '<button class="btn" data-close>取消</button>',
      onMount: function (box, close) {
        U.$$('[data-stockfish]', box).forEach(function (el) {
          el.addEventListener('click', function () {
            const fid = el.dataset.stockfish;
            if (pondIdx != null) {
              const r = S.buyFish(pondIdx, fid);
              U.toast(r.msg, r.ok ? 'good' : 'bad');
              if (r.ok) { close(); UI.refresh(); }
            } else {
              let cnt = 0;
              S.state.fish.ponds.forEach(function (p) {
                if (!p.fishId && p.id < S.fishSlots()) {
                  if (S.buyFish(p.id, fid).ok) cnt++;
                }
              });
              U.toast(cnt ? '已在 ' + cnt + ' 个鱼池投放 ' + D.FISH_MAP[fid].name : '没有空余鱼池', cnt ? 'good' : 'bad');
              if (cnt) { close(); UI.refresh(); }
            }
          });
        });
      }
    });
  }

  function bagModal() {
    const st = S.get();
    const items = Object.keys(st.inventory).filter(function (k) {
      return k.indexOf('fish_') === 0 || k === 'fishFood' || k === 'fishSpeed' || k === 'fishShield';
    });
    const body = items.length
      ? '<div class="bag-grid">' + items.map(function (k) {
          const it = D.ITEMS[k] || { name: k.replace('fish_', ''), icon: '🐟' };
          return '<div class="bag-item"><div class="bi-ic">' + it.icon + '</div>' +
            '<div class="bi-nm">' + it.name + '</div><div class="bi-ct">×' + st.inventory[k] + '</div></div>';
        }).join('') + '</div>'
      : '<div style="padding:20px;text-align:center;color:#8b968c">鱼塘背包空空如也，去养鱼收获吧～</div>';
    U.modal({ title: '🎒 鱼塘背包', icon: '🎒', body: body, footer: false });
  }

  
  function initFishScene(root) {
    const cvs = U.$('#fishCanvas', root);
    if (!cvs || !Spr) return;
    if (fishScene) { fishScene.stop(); fishScene = null; }
    fishScene = new Spr.Scene(cvs, { bgFn: Spr.BACKGROUNDS.fish });

    // 根据鱼塘里的鱼生成游动精灵
    const fishes = S.get().fish.ponds.filter(function (p) { return p.fishId; });
    fishes.forEach(function (pond, i) {
      const fm = D.FISH_MAP[pond.fishId];
      const cfg = Spr.CREATURE_LIBRARY[fm.id] || {
        emoji: fm.icon, frames: { idle: 1, swim: 4, happy: 4 }, size: 96
      };
      const sheets = Spr.buildCreatureSheets({
        emoji: cfg.emoji, states: cfg.frames, size: cfg.size
      });
      const sw = new Spr.Sprite(fishScene, {
        sheets: sheets, frames: cfg.frames,
        initState: 'swim',
        x: fishScene.size.w * (0.15 + i * 0.22),
        y: fishScene.size.h * (0.45 + (i % 2) * 0.25),
        vx: (Math.random() > 0.5 ? 1 : -1) * (35 + Math.random() * 20),
        vy: (Math.random() > 0.5 ? 1 : -1) * 8,
        facing: 1, scale: 0.6, size: cfg.size,
        frameTime: 200, tag: 'fish',
        onClick: function () {
          sw.say(fm.name + '：咕噜咕噜~', 1500);
          sw.emote('💧', 900);
          fishScene.burst(sw.x, sw.y, { icons: ['💧', '✨'], count: 5, gravity: -20, up: 10, life: 800 });
        }
      });
      fishScene.addSprite(sw);
      // 靠近指针就游过去（互动感）
      fishScene.addMachine(new Spr.StateMachine(sw, Spr.BEHAVIORS.swim({ speed: 30, chaseSpeed: 66 })));
    });

    // 如果没有鱼，放几条空的装饰鱼
    if (fishes.length === 0) {
      const carp = Spr.makeSprite(fishScene, 'carp', {
        x: fishScene.size.w * 0.35, y: fishScene.size.h * 0.55, scale: 0.55, state: 'swim'
      });
      carp && (carp.vx = 30) && fishScene.addSprite(carp);
    }

    fishScene.start();
  }

  global.WG.ui.pages.fish = page;
})(window);
