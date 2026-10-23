/* ============================================================
   萌宠小屋（Canvas 2D 场景层版本）
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const Spr = global.WG.sprite;
  const page = {};
  let petScene = null;
  let petSprite = null;

  function bubbleOf(pet) {
    const sp = D.PET_MAP[pet.speciesId];
    const list = (sp && sp.bubble) || ['今天也要加油哦'];
    const idx = Math.floor((pet.exp + pet.level * 7 + pet.intimacy) % list.length);
    return list[idx];
  }

  page.render = function (root) {
    const st = S.get();
    const pet = S.activePet();

    if (!pet) {
      root.innerHTML = '<div class="page-head"><div class="page-title">🐾 萌宠小屋</div>' +
        '<div class="page-sub">花园达到 Lv2 后可领养你的第一只萌宠</div></div>' +
        '<div class="card" style="text-align:center;padding:44px 20px">' +
        '<div style="font-size:56px">🥚</div>' +
        '<div style="font-size:16px;font-weight:800;margin-top:10px">还没有萌宠伙伴</div>' +
        '<div style="font-size:12px;color:#8b968c;margin-top:8px">提升花园等级到 Lv2，即可领养小白猫或小黄狗</div>' +
        '<button class="btn btn-primary" id="petAdoptFirst" style="margin-top:16px">去领养</button></div>';
      U.$('#petAdoptFirst', root).addEventListener('click', adoptModal);
      return;
    }

    const sp = D.PET_MAP[pet.speciesId];
    const lvDef = S.petDef(pet.level);
    const nextLv = S.nextPetLevel(pet);
    const star = S.intimacyStar(pet.intimacy);
    const idDef = S.intimacyDef(pet.intimacy);
    const nextStar = D.INTIMACY_LEVELS.find(function (x) { return x.star === star + 1; });
    const owned = Object.keys(st.pets.list);

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🐾 萌宠小屋</div>' +
      '<div class="page-sub">喂养 · 抚摸 · 换装，萌宠会为学习和种植提供加成</div><div class="spacer"></div>' +
      '<button class="btn btn-sm" id="petAdopt">➕ 领养新萌宠</button></div>' +

      '<div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px" class="pet-layout">' +
      '<div>' +
      '<div class="pet-stage" id="petStage">' +
      '<div class="pet-name">🎀 ' + U.esc(pet.name) + (pet.accessory ? ' · 装饰已佩戴' : '') + '</div>' +
      '<div class="pet-scene-wrap"><canvas id="petCanvas" width="340" height="240"></canvas></div>' +
      '<div class="pet-meta-line">' +
      '<span class="pet-chip">Lv' + pet.level + ' · ' + (lvDef ? lvDef.lv : 1) + '级</span>' +
      '<span class="pet-chip stars">' + '★'.repeat(star) + '☆'.repeat(5 - star) + '</span>' +
      '<span class="pet-chip">饱腹 ' + Math.round(pet.fullness) + '%</span>' +
      '</div>' +
      '<div class="bar pink" style="width:78%;margin-top:12px"><i style="width:' + U.clamp(pet.fullness, 0, 100) + '%"></i></div>' +
      '<div class="bar-meta" style="width:78%"><span>饱腹值（低于 0 停止产出，无惩罚）</span><span>' + Math.round(pet.fullness) + '/100</span></div>' +
      '<div class="pet-actions">' +
      '<button class="btn btn-primary btn-sm" id="petFeedBasic">🍚 投喂基础粮（×' + S.inv('petFoodBasic') + '）</button>' +
      '<button class="btn btn-gold btn-sm" id="petFeedAdv">🍖 投喂高级粮（×' + S.inv('petFoodAdvanced') + '）</button>' +
      '<button class="btn btn-pink btn-sm" id="petPat">🤗 抚摸互动</button>' +
      '<button class="btn btn-sm" id="petAcc">🎀 换装配饰</button>' +
      '<button class="btn btn-sm" id="petRename">📛 改名</button>' +
      '</div>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🌟</span>等级特权</div>' +
      '<div style="font-size:12.5px;line-height:1.9">' +
      '<div class="st-item good" style="margin-bottom:8px"><span>当前 Lv' + pet.level + '：' + lvDef.perk + '</span></div>' +
      (nextLv ? '<div class="st-item info"><span>下一级 Lv' + (pet.level + 1) + '：' + nextLv.perk + '</span></div>' : '<div class="st-item info"><span>已达满级神宠，解锁专属铭牌</span></div>') +
      '</div>' +
      '<div class="bar-meta" style="margin-top:12px"><span>宠物经验</span><span>' + U.fmtNum(pet.exp) + (nextLv ? ' / ' + nextLv.exp : '') + '</span></div>' +
      '<div class="bar pink" style="margin-top:5px"><i style="width:' + (nextLv ? U.clamp(pet.exp / nextLv.exp * 100, 0, 100) : 100) + '%"></i></div>' +
      '<div class="bar-meta" style="margin-top:12px"><span>亲密度 ' + U.fmtNum(pet.intimacy) + ' · ' + star + ' 星</span><span>' + (nextStar ? '下一星 ' + nextStar.exp : '已满星') + '</span></div>' +
      '<div class="bar pink" style="margin-top:5px"><i style="width:' + (nextStar ? U.clamp(pet.intimacy / nextStar.exp * 100, 0, 100) : 100) + '%"></i></div>' +
      '<div style="font-size:11px;color:#8b968c;margin-top:8px">' + idDef.perk + '</div>' +
      '</div>' +
      '</div>' +

      '<div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🐾</span>我的萌宠</div>' +
      '<div class="pet-switch">' + D.PET_SPECIES.map(function (s) {
        const has = !!st.pets.list[s.id];
        const isOn = st.pets.activeId === s.id;
        if (!has && s.limited) {
          return '<div class="pet-card-mini lock" data-species="' + s.id + '"><span class="pc-ic">' + s.icon + '</span>' + s.name + '<span style="font-size:9.5px;color:#b0b8ac">限定</span></div>';
        }
        if (!has) {
          const can = st.garden.level >= s.reqGardenLevel;
          return '<div class="pet-card-mini' + (can ? '' : ' lock') + '" data-species="' + s.id + '">' +
            '<span class="pc-ic">' + s.icon + '</span>' + s.name +
            '<span style="font-size:9.5px;color:#b0b8ac">' + (can ? '可领养' : 'Lv' + s.reqGardenLevel) + '</span></div>';
        }
        return '<div class="pet-card-mini' + (isOn ? ' on' : '') + '" data-switch="' + s.id + '">' +
          '<span class="pc-ic">' + s.icon + '</span>' + U.esc(st.pets.list[s.id].name) +
          '<span style="font-size:9.5px;color:#8b968c">Lv' + st.pets.list[s.id].level + '</span></div>';
      }).join('') + '</div></div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">🎒</span>宠物背包</div>' +
      '<div class="bag-grid">' +
      ['petFoodBasic', 'petFoodAdvanced', 'petAccessory', 'petExpShard', 'petRenameCard'].map(function (id) {
        const it = D.ITEMS[id];
        const n = S.inv(id);
        return '<div class="bag-item"><div class="bi-ic">' + it.icon + '</div><div class="bi-nm">' + it.name + '</div>' +
          '<div class="bi-ct">×' + n + '</div>' +
          (n > 0 ? '<button class="btn btn-xs btn-primary" style="margin-top:5px" data-useitem="' + id + '">使用</button>' : '<div class="bi-price">商城兑换</div>') +
          '</div>';
      }).join('') + '</div>' +
      '<div style="font-size:11px;color:#8b968c;margin-top:9px">宠物经验：基础粮 +2，高级粮 +5；每日抚摸 +3 经验 / +2 亲密度（上限 5 次）</div>' +
      '</div></div></div>';

    bind(root);
  };

  function bind(root) {
    const pet = S.activePet();
    if (!pet) { adoptModal(); return; }

    // 初始化 Canvas 场景层
    initPetScene(pet, root);

    const feed = function (id) {
      const r = S.feedPet(id);
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) { bounce(); UI.refresh(); }
    };
    U.$('#petFeedBasic', root).addEventListener('click', function () { feed('petFoodBasic'); });
    U.$('#petFeedAdv', root).addEventListener('click', function () { feed('petFoodAdvanced'); });

    U.$('#petPat', root).addEventListener('click', function (e) {
      const r = S.patPet();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) {
        U.floatText(e.target, '💗 +2', 'pink');
        bounce();
        UI.refresh();
      }
    });
    U.$('#petAcc', root).addEventListener('click', function () {
      const r = S.equipAccessory();
      U.toast(r.msg, r.ok ? 'good' : 'bad');
      if (r.ok) UI.refresh();
    });
    U.$('#petRename', root).addEventListener('click', renameModal);
    U.$('#petAdopt', root).addEventListener('click', adoptModal);

    U.$$('[data-switch]', root).forEach(function (el) {
      el.addEventListener('click', function () {
        if (S.switchPet(el.dataset.switch)) { U.toast('已切换萌宠', 'good'); UI.refresh(); }
      });
    });
    U.$$('[data-species]', root).forEach(function (el) {
      el.addEventListener('click', function () { adoptModal(el.dataset.species); });
    });
    U.$$('[data-useitem]', root).forEach(function (el) {
      el.addEventListener('click', function () {
        const id = el.dataset.useitem;
        let r;
        if (id === 'petExpShard') r = S.usePetShard();
        else if (id === 'petFoodBasic' || id === 'petFoodAdvanced') r = S.feedPet(id);
        else if (id === 'petAccessory') r = S.equipAccessory();
        else if (id === 'petRenameCard') { renameModal(); return; }
        else r = { ok: false, msg: '暂不支持使用' };
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
  }

  function bounce() {
    if (!petSprite) return;
    petSprite.setState('happy', 900);
    petSprite.say('嗷~被摸摸好开心！', 1800);
    petSprite.emote('💗', 1100);
    if (petScene) {
      petScene.burst(petSprite.x, petSprite.y - petSprite.h * 0.2, {
        icons: ['💗', '✨'], count: 5, up: 46, life: 850
      });
    }
  }

  function initPetScene(pet, root) {
    const cvs = U.$('#petCanvas', root);
    if (!cvs || !Spr) return;
    // 停掉旧的
    if (petScene) { petScene.stop(); petScene = null; }

    petScene = new Spr.Scene(cvs, { bgFn: Spr.BACKGROUNDS.garden });

    const spriteCfg = Spr.CREATURE_LIBRARY[pet.speciesId] || {
      emoji: D.PET_MAP[pet.speciesId].icon,
      frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128
    };
    const sheets = Spr.buildCreatureSheets({
      emoji: spriteCfg.emoji, states: spriteCfg.frames, size: spriteCfg.size
    });
    petSprite = new Spr.Sprite(petScene, {
      sheets: sheets,
      frames: spriteCfg.frames,
      initState: pet.fullness < 20 ? 'sleep' : 'idle',
      x: petScene.size.w / 2,
      y: petScene.size.h * 0.72,
      scale: 0.9,
      frameTime: 180,
      facing: 1,
      size: spriteCfg.size,
      onClick: function () {
        // 点击宠物 → 冒气泡 + 爱心粒子 + 开心跳跃
        petSprite.say(bubbleOf(pet), 2200);
        petSprite.setState('happy', 900);
        petSprite.emote('❤️', 1100);
        petScene.burst(petSprite.x, petSprite.y - petSprite.h * 0.2, {
          icons: ['❤️', '💕', '✨'], count: 7, up: 52,life: 1000
        });
        S.patPet();
        // 延迟刷新，让气泡/粒子可见后再重渲染
        setTimeout(function () { UI.refresh(); }, 1600);
      }
    });
    petScene.addSprite(petSprite);

    // 绑定状态机：困了会睡，平时随机走动 + 跟随指针
    petScene.addMachine(new Spr.StateMachine(petSprite, Spr.BEHAVIORS.pet({
      fullness: pet.fullness,
      speed: 46
    })));

    // 心情好时随机说句话（间隔较长，避免刷屏）
    let nextChatAt = global.performance.now() + 4000;
    petScene.spawners.push(function (ctx, size, now) {
      if (now < nextChatAt) return;
      nextChatAt = now + 9000 + Math.random() * 6000;
      const p = S.activePet();
      if (!p || petSprite.state === 'sleep') return;
      if (p.fullness > 65) {
        petSprite.say(bubbleOf(p), 2000);
        petSprite.emote('🎵', 1200);
      }
    });

    petScene.start();
  }

  function renameModal() {
    const pet = S.activePet();
    if (!pet) return;
    if (S.inv('petRenameCard') <= 0) { U.toast('没有宠物改名卡，可在商城兑换', 'bad'); return; }
    U.modal({
      title: '给萌宠改名', icon: '📛',
      body: '<input class="login-input" id="petName" maxlength="8" value="' + U.esc(pet.name) + '" placeholder="输入新名字">',
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="petNameOk">确定</button>',
      onMount: function (box, close) {
        U.$('#petNameOk', box).addEventListener('click', function () {
          const name = (U.$('#petName', box).value || '').trim();
          if (!name) { U.toast('名字不能为空', 'bad'); return; }
          if (S.renamePet(name)) { U.toast('改名成功', 'good'); close(); UI.refresh(); }
          else U.toast('改名卡不足', 'bad');
        });
      }
    });
  }

  function adoptModal(preselect) {
    const st = S.get();
    U.modal({
      title: '领养萌宠', icon: '🐾',
      body: '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">高阶宠物需要花园等级达标后解锁；限定宠物仅在节日活动中出现。</div>' +
        '<div style="display:flex;flex-direction:column;gap:9px">' + D.PET_SPECIES.map(function (s) {
          const has = !!st.pets.list[s.id];
          const can = st.garden.level >= s.reqGardenLevel && !s.limited;
          return '<div class="st-item ' + (has ? 'good' : can ? 'info' : 'warn') + '" data-adopt="' + s.id + '" style="cursor:' + (can && !has ? 'pointer' : 'default') + '">' +
            '<span style="font-size:24px">' + s.icon + '</span>' +
            '<span style="flex:1"><b>' + s.name + '</b><div style="font-size:10.5px;color:#8b968c">' + U.esc(s.desc) + '</div></span>' +
            '<span style="font-size:10.5px;font-weight:700;color:' + (has ? '#4f9e57' : can ? '#5aa9d6' : '#c67b3f') + '">' +
            (has ? '已领养' : s.limited ? '节日限定' : can ? '可领养' : '花园 Lv' + s.reqGardenLevel) + '</span></div>';
        }).join('') + '</div>',
      footer: '<button class="btn" data-close>关闭</button>',
      onMount: function (box, close) {
        U.$$('[data-adopt]', box).forEach(function (el) {
          el.addEventListener('click', function () {
            const id = el.dataset.adopt;
            const r = S.adoptPet(id);
            if (r.ok) { U.toast(r.msg, 'good'); close(); UI.refresh(); }
            else U.toast(r.msg, 'bad');
          });
        });
      }
    });
  }

  global.WG.ui.pages.pet = page;
})(window);
