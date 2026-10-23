/* ============================================================
   任务 & 活动
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const page = {};

  page.render = function (root) {
    const st = S.get();
    const stats = S.stats();
    const claimed = st.tasks.claimed;
    const doneCount = D.TASKS.filter(function (t) { return claimed.indexOf(t.id) >= 0; }).length;
    const allClaimed = doneCount === D.TASKS.length;
    const weekly = S.weeklyProgress();
    const ck = S.checkinInfo();

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🎯 任务活动</div>' +
      '<div class="page-sub">轻量化日常任务，完成即领积分与道具，无强制打卡压力</div><div class="spacer"></div>' +
      '<div class="stat-chip" style="background:#fff4e6"><span class="ic">✅</span><b>' + doneCount + '/' + D.TASKS.length + '</b><span>今日任务</span></div></div>' +

      '<div class="card checkin-banner">' +
      '<div class="ckb-ic">📅</div>' +
      '<div class="ckb-body"><div class="ckb-nm">每日签到 <span class="tag' + (ck.signed ? ' ok' : '') + '">' + (ck.signed ? '今日已签' : '待签到') + '</span></div>' +
      '<div class="ckb-sub">连续签到 ' + ck.streak + ' 天 · 签到随机获得积分或种子，连续 7 天必得稀有种子</div></div>' +
      '<div class="spacer"></div>' +
      '<button class="btn btn-sm ' + (ck.signed ? '' : 'btn-gold') + '" id="taskCheckin">' + (ck.signed ? '查看签到' : '立即签到') + '</button></div>' +

      '<div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px" class="task-layout">' +
      '<div class="card"><div class="card-title"><span class="ct-ic">📋</span>每日任务' +
      '<span class="ct-more">每日 0 点刷新</span></div>' +
      '<div class="task-list">' + D.TASKS.map(function (t) {
        const prog = t.metric === 'feed' ? (st.tasks.feedCount || 0) : S.taskProgress(t);
        const done = S.taskDone(t);
        const got = claimed.indexOf(t.id) >= 0;
        const pct = U.clamp(Math.min(prog, t.target) / t.target * 100, 0, 100);
        return '<div class="task' + (got ? ' done' : '') + '">' +
          '<div class="task-ic">' + t.icon + '</div>' +
          '<div class="task-body"><div class="task-nm">' + t.name +
          (got ? '<span class="tag ok">已领取</span>' : done ? '<span class="tag ok">可领取</span>' : '') + '</div>' +
          '<div class="task-rw">奖励：+' + t.reward.points + ' 收获积分' + (t.reward.exp ? ' · +' + t.reward.exp + ' 花园经验' : '') +
          (t.reward.items ? ' · ' + Object.keys(t.reward.items).map(function (k) { return D.ITEMS[k].name + '×' + t.reward.items[k]; }).join(' ') : '') + '</div>' +
          '<div class="task-progress"><div class="bar green"><i style="width:' + pct + '%"></i></div>' +
          '<span class="tp-txt">' + Math.min(prog, t.target) + '/' + t.target + '</span></div></div>' +
          '<div class="task-right">' +
          (got ? '<span class="tag ok">已完成</span>' :
            done ? '<button class="btn btn-xs btn-gold" data-claim="' + t.id + '">领取</button>' :
              '<button class="btn btn-xs" data-jump="' + t.jump + '">前往</button>') +
          '</div></div>';
      }).join('') + '</div></div>' +

      '<div>' +
      '<div class="card" style="text-align:center;background:linear-gradient(160deg,#fff9e8,#fff3dc);border-color:#f3dfae">' +
      '<div style="font-size:46px">' + (st.tasks.chestClaimed ? '📭' : allClaimed ? '🎁' : '🔒') + '</div>' +
      '<div style="font-size:15px;font-weight:800;margin-top:6px">每日专属宝箱</div>' +
      '<div style="font-size:11.5px;color:#8b968c;margin-top:5px;line-height:1.8">完成并领取全部每日任务后开启<br>随机掉落稀有种子、高级粮食</div>' +
      '<button class="btn btn-sm ' + (allClaimed && !st.tasks.chestClaimed ? 'btn-gold' : '') + '" id="taskChest" style="margin-top:12px" ' +
      (allClaimed && !st.tasks.chestClaimed ? '' : 'disabled') + '>' +
      (st.tasks.chestClaimed ? '今日已开启' : allClaimed ? '开启宝箱' : '还差 ' + (D.TASKS.length - doneCount) + ' 个任务') + '</button>' +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">📅</span>周期活动</div>' +
      '<div class="task-list">' +
      '<div class="task"><div class="task-ic">🔥</div><div class="task-body">' +
      '<div class="task-nm">周打卡活动</div>' +
      '<div class="task-rw">连续打卡 ' + weekly.streak + '/7 天 · 奖励 限定花卉种子 ×2 + 20 积分</div>' +
      '<div class="task-progress"><div class="bar pink"><i style="width:' + U.clamp(weekly.streak / 7 * 100, 0, 100) + '%"></i></div>' +
      '<span class="tp-txt">' + weekly.streak + '/7</span></div></div>' +
      '<div class="task-right">' + (weekly.streakClaimed ? '<span class="tag ok">已领取</span>' :
        weekly.streak >= 7 ? '<button class="btn btn-xs btn-gold" data-weekly="streak">领取</button>' : '<span class="tag">进行中</span>') + '</div></div>' +

      '<div class="task"><div class="task-ic">🚀</div><div class="task-body">' +
      '<div class="task-nm">单词冲刺活动</div>' +
      '<div class="task-rw">本周累计背诵 ' + weekly.weekWords + '/200 词 · 奖励 花园加速礼包（30 积分 + 肥料 ×3）</div>' +
      '<div class="task-progress"><div class="bar blue"><i style="width:' + U.clamp(weekly.weekWords / 200 * 100, 0, 100) + '%"></i></div>' +
      '<span class="tp-txt">' + weekly.weekWords + '/200</span></div></div>' +
      '<div class="task-right">' + (weekly.sprintClaimed ? '<span class="tag ok">已领取</span>' :
        weekly.weekWords >= 200 ? '<button class="btn btn-xs btn-gold" data-weekly="sprint">领取</button>' : '<span class="tag">进行中</span>') + '</div></div>' +

      '<div class="task" style="opacity:.72"><div class="task-ic">🎊</div><div class="task-body">' +
      '<div class="task-nm">节日限定活动 <span class="tag">敬请期待</span></div>' +
      '<div class="task-rw">节假日上线专属词库、限定宠物「星光独角兽」、专属花园皮肤</div></div>' +
      '<div class="task-right"><span class="tag due">未开启</span></div></div>' +
      '</div></div></div></div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">💡</span>今日学习进度</div>' +
      '<div class="data-grid">' +
      '<div class="dg-item"><b>' + stats.newToday + '</b><span>今日新词</span></div>' +
      '<div class="dg-item blue"><b>' + stats.reviewToday + '</b><span>今日复习</span></div>' +
      '<div class="dg-item gold"><b>' + st.learn.quizToday + '</b><span>今日闯关</span></div>' +
      '<div class="dg-item pink"><b>' + (st.garden.todayHarvest + st.orchard.todayHarvest + st.fish.todayHarvest + st.livestock.todayCollect) + '</b><span>今日收获</span></div>' +
      '<div class="dg-item"><b>' + st.garden.todayHelp + '</b><span>今日互助</span></div>' +
      '<div class="dg-item blue"><b>' + (st.steals.total || 0) + '</b><span>今日偷菜</span></div>' +
      '</div></div>';

    bind(root);
  };

  function bind(root) {
    U.$$('[data-claim]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const r = S.claimTask(b.dataset.claim);
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
    U.$$('[data-jump]', root).forEach(function (b) {
      b.addEventListener('click', function () { UI.go(b.dataset.jump); });
    });
    U.$$('[data-weekly]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const r = S.claimWeekly(b.dataset.weekly);
        U.toast(r.msg, r.ok ? 'gold' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
    const chest = U.$('#taskChest', root);
    if (chest) chest.addEventListener('click', function () {
      const r = S.claimTask('chest');
      U.toast(r.msg, r.ok ? 'gold' : 'bad');
      if (r.ok) UI.refresh();
    });
    const ckBtn = U.$('#taskCheckin', root);
    if (ckBtn) ckBtn.addEventListener('click', function () { UI.checkinModal(); });
  }

  global.WG.ui.pages.tasks = page;
})(window);
