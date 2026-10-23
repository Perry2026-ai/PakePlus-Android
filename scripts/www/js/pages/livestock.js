/* ============================================================
   养殖场页面
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const Spr = global.WG.sprite;
  let livestockScene = null;
  const page = {};

  function penHtml(pen) {
    const cs = S.animalState(pen);
    const animal = pen.animalId ? D.LIVESTOCK_MAP[pen.animalId] : null;
    if (cs.status === 'locked') {
      return '<div class="pen locked" data-pen="' + pen.id + '">' +
        '<div class="pen-idx">' + (pen.id + 1) + '</div>' +
        '<div class="pen-empty-plus" style="font-size:22px">🔒</div>' +
        '<div class="pen-empty-txt">牧场 Lv' + nextUnlockLevel(pen.id) + ' 解锁</div></div>';
    }
    if (cs.status === 'empty') {
      return '<div class="pen empty" data-pen="' + pen.id + '">' +
        '<div class="pen-idx">' + (pen.id + 1) + '</div>' +
        '<div class="pen-empty-plus">＋</div>' +
        '<div class="pen-empty-txt">点击购入</div></div>';
    }
    const isReady = cs.status === 'ready';
    const isSpoiled = cs.status === 'spoiled';
    let badge = '';
    if (isReady) badge = '<span class="pond-badge harvest">可收取</span>';
    else if (isSpoiled) badge = '<span class="pond-badge wither">已变质</span>';
    else if (animal.tier === 3) badge = '<span class="pond-badge" style="background:#dd8f2c">珍稀</span>';
    else if (animal.tier === 2) badge = '<span class="pond-badge" style="background:#6aa9d6">稀有</span>';

    let timer = '';
    if (isReady) timer = '<div class="pond-timer">余 ' + U.fmtTime(cs.collectLeft) + ' 收取</div>';
    else if (isSpoiled) timer = '<div class="pond-timer">超时未收取</div>';
    else timer = '<div class="pond-timer">剩余 <span data-ts="' + pen.produceAt + '">' + U.fmtTime(cs.remain) + '</span></div>';

    const prog = (!isReady && !isSpoiled)
      ? '<div class="pond-progress"><i data-start="' + pen.boughtAt + '" data-end="' + pen.produceAt + '" style="width:' + cs.pct + '%"></i></div>'
      : '<div class="pond-progress"><i style="width:100%;' + (isSpoiled ? 'background:#b9bfb4' : 'background:linear-gradient(90deg,#ffc3d2,#f79ab1)') + '"></i></div>';

    return '<div class="pen' + (isReady ? ' ready' : '') + (isSpoiled ? ' spoiled' : '') + '" data-pen="' + pen.id + '">' +
      '<div class="pond-top"><span class="pen-idx">' + (pen.id + 1) + '</span>' + badge +
      (pen.feed ? '<span class="plot-status-ic" title="已投喂 ' + pen.feed + ' 次">🍽️</span>' : '') + '</div>' +
      '<div class="pond-ic">' + animal.icon + '</div>' +
      '<div class="pond-name">' + animal.name + '</div>' +
      '<div class="pond-sub">' + animal.product + ' ' + animal.productName + '</div>' +
      timer + prog + '</div>';
  }

  function nextUnlockLevel(penId) {
    for (let i = 0; i < D.LIVESTOCK_LEVELS.length; i++) {
      if (D.LIVESTOCK_LEVELS[i].slots > penId) return D.LIVESTOCK_LEVELS[i].lv;
    }
    return 10;
  }

  page.render = function (root) {
    const st = S.get();
    const l = st.livestock;
    const next = S.nextLivestockLevel();
    const cols = U.$('#view').clientWidth > 1100 ? 6 : 5;
    const shieldLeft = l.shieldUntil > U.now() ? (l.shieldUntil - U.now()) / 1000 : 0;
    const readyCount = l.pens.filter(function (p) { return S.animalState(p).status === 'ready'; }).length;
    const pct = next ? U.clamp(l.exp / next.exp * 100, 0, 100) : 100;

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🐔 欢乐牧场</div>' +
      '<div class="page-sub">购入禽畜 · 喂养加速 · 收取产物，鸡鸭鹅牛样样有</div><div class="spacer"></div>' +
      (shieldLeft > 0 ? '<span class="weather-chip" style="background:#fff0e0;border-color:#f0b96a">🛡️ 防护中 ' + U.fmtDur(shieldLeft) + '</span>' : '') +
      '<button class="btn btn-sm" id="lBag">🎒 牧场背包</button></div>' +

      '<div class="garden-hero">' +
      '<div class="garden-hero-title">🏡 我的牧场<span class="lv-tag">牧场 Lv' + l.level + '</span></div>' +
      '<div class="garden-hero-meta">' +
      '<div class="gm"><b>' + U.fmtNum(l.exp) + '</b><span>牧场经验' + (next ? ' / ' + next.exp : '') + '</span></div>' +
      '<div class="gm"><b>' + l.todayCollect + '</b><span>今日收取</span></div>' +
      '<div class="gm"><b>' + S.livestockSlots() + '/12</b><span>已解锁栏位</span></div>' +
      (readyCount ? '<div class="gm"><b style="color:#f79ab1">' + readyCount + '</b><span>可收取</span></div>' : '') +
      '</div>' +
      '<div class="bar pink" style="margin-top:12px;max-width:460px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="bar-meta" style="max-width:460px"><span>下一等级：' + (next ? 'Lv' + next.lv + ' · ' + next.perk : '已满级，专属荣誉铭牌已解锁') + '</span><span>' + Math.floor(pct) + '%</span></div>' +
      '</div>' +      '<div class="canvas-stage" style="height:150px"><canvas id="livestockCanvas" width="800" height="150"></canvas></div>' +



      '<div class="plots-wrap" style="--cols:' + cols + '">' +
      l.pens.map(penHtml).join('') +
      '</div>' +

      '<div class="toolbar">' +
      '<button class="btn btn-pink btn-sm" id="lBuyAll">🐔 一键购入</button>' +
      '<button class="btn btn-sm" id="lFeedAll">🍽️ 一键投喂</button>' +
      '<button class="btn btn-gold btn-sm" id="lCollectAll">🧺 一键收取' + (readyCount ? '（' + readyCount + '）' : '') + '</button>' +
      '<button class="btn btn-sm" id="lSpeedAll">💉 催长素</button>' +
      '<button class="btn btn-sm" id="lShield">🚧 围栏</button>' +
      '<div class="tb-label">投喂饲料缩短 12% 产出时间（每只上限 3 次）· 超时产物会变质</div>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🐔</span>可购入禽畜一览' +
      '<span class="ct-more" id="lGoShop">去商城兑换饲料 →</span></div>' +
      '<div class="seed-grid">' + D.LIVESTOCK_SPECIES.map(function (s) {
        const ok = S.animalUnlocked(s.id);
        return '<div class="seed-opt' + (ok ? '' : ' dis') + '" data-animalinfo="' + s.id + '">' +
          '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
          '<div class="so-ms">' + D.TIER_NAME[s.tier] + ' · 产出 ' + s.product + s.productName + '</div>' +
          '<div class="so-ms">' + U.fmtDur(s.prodSec) + '</div>' +
          '<div class="so-pt' + (ok ? ' learn' : '') + '">' + (ok ? '📚 ' + s.cost : '牧场 Lv' + s.unlockLevel) + '</div></div>';
      }).join('') + '</div></div>';

    bind(root);
  };

  function bind(root) {
    initLivestockScene(root);
    U.$$('.pen', root).forEach(function (el) {
      el.addEventListener('click', function () { openPen(Number(el.dataset.pen)); });
    });
    U.$('#lBag', root).addEventListener('click', bagModal);
    U.$('#lGoShop', root).addEventListener('click', function () { UI.go('shop'); });
    U.$$('[data-animalinfo]', root).forEach(function (el) {
      el.addEventListener('click', function () { animalInfo(el.dataset.animalinfo); });
    });
    U.$('#lBuyAll', root).addEventListener('click', function () { buyModal(null); });
    U.$('#lFeedAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.livestock.pens.forEach(function (p) {
        if (p.animalId && (S.animalState(p).status === 'young' || S.animalState(p).status === 'producing') && p.feed < 3 && S.inv('animalFeed') > 0) {
          if (S.feedAnimal(p.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '一键投喂完成，共 ' + cnt + ' 只禽畜' : '没有可投喂的禽畜或饲料不足', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#lCollectAll', root).addEventListener('click', function () {
      const r = S.collectAll();
      U.toast(r.count ? '收取 ' + r.count + ' 份产物，积分 +' + r.points + (r.spoiled ? '，' + r.spoiled + ' 份已变质' : '') : '没有可收取的产物', r.count ? 'good' : 'bad');
      if (r.count) UI.refresh();
    });
    U.$('#lSpeedAll', root).addEventListener('click', function () {
      let cnt = 0;
      S.state.livestock.pens.forEach(function (p) {
        if (p.animalId && S.animalState(p).status !== 'ready' && S.inv('animalSpeed') > 0) {
          if (S.speedAnimal(p.id).ok) cnt++;
        }
      });
      U.toast(cnt ? '催长素已对 ' + cnt + ' 只禽畜使用' : '没有可用催长素', cnt ? 'good' : 'bad');
      if (cnt) UI.refresh();
    });
    U.$('#lShield', root).addEventListener('click', function () {
      const r = S.livestockShield();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
  }

  function openPen(penIdx) {
    const pen = S.state.livestock.pens[penIdx];
    if (penIdx >= S.livestockSlots()) { U.toast('栏位尚未解锁', 'bad'); return; }
    const cs = S.animalState(pen);
    if (cs.status === 'empty') { buyModal(penIdx); return; }
    const animal = D.LIVESTOCK_MAP[pen.animalId];
    let actions = '';
    if (cs.status === 'ready' || cs.status === 'spoiled') {
      actions = '<button class="btn btn-gold" id="penCollect">🧺 收取产物</button>';
    } else {
      actions = '<button class="btn" id="penFeed">🍽️ 投喂（' + pen.feed + '/3）</button>' +
        '<button class="btn" id="penSpeed">💉 催长素</button>';
    }
    U.modal({
      title: '栏位 ' + (penIdx + 1) + ' · ' + animal.name, icon: animal.icon,
      body: '<div style="padding:4px 2px;line-height:1.8">' +
        '<div>状态：' + (cs.status === 'ready' ? '✅ 产物已产出' : cs.status === 'spoiled' ? '🗑️ 已变质' : '🌱 产出中（' + Math.floor(cs.pct) + '%）') + '</div>' +
        '<div>产物：' + animal.product + ' ' + animal.productName + '，积分 +' + animal.points + '</div>' +
        (cs.remain ? '<div>剩余时间：' + U.fmtTime(cs.remain) + '</div>' : '') +
        '</div>',
      footer: actions + '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        const c = U.$('#penCollect', box);
        if (c) c.addEventListener('click', function () {
          const r = S.collectProduct(penIdx);
          U.toast(r.ok ? ('收取 ' + animal.productName + '，积分 +' + r.gained.points) : r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const fd = U.$('#penFeed', box);
        if (fd) fd.addEventListener('click', function () {
          const r = S.feedAnimal(penIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
        const sp = U.$('#penSpeed', box);
        if (sp) sp.addEventListener('click', function () {
          const r = S.speedAnimal(penIdx);
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          close(); UI.refresh();
        });
      }
    });
  }

  function animalInfo(animalId) {
    const s = D.LIVESTOCK_MAP[animalId];
    if (!s) return;
    const ok = S.animalUnlocked(animalId);
    U.modal({
      title: s.name + ' · ' + D.TIER_NAME[s.tier] + '禽畜',
      icon: s.icon,
      body: '<div style="line-height:2">' +
        '<div>产出周期：<b>' + U.fmtDur(s.prodSec) + '</b>（含加速后约 ' + U.fmtDur(s.prodSec * (1 - S.buffs().grow / 100)) + '）</div>' +
        '<div>购入价格：<b>' + s.cost + ' 积分</b></div>' +
        '<div>每次产出：<b>' + s.points + ' 积分</b> + ' + s.exp + ' 牧场经验 · ' + s.product + s.productName + '</div>' +
        '<div>回收价值：约 ' + Math.round(s.price * 0.6) + ' 积分</div>' +
        '<div>解锁条件：' + (ok ? '<span style="color:#4f9e57">已解锁</span>' : '牧场 Lv' + s.unlockLevel) + '</div>' +
        '</div>',
      footer: '<button class="btn" data-close>关闭</button>' +
        (ok ? '<button class="btn btn-primary" data-close id="aiBuy">去购入</button>' : ''),
      onMount: function (box, close) {
        const b = U.$('#aiBuy', box);
        if (b) b.addEventListener('click', function () { close(); buyModal(null); });
      }
    });
  }

  function buyModal(penIdx) {
    const st = S.get();
    const list = D.LIVESTOCK_SPECIES.filter(function (s) { return S.animalUnlocked(s.id); });
    U.modal({
      title: penIdx != null ? ('栏位 ' + (penIdx + 1) + ' · 选择禽畜') : '一键购入 · 选择禽畜',
      icon: '🐔',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">购入消耗 📚 学习积分（背单词获得），成熟后收取产物获得积分与牧场经验。当前学习积分：<b style="color:#3d8fc0">' + U.fmtNum(st.learnPoints) + '</b></div>' +
        '<div class="seed-grid" id="lBuyGrid">' + list.map(function (s) {
          const canPay = st.learnPoints >= s.cost;
          return '<div class="seed-opt' + (canPay ? '' : ' dis') + '" data-buyanimal="' + s.id + '">' +
            '<div class="so-ic">' + s.icon + '</div><div class="so-nm">' + s.name + '</div>' +
            '<div class="so-ms">' + D.TIER_NAME[s.tier] + ' · 产出 ' + s.product + '</div>' +
            '<div class="so-ms">' + U.fmtDur(s.prodSec) + '</div>' +
            '<div class="so-pt learn">📚 ' + s.cost + (canPay ? '' : ' · 不足') + '</div></div>';
        }).join('') + '</div>',
      footer: '<button class="btn" data-close>取消</button>',
      onMount: function (box, close) {
        U.$$('[data-buyanimal]', box).forEach(function (el) {
          el.addEventListener('click', function () {
            const aid = el.dataset.buyanimal;
            if (penIdx != null) {
              const r = S.buyAnimal(penIdx, aid);
              U.toast(r.msg, r.ok ? 'good' : 'bad');
              if (r.ok) { close(); UI.refresh(); }
            } else {
              let cnt = 0;
              S.state.livestock.pens.forEach(function (p) {
                if (!p.animalId && p.id < S.livestockSlots()) {
                  if (S.buyAnimal(p.id, aid).ok) cnt++;
                }
              });
              U.toast(cnt ? '已在 ' + cnt + ' 个栏位购入 ' + D.LIVESTOCK_MAP[aid].name : '没有空余栏位', cnt ? 'good' : 'bad');
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
      return k.indexOf('product_') === 0 || k === 'animalFeed' || k === 'animalSpeed' || k === 'animalShield';
    });
    const body = items.length
      ? '<div class="bag-grid">' + items.map(function (k) {
          const it = D.ITEMS[k] || { name: k.replace('product_', '') + '产物', icon: '📦' };
          return '<div class="bag-item"><div class="bi-ic">' + it.icon + '</div>' +
            '<div class="bi-nm">' + it.name + '</div><div class="bi-ct">×' + st.inventory[k] + '</div></div>';
        }).join('') + '</div>'
      : '<div style="padding:20px;text-align:center;color:#8b968c">牧场背包空空如也，去养殖收取产物吧～</div>';
    U.modal({ title: '🎒 牧场背包', icon: '🎒', body: body, footer: false });
  }

  
  function initLivestockScene(root) {
    const cvs = U.$('#livestockCanvas', root);
    if (!cvs || !Spr) return;
    if (livestockScene) { livestockScene.stop(); livestockScene = null; }
    livestockScene = new Spr.Scene(cvs, { bgFn: Spr.BACKGROUNDS.livestock });

    // 牧场里的动物
    const animals = S.get().livestock.pens.filter(function (p) { return p.animalId; });
    animals.slice(0, 4).forEach(function (pen, i) {
      const am = D.LIVESTOCK_MAP[pen.animalId];
      const cfg = Spr.CREATURE_LIBRARY[am.id] || {
        emoji: am.icon, frames: { idle: 1, walk: 4, happy: 4, graze: 4 }, size: 112
      };
      const sheets = Spr.buildCreatureSheets({ emoji: cfg.emoji, states: cfg.frames, size: cfg.size });
      const sp = new Spr.Sprite(livestockScene, {
        sheets: sheets, frames: cfg.frames,
        initState: 'walk',
        x: livestockScene.size.w * (0.18 + i * 0.2),
        y: livestockScene.size.h * (0.45 + (i % 2) * 0.28),
        vx: (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 15),
        vy: 0, facing: 1,
        scale: 0.55, frameTime: 220, size: cfg.size, tag: 'animal',
        onClick: function () {
          sp.say(am.name + '：' + (am.id === 'chicken' ? '咯咯哒~' : am.id === 'duck' ? '嘎~嘎~' : '哞~'), 1500);
          sp.emote('💛', 900);
          livestockScene.burst(sp.x, sp.y - 16, { icons: ['💛', '✨'], count: 5, life: 800 });
        }
      });
      livestockScene.addSprite(sp);
      // 走走停停吃草
      livestockScene.addMachine(new Spr.StateMachine(sp, Spr.BEHAVIORS.wander({ speed: 30 })));
    });

    // 宠物路过
    const pet = S.activePet();
    if (pet) {
      const pc = Spr.CREATURE_LIBRARY[pet.speciesId];
      if (pc) {
        const sheets = Spr.buildCreatureSheets({ emoji: pc.emoji, states: pc.frames, size: pc.size });
        const ps = new Spr.Sprite(livestockScene, {
          sheets: sheets, frames: pc.frames,
          initState: 'walk', x: livestockScene.size.w * 0.05, y: livestockScene.size.h * 0.7,
          vx: 25, vy: 0, scale: 0.45, frameTime: 200, size: pc.size, tag: 'pet'
        });
        livestockScene.addSprite(ps);
      }
    }

    livestockScene.start();
  }

  global.WG.ui.pages.livestock = page;
})(window);
