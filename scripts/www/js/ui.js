/* ============================================================
   全局界面：登录 / 顶栏 / 侧栏 / 右栏 / 路由 / 刷新
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = { pages: {}, route: '' };

  const NAV = [
    { id: 'learn', name: '单词学习中心', icon: '📖' },
    { id: 'garden', name: '我的花园', icon: '🌻' },
    { id: 'orchard', name: '欢乐果园', icon: '🍎' },
    { id: 'fish', name: '欢乐鱼塘', icon: '🐟' },
    { id: 'livestock', name: '欢乐牧场', icon: '🐔' },
    { id: 'pet', name: '萌宠小屋', icon: '🐾' },
    { id: 'shop', name: '积分商城', icon: '🛍️' },
    { id: 'friends', name: '好友广场', icon: '👫' },
    { id: 'tasks', name: '任务活动', icon: '🎯' },
    { id: 'rank', name: '荣誉排行榜', icon: '🏆' },
    { id: 'profile', name: '个人数据中心', icon: '📊' }
  ];
  UI.nav = NAV;

  /* ---------------- 登录 / 创建花园 ---------------- */
  let draft = { avatar: '🌻', pet: 'cat', nickname: '' };

  UI.renderLogin = function () {
    const el = U.$('#loginScreen');
    el.classList.remove('hidden');
    U.$('#topbar').classList.add('hidden');
    U.$('.layout').classList.add('hidden');
    el.innerHTML =
      '<div class="login-card">' +
      '<div class="login-logo">单词花园<em>：偷菜大作战</em></div>' +
      '<div class="login-slogan">背单词 · 种花园 · 养萌宠</div>' +
      '<div class="login-label">给你的花园起个名字</div>' +
      '<input id="lgName" class="login-input" maxlength="10" placeholder="例如：背词小农夫" value="' + U.esc(draft.nickname) + '">' +
      '<div class="login-label">选择花园头像</div>' +
      '<div class="avatar-picker" id="lgAvatars">' +
      D.AVATARS.map(function (a) {
        return '<button class="avatar-opt' + (a === draft.avatar ? ' on' : '') + '" data-ava="' + a + '">' + a + '</button>';
      }).join('') +
      '</div>' +
      '<div class="login-label">挑选你的初始伙伴（花园 Lv2 起陪你一起成长）</div>' +
      '<div class="pet-picker" id="lgPets">' +
      D.PET_SPECIES.filter(function (p) { return p.starter; }).map(function (p) {
        return '<button class="pet-opt' + (p.id === draft.pet ? ' on' : '') + '" data-pet="' + p.id + '">' +
          '<span class="emo">' + p.icon + '</span><div class="nm">' + p.name + '</div><div class="ds">' + U.esc(p.desc) + '</div></button>';
      }).join('') +
      '</div>' +
      '<button class="login-btn" id="lgEnter">进入我的花园</button>' +
      '<div class="login-tip">所有进度保存在本机浏览器，无需注册与充值<br>全部养成资源通过背单词获得 · 零氪金</div>' +
      '</div>';

    U.$$('#lgAvatars .avatar-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        draft.avatar = b.dataset.ava;
        U.$$('#lgAvatars .avatar-opt').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
    U.$$('#lgPets .pet-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        draft.pet = b.dataset.pet;
        U.$$('#lgPets .pet-opt').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
    U.$('#lgEnter').addEventListener('click', function () {
      const name = (U.$('#lgName').value || '').trim();
      if (!name) { U.toast('请先给你的花园起个名字', 'bad'); U.$('#lgName').focus(); return; }
      draft.nickname = name;
      const st = S.get();
      st.profile.nickname = name;
      st.profile.avatar = draft.avatar;
      st.logged = true;
      // 新手礼包：赠送初始积分与种子，方便体验核心玩法
      if (!st.profile.started) {
        st.profile.started = true;
        S.addPoints(15, true);
        S.addItem('seed_cabbage', 3);
        S.addItem('seed_sunflower', 3);
        S.addItem('water', 3);
        S.addItem('fertilizer', 2);
        S.addItem('petFoodBasic', 2);
        S.pushNotice('🎁', '新手礼包已发放：15 积分 + 白菜种子×3 + 向日葵种子×3 + 浇水壶×3 + 肥料×2 + 宠物粮×2');
      }
      if (!st.pets.list[draft.pet]) {
        S.adoptPet(draft.pet, D.PET_MAP[draft.pet].name, true);
      }
      st.pets.activeId = draft.pet;
      S.save();
      U.toast('欢迎来到单词花园，' + name + '！', 'good');
      UI.enterGame();
    });
  };

  UI.enterGame = function () {
    U.$('#loginScreen').classList.add('hidden');
    U.$('#topbar').classList.remove('hidden');
    U.$('.layout').classList.remove('hidden');
    UI.renderChrome();
    const hash = (location.hash || '').replace('#/', '');
    UI.go(hash && NAV.some(function (n) { return n.id === hash; }) ? hash : 'garden');
    if (!UI._timer) UI._timer = setInterval(UI.tick, 1000);
  };

  /* ---------------- 顶栏 ---------------- */
  UI.renderTopbar = function () {
    const st = S.get();
    const stats = S.stats();
    const doneTasks = D.TASKS.filter(function (t) { return S.taskDone(t) && st.tasks.claimed.indexOf(t.id) < 0; }).length;
    const friendReady = S.getFriends().reduce(function (a, f) { return a + f.ready; }, 0);
    const unread = st.notices.length;
    U.$('#topbar').innerHTML =
      '<button class="icon-btn hamburger" id="btnMenu">☰</button>' +
      '<div class="brand">' +
      '<div class="brand-name">单词花园<em>：偷菜大作战</em></div>' +
      '<div class="brand-slogan">背单词 · 种花园 · 养萌宠</div>' +
      '</div>' +
      '<div class="top-stats">' +
      '<div class="stat-chip cur-learn"><span class="ic">📚</span><b>' + U.fmtNum(st.learnPoints) + '</b><span>学习积分</span></div>' +
      '<div class="stat-chip cur-farm"><span class="ic">🪙</span><b>' + U.fmtNum(st.points) + '</b><span>收获积分</span></div>' +
      '<div class="stat-chip"><span class="ic">📚</span><b>' + stats.newToday + '</b><span>/50 今日新词</span></div>' +
      '<div class="stat-chip"><span class="ic">🔥</span><b>' + stats.streak + '</b><span>连续打卡</span></div>' +
      (friendReady ? '<div class="stat-chip" id="chipFriend"><span class="ic">🥷</span><b>' + friendReady + '</b><span>可偷作物</span></div>' : '') +
      '</div>' +
      '<div class="top-actions">' +
      '<button class="icon-btn" id="btnCheckin" title="每日签到">📅' + (S.checkinInfo().signed ? '' : '<span class="dot"></span>') + '</button>' +
      '<button class="icon-btn" id="btnNotice" title="消息通知">🔔' + (unread ? '<span class="dot"></span>' : '') + '</button>' +
      '<button class="icon-btn" id="btnSetting" title="设置">⚙️</button>' +
      '<button class="user-chip" id="btnProfile" title="个人数据中心">' +
      '<span class="user-ava">' + st.profile.avatar + '</span>' +
      '<span><span class="user-name">' + U.esc(st.profile.nickname || '我的花园') + '</span>' +
      '<span class="user-lv">学习 Lv' + st.learn.level + ' · 花园 Lv' + st.garden.level + '</span></span>' +
      '</button>' +
      '</div>';

    U.$('#btnMenu').addEventListener('click', function () {
      U.$('#sidebar').classList.toggle('open');
      U.$('#drawerMask').classList.toggle('on');
    });
    U.$('#btnNotice').addEventListener('click', UI.noticeModal);
    U.$('#btnCheckin').addEventListener('click', UI.checkinModal);
    U.$('#btnSetting').addEventListener('click', UI.settingsModal);
    U.$('#btnProfile').addEventListener('click', function () { UI.go('profile'); });
    if (U.$('#chipFriend')) U.$('#chipFriend').addEventListener('click', function () { UI.go('friends'); });
  };

  /* ---------------- 侧栏 ---------------- */
  UI.renderSidebar = function () {
    const st = S.get();
    const claimable = D.TASKS.filter(function (t) { return S.taskDone(t) && st.tasks.claimed.indexOf(t.id) < 0; }).length +
      (st.tasks.chest && !st.tasks.chestClaimed ? 1 : 0);
    const due = S.dueWords().length;
    const friendReady = S.getFriends().reduce(function (a, f) { return a + f.ready; }, 0);
    const badges = { tasks: claimable, learn: due ? null : 0, friends: friendReady };

    U.$('#sidebar').innerHTML =
      '<div class="nav-title">游戏主场景</div>' +
      NAV.map(function (n) {
        let badge = '';
        if (n.id === 'tasks' && claimable) badge = '<span class="nav-badge">' + claimable + '</span>';
        else if (n.id === 'friends' && friendReady) badge = '<span class="nav-badge">' + friendReady + '</span>';
        else if (n.id === 'learn' && due) badge = '<span class="nav-badge" style="background:#f0b96a">' + due + '</span>';
        return '<a class="nav-item' + (UI.route === n.id ? ' on' : '') + '" data-nav="' + n.id + '">' +
          '<span class="ni">' + n.icon + '</span><span>' + n.name + '</span>' + badge + '</a>';
      }).join('') +
      '<div class="sidebar-foot">本游戏无充值入口<br>所有资源依靠背单词获得<br>数据自动保存在本机</div>';

    U.$$('#sidebar [data-nav]').forEach(function (a) {
      a.addEventListener('click', function () {
        UI.go(a.dataset.nav);
        U.$('#sidebar').classList.remove('open');
        U.$('#drawerMask').classList.remove('on');
      });
    });
  };

  /* ---------------- 右栏 ---------------- */
  function growthCard(icon, name, lv, cur, next, barCls) {
    const pct = next ? U.clamp(cur / next.exp * 100, 0, 100) : 100;
    const meta = next
      ? '<div class="bar-meta"><span>' + U.fmtNum(cur) + ' / ' + next.exp + ' EXP</span><span>' + Math.floor(pct) + '%</span></div>'
      : '<div class="bar-meta"><span>已达最高等级</span><span>MAX</span></div>';
    return '<div class="growth-card">' +
      '<div class="growth-head"><span class="gh-ic">' + icon + '</span><span class="gh-name">' + name + '</span><span class="gh-lv">Lv' + lv + '</span></div>' +
      '<div class="bar ' + barCls + '"><i style="width:' + pct + '%"></i></div>' + meta + '</div>';
  }

  UI.renderRightbar = function () {
    const st = S.get();
    const stats = S.stats();
    const pet = S.activePet();
    const ready = st.garden.plots.filter(function (p) {
      const cs = S.cropState(p);
      return cs.status === 'mature';
    }).length;
    const growing = st.garden.plots.filter(function (p) {
      const cs = S.cropState(p);
      return cs.status === 'growing' || cs.status === 'seed';
    }).length;
    const due = S.dueWords().length;
    const claimable = D.TASKS.filter(function (t) { return S.taskDone(t) && st.tasks.claimed.indexOf(t.id) < 0; }).length;
    const friendReady = S.getFriends().reduce(function (a, f) { return a + f.ready; }, 0);
    const shieldLeft = st.garden.shieldUntil > U.now() ? (st.garden.shieldUntil - U.now()) / 1000 : 0;

    const statuses = [];
    if (ready) statuses.push({ cls: 'good', html: '<b>' + ready + '</b> 块作物可以收获啦', go: 'garden', goTxt: '去收获' });
    const fishReady = st.fish.ponds.filter(function (p) { return S.fishState(p).status === 'mature'; }).length;
    if (fishReady) statuses.push({ cls: 'good', html: '🐟 有 <b>' + fishReady + '</b> 条鱼可以收获', go: 'fish', goTxt: '去捞鱼' });
    const fruitReady = st.orchard.trees.filter(function (t) { return S.orchardState(t).status === 'mature'; }).length;
    if (fruitReady) statuses.push({ cls: 'good', html: '🍎 有 <b>' + fruitReady + '</b> 份果实可以收获', go: 'orchard', goTxt: '去摘果' });
    const animalReady = st.livestock.pens.filter(function (p) { return S.animalState(p).status === 'ready'; }).length;
    if (animalReady) statuses.push({ cls: 'good', html: '🐔 有 <b>' + animalReady + '</b> 份产物可以收取', go: 'livestock', goTxt: '去收取' });
    if (growing) statuses.push({ cls: 'info', html: '<b>' + growing + '</b> 块作物正在生长', go: 'garden', goTxt: '去打理' });
    if (friendReady) statuses.push({ cls: 'warn', html: '好友有 <b>' + friendReady + '</b> 块成熟作物可偷', go: 'friends', goTxt: '去偷菜' });
    if (due) statuses.push({ cls: 'warn', html: '<b>' + due + '</b> 个单词待复习（艾宾浩斯）', go: 'learn', goTxt: '去复习' });
    if (claimable) statuses.push({ cls: 'warn', html: '<b>' + claimable + '</b> 个任务奖励可领取', go: 'tasks', goTxt: '去领取' });
    if (!S.checkinInfo().signed) statuses.push({ cls: 'good', html: '今日签到可领 <b>随机种子 / 积分</b>', go: 'tasks', goTxt: '去签到' });
    if (pet && pet.fullness < 20) statuses.push({ cls: 'warn', html: '宠物饱腹值偏低（' + Math.round(pet.fullness) + '%）', go: 'pet', goTxt: '去投喂' });
    if (shieldLeft > 0) statuses.push({ cls: 'good', html: '花园防护中，剩余 <b>' + U.fmtDur(shieldLeft) + '</b>', go: 'garden', goTxt: '' });
    if (!statuses.length) statuses.push({ cls: 'info', html: '花园一片安宁，去背几个单词吧', go: 'learn', goTxt: '去学习' });

    const quick = [
      { id: 'shield', icon: '🛡️', name: '守护卡' },
      { id: 'water', icon: '💧', name: '浇水壶' },
      { id: 'fertilizer', icon: '🌱', name: '肥料' },
      { id: 'speedup', icon: '⚡', name: '加速剂' }
    ];

    U.$('#rightbar').innerHTML =
      '<div class="card-title" style="margin:2px 0 0"><span class="ct-ic">📈</span>成长状态</div>' +
      growthCard('🌻', '花园等级', stats.gardenLevel, st.garden.exp, S.nextGardenLevel(), 'green') +
      growthCard('📖', '学习等级 · ' + S.learnDef().name, stats.learnLevel, st.learn.exp, S.nextLearnLevel(), 'blue') +
      (pet ? growthCard('🐾', pet.name, pet.level, pet.exp, S.nextPetLevel(pet), 'pink') : growthCard('🐾', '萌宠小屋', '—', 0, null, 'pink')) +
      growthCard('🐟', '鱼池等级', st.fish.level, st.fish.exp, S.nextFishLevel(), 'blue') +
      growthCard('🍎', '果园等级', st.orchard.level, st.orchard.exp, S.nextOrchardLevel(), 'gold') +
      growthCard('🐔', '牧场等级', st.livestock.level, st.livestock.exp, S.nextLivestockLevel(), 'gold') +
      (pet ? '<div class="growth-card"><div class="growth-head"><span class="gh-ic">💗</span><span class="gh-name">亲密度 ' +
        '<span class="stars">' + '★'.repeat(S.intimacyStar(pet.intimacy)) + '☆'.repeat(5 - S.intimacyStar(pet.intimacy)) + '</span></span>' +
        '<span class="gh-lv">' + Math.round(pet.intimacy) + '</span></div>' +
        '<div class="bar pink"><i style="width:' + U.clamp(pet.intimacy / 580 * 100, 0, 100) + '%"></i></div>' +
        '<div class="bar-meta"><span>饱腹 ' + Math.round(pet.fullness) + '%</span><span>亲密 ' + Math.round(pet.intimacy) + '/580</span></div></div>' : '') +
      '<div class="card" style="padding:13px 14px"><div class="card-title" style="margin-bottom:9px"><span class="ct-ic">📋</span>实时状态</div>' +
      '<div class="status-list">' + statuses.map(function (s) {
        return '<div class="st-item ' + s.cls + '"><span class="dotm"></span><span>' + s.html + '</span>' +
          (s.go ? '<span class="st-go" data-go="' + s.go + '">' + (s.goTxt || '查看') + '</span>' : '') + '</div>';
      }).join('') + '</div></div>' +
      '<div class="card" style="padding:13px 14px"><div class="card-title" style="margin-bottom:9px"><span class="ct-ic">🎒</span>快捷道具</div>' +
      '<div class="quick-items">' + quick.map(function (q) {
        const n = S.inv(q.id);
        return '<div class="qi' + (n <= 0 ? ' off' : '') + '" data-quick="' + q.id + '"><span class="q-ic">' + q.icon + '</span>' +
          '<span>' + q.name + '</span><span class="q-ct">×' + n + '</span></div>';
      }).join('') + '</div>' +
      '<div style="font-size:10.5px;color:#a9b2a6;margin-top:9px;line-height:1.6">' +
      '作物加速 ' + S.buffs().grow + '% · 复习加成 ' + S.buffs().reviewPts + '% · 偷菜上限 ' + S.stealLimit() + ' 次</div></div>';

    U.$$('#rightbar [data-go]').forEach(function (el) {
      el.addEventListener('click', function () { UI.go(el.dataset.go); });
    });
    U.$$('#rightbar [data-quick]').forEach(function (el) {
      el.addEventListener('click', function () {
        const id = el.dataset.quick;
        if (S.inv(id) <= 0) {
          if (id === 'shield') { U.toast('守护卡不足，可在打卡或商城获取', 'bad'); UI.go('shop'); }
          else { U.toast('道具不足，去商城兑换吧', 'bad'); UI.go('shop'); }
          return;
        }
        const r = S.quickUse(id);
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
  };

  /* ---------------- 刷新 / 路由 ---------------- */
  UI.renderChrome = function () {
    UI.renderTopbar();
    UI.renderSidebar();
    UI.renderRightbar();
  };

  UI.refresh = function () {
    UI.renderChrome();
    const page = UI.pages[UI.route];
    if (page) page.render(U.$('#view'));
  };

  UI.go = function (route) {
    if (!UI.pages[route]) route = 'garden';
    UI.route = route;
    location.hash = '#/' + route;
    UI.refresh();
    U.$('#view').scrollTop = 0;
  };

  UI.tick = function () {
    const now = U.now();
    U.$$('[data-ts]').forEach(function (el) {
      const ts = Number(el.dataset.ts);
      if (!ts) return;
      const left = (ts - now) / 1000;
      el.textContent = left <= 0 ? '已完成' : U.fmtTime(left);
    });
    U.$$('[data-pg]').forEach(function (el) {
      const start = Number(el.dataset.start);
      const end = Number(el.dataset.end);
      if (!start || !end) return;
      const pct = U.clamp((now - start) / (end - start) * 100, 0, 100);
      el.style.width = pct + '%';
    });
    // 学习时长统计
    if (UI.route === 'learn') S.startStudyTimer();
    // 作物成熟 / 枯萎状态切换时刷新花园
    if (UI.route === 'garden' && UI._matSnapshot) {
      const snap = S.state.garden.plots.map(function (p) {
        return p.seedId ? S.cropState(p).status : 'empty';
      }).join(',');
      if (snap !== UI._matSnapshot) {
        UI._matSnapshot = snap;
        UI.refresh();
      }
    }
    // 每 30 秒同步一次宠物饱腹
    if (!UI._lastSync || now - UI._lastSync > 30000) {
      UI._lastSync = now;
      S.syncPets();
    }
  };

  /* ---------------- 消息通知 ---------------- */
  UI.noticeModal = function () {
    const st = S.get();
    const list = st.notices.length
      ? st.notices.map(function (n) {
        const t = new Date(n.at);
        return '<div class="st-item info" style="margin-bottom:7px"><span style="font-size:16px">' + n.icon + '</span>' +
          '<span style="flex:1">' + U.esc(n.text) + '</span>' +
          '<span style="font-size:10px;color:#a9b2a6">' + U.pad(t.getMonth() + 1) + '-' + U.pad(t.getDate()) + ' ' + U.pad(t.getHours()) + ':' + U.pad(t.getMinutes()) + '</span></div>';
      }).join('')
      : U.empty('暂时没有新消息，去背单词赚积分吧', '🔔');
    U.modal({ title: '消息通知', icon: '🔔', body: list });
  };

  /* ---------------- 每日签到 ---------------- */
  function checkinDaysHtml(info) {
    return info.days.map(function (d) {
      const dd = new Date(d.key + 'T00:00:00');
      const label = (dd.getMonth() + 1) + '/' + dd.getDate();
      const cls = d.signed ? 'signed' : d.today ? 'today' : '';
      return '<div class="ck-day ' + cls + '">' +
        '<span class="ck-d">' + label + '</span>' +
        '<span class="ck-ic">' + (d.signed ? '✓' : d.today ? '🎁' : '·') + '</span>' +
        '<span class="ck-t">' + (d.signed ? '已签' : d.today ? '今天' : '—') + '</span></div>';
    }).join('');
  }

  UI.checkinModal = function () {
    const info = S.checkinInfo();
    U.modal({
      title: '每日签到', icon: '📅',
      body:
        '<div class="ck-hero"><div class="ck-hero-ic">📅</div>' +
        '<div class="ck-hero-nm">连续签到 <b>' + info.streak + '</b> 天</div>' +
        '<div class="ck-hero-sub">每日签到必得随机种子或积分 · 连续 7 天必得稀有种子</div></div>' +
        '<div class="ck-days">' + checkinDaysHtml(info) + '</div>' +
        '<div class="st-item info" style="margin-top:12px"><span>奖励池：积分 4~10 · 普通种子 · 稀有种子 · 珍稀种子</span></div>',
      footer: '<button class="btn" data-close>关闭</button>' +
        '<button class="btn btn-gold" id="btnDoCheckin" ' + (info.signed ? 'disabled' : '') + '>' +
        (info.signed ? '今日已签到' : '立即签到') + '</button>',
      onMount: function (box, close) {
        const b = U.$('#btnDoCheckin', box);
        if (!b || info.signed) return;
        b.addEventListener('click', function () {
          const r = S.doCheckin();
          if (!r.ok) { U.toast(r.msg, 'bad'); return; }
          close();
          UI.refresh();
          U.modal({
            title: '签到成功', icon: '📅',
            body: '<div class="ck-win"><div class="ck-win-ic">' + r.reward.icon + '</div>' +
              '<div class="ck-win-nm">获得 ' + U.esc(r.reward.name) + '</div>' +
              '<div class="ck-win-sub">已连续签到 ' + r.streak + ' 天' +
              (r.reward.type === 'seed' ? ' · 种子已放入背包' : ' · 积分已到账') + '</div>' +
              (r.streak % 7 === 0 ? '<div class="ck-win-tip">🎉 连续 7 天达成，稀有种子已发放</div>' : '') +
              '<div class="ck-win-sub" style="margin-top:8px;color:#b0b8ac">明天再来，连续签到奖励更丰厚</div></div>',
            footer: '<button class="btn btn-primary" data-close>收下奖励</button>'
          });
        });
      }
    });
  };

  /* ---------------- 设置 ---------------- */
  UI.settingsModal = function () {
    const st = S.get();
    U.modal({
      title: '设置', icon: '⚙️',
      body:
        '<div style="display:flex;flex-direction:column;gap:13px">' +
        '<label style="display:flex;align-items:center;gap:10px"><span style="flex:1"><b>演示加速</b><div style="font-size:11px;color:#8b968c">作物生长速度提升约 12 倍，方便快速体验收获与偷菜流程（仅对新播种作物生效）</div></span>' +
        '<input type="checkbox" id="setFast" ' + (st.settings.fastGrow ? 'checked' : '') + ' style="width:18px;height:18px"></label>' +
        '<label style="display:flex;align-items:center;gap:10px"><span style="flex:1"><b>单词朗读</b><div style="font-size:11px;color:#8b968c">使用浏览器语音合成朗读单词</div></span>' +
        '<input type="checkbox" id="setSound" ' + (st.settings.sound ? 'checked' : '') + ' style="width:18px;height:18px"></label>' +
        '<div style="border-top:1px dashed #e6dfcd;padding-top:12px"><b>数据存档</b>' +
        '<div style="font-size:11px;color:#8b968c;margin:4px 0 8px">存档保存在本机浏览器，可导出备份或迁移到其他设备</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-sm" id="setExport">导出存档</button>' +
        '<button class="btn btn-sm" id="setImport">导入存档</button>' +
        '<button class="btn btn-sm" id="setLogout">退出登录</button>' +
        '<button class="btn btn-sm" id="setReset" style="color:#c05a44">重置游戏</button>' +
        '</div></div></div>',
      footer: '<button class="btn btn-primary" data-close>关闭</button>',
      onMount: function (box, close) {
        U.$('#setFast', box).addEventListener('change', function (e) {
          st.settings.fastGrow = e.target.checked; S.save(); U.toast(e.target.checked ? '演示加速已开启' : '演示加速已关闭', 'good');
        });
        U.$('#setSound', box).addEventListener('change', function (e) {
          st.settings.sound = e.target.checked; S.save();
        });
        U.$('#setExport', box).addEventListener('click', function () {
          U.download('单词花园存档_' + U.dateStr() + '.json', S.exportSave(), 'application/json');
        });
        U.$('#setImport', box).addEventListener('click', function () {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.json,application/json';
          inp.onchange = function () {
            const f = inp.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = function () {
              if (S.importSave(reader.result)) { U.toast('存档导入成功', 'good'); close(); UI.refresh(); }
              else U.toast('存档格式不正确', 'bad');
            };
            reader.readAsText(f);
          };
          inp.click();
        });
        U.$('#setLogout', box).addEventListener('click', function () {
          S.get().logged = false; S.save(); close();
          location.reload();
        });
        U.$('#setReset', box).addEventListener('click', function () {
          U.confirm('重置游戏', '将清空花园、单词、宠物、积分等全部进度，此操作不可恢复。确定继续吗？', function () {
            S.reset(); close(); location.reload();
          }, '确定重置');
        });
      }
    });
  };

  UI.quickUse = function (id) {
    const r = S.quickUse(id);
    U.toast(r.msg, r.ok ? 'good' : 'bad');
    UI.refresh();
  };

  global.WG.ui = UI;
})(window);
