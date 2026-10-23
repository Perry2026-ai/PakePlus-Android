/* ============================================================
   状态层：存档 / 积分 / 等级 / 作物状态机 / 宠物 / 商城 / 任务
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const KEY = 'wg_save_v1';
  const PLOT_TOTAL = 30;
  const MATURE_WINDOW = 12 * 60 * 60 * 1000;   // 成熟后 12 小时超长保鲜期（护肝机制）
  const FISH_POND_TOTAL = 12;
  const LIVESTOCK_PEN_TOTAL = 12;
  const ORCHARD_TOTAL = 12;
  const PRODUCE_WINDOW = 12 * 60 * 60 * 1000;   // 产物可收取窗口 12 小时
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]; // 艾宾浩斯（天）
  const S = {};

  /* ---------------- 默认存档 ---------------- */
  function newPlots() {
    const arr = [];
    for (let i = 0; i < PLOT_TOTAL; i++) {
      arr.push({
        id: i,
        type: i % 2 === 0 ? 'veg' : 'flower',
        seedId: null,
        plantedAt: 0,
        matureAt: 0,
        witherAt: 0,
        duration: 0,
        water: 0,
        fert: 0,
        weed: false,
        pest: false,
        mutated: false,
        rebirthChecked: false
      });
    }
    return arr;
  }

  function newPonds() {
    const arr = [];
    for (let i = 0; i < FISH_POND_TOTAL; i++) {
      arr.push({
        id: i, fishId: null, stockedAt: 0, matureAt: 0, witherAt: 0,
        duration: 0, feed: 0, shielded: false
      });
    }
    return arr;
  }

  function newPens() {
    const arr = [];
    for (let i = 0; i < LIVESTOCK_PEN_TOTAL; i++) {
      arr.push({
        id: i, animalId: null, boughtAt: 0, produceAt: 0, expireAt: 0,
        duration: 0, feed: 0, shielded: false
      });
    }
    return arr;
  }

  function newTrees() {
    const arr = [];
    for (let i = 0; i < ORCHARD_TOTAL; i++) {
      arr.push({
        id: i, fruitId: null, plantedAt: 0, matureAt: 0, witherAt: 0,
        duration: 0, fert: 0, shielded: false
      });
    }
    return arr;
  }

  function defaultState() {
    return {
      version: 1,
      logged: false,
      profile: {
        nickname: '', avatar: '🌻', created: U.now(), started: false,
        days: [], totalPoints: 0, totalHarvest: 0, totalSteal: 0, totalHelp: 0
      },
      settings: { sound: true, fastGrow: false },
      points: 0,          // 收获积分：收获 / 出售 / 任务 / 签到等经营行为获得
      learnPoints: 0,     // 学习积分：唯一来源是背单词，用于购买种子 / 鱼苗 / 幼崽
      learn: {
        book: 'primary',
        words: {},              // key -> {stage,nextReview,learnedAt,correct,wrong}
        wrongWords: {},         // key -> {count,lastAt}
        newToday: 0, reviewToday: 0, quizToday: 0,
        date: '',
        totalNew: 0, totalReview: 0, correct: 0, wrong: 0,
        exp: 0, level: 1,
        streak: 0, lastCheckin: '', checkedToday: false, streak7: false,
        scholarBuff: false, scholarBuffUntil: 0,
        history: {},            // date -> {newWords, reviews, quiz, minutes}
        studySec: 0
      },
      garden: {
        exp: 0, level: 1,
        plots: newPlots(),
        todayHarvest: 0, todayHelp: 0, todaySteal: 0, todayDate: '',
        helpExpToday: 0,
        shieldUntil: 0,
        decorations: [],
        lastSeed: 'cabbage',
        album: {}
      },
      fish: {
        exp: 0, level: 1,
        ponds: newPonds(),
        todayHarvest: 0, todaySteal: 0, todayDate: '',
        shieldUntil: 0,
        lastFish: 'carp'
      },
      livestock: {
        exp: 0, level: 1,
        pens: newPens(),
        todayCollect: 0, todaySteal: 0, todayDate: '',
        shieldUntil: 0,
        lastAnimal: 'chicken'
      },
      orchard: {
        exp: 0, level: 1,
        trees: newTrees(),
        todayHarvest: 0, todaySteal: 0, todayDate: '',
        shieldUntil: 0,
        lastFruit: 'apple'
      },
      pets: {
        activeId: '',
        list: {},               // speciesId -> pet
        lastProduceDate: '',
        mood: 'happy',
        moodDate: ''
      },
      weather: { date: '', id: 'sunny' },
      blindbox: { date: '', used: false },
      albumHidden: false,
      inventory: {},
      shop: { date: '', bought: {} },
      tasks: { date: '', claimed: [], chest: false, chestClaimed: false, feedCount: 0 },
      week: { key: '', streakClaimed: false, sprintClaimed: false },
      checkin: { lastDate: '', streak: 0, history: {}, lastReward: null },
      friends: { date: '', data: {} },
      steals: { date: '', perFriend: {}, total: 0 },
      notices: [],
      reviewBuffUntil: 0
    };
  }

  /* ---------------- 存档读写 ---------------- */
  S.state = null;

  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.state)); } catch (e) { /* 忽略配额错误 */ }
  };

  S.load = function () {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { S.state = defaultState(); return; }
    try {
      const parsed = JSON.parse(raw);
      S.state = migrate(parsed);
    } catch (e) {
      S.state = defaultState();
    }
  };

  function migrate(old) {
    const base = defaultState();
    const st = Object.assign(base, old || {});
    st.profile = Object.assign(base.profile, old.profile || {});
    st.settings = Object.assign(base.settings, old.settings || {});
    st.learn = Object.assign(base.learn, old.learn || {});
    st.garden = Object.assign(base.garden, old.garden || {});
    st.fish = Object.assign(base.fish, old.fish || {});
    st.livestock = Object.assign(base.livestock, old.livestock || {});
    st.orchard = Object.assign(base.orchard, old.orchard || {});
    st.pets = Object.assign(base.pets, old.pets || {});
    st.shop = Object.assign(base.shop, old.shop || {});
    st.tasks = Object.assign(base.tasks, old.tasks || {});
    st.checkin = Object.assign({ lastDate: '', streak: 0, history: {}, lastReward: null }, old.checkin || {});
    if (!st.checkin.history || typeof st.checkin.history !== 'object') st.checkin.history = {};
    st.friends = Object.assign(base.friends, old.friends || {});
    st.steals = Object.assign(base.steals, old.steals || {});
    st.inventory = old.inventory || {};
    st.notices = old.notices || [];
    st.points = Number(st.points) || 0;
    st.learnPoints = Number(st.learnPoints) || 0;
    if (!Array.isArray(st.garden.plots) || st.garden.plots.length !== PLOT_TOTAL) st.garden.plots = newPlots();
    else st.garden.plots = st.garden.plots.map(function (p, i) {
      return Object.assign({
        id: i, type: i % 2 === 0 ? 'veg' : 'flower', seedId: null, plantedAt: 0,
        matureAt: 0, witherAt: 0, duration: 0, water: 0, fert: 0,
        weed: false, pest: false, mutated: false, rebirthChecked: false
      }, p || {});
    });
    if (!Array.isArray(st.fish.ponds) || st.fish.ponds.length !== FISH_POND_TOTAL) st.fish.ponds = newPonds();
    else st.fish.ponds = st.fish.ponds.map(function (p, i) {
      return Object.assign({ id: i, fishId: null, stockedAt: 0, matureAt: 0, witherAt: 0, duration: 0, feed: 0, shielded: false }, p || {});
    });
    if (!Array.isArray(st.livestock.pens) || st.livestock.pens.length !== LIVESTOCK_PEN_TOTAL) st.livestock.pens = newPens();
    else st.livestock.pens = st.livestock.pens.map(function (p, i) {
      return Object.assign({ id: i, animalId: null, boughtAt: 0, produceAt: 0, expireAt: 0, duration: 0, feed: 0, shielded: false }, p || {});
    });
    if (!Array.isArray(st.orchard.trees) || st.orchard.trees.length !== ORCHARD_TOTAL) st.orchard.trees = newTrees();
    else st.orchard.trees = st.orchard.trees.map(function (t, i) {
      return Object.assign({ id: i, fruitId: null, plantedAt: 0, matureAt: 0, witherAt: 0, duration: 0, fert: 0, shielded: false }, t || {});
    });
    return st;
  }

  S.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { }
    S.state = defaultState();
    S.init(true);
  };

  S.exportSave = function () { return JSON.stringify(S.state); };

  S.importSave = function (text) {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !obj.learn) throw new Error('bad');
      S.state = migrate(obj);
      S.ensureDaily(true);
      S.save();
      return true;
    } catch (e) { return false; }
  };

  S.init = function (skipDaily) {
    S.load();
    if (!skipDaily) S.ensureDaily();
    S.syncPets();
    S.save();
  };

  /* ---------------- 基础 getter ---------------- */
  S.get = function () { return S.state; };
  S.points = function () { return S.state.points; };
  S.inv = function (id) { return S.state.inventory[id] || 0; };

  function addItem(id, n) {
    const v = (S.state.inventory[id] || 0) + n;
    if (v <= 0) delete S.state.inventory[id];
    else S.state.inventory[id] = Math.round(v * 100) / 100;
  }
  S.addItem = addItem;
  S.takeItem = function (id, n) {
    if (S.inv(id) < n) return false;
    addItem(id, -n);
    return true;
  };

  /* ---------------- 等级定义 ---------------- */
  S.learnDef = function (lv) { return D.LEARN_LEVELS[U.clamp((lv || S.state.learn.level) - 1, 0, 9)]; };
  S.gardenDef = function (lv) { return D.GARDEN_LEVELS[U.clamp((lv || S.state.garden.level) - 1, 0, 14)]; };
  S.petDef = function (lv) { return D.PET_LEVELS[U.clamp((lv || 1) - 1, 0, 9)]; };
  S.intimacyDef = function (v) {
    let d = D.INTIMACY_LEVELS[0];
    D.INTIMACY_LEVELS.forEach(function (x) { if (v >= x.exp) d = x; });
    return d;
  };
  S.intimacyStar = function (v) { return S.intimacyDef(v).star; };

  S.learnAcc = function () {
    const l = S.state.learn;
    const total = l.correct + l.wrong;
    return total > 0 ? (l.correct / total * 100) : 70;
  };

  S.nextLearnLevel = function () {
    const lv = S.state.learn.level;
    return lv >= 10 ? null : D.LEARN_LEVELS[lv];
  };
  S.nextGardenLevel = function () {
    const lv = S.state.garden.level;
    return lv >= 15 ? null : D.GARDEN_LEVELS[lv];
  };
  S.nextPetLevel = function (pet) {
    if (!pet) return null;
    return pet.level >= 10 ? null : D.PET_LEVELS[pet.level];
  };

  S.unlockedPlots = function () { return S.gardenDef().plots; };

  /* ---------------- 加成汇总 ---------------- */
  S.buffs = function () {
    const st = S.state;
    const g = S.gardenDef();
    const ll = S.learnDef();
    const pet = S.activePet();
    const pd = pet ? S.petDef(pet.level) : {};
    const star = pet ? S.intimacyDef(pet.intimacy) : {};
    const allB = (star.allBonus || 0) / 100;

    let grow = (pd.grow || 0) + (ll.lv >= 4 ? 8 : 0);
    let reviewPts = (pd.reviewPts || 0) + (ll.lv >= 7 ? 15 : 0) + (star.expBonus || 0);
    let learnPts = (pd.learnPts || 0) + (ll.lv >= 2 ? 5 : 0);
    let stealBonus = (pd.steal || 0) + (ll.lv >= 8 ? 5 : 0) + (g.lv >= 12 ? 3 : 0);
    let shieldPct = (pd.shieldPct || 0) + (ll.lv >= 6 ? 20 : 0) + (g.lv >= 8 ? 10 : 0) + (g.lv >= 11 ? 100 : 0);
    let rareDrop = (pd.rareDrop || 0) + (star.rareDrop || 0) + (g.lv >= 12 ? 15 : 0);
    let quizBonus = (pd.quizBonus || 0) + (ll.lv >= 3 ? 1 : 0) + (ll.lv >= 8 ? 1 : 0);

    grow = grow * (1 + allB);
    reviewPts = reviewPts * (1 + allB);
    learnPts = learnPts * (1 + allB);

    return {
      grow: Math.round(grow),
      reviewPts: Math.round(reviewPts),
      learnPts: Math.round(learnPts),
      stealBonus: Math.round(stealBonus),
      shieldPct: Math.round(shieldPct),
      rareDrop: Math.round(rareDrop),
      quizBonus,
      freeWater: pd.freeWater || 0,
      freeFood: pd.freeFood || 0
    };
  };

  S.stealLimit = function () { return 20 + S.buffs().stealBonus; };
  S.helpLimit = function () { return 10; };
  S.newWordCap = function () { return 50; };
  S.shieldDuration = function () { return 3600 * 1000 * (1 + S.buffs().shieldPct / 100); };

  S.scholarActive = function () {
    const l = S.state.learn;
    if (!l.scholarBuff) return false;
    if (l.scholarBuffUntil && l.scholarBuffUntil <= U.now()) {
      l.scholarBuff = false;
      return false;
    }
    return true;
  };

  /* ---------------- 积分 / 经验 ---------------- */
  function pushNotice(icon, text) {
    const st = S.state;
    st.notices.unshift({ icon: icon, text: text, at: U.now() });
    if (st.notices.length > 30) st.notices.length = 30;
  }
  S.pushNotice = pushNotice;

  S.addPoints = function (n, quiet) {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    S.state.points = Math.round((S.state.points + v) * 100) / 100;
    if (v > 0) S.state.profile.totalPoints = Math.round((S.state.profile.totalPoints + v) * 100) / 100;
    if (!quiet) S.save();
    return v;
  };

  /* ============================================================
     学习积分（背单词专属货币）
     ------------------------------------------------------------
     传入的是「原始单位」，入账时统一乘以 3.5 倍系数，
     与 data.js 中商品价格的缩放保持一致。
     返回值为实际入账的学习积分，UI 直接用它做文案。
     ============================================================ */
  S.addLearnPoints = function (n, quiet) {
    const v = Math.round((Number(n) || 0) * D.POINT_SCALE * 100) / 100;
    S.state.learnPoints = Math.round((S.state.learnPoints + v) * 100) / 100;
    if (!quiet) S.save();
    return v;
  };

  // 读取指定币种的余额
  S.balanceOf = function (currency) {
    return currency === D.CUR.LEARN ? S.state.learnPoints : S.state.points;
  };

  // 按币种扣费；余额不足返回 false，不做任何扣减
  S.spendOf = function (currency, amount) {
    const a = Math.round((Number(amount) || 0) * 100) / 100;
    if (S.balanceOf(currency) < a) return false;
    if (currency === D.CUR.LEARN) {
      S.state.learnPoints = Math.round((S.state.learnPoints - a) * 100) / 100;
    } else {
      S.state.points = Math.round((S.state.points - a) * 100) / 100;
    }
    return true;
  };

  // 币种元信息（供 UI 复用）
  S.currencyMeta = function (currency) {
    return currency === D.CUR.LEARN
      ? { key: D.CUR.LEARN, icon: '📚', name: '学习积分', color: '#5aa9d6' }
      : { key: D.CUR.FARM, icon: '🪙', name: '收获积分', color: '#e8a93c' };
  };

  S.addLearnExp = function (n) {
    const l = S.state.learn;
    const mult = (l.streak7 ? 1.1 : 1) * (1 + S.buffs().learnPts / 100) * (1 + (S.intimacyDef(S.activePet() ? S.activePet().intimacy : 0).expBonus || 0) / 100);
    l.exp = Math.round((l.exp + n * mult) * 10) / 10;
    checkLearnLevel();
  };

  function checkLearnLevel() {
    const l = S.state.learn;
    let guard = 0;
    while (l.level < 10 && guard++ < 12) {
      const next = D.LEARN_LEVELS[l.level]; // 下一级定义
      if (!next) break;
      const acc = S.learnAcc();
      if (l.exp >= next.exp && l.totalNew >= next.minWords && acc >= next.acc) {
        l.level++;
        pushNotice('🎓', '学习等级提升：Lv' + l.level + ' ' + next.name);
        U.toast('学习等级提升 · Lv' + l.level + ' ' + next.name, 'gold');
      } else break;
    }
  }
  S.checkLearnLevel = checkLearnLevel;

  S.addGardenExp = function (n) {
    const g = S.state.garden;
    g.exp = Math.round((g.exp + n) * 10) / 10;
    let guard = 0;
    while (g.level < 15 && guard++ < 20) {
      const next = D.GARDEN_LEVELS[g.level];
      if (!next) break;
      if (g.exp >= next.exp) {
        g.level++;
        pushNotice('🌻', '花园升级：Lv' + g.level + '，' + next.perk);
        U.toast('花园升级 · Lv' + g.level + ' 解锁新权益', 'gold');
      } else break;
    }
  };

  /* ---------------- 每日重置 / 产出 ---------------- */
  S.ensureDaily = function (force) {
    const st = S.state;
    const today = U.dateStr();

    if (st.learn.date !== today) {
      st.learn.date = today;
      st.learn.newToday = 0;
      st.learn.reviewToday = 0;
      st.learn.quizToday = 0;
      st.learn.checkedToday = false;
    }
    if (st.garden.todayDate !== today) {
      st.garden.todayDate = today;
      st.garden.todayHarvest = 0;
      st.garden.todayHelp = 0;
      st.garden.todaySteal = 0;
      st.garden.helpExpToday = 0;
      // 每日免费道具
      if (st.garden.level >= 5) addItem('fertilizer', 1);
      if (st.garden.level >= 9) addItem('shield', 1);
      if (st.garden.level >= 15) { addItem('water', 3); addItem('fertilizer', 3); }
    }
    if (st.fish.todayDate !== today) {
      st.fish.todayDate = today;
      st.fish.todayHarvest = 0;
      st.fish.todaySteal = 0;
      if (st.fish.level >= 4) addItem('fishFood', 1);
    }
    if (st.livestock.todayDate !== today) {
      st.livestock.todayDate = today;
      st.livestock.todayCollect = 0;
      st.livestock.todaySteal = 0;
      if (st.livestock.level >= 4) addItem('animalFeed', 1);
    }
    if (st.orchard.todayDate !== today) {
      st.orchard.todayDate = today;
      st.orchard.todayHarvest = 0;
      st.orchard.todaySteal = 0;
      if (st.orchard.level >= 4) addItem('orchardFert', 1);
    }
    if (st.tasks.date !== today) {
      st.tasks.date = today;
      st.tasks.claimed = [];
      st.tasks.chest = false;
      st.tasks.chestClaimed = false;
      st.tasks.feedCount = 0;
    }
    if (st.shop.date !== today) {
      st.shop.date = today;
      st.shop.bought = {};
    }
    const wk = S.weekKey();
    if (!st.week || st.week.key !== wk) {
      st.week = { key: wk, streakClaimed: false, sprintClaimed: false };
    }
    if (st.steals.date !== today) {
      st.steals.date = today;
      st.steals.perFriend = {};
      st.steals.total = 0;
    }
    if (st.friends.date !== today) {
      st.friends.date = today;
      st.friends.data = genFriends(today);
    }
    // 宠物每日产出
    if (st.pets.lastProduceDate !== today) {
      const pet = S.activePet();
      st.pets.lastProduceDate = today;
      if (pet) {
        syncPets();
        if (pet.fullness > 0) {
          const pts = 1 + Math.floor(pet.level / 2);
          S.addPoints(pts, true);
          const gains = ['积分 +' + pts];
          if (pet.level >= 2) { addItem('petFoodBasic', 1); gains.push('基础宠物粮 ×1'); }
          if (pet.level >= 4) { addItem('water', 2); gains.push('浇水壶 ×2'); }
          if (S.intimacyStar(pet.intimacy) >= 5) {
            const rareSeeds = D.SEEDS.filter(function (s) { return s.tier === 2; });
            const rs = rareSeeds[Math.floor(Math.random() * rareSeeds.length)];
            addItem('seed_' + rs.id, 1);
            gains.push(rs.name + '种子 ×1');
          }
          // 看家护院：宠物自动清理花园杂草/虫害
          let cleaned = 0;
          for (let i = 0; i < S.unlockedPlots(); i++) {
            const p = st.garden.plots[i];
            if (!p.seedId) continue;
            const cs = S.cropState(p);
            if (cs.status === 'growing' || cs.status === 'seed') {
              if (p.weed && pet.level >= 3) { p.weed = false; cleaned++; }
              if (p.pest && pet.level >= 5) { p.pest = false; cleaned++; }
            }
          }
          if (cleaned > 0) gains.push('看家护院清理 ' + cleaned + ' 处杂草/虫害');
          pushNotice('🐾', pet.name + ' 今日产出：' + gains.join('，'));
        }
      }
    }
    if (force) { S.save(); }
  };

  /* ---------------- 学习：背诵 / 复习 / 错题 ---------------- */
  S.learnWord = function (wordKey, known, mode) {
    const st = S.state;
    const w = D.WORD_MAP[wordKey];
    if (!w) return { ok: false, msg: '单词不存在' };
    const rec = st.learn.words[wordKey];
    const today = U.dateStr();
    st.learn.date = today;
    const hist = st.learn.history[today] || (st.learn.history[today] = { newWords: 0, reviews: 0, quiz: 0, minutes: 0 });

    if (!rec) {
      if (!known) {
        st.learn.wrong++;
        addWrong(wordKey);
        st.learn.words[wordKey] = { stage: -1, nextReview: U.now() + 10 * 60 * 1000, learnedAt: U.now(), correct: 0, wrong: 1 };
        S.checkLearnLevel();
        return { ok: true, known: false, msg: '已加入生词本，稍后再来一次' };
      }
      // 新词成功
      const capped = st.learn.newToday >= S.newWordCap();
      st.learn.words[wordKey] = { stage: 1, nextReview: U.now() + REVIEW_INTERVALS[0] * 86400000, learnedAt: U.now(), correct: 1, wrong: 0 };
      st.learn.newToday++;
      st.learn.totalNew++;
      st.learn.correct++;
      hist.newWords++;
      let got = 0;
      if (!capped) {
        got = S.addLearnPoints(2, true);
        S.addLearnExp(2);
      }
      if (st.profile.days.indexOf(today) < 0) st.profile.days.push(today);
      checkinIfNeeded();
      S.save();
      return { ok: true, known: true, points: got, msg: capped ? '今日新词积分已达上限，仍计入学习量' : '新词掌握 +' + got + ' 学习积分' };
    }

    // 已有记录：复习
    if (known) {
      rec.stage = Math.min(rec.stage + 1, REVIEW_INTERVALS.length);
      const days = REVIEW_INTERVALS[Math.min(rec.stage - 1, REVIEW_INTERVALS.length - 1)];
      rec.nextReview = U.now() + days * 86400000;
      rec.correct = (rec.correct || 0) + 1;
      st.learn.correct++;
      st.learn.reviewToday++;
      st.learn.totalReview++;
      hist.reviews++;
      const buff = st.reviewBuffUntil > U.now() ? 2 : 1;
      const base = 1 * (1 + S.buffs().reviewPts / 100) * buff;
      const pts = Math.round(base * 100) / 100;
      const got = S.addLearnPoints(pts, true);
      S.addLearnExp(1);
      if (st.profile.days.indexOf(today) < 0) st.profile.days.push(today);
      S.save();
      return { ok: true, known: true, points: got, msg: '复习巩固 +' + got + ' 学习积分' + (buff > 1 ? '（加倍卡生效）' : '') };
    }
    rec.wrong = (rec.wrong || 0) + 1;
    rec.stage = Math.max(0, rec.stage - 1);
    rec.nextReview = U.now() + 30 * 60 * 1000;
    st.learn.wrong++;
    addWrong(wordKey);
    S.checkLearnLevel();
    S.save();
    return { ok: true, known: false, msg: '没关系，已为你安排稍后复习' };
  };

  function addWrong(key) {
    const st = S.state;
    const w = st.learn.wrongWords[key] || (st.learn.wrongWords[key] = { count: 0, lastAt: 0 });
    w.count++;
    w.lastAt = U.now();
    if (!st.learn.words[key]) {
      st.learn.words[key] = { stage: -1, nextReview: U.now() + 10 * 60 * 1000, learnedAt: U.now(), correct: 0, wrong: 1 };
    }
  }

  // 错题订正
  S.fixWrong = function (key) {
    const st = S.state;
    const w = st.learn.wrongWords[key];
    if (!w) return { ok: false };
    delete st.learn.wrongWords[key];
    const rec = st.learn.words[key];
    if (rec) {
      rec.wrong = Math.max(0, (rec.wrong || 1) - 1);
      rec.stage = Math.max(rec.stage, 0);
      rec.nextReview = U.now() + 86400000;
    }
    const got = S.addLearnPoints(0.5, true);
    S.addLearnExp(0.5);
    S.save();
    return { ok: true, points: got, msg: '订正完成 +' + got + ' 学习积分' };
  };

  S.wrongList = function () {
    const st = S.state;
    return Object.keys(st.learn.wrongWords).filter(function (k) { return D.WORD_MAP[k]; })
      .map(function (k) { return Object.assign({}, D.WORD_MAP[k], st.learn.wrongWords[k]); })
      .sort(function (a, b) { return b.lastAt - a.lastAt; });
  };

  S.dueWords = function (limit) {
    const st = S.state;
    const now = U.now();
    const list = Object.keys(st.learn.words)
      .filter(function (k) { return D.WORD_MAP[k] && st.learn.words[k].nextReview <= now && st.learn.words[k].stage >= 0; })
      .map(function (k) { return D.WORD_MAP[k]; });
    return limit ? list.slice(0, limit) : list;
  };

  S.learnedOfBook = function (book) {
    const st = S.state;
    return Object.keys(st.learn.words).filter(function (k) {
      const w = D.WORD_MAP[k];
      return w && w.book === book && st.learn.words[k].stage > 0;
    }).map(function (k) { return D.WORD_MAP[k]; });
  };

  // 打卡判定（累计 20 个单词）
  function checkinIfNeeded() {
    const st = S.state;
    const l = st.learn;
    if (l.checkedToday) return;
    const totalToday = l.newToday + l.reviewToday;
    if (totalToday < 20) return;
    l.checkedToday = true;
    const yesterday = U.dateStr(new Date(U.dayStart() - 86400000));
    l.streak = (l.lastCheckin === yesterday || l.lastCheckin === U.dateStr()) ? (l.streak || 0) + 1 : 1;
    l.lastCheckin = U.dateStr();
    if (l.streak >= 7) l.streak7 = true;
    const got = S.addLearnPoints(20, true);
    addItem('petFoodBasic', 1);
    S.addLearnExp(20);
    pushNotice('📅', '完成今日学习打卡：+' + got + ' 学习积分 + 基础宠物粮 ×1，连续 ' + l.streak + ' 天');
    U.toast('今日学习打卡完成！+' + got + ' 学习积分 + 基础宠物粮', 'gold');
    S.save();
  }
  S.checkinIfNeeded = checkinIfNeeded;

  S.makeupCheckin = function () {
    const st = S.state;
    if (!S.takeItem('makeupCard', 1)) return false;
    st.learn.streak = (st.learn.streak || 0) + 1;
    st.learn.lastCheckin = U.dateStr();
    if (st.learn.streak >= 7) st.learn.streak7 = true;
    S.save();
    return true;
  };

  /* ---------------- 闯关出题 ---------------- */
  S.buildQuiz = function (count) {
    const st = S.state;
    const bookId = st.learn.book;
    const all = D.BOOK_WORDS[bookId] || [];
    let pool = S.learnedOfBook(bookId);
    if (pool.length < 6) pool = all;
    const picks = U.shuffle(pool.length ? pool : all).slice(0, count);
    const quiz = [];
    picks.forEach(function (w, i) {
      const type = ['choice', 'fill', 'judge'][i % 3];
      const others = U.shuffle(all.filter(function (x) { return x.key !== w.key; })).slice(0, 3);
      if (type === 'choice') {
        const opts = U.shuffle([w].concat(others.slice(0, 3))).map(function (x) { return x.mean; });
        quiz.push({ type: 'choice', word: w, stem: w.word, sub: w.phon, opts: opts, answer: w.mean });
      } else if (type === 'fill') {
        quiz.push({ type: 'fill', word: w, stem: w.mean, sub: w.phon, answer: w.word });
      } else {
        const lie = others[0] && others[0].mean;
        const useLie = Math.random() < 0.5;
        quiz.push({
          type: 'judge', word: w, stem: w.word,
          sub: useLie ? ('「' + w.mean + '」的释义标注为：' + lie + '，是否正确？') : ('「' + w.mean + '」的释义标注为：' + w.mean + '，是否正确？'),
          answer: !useLie
        });
      }
    });
    return quiz;
  };

  S.finishQuiz = function (correctCount, total) {
    const st = S.state;
    const l = st.learn;
    const rate = total ? correctCount / total : 0;
    st.tasks.date = U.dateStr();
    l.quizToday++;
    const hist = l.history[U.dateStr()] || (l.history[U.dateStr()] = { newWords: 0, reviews: 0, quiz: 0, minutes: 0 });
    hist.quiz++;
    let pts = 0, exp = 0;
    if (rate >= 1) {
      pts = 15; exp = 15;
      // 学霸暴击 buff：闯关满分触发，1 小时内变异概率 +4%、学习收益 +10%
      l.scholarBuff = true;
      l.scholarBuffUntil = U.now() + 3600 * 1000;
      pushNotice('🎓', '学霸暴击触发！1 小时内变异概率 +4%、学习收益提升');
    }
    else if (rate >= 0.8) { pts = 10; exp = 10; }
    let got = 0;
    if (pts) { got = S.addLearnPoints(pts, true); }
    l.correct += correctCount;
    l.wrong += (total - correctCount);
    if (exp) S.addLearnExp(exp);
    if (st.profile.days.indexOf(U.dateStr()) < 0) st.profile.days.push(U.dateStr());
    checkinIfNeeded();
    S.save();
    return { points: got, exp: exp, rate: rate, scholar: rate >= 1 };
  };

  /* ---------------- 花园：作物状态机 ---------------- */
  S.seedUnlocked = function (seedId) {
    const seed = D.SEED_MAP[seedId];
    if (!seed) return false;
    return S.state.garden.level >= seed.unlockLevel;
  };

  /* ---------------- 天气系统 ---------------- */
  S.todayWeather = function () {
    const st = S.state;
    const today = U.dateStr();
    if (st.weather.date !== today) {
      const rnd = U.seedRand(today + 'weather');
      const weights = [30, 22, 14, 20, 14]; // 晴/风/露/阴/雨
      let total = weights.reduce(function (a, b) { return a + b; }, 0);
      let r = rnd() * total;
      let idx = 0;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) { idx = i; break; }
      }
      st.weather = { date: today, id: D.WEATHER[idx].id };
      S.save();
    }
    return D.WEATHER_MAP[st.weather.id] || D.WEATHER[0];
  };

  S.cropState = function (plot) {
    const unlocked = plot.id < S.unlockedPlots();
    if (!unlocked) return { status: 'locked', pct: 0, remain: 0 };
    if (!plot.seedId) return { status: 'empty', pct: 0, remain: 0 };
    const now = U.now();
    if (now >= plot.witherAt) return { status: 'withered', pct: 100, remain: 0, weed: plot.weed, pest: plot.pest, mutated: plot.mutated };
    if (now >= plot.matureAt) {
      return { status: 'mature', pct: 100, remain: 0, weed: plot.weed, pest: plot.pest, mutated: plot.mutated, harvestLeft: Math.max(0, (plot.witherAt - now) / 1000) };
    }
    const total = Math.max(1, plot.matureAt - plot.plantedAt);
    const pct = U.clamp(((now - plot.plantedAt) / total) * 100, 0, 99.5);
    const remain = Math.max(0, (plot.matureAt - now) / 1000);
    return { status: pct < 34 ? 'seed' : 'growing', pct: pct, remain: remain, weed: plot.weed, pest: plot.pest, mutated: plot.mutated };
  };

  S.plant = function (plotIdx, seedId) {
    const st = S.state;
    const plot = st.garden.plots[plotIdx];
    if (!plot) return { ok: false, msg: '地块不存在' };
    if (plotIdx >= S.unlockedPlots()) return { ok: false, msg: '地块尚未解锁（提升花园等级）' };
    if (plot.seedId) return { ok: false, msg: '该地块已种植' };
    const seed = D.SEED_MAP[seedId];
    if (!seed) return { ok: false, msg: '种子不存在' };
    if (!S.seedUnlocked(seedId)) return { ok: false, msg: '花园 Lv' + seed.unlockLevel + ' 解锁该种子' };
    if (seed.type !== plot.type) return { ok: false, msg: seed.type === 'veg' ? '该地块为花卉区' : '该地块为蔬菜区' };

    const seedKey = 'seed_' + seedId;
    let paid = 0;
    if (S.inv(seedKey) > 0) {
      S.takeItem(seedKey, 1);
    } else if (S.spendOf(D.CUR.LEARN, seed.cost)) {
      paid = seed.cost;
    } else {
      return { ok: false, msg: '学习积分不足，需要 ' + seed.cost + ' 学习积分（背单词获得）' };
    }

    let grow = S.buffs().grow / 100;
    if (S.state.garden.level >= 14 && seed.tier === 3) grow += 0.10;
    // 天气：晴天 +5%，微风大幅加速
    const w = S.todayWeather();
    if (w.id === 'sunny') grow += 0.05;
    if (w.id === 'breeze') grow += 0.12;
    let dur = seed.growSec * 1000 * (1 - grow);
    if (st.settings.fastGrow) dur = dur * 0.08;
    dur = Math.max(20000, dur);
    const now = U.now();
    plot.seedId = seedId;
    plot.plantedAt = now;
    plot.duration = dur;
    plot.matureAt = now + dur;
    plot.witherAt = now + dur + MATURE_WINDOW;
    plot.water = 0;
    plot.fert = 0;
    plot.weed = Math.random() < 0.22;
    plot.pest = Math.random() < 0.18;
    plot.mutated = false;
    plot.rebirthChecked = false;
    // 杂草/虫害减缓生长 15%（每个），清理后恢复
    const slow = (plot.weed ? 0.15 : 0) + (plot.pest ? 0.15 : 0);
    if (slow > 0) {
      const ext = dur * slow;
      plot.matureAt += ext;
      plot.witherAt += ext;
    }
    // 变异概率：晨露天气 + 学霸暴击buff + 稀有掉落加成
    let mutChance = 0.04;
    if (w.id === 'dewdrop') mutChance += 0.03;
    mutChance += S.buffs().rareDrop / 100;
    if (S.scholarActive()) mutChance += 0.04;
    if (Math.random() < mutChance) plot.mutated = true;
    st.garden.lastSeed = seedId;
    S.save();
    return { ok: true, paid: paid, msg: paid ? '播种成功，消耗 ' + paid + ' 积分' : '播种成功，使用库存种子' };
  };

  function shorten(plot, ratio) {
    const now = U.now();
    if (now >= plot.matureAt) return false;
    const base = plot.duration || (plot.matureAt - plot.plantedAt);
    const cut = base * ratio;
    plot.matureAt = Math.max(now + 3000, plot.matureAt - cut);
    plot.witherAt = plot.matureAt + MATURE_WINDOW;
    return true;
  }

  S.water = function (plotIdx, free) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    const cs = S.cropState(plot);
    if (cs.status === 'mature' || cs.status === 'withered') return { ok: false, msg: '作物已成熟或已枯萎' };
    if (plot.water >= 3) return { ok: false, msg: '该地块浇水次数已达上限' };
    if (!free && !S.takeItem('water', 1)) return { ok: false, msg: '浇水壶不足，请到商城兑换' };
    plot.water++;
    shorten(plot, 0.12);
    S.save();
    return { ok: true, msg: '浇水成功，生长时间缩短 12%' };
  };

  S.fertilize = function (plotIdx, free) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    const cs = S.cropState(plot);
    if (cs.status === 'mature' || cs.status === 'withered') return { ok: false, msg: '作物已成熟或已枯萎' };
    if (plot.fert >= 3) return { ok: false, msg: '该地块施肥次数已达上限' };
    if (!free && !S.takeItem('fertilizer', 1)) return { ok: false, msg: '肥料不足，请到商城兑换' };
    plot.fert++;
    shorten(plot, 0.12);
    S.save();
    return { ok: true, msg: '施肥成功，生长时间缩短 12%' };
  };

  S.speedup = function (plotIdx) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    const cs = S.cropState(plot);
    if (cs.status === 'mature' || cs.status === 'withered') return { ok: false, msg: '作物已成熟或已枯萎' };
    if (!S.takeItem('speedup', 1)) return { ok: false, msg: '加速剂不足' };
    const now = U.now();
    plot.matureAt = Math.max(now + 2000, now + (plot.matureAt - now) * 0.5);
    plot.witherAt = plot.matureAt + MATURE_WINDOW;
    S.save();
    return { ok: true, msg: '加速剂生效，剩余时间减半' };
  };

  S.clearWeed = function (plotIdx) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    if (!plot.weed) return { ok: false, msg: '该地块没有杂草' };
    plot.weed = false;
    // 清理后恢复被减缓的 15% 生长时间
    const now = U.now();
    if (now < plot.matureAt) {
      const base = plot.duration || (plot.matureAt - plot.plantedAt);
      const cut = base * 0.15;
      plot.matureAt = Math.max(now + 1000, plot.matureAt - cut);
      plot.witherAt = plot.matureAt + MATURE_WINDOW;
    }
    S.save();
    return { ok: true, msg: '除草成功，生长速度恢复' };
  };

  S.clearPest = function (plotIdx) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    if (!plot.pest) return { ok: false, msg: '该地块没有虫害' };
    plot.pest = false;
    const now = U.now();
    if (now < plot.matureAt) {
      const base = plot.duration || (plot.matureAt - plot.plantedAt);
      const cut = base * 0.15;
      plot.matureAt = Math.max(now + 1000, plot.matureAt - cut);
      plot.witherAt = plot.matureAt + MATURE_WINDOW;
    }
    S.save();
    return { ok: true, msg: '除虫成功，生长速度恢复' };
  };

  S.clearWeedAll = function () {
    let n = 0;
    for (let i = 0; i < S.unlockedPlots(); i++) {
      const p = S.state.garden.plots[i];
      if (p.weed) { S.clearWeed(i); n++; }
    }
    return { ok: n > 0, count: n };
  };

  S.clearPestAll = function () {
    let n = 0;
    for (let i = 0; i < S.unlockedPlots(); i++) {
      const p = S.state.garden.plots[i];
      if (p.pest) { S.clearPest(i); n++; }
    }
    return { ok: n > 0, count: n };
  };

  S.clearPlot = function (plotIdx) {
    const plot = S.state.garden.plots[plotIdx];
    if (!plot) return { ok: false, msg: '地块不存在' };
    if (!plot.seedId) return { ok: false, msg: '该地块是空的' };
    const cs = S.cropState(plot);
    if (cs.status === 'mature') return { ok: false, msg: '作物已成熟，请先收获' };
    plot.seedId = null; plot.plantedAt = 0; plot.matureAt = 0; plot.witherAt = 0;
    plot.duration = 0; plot.water = 0; plot.fert = 0; plot.weed = false; plot.pest = false;
    plot.mutated = false; plot.rebirthChecked = false;
    S.save();
    return { ok: true, msg: '已铲地，地块清空' };
  };

  S.harvest = function (plotIdx, quiet) {
    const st = S.state;
    const plot = st.garden.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '该地块没有作物' };
    const seed = D.SEED_MAP[plot.seedId];
    const cs = S.cropState(plot);
    if (cs.status === 'growing' || cs.status === 'seed') return { ok: false, msg: '作物还未成熟' };

    let gained = { points: 0, exp: 0, items: [], withered: cs.status === 'withered', mutated: plot.mutated };
    if (cs.status === 'mature') {
      const tierPts = seed.points * (1 + (st.garden.level >= 3 && seed.tier === 1 ? 0.05 : 0) + (st.garden.level >= 9 && seed.tier === 3 ? 0.12 : 0));
      gained.points = Math.round(tierPts * 10) / 10;
      gained.exp = seed.exp;
      // 变异：积分翻倍、经验 1.5 倍，掉落限定变异种子
      if (plot.mutated) {
        gained.points = Math.round(gained.points * 2 * 10) / 10;
        gained.exp = Math.round(gained.exp * 1.5 * 10) / 10;
        const rareSeed = U.pick(D.SEEDS.filter(function (s) { return s.tier === 2; }));
        S.addItem('seed_' + rareSeed.id, 1);
        gained.items.push('✨变异 · ' + rareSeed.name + '种子 ×1');
      }
      S.addPoints(gained.points, true);
      S.addItem('crop_' + seed.id, 1);
      gained.items.push(seed.name + ' ×1');
      // 图鉴收录
      st.garden.album[seed.id] = (st.garden.album[seed.id] || 0) + 1;
      // 稀有掉落
      if (seed.drop) {
        let chance = seed.tier === 3 ? 1 : 0.7;
        chance += S.buffs().rareDrop / 100;
        if (Math.random() < chance) {
          S.addItem(seed.drop, 1);
          gained.items.push((D.ITEMS[seed.drop] ? D.ITEMS[seed.drop].name : seed.drop) + ' ×1');
        }
      }
      st.profile.totalHarvest++;
      if (seed.type === 'flower' && seed.tier >= 2) st.profile.rareFlower = (st.profile.rareFlower || 0) + 1;
    } else {
      // 枯萎：无惩罚，仅清空地块
      gained.exp = 0;
      gained.points = 0;
    }
    S.addGardenExp(gained.exp);
    st.garden.todayHarvest++;
    plot.seedId = null; plot.plantedAt = 0; plot.matureAt = 0; plot.witherAt = 0; plot.duration = 0;
    plot.water = 0; plot.fert = 0;
    S.save();
    return { ok: true, gained: gained, seed: seed };
  };

  S.harvestAll = function () {
    const res = { count: 0, points: 0, exp: 0, items: [], withered: 0 };
    S.state.garden.plots.forEach(function (p) {
      if (!p.seedId) return;
      const cs = S.cropState(p);
      if (cs.status === 'mature' || cs.status === 'withered') {
        const r = S.harvest(p.id, true);
        if (r.ok) {
          res.count++;
          res.points += r.gained.points;
          res.exp += r.gained.exp;
          if (r.gained.withered) res.withered++;
          r.gained.items.forEach(function (x) { res.items.push(x); });
        }
      }
    });
    return res;
  };

  S.sowAll = function (seedId) {
    const st = S.state;
    const seed = D.SEED_MAP[seedId];
    if (!seed) return { ok: false, msg: '种子不存在' };
    let planted = 0;
    for (let i = 0; i < S.unlockedPlots(); i++) {
      const p = st.garden.plots[i];
      if (p.seedId || p.type !== seed.type) continue;
      const r = S.plant(i, seedId);
      if (r.ok) planted++;
      else break;
    }
    return { ok: planted > 0, count: planted, msg: planted ? '一键播种 ' + planted + ' 块' : '没有可播种的空地块或积分不足' };
  };

  S.waterAll = function () {
    let n = 0;
    for (let i = 0; i < S.unlockedPlots(); i++) {
      const p = S.state.garden.plots[i];
      if (!p.seedId) continue;
      const cs = S.cropState(p);
      if (cs.status !== 'growing' && cs.status !== 'seed') continue;
      if (p.water >= 3) continue;
      const r = S.water(i);
      if (r.ok) n++;
      else break;
    }
    return { ok: n > 0, count: n };
  };

  S.fertilizeAll = function () {
    let n = 0;
    for (let i = 0; i < S.unlockedPlots(); i++) {
      const p = S.state.garden.plots[i];
      if (!p.seedId) continue;
      const cs = S.cropState(p);
      if (cs.status !== 'growing' && cs.status !== 'seed') continue;
      if (p.fert >= 3) continue;
      const r = S.fertilize(i);
      if (r.ok) n++;
      else break;
    }
    return { ok: n > 0, count: n };
  };

  S.useShield = function () {
    const st = S.state;
    if (st.garden.shieldUntil > U.now()) return { ok: false, msg: '花园防护中，剩余 ' + U.fmtDur((st.garden.shieldUntil - U.now()) / 1000) };
    if (!S.takeItem('shield', 1)) return { ok: false, msg: '守护卡不足，可通过打卡/商城获取' };
    st.garden.shieldUntil = U.now() + S.shieldDuration();
    S.save();
    return { ok: true, msg: '花园防护开启，持续 ' + U.fmtDur(S.shieldDuration() / 1000) };
  };

  S.recycleAll = function () {
    const st = S.state;
    let total = 0, count = 0;
    Object.keys(st.inventory).forEach(function (id) {
      const n = st.inventory[id];
      if (!n) return;
      let price = 0;
      if (id === 'decoShard') { price = 6; }
      else if (id.indexOf('crop_') === 0) {
        const seed = D.SEED_MAP[id.replace('crop_', '')];
        price = seed ? Math.round(seed.price * 0.6) : 0;
      } else if (id.indexOf('fruit_') === 0) {
        const fruit = D.FRUIT_MAP[id.replace('fruit_', '')];
        price = fruit ? Math.round(fruit.price * 0.6) : 0;
      } else if (id.indexOf('fish_') === 0) {
        const fish = D.FISH_MAP[id.replace('fish_', '')];
        price = fish ? Math.round(fish.price * 0.6) : 0;
      } else if (id.indexOf('product_') === 0) {
        const animal = D.LIVESTOCK_MAP[id.replace('product_', '')];
        price = animal ? Math.round(animal.price * 0.6) : 0;
      } else return;
      total += price * n;
      count += n;
      delete st.inventory[id];
    });
    if (!total) return { ok: false, msg: '背包中没有可回收的作物/果实/鱼/畜产物' };
    S.addPoints(Math.round(total * 10) / 10, true);
    S.save();
    return { ok: true, points: Math.round(total * 10) / 10, count: count };
  };

  /* ---------------- 好友 / 偷菜 / 互助 ---------------- */
  function genFriends(seedDate) {
    const data = {};
    D.FRIENDS.forEach(function (f) {
      const rnd = U.seedRand(seedDate + f.id);
      const plots = [];
      const tierPool = [[1, 1, 1, 2], [1, 1, 2, 2], [1, 2, 2, 3], [2, 2, 3, 3]][U.clamp(Math.floor(f.lv / 4), 0, 3)];
      for (let i = 0; i < 6; i++) {
        const tier = tierPool[Math.floor(rnd() * tierPool.length)];
        const cands = D.SEEDS.filter(function (s) { return s.tier === tier; });
        const seed = cands[Math.floor(rnd() * cands.length)];
        // -25 分钟 ~ +45 分钟 成熟，保证部分可偷
        const offset = (-25 + rnd() * 70) * 60 * 1000;
        const matureAt = U.now() + offset;
        plots.push({
          seedId: seed.id,
          matureAt: matureAt,
          witherAt: matureAt + MATURE_WINDOW,
          protected: rnd() < 0.15,
          stolen: false,
          helped: false
        });
      }
      data[f.id] = { plots: plots, shieldUntil: 0 };
    });
    return data;
  }

  S.getFriends = function () {
    S.ensureDaily();
    return D.FRIENDS.map(function (f) {
      const g = S.state.friends.data[f.id] || { plots: [], shieldUntil: 0 };
      const ready = g.plots.filter(function (p) {
        return U.now() >= p.matureAt && U.now() < p.witherAt && !p.stolen && !p.protected;
      }).length;
      return Object.assign({}, f, {
        plots: g.plots,
        ready: ready,
        stoleToday: S.state.steals.perFriend[f.id] || 0
      });
    });
  };

  S.stealFrom = function (friendId, plotIdx) {
    const st = S.state;
    S.ensureDaily();
    const g = st.friends.data[friendId];
    if (!g) return { ok: false, msg: '好友花园不存在' };
    const plot = g.plots[plotIdx];
    if (!plot || !plot.seedId) return { ok: false, msg: '这块地没有作物' };
    const now = U.now();
    if (now < plot.matureAt) return { ok: false, msg: '作物还未成熟' };
    if (now >= plot.witherAt) return { ok: false, msg: '作物已经枯萎' };
    if (plot.stolen) return { ok: false, msg: '已经被偷走了' };
    if (plot.protected) return { ok: false, msg: '该作物处于保护状态' };
    const used = st.steals.perFriend[friendId] || 0;
    if (used >= 3) return { ok: false, msg: '今日偷该好友已达 3 次上限' };
    if (st.steals.total >= S.stealLimit()) return { ok: false, msg: '今日偷菜总次数已用完（' + S.stealLimit() + ' 次）' };

    const seed = D.SEED_MAP[plot.seedId];
    plot.stolen = true;
    st.steals.perFriend[friendId] = used + 1;
    st.steals.total++;
    st.garden.todaySteal = st.steals.total;
    st.profile.totalSteal++;
    S.addItem('crop_' + seed.id, 1);
    if (seed.drop && Math.random() < 0.35 + S.buffs().rareDrop / 100) S.addItem(seed.drop, 1);
    S.addGardenExp(2);
    pushNotice('🥷', '在「' + (D.FRIENDS.find(function (f) { return f.id === friendId; }) || {}).name + '」的花园偷到 ' + seed.name + ' ×1');
    S.save();
    return { ok: true, seed: seed, msg: '偷到 ' + seed.name + ' ×1' };
  };

  S.helpFriend = function (friendId, plotIdx) {
    const st = S.state;
    S.ensureDaily();
    if (st.garden.todayHelp >= S.helpLimit()) return { ok: false, msg: '今日互助次数已用完（' + S.helpLimit() + ' 次）' };
    const g = st.friends.data[friendId];
    if (!g) return { ok: false, msg: '好友花园不存在' };
    const plot = g.plots[plotIdx];
    if (plot && plot.helped) return { ok: false, msg: '这块地已经帮忙过了' };
    if (plot) plot.helped = true;
    st.garden.todayHelp++;
    st.profile.totalHelp++;
    const pts = 0.5 * (1 + (st.garden.level >= 4 ? 0.10 : 0));
    S.addPoints(Math.round(pts * 100) / 100, true);
    S.addGardenExp(1);
    st.garden.helpExpToday += 2;
    S.save();
    return { ok: true, msg: '互助成功 +1 花园经验 +' + (Math.round(pts * 100) / 100) + ' 积分' };
  };

  /* ---------------- 好友互动：拍一拍 / 留言 / 捣蛋 ---------------- */
  S.patFriend = function (friendId) {
    const st = S.state;
    S.ensureDaily();
    const key = 'pat_' + friendId;
    if (st.friends[key] && st.friends[key] === U.dateStr()) return { ok: false, msg: '今天已经拍过啦，明天再来' };
    st.friends[key] = U.dateStr();
    // 拍一拍随机掉落少量积分
    const pts = Math.random() < 0.5 ? 1 : 2;
    S.addPoints(pts, true);
    const f = D.FRIENDS.find(function (x) { return x.id === friendId; });
    pushNotice('👋', '拍了拍「' + (f ? f.name : '好友') + '」，掉落 ' + pts + ' 积分');
    S.save();
    return { ok: true, pts: pts, msg: '拍一拍成功，掉落 ' + pts + ' 积分' };
  };

  S.messages = function () {
    return S.state.friends.messages || [];
  };

  S.addMessage = function (friendId, text) {
    const st = S.state;
    if (!st.friends.messages) st.friends.messages = [];
    const f = D.FRIENDS.find(function (x) { return x.id === friendId; });
    st.friends.messages.unshift({
      from: f ? f.name : '好友',
      icon: f ? f.icon : '👤',
      text: text,
      at: U.now()
    });
    if (st.friends.messages.length > 30) st.friends.messages.length = 30;
    S.save();
  };

  S.prankFriend = function (friendId, type) {
    const st = S.state;
    const g = st.friends.data[friendId];
    if (!g) return { ok: false, msg: '好友花园不存在' };
    const f = D.FRIENDS.find(function (x) { return x.id === friendId; });
    // 捣蛋仅作为趣味互动，随机获得少量积分或被"反制"
    const roll = Math.random();
    if (roll < 0.4) {
      const pts = 1;
      S.addPoints(pts, true);
      pushNotice('🐛', '在「' + (f ? f.name : '好友') + '」的花园放了' + (type === 'weed' ? '杂草' : '小虫') + '，恶作剧 +1 积分');
      S.save();
      return { ok: true, msg: '捣蛋成功！+1 积分（纯趣味互动）' };
    }
    pushNotice('😅', '放' + (type === 'weed' ? '杂草' : '小虫') + '时被「' + (f ? f.name : '好友') + '」家的宠物发现啦');
    return { ok: true, msg: '被宠物发现啦，恶作剧失败（纯趣味互动）' };
  };

  /* ---------------- 商城 ---------------- */
  S.shopGoods = function () {
    const st = S.state;
    const goods = [];
    // 种子 —— 必须用学习积分兑换
    D.SEEDS.forEach(function (s) {
      goods.push({
        id: 'seed_' + s.id, kind: 'seed', seed: s, cat: 'plant',
        name: s.name + (s.type === 'veg' ? '种子' : '花种'), icon: s.icon,
        desc: TIER_DESC(s), price: s.cost, limit: 0,
        currency: D.CUR.LEARN,
        locked: st.garden.level < s.unlockLevel,
        lockMsg: '花园 Lv' + s.unlockLevel + ' 解锁'
      });
    });
    // 道具 —— 学习辅助用学习积分，养料 / 周边 / 宠物用品用收获积分
    Object.keys(D.ITEMS).forEach(function (id) {
      const it = D.ITEMS[id];
      if (it.noSell) return;
      let locked = false, lockMsg = '';
      if (it.reqLearnLevel && st.learn.level < it.reqLearnLevel) { locked = true; lockMsg = '学习 Lv' + it.reqLearnLevel + ' 解锁'; }
      if (it.reqGardenLevel && st.garden.level < it.reqGardenLevel) { locked = true; lockMsg = '花园 Lv' + it.reqGardenLevel + ' 解锁'; }
      if (it.once && st.garden.decorations.indexOf(id) >= 0) { locked = true; lockMsg = '已拥有'; }
      let price = it.price;
      if (id === 'water' || id === 'fertilizer') {
        if (st.garden.level >= 13) price = Math.round(price * 0.95 * 10) / 10;
      }
      goods.push({
        id: id, kind: 'item', item: it, cat: it.cat,
        name: it.name, icon: it.icon, desc: it.desc, price: price,
        currency: it.currency || D.CUR.FARM,
        limit: it.limit || 0, locked: locked, lockMsg: lockMsg,
        bought: st.shop.bought[id] || 0
      });
    });
    return goods;
  };

  function TIER_DESC(s) {
    return D.TIER_NAME[s.tier] + '·' + (s.type === 'veg' ? '蔬菜' : '花卉') + '｜生长 ' + U.fmtDur(s.growSec) +
      '｜收获 ' + s.points + ' 积分 + ' + s.exp + ' 花园经验';
  }

  S.buy = function (goodsId, qty) {
    const st = S.state;
    const n = qty || 1;
    const goods = S.shopGoods().find(function (g) { return g.id === goodsId; });
    if (!goods) return { ok: false, msg: '商品不存在' };
    if (goods.locked) return { ok: false, msg: goods.lockMsg || '尚未解锁' };
    if (goods.limit) {
      const bought = st.shop.bought[goodsId] || 0;
      if (bought + n > goods.limit) return { ok: false, msg: '超出每日限购（' + goods.limit + '）' };
    }
    const total = Math.round(goods.price * n * 10) / 10;
    const meta = S.currencyMeta(goods.currency);
    if (!S.spendOf(goods.currency, total)) {
      return { ok: false, msg: meta.name + '不足，需要 ' + total + '（' + (goods.currency === D.CUR.LEARN ? '去背单词赚学习积分' : '去收获作物赚积分') + '）' };
    }
    st.shop.bought[goodsId] = (st.shop.bought[goodsId] || 0) + n;
    // 发放
    if (goods.kind === 'seed') {
      S.addItem('seed_' + goods.seed.id, n);
    } else {
      S.addItem(goods.id, n);
      if (goods.item.once) {
        if (st.garden.decorations.indexOf(goods.id) < 0) st.garden.decorations.push(goods.id);
        const expMap = { deco_tile: 30, deco_fence: 30, deco_ornament: 40, deco_bg: 60, deco_bg_custom: 100, deco_effect: 60, deco_skin: 100 };
        S.addGardenExp(expMap[goods.id] || 20);
      }
    }
    S.save();
    return { ok: true, msg: '兑换成功：' + goods.name + ' ×' + n + '，消耗 ' + total + ' ' + meta.name };
  };

  S.useStudyItem = function (id) {
    const st = S.state;
    if (id === 'wrongClearCard') {
      if (!S.takeItem(id, 1)) return { ok: false, msg: '没有错题清零卡' };
      if (!Object.keys(st.learn.wrongWords).length) { addItem(id, 1); return { ok: false, msg: '错题本已经是空的' }; }
      const n = Object.keys(st.learn.wrongWords).length;
      st.learn.wrongWords = {};
      S.save();
      return { ok: true, msg: '已清空 ' + n + ' 个错题' };
    }
    if (id === 'reviewDoubleCard') {
      if (st.reviewBuffUntil > U.now()) return { ok: false, msg: '复习加倍已生效中' };
      if (!S.takeItem(id, 1)) return { ok: false, msg: '没有复习加倍卡' };
      st.reviewBuffUntil = U.now() + 3600 * 1000;
      S.save();
      return { ok: true, msg: '复习积分翻倍，持续 1 小时' };
    }
    if (id === 'makeupCard') {
      const ok = S.makeupCheckin();
      return ok ? { ok: true, msg: '补签成功，连续打卡 +1 天' } : { ok: false, msg: '没有补签卡' };
    }
    return { ok: false, msg: '该道具需在对应场景使用' };
  };

  /* ---------------- 鱼池 ---------------- */
  S.fishDef = function (lv) { return D.FISH_POND_LEVELS[U.clamp((lv || S.state.fish.level) - 1, 0, 9)]; };
  S.nextFishLevel = function () { const lv = S.state.fish.level; return lv >= 10 ? null : D.FISH_POND_LEVELS[lv]; };
  S.fishSlots = function () { return S.fishDef().slots; };
  S.fishShieldActive = function () { return S.state.fish.shieldUntil > U.now(); };

  S.fishUnlocked = function (fishId) {
    const f = D.FISH_MAP[fishId];
    return f && S.state.fish.level >= f.unlockLevel;
  };

  S.fishState = function (pond) {
    const unlocked = pond.id < S.fishSlots();
    if (!unlocked) return { status: 'locked', pct: 0, remain: 0 };
    if (!pond.fishId) return { status: 'empty', pct: 0, remain: 0 };
    const now = U.now();
    if (now >= pond.witherAt) return { status: 'escaped', pct: 100, remain: 0 };
    if (now >= pond.matureAt) return { status: 'mature', pct: 100, remain: 0, harvestLeft: Math.max(0, (pond.witherAt - now) / 1000) };
    const total = Math.max(1, pond.matureAt - pond.stockedAt);
    const pct = U.clamp(((now - pond.stockedAt) / total) * 100, 0, 99.5);
    return { status: pct < 34 ? 'fry' : 'growing', pct: pct, remain: Math.max(0, (pond.matureAt - now) / 1000) };
  };

  S.buyFish = function (pondIdx, fishId) {
    const st = S.state;
    const pond = st.fish.ponds[pondIdx];
    if (!pond) return { ok: false, msg: '鱼池不存在' };
    if (pondIdx >= S.fishSlots()) return { ok: false, msg: '鱼池尚未解锁（提升鱼池等级）' };
    if (pond.fishId) return { ok: false, msg: '该鱼池已养鱼' };
    const fish = D.FISH_MAP[fishId];
    if (!fish) return { ok: false, msg: '鱼种不存在' };
    if (!S.fishUnlocked(fishId)) return { ok: false, msg: '鱼池 Lv' + fish.unlockLevel + ' 解锁该鱼种' };
    const fryKey = 'fry_' + fishId;
    if (S.inv(fryKey) > 0) { S.takeItem(fryKey, 1); }
    else if (S.spendOf(D.CUR.LEARN, fish.cost)) { /* 已扣学习积分 */ }
    else return { ok: false, msg: '学习积分不足，需要 ' + fish.cost + ' 学习积分（背单词获得）' };

    let grow = (S.fishDef().grow || 0) / 100;
    grow += (st.fish.level >= 4 ? 0.08 : 0) + (st.fish.level >= 8 ? 0.04 : 0);
    let dur = fish.growSec * 1000 * (1 - grow);
    if (st.settings.fastGrow) dur = dur * 0.08;
    dur = Math.max(20000, dur);
    const now = U.now();
    pond.fishId = fishId;
    pond.stockedAt = now;
    pond.duration = dur;
    pond.matureAt = now + dur;
    pond.witherAt = now + dur + MATURE_WINDOW;
    pond.feed = 0;
    st.fish.lastFish = fishId;
    S.save();
    return { ok: true, msg: '已投放 ' + fish.name + '鱼苗' };
  };

  S.feedFish = function (pondIdx) {
    const pond = S.state.fish.ponds[pondIdx];
    if (!pond || !pond.fishId) return { ok: false, msg: '鱼池没有鱼' };
    const cs = S.fishState(pond);
    if (cs.status !== 'fry' && cs.status !== 'growing') return { ok: false, msg: '鱼已成熟，无需投喂' };
    if (pond.feed >= 3) return { ok: false, msg: '该鱼池今日投喂已达上限（3 次）' };
    if (!S.takeItem('fishFood', 1)) return { ok: false, msg: '鱼食不足，请到商城兑换' };
    pond.feed++;
    const reduce = pond.duration * 0.12;
    pond.matureAt -= reduce;
    pond.witherAt -= reduce;
    S.save();
    return { ok: true, msg: '投喂成功，生长加速 12%' };
  };

  S.speedFish = function (pondIdx) {
    const pond = S.state.fish.ponds[pondIdx];
    if (!pond || !pond.fishId) return { ok: false, msg: '鱼池没有鱼' };
    if (S.fishState(pond).status === 'mature') return { ok: false, msg: '鱼已成熟' };
    if (!S.takeItem('fishSpeed', 1)) return { ok: false, msg: '增氧剂不足' };
    const remain = Math.max(0, pond.matureAt - U.now());
    const reduce = Math.min(remain, remain * 0.5);
    pond.matureAt -= reduce;
    pond.witherAt -= reduce;
    S.save();
    return { ok: true, msg: '增氧剂生效，生长时间减半' };
  };

  S.harvestFish = function (pondIdx, quiet) {
    const st = S.state;
    const pond = st.fish.ponds[pondIdx];
    if (!pond || !pond.fishId) return { ok: false, msg: '该鱼池没有鱼' };
    const fish = D.FISH_MAP[pond.fishId];
    const cs = S.fishState(pond);
    if (cs.status === 'fry' || cs.status === 'growing') return { ok: false, msg: '鱼还未成熟' };
    let gained = { points: 0, exp: 0, items: [], escaped: cs.status === 'escaped' };
    if (cs.status === 'mature') {
      const lvlBonus = (st.fish.level >= 2 ? 0.05 : 0) + (st.fish.level >= 6 ? 0.05 : 0);
      gained.points = Math.round(fish.points * (1 + lvlBonus) * 10) / 10;
      gained.exp = fish.exp;
      S.addPoints(gained.points, true);
      S.addItem('fish_' + fish.id, 1);
      gained.items.push(fish.name + ' ×1');
      if (fish.drop && Math.random() < (fish.tier === 3 ? 1 : 0.65)) {
        S.addItem(fish.drop, 1);
        gained.items.push((D.ITEMS[fish.drop] ? D.ITEMS[fish.drop].name : fish.drop) + ' ×1');
      }
    }
    S.addFishExp(gained.exp);
    st.fish.todayHarvest++;
    pond.fishId = null; pond.stockedAt = 0; pond.matureAt = 0; pond.witherAt = 0; pond.duration = 0; pond.feed = 0;
    S.save();
    return { ok: true, gained: gained, fish: fish };
  };

  S.harvestAllFish = function () {
    const res = { count: 0, points: 0, exp: 0, items: [], escaped: 0 };
    S.state.fish.ponds.forEach(function (p) {
      if (!p.fishId) return;
      const cs = S.fishState(p);
      if (cs.status === 'mature' || cs.status === 'escaped') {
        const r = S.harvestFish(p.id, true);
        if (r.ok) {
          res.count++; res.points += r.gained.points; res.exp += r.gained.exp;
          res.items = res.items.concat(r.gained.items);
          if (r.gained.escaped) res.escaped++;
        }
      }
    });
    return res;
  };

  S.addFishExp = function (n) {
    const f = S.state.fish;
    f.exp = Math.round((f.exp + n) * 10) / 10;
    let guard = 0;
    while (f.level < 10 && guard++ < 15) {
      const next = D.FISH_POND_LEVELS[f.level];
      if (next && f.exp >= next.exp) {
        f.level++;
        pushNotice('🐟', '鱼池升级：Lv' + f.level + '，' + next.perk);
        U.toast('鱼池升级 · Lv' + f.level + ' 解锁新权益', 'gold');
      } else break;
    }
  };

  S.fishShield = function () {
    if (!S.takeItem('fishShield', 1)) return { ok: false, msg: '鱼池防护网不足' };
    S.state.fish.shieldUntil = U.now() + 60 * 60 * 1000;
    S.save();
    return { ok: true, msg: '鱼池防护已开启，持续 1 小时' };
  };

  /* ---------------- 养殖（禽畜） ---------------- */
  S.livestockDef = function (lv) { return D.LIVESTOCK_LEVELS[U.clamp((lv || S.state.livestock.level) - 1, 0, 9)]; };
  S.nextLivestockLevel = function () { const lv = S.state.livestock.level; return lv >= 10 ? null : D.LIVESTOCK_LEVELS[lv]; };
  S.livestockSlots = function () { return S.livestockDef().slots; };
  S.livestockShieldActive = function () { return S.state.livestock.shieldUntil > U.now(); };

  S.animalUnlocked = function (animalId) {
    const a = D.LIVESTOCK_MAP[animalId];
    return a && S.state.livestock.level >= a.unlockLevel;
  };

  S.animalState = function (pen) {
    const unlocked = pen.id < S.livestockSlots();
    if (!unlocked) return { status: 'locked', pct: 0, remain: 0 };
    if (!pen.animalId) return { status: 'empty', pct: 0, remain: 0 };
    const now = U.now();
    if (now >= pen.expireAt) return { status: 'spoiled', pct: 100, remain: 0 };
    if (now >= pen.produceAt) return { status: 'ready', pct: 100, remain: 0, collectLeft: Math.max(0, (pen.expireAt - now) / 1000) };
    const total = Math.max(1, pen.produceAt - pen.boughtAt);
    const pct = U.clamp(((now - pen.boughtAt) / total) * 100, 0, 99.5);
    return { status: pct < 34 ? 'young' : 'producing', pct: pct, remain: Math.max(0, (pen.produceAt - now) / 1000) };
  };

  S.buyAnimal = function (penIdx, animalId) {
    const st = S.state;
    const pen = st.livestock.pens[penIdx];
    if (!pen) return { ok: false, msg: '栏位不存在' };
    if (penIdx >= S.livestockSlots()) return { ok: false, msg: '栏位尚未解锁（提升牧场等级）' };
    if (pen.animalId) return { ok: false, msg: '该栏位已有禽畜' };
    const animal = D.LIVESTOCK_MAP[animalId];
    if (!animal) return { ok: false, msg: '品种不存在' };
    if (!S.animalUnlocked(animalId)) return { ok: false, msg: '牧场 Lv' + animal.unlockLevel + ' 解锁该品种' };
    if (!S.spendOf(D.CUR.LEARN, animal.cost)) return { ok: false, msg: '学习积分不足，需要 ' + animal.cost + ' 学习积分（背单词获得）' };

    let speed = (S.livestockDef().speed || 0) / 100;
    speed += (st.livestock.level >= 4 ? 0.08 : 0) + (st.livestock.level >= 8 ? 0.04 : 0);
    let dur = animal.prodSec * 1000 * (1 - speed);
    if (st.settings.fastGrow) dur = dur * 0.08;
    dur = Math.max(20000, dur);
    const now = U.now();
    pen.animalId = animalId;
    pen.boughtAt = now;
    pen.duration = dur;
    pen.produceAt = now + dur;
    pen.expireAt = now + dur + PRODUCE_WINDOW;
    pen.feed = 0;
    st.livestock.lastAnimal = animalId;
    S.save();
    return { ok: true, msg: '已购入 ' + animal.name };
  };

  S.feedAnimal = function (penIdx) {
    const pen = S.state.livestock.pens[penIdx];
    if (!pen || !pen.animalId) return { ok: false, msg: '栏位没有禽畜' };
    const cs = S.animalState(pen);
    if (cs.status !== 'young' && cs.status !== 'producing') return { ok: false, msg: '产物已产出，无需投喂' };
    if (pen.feed >= 3) return { ok: false, msg: '该禽畜今日投喂已达上限（3 次）' };
    if (!S.takeItem('animalFeed', 1)) return { ok: false, msg: '饲料不足，请到商城兑换' };
    pen.feed++;
    const reduce = pen.duration * 0.12;
    pen.produceAt -= reduce;
    pen.expireAt -= reduce;
    S.save();
    return { ok: true, msg: '投喂成功，产出加速 12%' };
  };

  S.speedAnimal = function (penIdx) {
    const pen = S.state.livestock.pens[penIdx];
    if (!pen || !pen.animalId) return { ok: false, msg: '栏位没有禽畜' };
    if (S.animalState(pen).status === 'ready') return { ok: false, msg: '产物已产出' };
    if (!S.takeItem('animalSpeed', 1)) return { ok: false, msg: '催长素不足' };
    const remain = Math.max(0, pen.produceAt - U.now());
    const reduce = Math.min(remain, remain * 0.5);
    pen.produceAt -= reduce;
    pen.expireAt -= reduce;
    S.save();
    return { ok: true, msg: '催长素生效，产出时间减半' };
  };

  S.collectProduct = function (penIdx, quiet) {
    const st = S.state;
    const pen = st.livestock.pens[penIdx];
    if (!pen || !pen.animalId) return { ok: false, msg: '该栏位没有禽畜' };
    const animal = D.LIVESTOCK_MAP[pen.animalId];
    const cs = S.animalState(pen);
    if (cs.status === 'young' || cs.status === 'producing') return { ok: false, msg: '产物尚未产出' };
    let gained = { points: 0, exp: 0, items: [], spoiled: cs.status === 'spoiled' };
    if (cs.status === 'ready') {
      const lvlBonus = (st.livestock.level >= 2 ? 0.05 : 0) + (st.livestock.level >= 6 ? 0.05 : 0);
      gained.points = Math.round(animal.points * (1 + lvlBonus) * 10) / 10;
      gained.exp = animal.exp;
      S.addPoints(gained.points, true);
      S.addItem('product_' + animal.id, 1);
      gained.items.push(animal.product + ' ' + animal.productName + ' ×1');
    }
    S.addLivestockExp(gained.exp);
    st.livestock.todayCollect++;
    pen.animalId = null; pen.boughtAt = 0; pen.produceAt = 0; pen.expireAt = 0; pen.duration = 0; pen.feed = 0;
    S.save();
    return { ok: true, gained: gained, animal: animal };
  };

  S.collectAll = function () {
    const res = { count: 0, points: 0, exp: 0, items: [], spoiled: 0 };
    S.state.livestock.pens.forEach(function (p) {
      if (!p.animalId) return;
      const cs = S.animalState(p);
      if (cs.status === 'ready' || cs.status === 'spoiled') {
        const r = S.collectProduct(p.id, true);
        if (r.ok) {
          res.count++; res.points += r.gained.points; res.exp += r.gained.exp;
          res.items = res.items.concat(r.gained.items);
          if (r.gained.spoiled) res.spoiled++;
        }
      }
    });
    return res;
  };

  S.addLivestockExp = function (n) {
    const l = S.state.livestock;
    l.exp = Math.round((l.exp + n) * 10) / 10;
    let guard = 0;
    while (l.level < 10 && guard++ < 15) {
      const next = D.LIVESTOCK_LEVELS[l.level];
      if (next && l.exp >= next.exp) {
        l.level++;
        pushNotice('🐔', '牧场升级：Lv' + l.level + '，' + next.perk);
        U.toast('牧场升级 · Lv' + l.level + ' 解锁新权益', 'gold');
      } else break;
    }
  };

  S.livestockShield = function () {
    if (!S.takeItem('animalShield', 1)) return { ok: false, msg: '牧场围栏不足' };
    S.state.livestock.shieldUntil = U.now() + 60 * 60 * 1000;
    S.save();
    return { ok: true, msg: '牧场防护已开启，持续 1 小时' };
  };

  /* ---------------- 果园 ---------------- */
  S.orchardDef = function (lv) { return D.ORCHARD_LEVELS[U.clamp((lv || S.state.orchard.level) - 1, 0, 9)]; };
  S.nextOrchardLevel = function () { const lv = S.state.orchard.level; return lv >= 10 ? null : D.ORCHARD_LEVELS[lv]; };
  S.orchardSlots = function () { return S.orchardDef().slots; };
  S.orchardShieldActive = function () { return S.state.orchard.shieldUntil > U.now(); };

  S.fruitUnlocked = function (fruitId) {
    const f = D.FRUIT_MAP[fruitId];
    return f && S.state.orchard.level >= f.unlockLevel;
  };

  S.orchardState = function (tree) {
    const unlocked = tree.id < S.orchardSlots();
    if (!unlocked) return { status: 'locked', pct: 0, remain: 0 };
    if (!tree.fruitId) return { status: 'empty', pct: 0, remain: 0 };
    const now = U.now();
    if (now >= tree.witherAt) return { status: 'withered', pct: 100, remain: 0 };
    if (now >= tree.matureAt) return { status: 'mature', pct: 100, remain: 0, harvestLeft: Math.max(0, (tree.witherAt - now) / 1000) };
    const total = Math.max(1, tree.matureAt - tree.plantedAt);
    const pct = U.clamp(((now - tree.plantedAt) / total) * 100, 0, 99.5);
    return { status: pct < 34 ? 'sapling' : 'growing', pct: pct, remain: Math.max(0, (tree.matureAt - now) / 1000) };
  };

  S.plantFruit = function (treeIdx, fruitId) {
    const st = S.state;
    const tree = st.orchard.trees[treeIdx];
    if (!tree) return { ok: false, msg: '果树位不存在' };
    if (treeIdx >= S.orchardSlots()) return { ok: false, msg: '果树位尚未解锁（提升果园等级）' };
    if (tree.fruitId) return { ok: false, msg: '该果树已栽种' };
    const fruit = D.FRUIT_MAP[fruitId];
    if (!fruit) return { ok: false, msg: '品种不存在' };
    if (!S.fruitUnlocked(fruitId)) return { ok: false, msg: '果园 Lv' + fruit.unlockLevel + ' 解锁该品种' };
    const saplingKey = 'sapling_' + fruitId;
    if (S.inv(saplingKey) > 0) { S.takeItem(saplingKey, 1); }
    else if (S.spendOf(D.CUR.LEARN, fruit.cost)) { /* 已扣学习积分 */ }
    else return { ok: false, msg: '学习积分不足，需要 ' + fruit.cost + ' 学习积分（背单词获得）' };

    let grow = (S.orchardDef().grow || 0) / 100;
    grow += (st.orchard.level >= 4 ? 0.08 : 0) + (st.orchard.level >= 8 ? 0.04 : 0);
    let dur = fruit.growSec * 1000 * (1 - grow);
    if (st.settings.fastGrow) dur = dur * 0.08;
    dur = Math.max(20000, dur);
    const now = U.now();
    tree.fruitId = fruitId;
    tree.plantedAt = now;
    tree.duration = dur;
    tree.matureAt = now + dur;
    tree.witherAt = now + dur + MATURE_WINDOW;
    tree.fert = 0;
    st.orchard.lastFruit = fruitId;
    S.save();
    return { ok: true, msg: '已栽种 ' + fruit.name + '树苗' };
  };

  S.fertilizeTree = function (treeIdx) {
    const tree = S.state.orchard.trees[treeIdx];
    if (!tree || !tree.fruitId) return { ok: false, msg: '果树位没有果树' };
    const cs = S.orchardState(tree);
    if (cs.status !== 'sapling' && cs.status !== 'growing') return { ok: false, msg: '果实已成熟，无需施肥' };
    if (tree.fert >= 3) return { ok: false, msg: '该果树今日施肥已达上限（3 次）' };
    if (!S.takeItem('orchardFert', 1)) return { ok: false, msg: '果树肥料不足，请到商城兑换' };
    tree.fert++;
    const reduce = tree.duration * 0.12;
    tree.matureAt -= reduce;
    tree.witherAt -= reduce;
    S.save();
    return { ok: true, msg: '施肥成功，生长加速 12%' };
  };

  S.speedTree = function (treeIdx) {
    const tree = S.state.orchard.trees[treeIdx];
    if (!tree || !tree.fruitId) return { ok: false, msg: '果树位没有果树' };
    if (S.orchardState(tree).status === 'mature') return { ok: false, msg: '果实已成熟' };
    if (!S.takeItem('orchardSpeed', 1)) return { ok: false, msg: '催熟剂不足' };
    const remain = Math.max(0, tree.matureAt - U.now());
    const reduce = Math.min(remain, remain * 0.5);
    tree.matureAt -= reduce;
    tree.witherAt -= reduce;
    S.save();
    return { ok: true, msg: '催熟剂生效，生长时间减半' };
  };

  S.harvestFruit = function (treeIdx, quiet) {
    const st = S.state;
    const tree = st.orchard.trees[treeIdx];
    if (!tree || !tree.fruitId) return { ok: false, msg: '该果树位没有果树' };
    const fruit = D.FRUIT_MAP[tree.fruitId];
    const cs = S.orchardState(tree);
    if (cs.status === 'sapling' || cs.status === 'growing') return { ok: false, msg: '果实还未成熟' };
    let gained = { points: 0, exp: 0, items: [], withered: cs.status === 'withered' };
    if (cs.status === 'mature') {
      const lvlBonus = (st.orchard.level >= 2 ? 0.05 : 0) + (st.orchard.level >= 6 ? 0.05 : 0);
      gained.points = Math.round(fruit.points * (1 + lvlBonus) * 10) / 10;
      gained.exp = fruit.exp;
      S.addPoints(gained.points, true);
      S.addItem('fruit_' + fruit.id, 1);
      gained.items.push(fruit.name + ' ×1');
      if (fruit.drop && Math.random() < (fruit.tier === 3 ? 1 : 0.65)) {
        S.addItem(fruit.drop, 1);
        gained.items.push((D.ITEMS[fruit.drop] ? D.ITEMS[fruit.drop].name : fruit.drop) + ' ×1');
      }
    }
    S.addOrchardExp(gained.exp);
    st.orchard.todayHarvest++;
    tree.fruitId = null; tree.plantedAt = 0; tree.matureAt = 0; tree.witherAt = 0; tree.duration = 0; tree.fert = 0;
    S.save();
    return { ok: true, gained: gained, fruit: fruit };
  };

  S.harvestAllFruit = function () {
    const res = { count: 0, points: 0, exp: 0, items: [], withered: 0 };
    S.state.orchard.trees.forEach(function (t) {
      if (!t.fruitId) return;
      const cs = S.orchardState(t);
      if (cs.status === 'mature' || cs.status === 'withered') {
        const r = S.harvestFruit(t.id, true);
        if (r.ok) {
          res.count++; res.points += r.gained.points; res.exp += r.gained.exp;
          res.items = res.items.concat(r.gained.items);
          if (r.gained.withered) res.withered++;
        }
      }
    });
    return res;
  };

  S.addOrchardExp = function (n) {
    const o = S.state.orchard;
    o.exp = Math.round((o.exp + n) * 10) / 10;
    let guard = 0;
    while (o.level < 10 && guard++ < 15) {
      const next = D.ORCHARD_LEVELS[o.level];
      if (next && o.exp >= next.exp) {
        o.level++;
        pushNotice('🍎', '果园升级：Lv' + o.level + '，' + next.perk);
        U.toast('果园升级 · Lv' + o.level + ' 解锁新权益', 'gold');
      } else break;
    }
  };

  S.orchardShield = function () {
    if (!S.takeItem('orchardShield', 1)) return { ok: false, msg: '果园防鸟网不足' };
    S.state.orchard.shieldUntil = U.now() + 60 * 60 * 1000;
    S.save();
    return { ok: true, msg: '果园防护已开启，持续 1 小时' };
  };

  /* ---------------- 宠物 ---------------- */
  S.adoptPet = function (speciesId, name, force) {
    const st = S.state;
    const sp = D.PET_MAP[speciesId];
    if (!sp) return { ok: false, msg: '宠物不存在' };
    if (!force && st.garden.level < sp.reqGardenLevel) return { ok: false, msg: '花园 Lv' + sp.reqGardenLevel + ' 解锁' };
    if (st.pets.list[speciesId]) return { ok: false, msg: '已领养过这只宠物' };
    st.pets.list[speciesId] = {
      speciesId: speciesId,
      name: name || sp.name,
      level: 1, exp: 0, intimacy: 0, fullness: 80,
      fullnessAt: U.now(),
      accessory: false,
      lastPat: '',
      patToday: 0
    };
    if (!st.pets.activeId) st.pets.activeId = speciesId;
    S.save();
    return { ok: true, msg: '领养成功：' + (name || sp.name) };
  };

  S.activePet = function () {
    const st = S.state;
    if (!st.pets || !st.pets.activeId) return null;
    return st.pets.list[st.pets.activeId] || null;
  };

  S.switchPet = function (speciesId) {
    if (!S.state.pets.list[speciesId]) return false;
    S.state.pets.activeId = speciesId;
    S.save();
    return true;
  };

  S.renamePet = function (name) {
    const p = S.activePet();
    if (!p || !name) return false;
    if (!S.takeItem('petRenameCard', 1)) return false;
    p.name = name;
    S.save();
    return true;
  };

  S.syncPets = function () {
    const st = S.state;
    Object.keys(st.pets.list || {}).forEach(function (k) {
      const p = st.pets.list[k];
      if (p.fullnessAt == null) p.fullnessAt = U.now();
      const hours = (U.now() - p.fullnessAt) / 3600000;
      if (hours > 0.1) {
        p.fullness = Math.max(0, Math.round((p.fullness - hours * 2) * 10) / 10);
        p.fullnessAt = U.now();
      }
    });
  };

  S.feedPet = function (foodId) {
    const st = S.state;
    const pet = S.activePet();
    if (!pet) return { ok: false, msg: '还没有宠物，先去领养一只吧' };
    if (!S.takeItem(foodId, 1)) return { ok: false, msg: '粮食不足，请到商城兑换' };
    const add = foodId === 'petFoodAdvanced' ? 60 : 30;
    const exp = foodId === 'petFoodAdvanced' ? 5 : 2;
    pet.fullness = Math.min(100, pet.fullness + add);
    pet.fullnessAt = U.now();
    pet.intimacy += 1;
    addPetExp(pet, exp);
    S.countFeed();
    S.save();
    return { ok: true, msg: '投喂成功，饱腹 +' + add + '，经验 +' + exp };
  };

  S.patPet = function () {
    const st = S.state;
    const pet = S.activePet();
    if (!pet) return { ok: false, msg: '还没有宠物' };
    const today = U.dateStr();
    if (pet.lastPat !== today) { pet.lastPat = today; pet.patToday = 0; }
    if (pet.patToday >= 5) return { ok: false, msg: '今日抚摸次数已达上限（5 次）' };
    pet.patToday++;
    pet.intimacy += 2;
    addPetExp(pet, 3);
    S.save();
    return { ok: true, msg: '摸摸头，亲密度 +2' };
  };

  S.usePetShard = function () {
    const pet = S.activePet();
    if (!pet) return { ok: false, msg: '还没有宠物' };
    if (!S.takeItem('petExpShard', 1)) return { ok: false, msg: '没有宠物升级碎片' };
    addPetExp(pet, 30);
    S.save();
    return { ok: true, msg: '宠物经验 +30' };
  };

  S.equipAccessory = function () {
    const pet = S.activePet();
    if (!pet) return { ok: false, msg: '还没有宠物' };
    if (pet.accessory) { pet.accessory = false; S.save(); return { ok: true, msg: '已取下配饰' }; }
    if (!S.takeItem('petAccessory', 1)) return { ok: false, msg: '没有宠物配饰' };
    pet.accessory = true;
    pet.intimacy += 5;
    S.save();
    return { ok: true, msg: '配饰已装备，亲密度 +5' };
  };

  function addPetExp(pet, n) {
    const bonus = 1 + (S.intimacyDef(pet.intimacy).expBonus || 0) / 100;
    pet.exp = Math.round((pet.exp + n * bonus) * 10) / 10;
    let guard = 0;
    while (pet.level < 10 && guard++ < 15) {
      const next = D.PET_LEVELS[pet.level];
      if (next && pet.exp >= next.exp) {
        pet.level++;
        pushNotice('🐾', pet.name + ' 升到 Lv' + pet.level + '：' + next.perk);
        U.toast('🎉 ' + pet.name + ' 升到 Lv' + pet.level + '！' + next.perk, 'gold');
      } else break;
    }
  }
  S.addPetExp = addPetExp;

  /* ---------------- 任务 ---------------- */
  S.taskProgress = function (task) {
    const st = S.state;
    const today = U.dateStr();
    const hist = st.learn.history[today] || { newWords: 0, reviews: 0, quiz: 0 };
    switch (task.metric) {
      case 'wordsToday': return st.learn.newToday + st.learn.reviewToday;
      case 'help': return st.garden.todayHelp;
      case 'harvest': return st.garden.todayHarvest + st.orchard.todayHarvest + st.fish.todayHarvest + st.livestock.todayCollect;
      case 'feed': return null; // 由记录计算
      case 'quiz': return st.learn.quizToday;
      default: return 0;
    }
  };

  S.taskDone = function (task) {
    const st = S.state;
    if (task.metric === 'feed') return (st.tasks.feedCount || 0) > 0;
    return S.taskProgress(task) >= task.target;
  };

  S.claimTask = function (taskId) {
    const st = S.state;
    S.ensureDaily();
    if (taskId === 'chest') {
      if (!st.tasks.chest) return { ok: false, msg: '宝箱尚未解锁' };
      const allDone = D.TASKS.every(function (t) { return st.tasks.claimed.indexOf(t.id) >= 0; });
      if (!allDone) return { ok: false, msg: '先领取全部每日任务奖励' };
      if (st.tasks.chestClaimed) return { ok: false, msg: '今日宝箱已领取' };
      st.tasks.chestClaimed = true;
      S.addPoints(D.CHEST.reward.points, true);
      S.addItem('petFoodAdvanced', 1);
      S.addItem('seed_' + U.pick(D.SEEDS.filter(function (s) { return s.tier === 2; })).id, 1);
      S.save();
      return { ok: true, msg: '开启每日宝箱：+15 积分 + 高级宠物粮 + 随机稀有种子' };
    }
    const task = D.TASKS.find(function (t) { return t.id === taskId; });
    if (!task) return { ok: false, msg: '任务不存在' };
    if (st.tasks.claimed.indexOf(taskId) >= 0) return { ok: false, msg: '已领取' };
    if (!S.taskDone(task)) return { ok: false, msg: '任务尚未完成' };
    st.tasks.claimed.push(taskId);
    S.addPoints(task.reward.points, true);
    if (task.reward.exp) S.addGardenExp(task.reward.exp);
    if (task.reward.items) {
      Object.keys(task.reward.items).forEach(function (k) { S.addItem(k, task.reward.items[k]); });
    }
    if (D.TASKS.every(function (t) { return st.tasks.claimed.indexOf(t.id) >= 0; })) st.tasks.chest = true;
    S.save();
    return { ok: true, msg: '领取成功：+' + task.reward.points + ' 积分' };
  };

  // 喂养计数（每日重置）
  S.countFeed = function () {
    const st = S.state;
    if (st.tasks.date !== U.dateStr()) S.ensureDaily();
    st.tasks.feedCount = (st.tasks.feedCount || 0) + 1;
    S.save();
  };

  /* ---------------- 周期活动 ---------------- */
  S.weekKey = function () {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // 周一为 0
    return U.dateStr(new Date(U.dayStart() - day * 86400000));
  };

  S.weeklyProgress = function () {
    const st = S.state;
    const monday = new Date(S.weekKey() + 'T00:00:00').getTime();
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const key = U.dateStr(new Date(monday + i * 86400000));
      const h = st.learn.history[key];
      if (h) sum += (h.newWords || 0);
    }
    return {
      streak: st.learn.streak || 0,
      weekWords: sum,
      streakClaimed: !!(st.week && st.week.streakClaimed),
      sprintClaimed: !!(st.week && st.week.sprintClaimed)
    };
  };

  S.claimWeekly = function (type) {
    const st = S.state;
    const p = S.weeklyProgress();
    if (type === 'streak') {
      if (p.streakClaimed) return { ok: false, msg: '本周已领取' };
      if (p.streak < 7) return { ok: false, msg: '连续打卡满 7 天后可领取' };
      st.week.streakClaimed = true;
      S.addPoints(20, true);
      S.addItem('seed_tulip', 2);
      S.save();
      return { ok: true, msg: '周打卡奖励：+20 积分 + 郁金香种子 ×2' };
    }
    if (type === 'sprint') {
      if (p.sprintClaimed) return { ok: false, msg: '本周已领取' };
      if (p.weekWords < 200) return { ok: false, msg: '本周累计背诵满 200 词后可领取' };
      st.week.sprintClaimed = true;
      S.addPoints(30, true);
      S.addItem('fertilizer', 3);
      S.addGardenExp(20);
      S.save();
      return { ok: true, msg: '冲刺礼包：+30 积分 + 肥料 ×3 + 20 花园经验' };
    }
    return { ok: false, msg: '活动不存在' };
  };

  /* ---------------- 每日签到 ---------------- */
  S.checkinInfo = function () {
    const st = S.state;
    S.ensureDaily();
    const c = st.checkin;
    const today = U.dateStr();
    const yesterday = U.dateStr(new Date(U.dayStart() - 86400000));
    const signed = c.lastDate === today;
    // 断签后从 0 起算，已签到则显示当前连续天数
    const streak = signed ? (c.streak || 0) : (c.lastDate === yesterday ? (c.streak || 0) : 0);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key = U.dateStr(new Date(U.dayStart() - i * 86400000));
      days.push({ key: key, signed: !!c.history[key], today: i === 0 });
    }
    return { signed: signed, streak: streak, days: days, lastReward: c.lastReward || null };
  };

  S.doCheckin = function () {
    const st = S.state;
    S.ensureDaily();
    const c = st.checkin;
    const today = U.dateStr();
    const yesterday = U.dateStr(new Date(U.dayStart() - 86400000));
    if (c.lastDate === today) return { ok: false, msg: '今天已经签到过啦，明天再来' };

    c.streak = c.lastDate === yesterday ? (c.streak || 0) + 1 : 1;
    c.lastDate = today;
    c.history[today] = true;
    if (st.profile.days.indexOf(today) < 0) st.profile.days.push(today);

    // 奖励：积分或随机种子；连续签到第 7 天必得稀有种子
    let reward;
    if (c.streak % 7 === 0) {
      const s = U.pick(D.SEEDS.filter(function (x) { return x.tier === 2; }));
      reward = { type: 'seed', seedId: s.id, name: s.name, icon: s.icon, tier: s.tier };
    } else {
      const roll = Math.random();
      if (roll < 0.45) {
        const pts = 3 + Math.min(c.streak, 7);
        reward = { type: 'points', amount: pts, name: pts + ' 积分', icon: '🪙' };
      } else {
        const tier = roll < 0.87 ? 1 : roll < 0.97 ? 2 : 3;
        const s = U.pick(D.SEEDS.filter(function (x) { return x.tier === tier; }));
        reward = { type: 'seed', seedId: s.id, name: s.name + '种子', icon: s.icon, tier: s.tier };
      }
    }

    if (reward.type === 'points') S.addPoints(reward.amount, true);
    else S.addItem('seed_' + reward.seedId, 1);
    c.lastReward = reward;
    pushNotice('📅', '每日签到（连续 ' + c.streak + ' 天）：获得 ' + reward.name);
    S.save();
    return { ok: true, streak: c.streak, reward: reward };
  };

  /* ---------------- 每日盲盒彩蛋 ---------------- */
  S.blindBoxInfo = function () {
    const st = S.state;
    const today = U.dateStr();
    if (st.blindbox.date !== today) {
      st.blindbox = { date: today, used: false };
    }
    return { used: !!st.blindbox.used, date: today };
  };

  S.openBlindBox = function () {
    const st = S.state;
    const info = S.blindBoxInfo();
    if (info.used) return { ok: false, msg: '今日盲盒已开启，明天再来吧' };
    st.blindbox.used = true;
    // 奖励池：积分 / 种子 / 道具
    const roll = Math.random();
    let reward;
    if (roll < 0.35) {
      const pts = 5 + Math.floor(Math.random() * 16);
      S.addPoints(pts, true);
      reward = { type: 'points', name: pts + ' 积分', icon: '🪙' };
    } else if (roll < 0.7) {
      const tier = roll < 0.55 ? 1 : 2;
      const s = U.pick(D.SEEDS.filter(function (x) { return x.tier === tier; }));
      S.addItem('seed_' + s.id, 1);
      reward = { type: 'seed', name: s.name + '种子 ×1', icon: s.icon };
    } else if (roll < 0.88) {
      const items = ['water', 'fertilizer', 'petFoodBasic'];
      const id = U.pick(items);
      S.addItem(id, 2);
      reward = { type: 'item', name: (D.ITEMS[id] ? D.ITEMS[id].name : id) + ' ×2', icon: D.ITEMS[id] ? D.ITEMS[id].icon : '🎁' };
    } else {
      const s = U.pick(D.SEEDS.filter(function (x) { return x.tier === 3; }));
      S.addItem('seed_' + s.id, 1);
      reward = { type: 'rare', name: '✨珍稀 · ' + s.name + '种子 ×1', icon: s.icon };
    }
    pushNotice('🎁', '每日盲盒开出：' + reward.name);
    S.save();
    return { ok: true, reward: reward };
  };

  /* ---------------- 排行榜 ---------------- */
  S.leaderboards = function () {
    const st = S.state;
    const me = {
      name: st.profile.nickname || '我',
      icon: st.profile.avatar || '🌻',
      words: st.learn.totalNew,
      acc: Math.round(S.learnAcc()),
      gardenLv: st.garden.level,
      rareFlower: (st.profile.rareFlower || 0),
      petLv: S.activePet() ? S.activePet().level : 0,
      intimacy: S.activePet() ? S.activePet().intimacy : 0,
      me: true
    };
    const bots = D.RANK_BOTS.map(function (b) { return Object.assign({ me: false }, b); });
    const all = bots.concat([me]);
    return {
      word: all.slice().sort(function (a, b) {
        if (b.words !== a.words) return b.words - a.words;
        return b.acc - a.acc;
      }).map(function (x, i) { return Object.assign({ rank: i + 1 }, x); }),
      garden: all.slice().sort(function (a, b) {
        if (b.gardenLv !== a.gardenLv) return b.gardenLv - a.gardenLv;
        return b.rareFlower - a.rareFlower;
      }).map(function (x, i) { return Object.assign({ rank: i + 1 }, x); }),
      pet: all.slice().sort(function (a, b) {
        if (b.petLv !== a.petLv) return b.petLv - a.petLv;
        return b.intimacy - a.intimacy;
      }).map(function (x, i) { return Object.assign({ rank: i + 1 }, x); })
    };
  };

  /* ---------------- 个人数据 ---------------- */
  S.stats = function () {
    const st = S.state;
    const today = U.dateStr();
    const hist = st.learn.history[today] || { newWords: 0, reviews: 0, quiz: 0, minutes: 0 };
    const learnedCount = Object.keys(st.learn.words).filter(function (k) { return st.learn.words[k].stage > 0; }).length;
    const acc = S.learnAcc();
    return {
      points: st.points,
      totalPoints: st.profile.totalPoints,
      newToday: st.learn.newToday,
      reviewToday: st.learn.reviewToday,
      totalNew: st.learn.totalNew,
      totalReview: st.learn.totalReview,
      learnedCount: learnedCount,
      acc: Math.round(acc * 10) / 10,
      streak: st.learn.streak,
      days: st.profile.days.length,
      studyDays: st.profile.days.length,
      learnLevel: st.learn.level,
      learnExp: st.learn.exp,
      gardenLevel: st.garden.level,
      gardenExp: st.garden.exp,
      fishLevel: st.fish.level,
      fishExp: st.fish.exp,
      livestockLevel: st.livestock.level,
      livestockExp: st.livestock.exp,
      orchardLevel: st.orchard.level,
      orchardExp: st.orchard.exp,
      petLevel: S.activePet() ? S.activePet().level : 0,
      intimacy: S.activePet() ? S.activePet().intimacy : 0,
      today: hist,
      dueCount: S.dueWords().length,
      wrongCount: Object.keys(st.learn.wrongWords).length
    };
  };

  /* ---------------- 道具使用入口 ---------------- */
  S.quickUse = function (id) {
    if (id === 'water' || id === 'fertilizer' || id === 'speedup') {
      let target = -1;
      for (let i = 0; i < S.unlockedPlots(); i++) {
        const p = S.state.garden.plots[i];
        if (!p.seedId) continue;
        const cs = S.cropState(p);
        if (cs.status === 'growing' || cs.status === 'seed') { target = i; break; }
      }
      if (target < 0) return { ok: false, msg: '没有正在生长的作物' };
      if (id === 'water') return S.water(target);
      if (id === 'fertilizer') return S.fertilize(target);
      return S.speedup(target);
    }
    if (id === 'shield') return S.useShield();
    if (id === 'reviewDoubleCard' || id === 'wrongClearCard' || id === 'makeupCard') return S.useStudyItem(id);
    if (id === 'petExpShard') return S.usePetShard();
    if (id === 'petFoodBasic' || id === 'petFoodAdvanced') return S.feedPet(id);
    return { ok: false, msg: '该道具需在对应页面使用' };
  };

  S.startStudyTimer = function () {
    const st = S.state;
    st.learn.studySec = (st.learn.studySec || 0) + 1;
    const hist = st.learn.history[U.dateStr()];
    if (hist) hist.minutes = Math.round((st.learn.studySec / 60) * 10) / 10;
  };

  global.WG.state = S;
})(window);
