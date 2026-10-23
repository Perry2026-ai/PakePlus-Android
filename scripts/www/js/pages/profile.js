/* ============================================================
   个人数据中心
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
    const pet = S.activePet();
    const ll = S.learnDef();
    const gl = S.gardenDef();
    const fl = S.fishDef();
    const ol = S.orchardDef();
    const nextL = S.nextLearnLevel();
    const nextG = S.nextGardenLevel();
    const nextF = S.nextFishLevel();
    const nextO = S.nextOrchardLevel();
    const nextP = S.nextPetLevel(pet);
    const badges = [];
    if (st.garden.level >= 15) badges.push('🌻 满级花园');
    if (st.learn.level >= 10) badges.push('🎓 单词宗师');
    if (pet && pet.level >= 10) badges.push('🐾 满级神宠');
    if (pet && S.intimacyStar(pet.intimacy) >= 5) badges.push('💗 满星亲密');
    if (stats.streak >= 7) badges.push('🔥 七日打卡');
    if (st.orchard.level >= 10) badges.push('🍎 满级果园');
    if (st.fish.level >= 10) badges.push('🐟 满级鱼塘');

    const days = Object.keys(st.learn.history).sort().reverse().slice(0, 7);
    const histRows = days.map(function (d) {
      const h = st.learn.history[d];
      return '<tr><td>' + d + '</td><td>' + (h.newWords || 0) + '</td><td>' + (h.reviews || 0) + '</td>' +
        '<td>' + (h.quiz || 0) + '</td><td>' + (h.minutes || 0) + ' 分钟</td></tr>';
    }).join('');

    root.innerHTML =
      '<div class="page-head"><div class="page-title">📊 个人数据中心</div>' +
      '<div class="page-sub">学习台账、成长进度与荣誉，全部数据永久保存在本机</div><div class="spacer"></div>' +
      '<button class="btn btn-sm" id="pfEdit">✏️ 编辑资料</button>' +
      '<button class="btn btn-sm" id="pfExport">⬇️ 导出学习台账</button></div>' +

      '<div class="profile-hero">' +
      '<div class="profile-ava">' + st.profile.avatar + '</div>' +
      '<div class="profile-main">' +
      '<div class="profile-name">' + U.esc(st.profile.nickname || '我的花园') +
      (badges.map(function (b) { return '<span class="badge-medal">' + b + '</span>'; }).join('')) + '</div>' +
      '<div class="profile-tags">' +
      '<span class="tag">学习 Lv' + st.learn.level + ' · ' + ll.name + '</span>' +
      '<span class="tag ok">花园 Lv' + st.garden.level + '</span>' +
      (pet ? '<span class="tag">' + pet.name + ' Lv' + pet.level + '</span>' : '') +
      '<span class="tag">加入于 ' + U.dateStr(new Date(st.profile.created)) + '</span>' +
      '</div>' +
      '<div class="profile-stat-grid">' +
      '<div class="ps-item"><b>' + stats.studyDays + '</b><span>学习天数</span></div>' +
      '<div class="ps-item"><b>' + stats.totalNew + '</b><span>累计背单词</span></div>' +
      '<div class="ps-item"><b>' + stats.totalReview + '</b><span>累计复习</span></div>' +
      '<div class="ps-item"><b>' + stats.acc + '%</b><span>正确率</span></div>' +
      '<div class="ps-item"><b>' + D.FRIENDS.length + '</b><span>好友数量</span></div>' +
      '<div class="ps-item"><b>' + U.fmtNum(st.profile.totalPoints) + '</b><span>历史积分总额</span></div>' +
      '</div></div></div>' +

      '<div class="section-gap"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">' +
      growthLine('📖', '单词学习成长线', 'Lv' + st.learn.level + ' ' + ll.name, st.learn.exp, nextL, 'blue',
        '累计背诵 ' + st.learn.totalNew + ' 词 · 正确率 ' + stats.acc + '%', ll.perk,
        nextL && st.learn.totalNew < nextL.minWords ? '还需累计背诵 ' + (nextL.minWords - st.learn.totalNew) + ' 词' : '') +
      growthLine('🌻', '花园养成成长线', 'Lv' + st.garden.level, st.garden.exp, nextG, 'green',
        '已解锁 ' + S.unlockedPlots() + ' 块地块 · 今日收获 ' + st.garden.todayHarvest, gl.perk, '') +
      growthLine('🍎', '果园养成成长线', 'Lv' + st.orchard.level, st.orchard.exp, nextO, 'gold',
        '已解锁 ' + S.orchardSlots() + '/12 棵果树 · 今日收获 ' + st.orchard.todayHarvest, ol.perk, '') +
      growthLine('🐟', '鱼塘养成成长线', 'Lv' + st.fish.level, st.fish.exp, nextF, 'blue',
        '已解锁 ' + S.fishSlots() + '/12 个鱼池 · 今日收获 ' + st.fish.todayHarvest, fl.perk, '') +
      growthLine('🐾', '萌宠养成成长线', pet ? pet.name + ' Lv' + pet.level : '尚未领养', pet ? pet.exp : 0, nextP, 'pink',
        pet ? '亲密度 ' + Math.round(pet.intimacy) + ' · ' + S.intimacyStar(pet.intimacy) + ' 星' : '花园 Lv2 解锁领养',
        pet ? S.petDef(pet.level).perk : '', '') +
      '</div>' +

      '<div class="section-gap"></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:12px" class="pf-bottom">' +
      '<div class="card"><div class="card-title"><span class="ct-ic">📒</span>学习台账（近 7 天）' +
      '<span class="ct-more" id="pfWrong">错题本（' + stats.wrongCount + '）→</span></div>' +
      (histRows ? '<div class="scroll-y"><table class="word-table"><thead><tr><th>日期</th><th>新词</th><th>复习</th><th>闯关</th><th>学习时长</th></tr></thead>' +
        '<tbody>' + histRows + '</tbody></table></div>' : U.empty('还没有学习记录，去背第一个单词吧', '📒')) +
      '</div>' +

      '<div class="card"><div class="card-title"><span class="ct-ic">🏅</span>成长激励 & 荣誉</div>' +
      '<div class="status-list">' +
      '<div class="st-item ' + (stats.streak >= 7 ? 'good' : 'info') + '"><span class="dotm"></span><span>连续打卡 <b>' + stats.streak + '</b> 天' +
      (st.learn.streak7 ? '（经验 +10% 永久加速生效）' : '（满 7 天解锁经验加速）') + '</span></div>' +
      '<div class="st-item info"><span class="dotm"></span><span>背诵 1 词 = 2 EXP · 复习 1 词 = 1 EXP · 闯关满分 = 15 EXP</span></div>' +
      '<div class="st-item info"><span class="dotm"></span><span>正确率 ' + stats.acc + '%（学习等级需同时满足经验、词量与正确率）</span></div>' +
      '<div class="st-item ' + (badges.length ? 'good' : '') + '"><span class="dotm"></span><span>已获得荣誉：' + (badges.length ? badges.join('、') : '继续努力，荣誉在等你') + '</span></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#8b968c;margin-top:10px;line-height:1.8">等级仅升级不降级，短期正确率波动不影响已有等级，鼓励长期学习积累。</div>' +
      '</div></div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">💾</span>数据留存</div>' +
      '<div style="font-size:11.5px;color:#8b968c;line-height:1.9">' +
      '账号数据永久保存在本机浏览器，学习记录、花园进度、宠物数据不会清零；建议定期导出存档备份。</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button class="btn btn-sm" id="pfBackup">导出完整存档</button>' +
      '<button class="btn btn-sm" id="pfCsv">导出学习台账 CSV</button>' +
      '</div></div>';

    bind(root, stats);
  };

  function growthLine(icon, title, lvText, cur, next, cls, sub, perk, extra) {
    const pct = next ? U.clamp(cur / next.exp * 100, 0, 100) : 100;
    return '<div class="card"><div class="card-title"><span class="ct-ic">' + icon + '</span>' + title +
      '<span class="tag" style="margin-left:auto">' + lvText + '</span></div>' +
      '<div class="bar ' + cls + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="bar-meta"><span>' + U.fmtNum(cur) + (next ? ' / ' + next.exp : '') + ' EXP</span><span>' + Math.floor(pct) + '%</span></div>' +
      '<div style="font-size:11.5px;color:#8b968c;margin-top:9px;line-height:1.8">' + U.esc(sub) + '</div>' +
      '<div style="font-size:11.5px;color:#4f9e57;margin-top:4px;line-height:1.8">当前权益：' + U.esc(perk) + '</div>' +
      (extra ? '<div style="font-size:11px;color:#c67b3f;margin-top:4px">' + U.esc(extra) + '</div>' : '') +
      '</div>';
  }

  function bind(root, stats) {
    U.$('#pfEdit', root).addEventListener('click', function () {
      const st = S.get();
      U.modal({
        title: '编辑花园资料', icon: '✏️',
        body: '<div class="login-label">花园昵称</div>' +
          '<input class="login-input" id="pfName" maxlength="10" value="' + U.esc(st.profile.nickname) + '">' +
          '<div class="login-label">花园头像</div><div class="avatar-picker" id="pfAvatars">' +
          D.AVATARS.map(function (a) {
            return '<button class="avatar-opt' + (a === st.profile.avatar ? ' on' : '') + '" data-ava="' + a + '">' + a + '</button>';
          }).join('') + '</div>',
        footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" id="pfSave">保存</button>',
        onMount: function (box, close) {
          let ava = st.profile.avatar;
          U.$$('#pfAvatars .avatar-opt', box).forEach(function (b) {
            b.addEventListener('click', function () {
              ava = b.dataset.ava;
              U.$$('#pfAvatars .avatar-opt', box).forEach(function (x) { x.classList.toggle('on', x === b); });
            });
          });
          U.$('#pfSave', box).addEventListener('click', function () {
            const name = (U.$('#pfName', box).value || '').trim();
            if (!name) { U.toast('昵称不能为空', 'bad'); return; }
            st.profile.nickname = name;
            st.profile.avatar = ava;
            S.save();
            close();
            U.toast('资料已更新', 'good');
            UI.refresh();
          });
        }
      });
    });

    U.$('#pfWrong', root).addEventListener('click', function () { UI.go('learn'); });

    U.$('#pfExport', root).addEventListener('click', function () {
      exportLedger();
    });
    U.$('#pfCsv', root).addEventListener('click', function () {
      exportLedger();
    });
    U.$('#pfBackup', root).addEventListener('click', function () {
      U.download('单词花园完整存档_' + U.dateStr() + '.json', S.exportSave(), 'application/json');
      U.toast('完整存档已导出', 'good');
    });
  }

  function exportLedger() {
    const st = S.get();
    const dates = Object.keys(st.learn.history).sort();
    if (!dates.length) { U.toast('还没有学习记录可以导出', 'bad'); return; }
    let csv = '日期,新词数,复习数,闯关轮次,学习时长(分钟),累计背诵\n';
    let acc = 0;
    dates.forEach(function (d) {
      const h = st.learn.history[d];
      acc += h.newWords || 0;
      csv += [d, h.newWords || 0, h.reviews || 0, h.quiz || 0, h.minutes || 0, acc].join(',') + '\n';
    });
    csv += '\n总计,,,,,,' + '\n';
    csv += '累计新词,' + st.learn.totalNew + '\n';
    csv += '累计复习,' + st.learn.totalReview + '\n';
    csv += '正确率,' + S.learnAcc().toFixed(1) + '%\n';
    csv += '连续打卡,' + st.learn.streak + ' 天\n';
    csv += '花园等级,Lv' + st.garden.level + '\n';
    csv += '学习等级,Lv' + st.learn.level + '\n';
    U.download('单词学习台账_' + U.dateStr() + '.csv', '\ufeff' + csv, 'text/csv;charset=utf-8');
    U.toast('学习台账已导出', 'good');
  }

  global.WG.ui.pages.profile = page;
})(window);
