/* ============================================================
   荣誉排行榜
   ============================================================ */
(function (global) {
  'use strict';

  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const page = {};
  let tab = 'word';

  const TABS = [
    { id: 'word', name: '📚 单词学霸榜', val: 'words', unit: '词', sub: function (r) { return '正确率 ' + r.acc + '%'; } },
    { id: 'garden', name: '🌻 花园达人榜', val: 'gardenLv', unit: '级', sub: function (r) { return '稀有花卉 ' + r.rareFlower + ' 株'; } },
    { id: 'pet', name: '🐾 萌宠养成榜', val: 'petLv', unit: '级', sub: function (r) { return '亲密度 ' + Math.round(r.intimacy); } }
  ];

  page.render = function (root) {
    const boards = S.leaderboards();
    const t = TABS.find(function (x) { return x.id === tab; }) || TABS[0];
    const rows = boards[t.id];
    const meRow = rows.find(function (r) { return r.me; });

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🏆 荣誉排行榜</div>' +
      '<div class="page-sub">每日 0 点更新 · 仅作荣誉展示，无惩罚机制</div><div class="spacer"></div>' +
      '<div class="stat-chip" style="background:#fff4e6"><span class="ic">🏅</span><b>第 ' + (meRow ? meRow.rank : '-') + ' 名</b><span>我的排名</span></div></div>' +

      '<div class="rank-tabs">' + TABS.map(function (x) {
        return '<button class="ltab' + (tab === x.id ? ' on' : '') + '" data-rank="' + x.id + '">' + x.name + '</button>';
      }).join('') + '</div>' +

      '<div class="card" style="padding:10px 12px">' +
      '<div class="rank-list">' + rows.map(function (r) {
        const noCls = r.rank === 1 ? ' g1' : r.rank === 2 ? ' g2' : r.rank === 3 ? ' g3' : '';
        return '<div class="rank-row' + (r.me ? ' me' : '') + '">' +
          '<div class="rank-no' + noCls + '">' + (r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank) + '</div>' +
          '<div class="rank-ava">' + r.icon + '</div>' +
          '<div><div class="rank-name">' + U.esc(r.name) + (r.me ? '<span class="me-tag">我</span>' : '') + '</div>' +
          '<div class="rank-sub">' + t.sub(r) + '</div></div>' +
          '<div class="rank-val"><b>' + r[t.val] + '</b><span>' + t.unit + '</span></div>' +
          '</div>';
      }).join('') + '</div></div>' +

      '<div class="section-gap"></div>' +
      '<div class="card" style="font-size:11.5px;color:#8b968c;line-height:1.9">' +
      '<b style="color:#3b4a3e">榜单说明</b><br>' +
      '· 单词学霸榜：按累计背诵单词数量、正确率排名；<br>' +
      '· 花园达人榜：按花园等级、稀有花卉收获数量排名；<br>' +
      '· 萌宠养成榜：按宠物等级、亲密度排名；<br>' +
      '· 榜单每日 0 点更新，仅做荣誉展示，不设降级与惩罚。</div>';

    U.$$('[data-rank]', root).forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.rank; UI.refresh(); });
    });
  };

  global.WG.ui.pages.rank = page;
})(window);
