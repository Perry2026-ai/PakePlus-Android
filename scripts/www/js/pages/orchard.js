/* ============================================================
   欢乐果园页面
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const Spr = global.WG.sprite;
  let orchardScene = null;
  const page = {};

  function treeHtml(tree) {
    const cs = S.orchardState(tree);
    const fruit = tree.fruitId ? D.FRUIT_MAP[tree.fruitId] : null;
    if (cs.status === 'locked') {
      return '<div class="tree locked" data-tree="' + tree.id + '">' +
        '<div class="tree-idx">' + (tree.id + 1) + '</div>' +
        '<div class="tree-empty-plus" style="font-size:22px">🔒</div>' +
        '<div class="tree-empty-txt">果园 Lv' + nextUnlockLevel(tree.id) + ' 解锁</div></div>';
    }
    if (cs.status === 'empty') {
      return '<div class="tree empty" data-tree="' + tree.id + '">' +
        '<div class="tree-idx">' + (tree.id + 1) + '</div>' +
        '<div class="tree-empty-plus">＋</div>' +
        '<div class="tree-empty-txt">点击栽种</div></div>';
    }
    const isMature = cs.status === 'mature';
    const isWithered = cs.status === 'withered';
    let badge = '';
    if (isMature) badge = '<span class="tree-badge harvest">可收获</span>';
    else if (isWithered) badge = '<span class="tree-badge wither">已枯萎</span>';
    else if (fruit.tier === 3) badge = '<span class="tree-badge" style="background:#dd8f2c">珍稀</span>';
    else if (fruit.tier === 2) badge = '<span class="tree-badge" style="background:#6aa9d6">稀有</span>';

    let timer = '';
    if (isMature) timer = '<div class="tree-timer">余 ' + U.fmtTime(cs.harvestLeft) + ' 收获</div>';
    else if (isWithered) timer = '<div class="tree-timer">超时未收获</div>';
    else timer = '<div class="tree-timer">剩余 <span data-ts="' + tree.matureAt + '">' + U.fmtTime(cs.remain) + '</span></div>';

    const prog = (!isMature && !isWithered)
      ? '<div class="tree-progress"><i data-start="' + tree.plantedAt + '" data-end="' + tree.matureAt + '" style="width:' + cs.pct + '%"></i></div>'
      : '<div class="tree-progress"><i style="width:100%;' + (isWithered ? 'background:#b9bfb4' : 'background:linear-gradient(90deg,#f8dc9a,#e8a93c)') + '"></i></div>';

    return '<div class="tree' + (isMature ? ' mature' : '') + (isWithered ? ' withered' : '') + '" data-tree="' + tree.id + '">' +
      '<div class="tree-top"><span class="tree-idx">' + (tree.id + 1) + '</span>' + badge +
      (tree.fert ? '<span class="plot-status-ic" title="已施肥 ' + tree.fert + ' 次">🍂</span>' : '') + '</div>' +
      '<div class="tree-ic">' + fruit.icon + '</div>' +
      '<div class="tree-name">' + fruit.name + '</div>' +
      timer + prog + '</div>';
  }

  function nextUnlockLevel(treeId) {
    for (let i = 0; i < D.ORCHARD_LEVELS.length; i++) {
      if (D.ORCHARD_LEVELS[i].slots > treeId) return D.ORCHARD_LEVELS[i].lv;
    }
    return 10;
  }

  page.render = function (root) {
    const st = S.get();
    const o = st.orchard;
    const def = S.orchardDef();
    const next = S.nextOrchardLevel();
    const cols = U.$('#view').clientWidth > 1100 ? 6 : 5;
    const shieldLeft = o.shieldUntil > U.now() ? (o.shieldUntil - U.now()) / 1000 : 0;
    const matureCount = o.trees.filter(function (t) { return S.orchardState(t).status === 'mature'; }).length;
    const pct = next ? U.clamp(o.exp / next.exp * 100, 0, 100) : 100;

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🍎 欢乐果园</div>' +
      '<div class="page-sub">栽种果树 · 施肥催熟 · 收获鲜果，还能去好友家摘果</div><div class="spacer"></div>' +
      (shieldLeft > 0 ? '<span class="weather-chip" style="background:#fff3e0;border-color:#f0c674">🛡️ 防护中 ' + U.fmtDur(shieldLeft) + '</span>' : '') +
      '<button class="btn btn-sm" id="oBag">🎒 果园背包</button></div>' +

      '<div class="garden-hero">' +
      '<div class="garden-hero-title">🌳 我的果园<span class="lv-tag">果园 Lv' + o.level + '</span></div>' +
      '<div class="garden-hero-meta">' +
      '<div class="gm"><b>' + U.fmtNum(o.exp) + '</b><span>果园经验' + (next ? ' / ' + next.exp : '') + '</span></div>' +
      '<div class="gm"><b>' + o.todayHarvest + '</b><span>今日收获</span></div>' +
      '<div class="gm"><b>' + S.orchardSlots() + '/12</b><span>已解锁果树</span></div>' +
      (matureCount ? '<div class="gm"><b style="color:#e8a93c">' + matureCount + '</b><span>可收获</span></div>' : '') +
      '</div>' +
      '<div class="bar gold" style="margin-top:12px;max-width:460px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="bar-meta" style="max-width:460px"><span>下一等级：' + (next ? 'Lv' + next.lv + ' · ' + next.perk : '已满级，专属荣誉铭牌已解锁') + '</span><span>' + Math.floor(pct) + '%</span></div>' +
      '</div>' +      '<div class="canvas-stage" style="height:150px"><canvas id="orchardCanvas" width="800" height="150"></canvas></div>' +



      '<div class="plots-wrap" style="--cols:' + cols + '">' +
      o.trees.map(treeHtml).join('') +
      '</div>' +

      '<div class="toolbar">' +
      '<button class="btn btn-gold btn-sm" id="oPlantAll">🌱 一键栽种</button>' +
      '<button class="btn btn-sm" id="oFertAll">🍂 一键施肥</button>' +
      '<button class="btn btn-gold btn-sm" id="oHarvestAll">🧺 一键收获' + (matureCount ? '（' + matureCount + '）' : '') + '</button>' +
      '<button class="btn btn-sm" id="oSpeedAll">☀️ 催熟剂</button>' +
      '<button class="btn btn-sm" id="oShield">🪺 防鸟网</button>' +
      '<div class="tb-label">施肥缩短 12% 生长（每棵上限 3 次）· 超时未收获果实会枯萎</div>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🍎</span>可栽种水果一览' +
      '<span class="ct-more" id="oGoShop">去商城兑换果苗 →</span></div>' +
      '<div class="seed-grid">' + D.FRUIT_SPECIES.map(function (s) {
        const ok = S.fruitUnlocked(s.id);
        return '<div class="seed-opt' + (ok ? '' : ' dis') + '" data-fruitinfo="' + s.id + '">' +
          '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
          '<div class="so-ms">' + D.TIER_NAME[s.tier] + ' · 水果</div>' +
          '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
          '<div class="so-pt' + (ok ? ' learn' : '') + '">' + (ok ? '📚 ' + s.cost : '果园 Lv' + s.unlockLevel) + '</div></div>';
      }).join('') + '</div></div>';

    bind(root);
  };

  function bind(root) {
    initOrchardScene(root);
    U.$$('.tree', root).forEach(function (el) {
      el.addEventListener('click', function () { openTree(Number(el.dataset.tree)); });
    });
    U.$('#oBag', root).addEventListener('click', bagModal);
    U.$('#oGoShop', root).addEventListener('click', function () { UI.go('shop'); });
    U.$$('[data-fruitinfo]', root).forEach(function (el) {
      el.addEventListener('click', function () { fruitInfo(el.dataset.fruitinfo); });
    });
    U.$('#oPlantAll', root).addEventListener('click', function () { plantModal(null); });
    U.$('#oFertAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.orchard.trees.forEach(function (t) {
        if (t.fruitId && (S.orchardState(t).status === 'sapling' || S.orchardState(t).status === 'growing') && t.fert < 3 && S.inv('orchardFert') > 0) {
          if (S.fertilizeTree(t.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '一键施肥完成，共 ' + cnt + ' 棵果树' : '没有可施肥的果树或肥料不足', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#oHarvestAll', root).addEventListener('click', function () {
      const r = S.harvestAllFruit();
      U.toast(r.count ? '收获 ' + r.count + ' 份果实，积分 +' + r.points + (r.withered ? '，' + r.withered + ' 棵已枯萎' : '') : '没有可收获的果实', r.count ? 'good' : 'bad');
      if (r.count) UI.refresh();
    });
    U.$('#oSpeedAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.orchard.trees.forEach(function (t) {
        if (t.fruitId && S.orchardState(t).status !== 'mature' && S.inv('orchardSpeed') > 0) {
          if (S.speedTree(t.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '催熟剂已对 ' + cnt + ' 棵果树使用' : '没有可用催熟剂', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#oShield', root).addEventListener('click', function () {
      const r = S.orchardShield();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
  }

  function openTree(treeIdx) {
    const tree = S.state.orchard.trees[treeIdx];
    if (treeIdx >= S.orchardSlots()) { U.toast('果树位尚未解锁', 'bad'); return; }
    const cs = S.orchardState(tree);
    if (cs.status === 'empty') { plantModal(treeIdx); return; }
    const fruit = D.FRUIT_MAP[tree.fruitId];
    let actions = '';
    if (cs.status === 'mature' || cs.status === 'withered') {
      actions = '<button class="btn btn-gold" id="treeHarvest">🧺 收获</button>';
    } else {
      actions = '<button class="btn" id="treeFert">🍂 施肥（' + tree.fert + '/3）</button>' +
        '<button class="btn" id="treeSpeed">☀️ 催熟剂</button>';
    }
    U.modal({
      title: '果树 ' + (treeIdx + 1) + ' · ' + fruit.name, icon: fruit.icon,
      body: '<div style="padding:4px 2px;line-height:1.8">' +
        '<div>状态：' + (cs.status === 'mature' ? '✅ 已成熟' : cs.status === 'withered' ? '🥀 已枯萎' : '🌱 生长中（' + Math.floor(cs.pct) + '%）') + '</div>' +
        '<div>预计产出：' + fruit.points + ' 积分，果园经验 +' + fruit.exp + '</div>' +
        (cs.remain ? '<div>剩余时间：' + U.fmtTime(cs.remain) + '</div>' : '') +
        (fruit.drop ? '<div>稀有掉落：' + (D.ITEMS[fruit.drop] ? D.ITEMS[fruit.drop].name : fruit.drop) + '</div>' : '') +
        '</div>',
      footer: actions + '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        const h = U.$('#treeHarvest', box);
        if (h) h.addEventListener('click', function () {
          const r = S.harvestFruit(treeIdx);
          U.toast(r.ok ? ('收获 ' + fruit.name + '，积分 +' + r.gained.points) : r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const fd = U.$('#treeFert', box);
        if (fd) fd.addEventListener('click', function () {
          const r = S.fertilizeTree(treeIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const sp = U.$('#treeSpeed', box);
        if (sp) sp.addEventListener('click', function () {
          const r = S.speedTree(treeIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
      }
    });
  }

  function fruitInfo(fruitId) {
    const s = D.FRUIT_MAP[fruitId];
    if (!s) return;
    const ok = S.fruitUnlocked(fruitId);
    U.modal({
      title: s.name + ' · ' + D.TIER_NAME[s.tier] + '水果',
      icon: s.icon,
      body: '<div style="line-height:2">' +
        '<div>生长时长：<b>' + U.fmtDur(s.growSec) + '</b>（含加速后约 ' + U.fmtDur(s.growSec * (1 - S.buffs().grow / 100)) + '）</div>' +
        '<div>栽种价格：<b>' + s.cost + ' 积分</b></div>' +
        '<div>收获收益：<b>' + s.points + ' 积分</b> + ' + s.exp + ' 果园经验</div>' +
        '<div>回收价值：约 ' + Math.round(s.price * 0.6) + ' 积分</div>' +
        (s.drop ? '<div>额外掉落：<b>' + (D.ITEMS[s.drop] ? D.ITEMS[s.drop].name : s.drop) + '</b>（' + (s.tier === 3 ? '必定' : '约 70%') + ' 概率）</div>' : '') +
        '<div>解锁条件：' + (ok ? '<span style="color:#4f9e57">已解锁</span>' : '果园 Lv' + s.unlockLevel) + '</div>' +
        '</div>',
      footer: '<button class="btn" data-close>关闭</button>' +
        (ok ? '<button class="btn btn-primary" data-close id="fiPlant">去栽种</button>' : ''),
      onMount: function (box, close) {
        const b = U.$('#fiPlant', box);
        if (b) b.addEventListener('click', function () { close(); plantModal(null); });
      }
    });
  }

  function plantModal(treeIdx) {
    const st = S.get();
    const list = D.FRUIT_SPECIES.filter(function (s) { return S.fruitUnlocked(s.id); });
    U.modal({
      title: treeIdx != null ? ('果树 ' + (treeIdx + 1) + ' · 选择果苗') : '一键栽种 · 选择果苗',
      icon: '🌱',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">栽种消耗 📚 学习积分（背单词获得），成熟后收获可获得更多积分与果园经验。当前学习积分：<b style="color:#3d8fc0">' + U.fmtNum(st.learnPoints) + '</b></div>' +
        '<div class="seed-grid" id="oPlantGrid">' + list.map(function (s) {
          const canPay = st.learnPoints >= s.cost;
          return '<div class="seed-opt' + (canPay ? '' : ' dis') + '" data-plantfruit="' + s.id + '">' +
            '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
            '<div class="so-ms">' + D.TIER_NAME[s.tier] + '</div>' +
            '<div class="so-ms">' + U.fmtDur(s.growSec) + '</div>' +
            '<div class="so-pt learn">📚 ' + s.cost + (canPay ? '' : ' · 不足') + '</div></div>';
        }).join('') + '</div>',
      footer: '<button class="btn" data-close>取消</button>',
      onMount: function (box, close) {
        U.$$('[data-plantfruit]', box).forEach(function (el) {
          el.addEventListener('click', function () {
            const fid = el.dataset.plantfruit;
            if (treeIdx != null) {
              const r = S.plantFruit(treeIdx, fid);
              U.toast(r.msg, r.ok ? 'good' : 'bad');
              if (r.ok) { close(); UI.refresh(); }
            } else {
              let cnt = 0;
              S.state.orchard.trees.forEach(function (t) {
                if (!t.fruitId && t.id < S.orchardSlots()) {
                  if (S.plantFruit(t.id, fid).ok) cnt++;
                }
              });
              U.toast(cnt ? '已在 ' + cnt + ' 棵果树位栽种 ' + D.FRUIT_MAP[fid].name : '没有空余果树位', cnt ? 'good' : 'bad');
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
      return k.indexOf('fruit_') === 0 || k === 'orchardFert' || k === 'orchardSpeed' || k === 'orchardShield';
    });
    const body = items.length
      ? '<div class="bag-grid">' + items.map(function (k) {
          const it = D.ITEMS[k] || { name: k.replace('fruit_', ''), icon: '🍎' };
          return '<div class="bag-item"><div class="bi-ic">' + it.icon + '</div>' +
            '<div class="bi-nm">' + it.name + '</div><div class="bi-ct">×' + st.inventory[k] + '</div></div>';
        }).join('') + '</div>'
      : '<div style="padding:20px;text-align:center;color:#8b968c">果园背包空空如也，去种果树收获吧～</div>';
    U.modal({ title: '🎒 果园背包', icon: '🎒', body: body, footer: false });
  }

  
  function initOrchardScene(root) {
    const cvs = U.$('#orchardCanvas', root);
    if (!cvs || !Spr) return;
    if (orchardScene) { orchardScene.stop(); orchardScene = null; }
    orchardScene = new Spr.Scene(cvs, { bgFn: Spr.BACKGROUNDS.orchard });

    // 果园里成熟的果树 → 显示 ripe 状态（会摇晃 + 闪光星星）
    const trees = S.get().orchard.trees.filter(function (t) { return t.fruitId; });
    trees.slice(0, 4).forEach(function (tree, i) {
      const fm = D.FRUIT_MAP[tree.fruitId];
      const cfg = Spr.CREATURE_LIBRARY[fm.id] || {
        emoji: fm.icon, frames: { grow: 3, ripe: 4 }, size: 112
      };
      const sheets = Spr.buildCreatureSheets({
        emoji: cfg.emoji, states: cfg.frames, size: cfg.size
      });
      const state = S.orchardState(tree).status === 'mature' || S.orchardState(tree).status === 'withered' ? 'ripe' : 'grow';
      const tr = new Spr.Sprite(orchardScene, {
        sheets: sheets, frames: cfg.frames,
        initState: state,
        x: orchardScene.size.w * (0.15 + i * 0.22),
        y: orchardScene.size.h * 0.7,
        scale: 0.65, facing: 1, frameTime: 220, size: cfg.size,
        tag: 'tree',
        onClick: function () {
          tr.say(fm.name + '：快点来摘我呀！', 1800);
          tr.emote('🍃', 1000);
          orchardScene.burst(tr.x, tr.y - tr.h * 0.3, { icons: ['🍎', '✨'], count: 5, up: 40, life: 900 });
        }
      });
      orchardScene.addSprite(tr);
    });

    // 宠物路过
    const pet = S.activePet();
    if (pet) {
      const pc = Spr.CREATURE_LIBRARY[pet.speciesId];
      if (pc) {
        const sheets = Spr.buildCreatureSheets({ emoji: pc.emoji, states: pc.frames, size: pc.size });
        const ps = new Spr.Sprite(orchardScene, {
          sheets: sheets, frames: pc.frames,
          initState: 'idle', x: orchardScene.size.w * 0.05, y: orchardScene.size.h * 0.75,
          vx: 28, vy: 0, scale: 0.5, frameTime: 200, size: pc.size, tag: 'pet',
          onClick: function () {
            ps.say('果园的果子好香呀~', 1600);
            ps.emote('🤤', 1000);
          }
        });
        orchardScene.addSprite(ps);
        orchardScene.addMachine(new Spr.StateMachine(ps, Spr.BEHAVIORS.pet({
          fullness: pet.fullness, speed: 38
        })));
      }
    }

    orchardScene.start();
  }

  global.WG.ui.pages.orchard = page;
})(window);
