/* ============================================================
   好友广场 & 偷菜
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const page = {};
  let selected = '';

  function plotState(p) {
    const now = U.now();
    if (!p.seedId) return 'empty';
    if (p.stolen) return 'stolen';
    if (now < p.matureAt) return 'growing';
    if (now >= p.witherAt) return 'withered';
    if (p.protected) return 'protected';
    return 'ready';
  }

  page.render = function (root) {
    const st = S.get();
    const friends = S.getFriends();
    const totalReady = friends.reduce(function (a, f) { return a + f.ready; }, 0);
    const sf = friends.find(function (f) { return f.id === selected; }) || null;

    root.innerHTML =
      '<div class="page-head"><div class="page-title">👫 好友广场</div>' +
      '<div class="page-sub">去好友花园偷菜、浇水施肥，双向共赢</div><div class="spacer"></div>' +
      '<span class="stat-chip" style="background:#fff8e6"><span class="ic">🥷</span><b>' +
      Math.max(0, S.stealLimit() - (st.steals.total || 0)) + '</b><span>/' + S.stealLimit() + ' 偷菜次数</span></span>' +
      '<span class="stat-chip" style="background:#eef8ea"><span class="ic">🤝</span><b>' +
      Math.max(0, S.helpLimit() - st.garden.todayHelp) + '</b><span>/' + S.helpLimit() + ' 互助次数</span></span>' +
      '</div>' +

      '<div class="card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#f4fbe9,#fff8f0)">' +
      '<span style="font-size:24px">🍀</span>' +
      '<div style="flex:1;min-width:180px"><b style="font-size:13px">今日好友花园有 ' + totalReady + ' 块成熟作物</b>' +
      '<div style="font-size:11px;color:#8b968c">单次最多偷 2 个作物，单个好友每日最多偷 3 次，偷菜作物可正常兑换积分与道具</div></div>' +
      (st.garden.shieldUntil > U.now() ? '<span class="shield-on">🛡️ 我的花园防护中</span>' : '') +
      '</div>' +

      (sf ? detailHtml(sf) : '') +
      '<div class="friend-grid" style="margin-top:' + (sf ? '14px' : '0') + '">' + friends.map(function (f) {
        const mini = f.plots.map(function (p, i) {
          const stt = plotState(p);
          const seed = D.SEED_MAP[p.seedId];
          let cls = 'mini-plot';
          if (stt === 'ready') cls += ' ready';
          else if (stt === 'stolen' || stt === 'withered') cls += ' stolen';
          return '<div class="' + cls + '" data-fplot="' + f.id + ':' + i + '" title="' + (seed ? seed.name : '') + '">' +
            (stt === 'ready' ? seed.icon : stt === 'growing' ? seed.icon : stt === 'protected' ? '🛡️' : stt === 'withered' ? '🥀' : '·') + '</div>';
        }).join('');
        return '<div class="friend-card">' +
          '<div class="fc-head"><div class="fc-ava">' + f.icon + '</div>' +
          '<div style="flex:1"><div class="fc-name">' + U.esc(f.name) + '</div>' +
          '<div class="fc-sub"><span class="online-dot ' + (f.online ? 'on' : '') + '"></span>' +
          (f.online ? '在线' : '离线') + ' · 花园 Lv' + f.lv + ' · ' + f.tag + '</div></div>' +
          (f.ready ? '<span class="plot-badge harvest" style="position:static">' + f.ready + ' 可偷</span>' : '') +
          '</div>' +
          '<div class="fc-plots">' + mini + '</div>' +
          '<div class="fc-foot">' +
          '<div class="fc-main">' +
          '<button class="fbtn fbtn-enter" data-enter="' + f.id + '">进入花园</button>' +
          '<button class="fbtn fbtn-steal" data-stealall="' + f.id + '"' + (f.ready ? '' : ' disabled') + '>🥷 偷菜</button>' +
          '</div>' +
          '<div class="fc-soc">' +
          '<button class="fbtn fbtn-soc" data-help="' + f.id + '" title="互助">🤝<em>互助</em></button>' +
          '<button class="fbtn fbtn-soc" data-pat="' + f.id + '" title="拍一拍">👋<em>拍一拍</em></button>' +
          '<button class="fbtn fbtn-soc" data-prank="' + f.id + ':weed" title="放草">🌿<em>放草</em></button>' +
          '<button class="fbtn fbtn-soc" data-prank="' + f.id + ':pest" title="放虫">🐛<em>放虫</em></button>' +
          '</div>' +
          '<div class="fc-note">今日已偷 <b>' + f.stoleToday + '</b>/3</div>' +
          '</div></div>';
      }).join('') + '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card"><div class="card-title"><span class="ct-ic">💬</span>好友留言板' +
      '<span class="ct-more">给好友留言，每日刷新</span></div>' +
      '<div style="display:flex;gap:8px;margin-bottom:10px">' +
      '<select class="select" id="msgFriend" style="flex:0 0 130px">' + friends.map(function (f) {
        return '<option value="' + f.id + '">' + f.icon + ' ' + f.name + '</option>';
      }).join('') + '</select>' +
      '<input class="login-input" id="msgInput" maxlength="40" placeholder="说点什么..." style="flex:1">' +
      '<button class="btn btn-sm btn-primary" id="msgSend">发送</button>' +
      '</div>' +
      '<div style="max-height:180px;overflow-y:auto">' + (S.messages().length ? S.messages().map(function (m) {
        const t = new Date(m.at);
        return '<div class="st-item info" style="margin-bottom:6px"><span style="font-size:16px">' + m.icon + '</span>' +
          '<span style="flex:1"><b>' + U.esc(m.from) + '</b>：' + U.esc(m.text) + '</span>' +
          '<span style="font-size:10px;color:#a9b2a6">' + U.pad(t.getMonth() + 1) + '-' + U.pad(t.getDate()) + ' ' + U.pad(t.getHours()) + ':' + U.pad(t.getMinutes()) + '</span></div>';
      }).join('') : U.empty('还没有留言，去打个招呼吧', '💬')) + '</div></div>' +

      '<div class="section-gap"></div>' +
      '<div class="card" style="font-size:11.5px;color:#8b968c;line-height:1.9">' +
      '<b style="color:#3b4a3e">社交规则</b><br>' +
      '· 偷菜：好友作物成熟后 30 分钟内可偷取，单次最多 2 个，单个好友每日 3 次，全员每日上限 ' + S.stealLimit() + ' 次；<br>' +
      '· 互助：帮好友浇水、施肥、除草，每次 +1 花园经验 +0.5 单词积分，每日上限 10 次；<br>' +
      '· 防护：使用守护卡可开启 1 小时防护，期间好友无法偷取你的作物；珍稀作物自带 10 分钟初始防护。</div>';

    bind(root, sf);
  };

  function detailHtml(f) {
    const plots = f.plots.map(function (p, i) {
      const stt = plotState(p);
      const seed = D.SEED_MAP[p.seedId];
      let cls = 'big-plot';
      if (stt === 'ready') cls += ' ready';
      else if (stt === 'protected') cls += ' protected';
      else if (stt === 'stolen' || stt === 'withered') cls += ' stolen';
      let ts = '';
      if (stt === 'growing') ts = '剩余 ' + U.fmtTime((p.matureAt - U.now()) / 1000);
      else if (stt === 'ready') ts = '可偷取';
      else if (stt === 'protected') ts = '保护中';
      else if (stt === 'stolen') ts = '已被偷';
      else if (stt === 'withered') ts = '已枯萎';
      return '<div class="' + cls + '" data-fplot="' + f.id + ':' + i + '">' +
        '<div class="bp-ic">' + (seed ? seed.icon : '🌱') + '</div>' +
        '<div class="bp-nm">' + (seed ? seed.name : '空地') + '</div>' +
        '<div class="bp-ts">' + ts + '</div>' +
        (stt === 'ready' ? '<button class="btn btn-xs btn-pink" style="margin-top:5px" data-steal="' + f.id + ':' + i + '">偷</button>' : '') +
        '</div>';
    }).join('');
    return '<div class="card friend-detail">' +
      '<div class="card-title"><span class="ct-ic">' + f.icon + '</span>' + U.esc(f.name) + ' 的花园' +
      '<span class="tag" style="margin-left:6px">Lv' + f.lv + '</span>' +
      '<span class="ct-more" id="fClose">收起 ✕</span></div>' +
      '<div style="font-size:11.5px;color:#8b968c;margin-bottom:10px">点击「偷」可偷取成熟作物，点击地块可帮忙浇水施肥</div>' +
      '<div class="big-plot-grid">' + plots + '</div></div>';
  }

  function bind(root, sf) {
    U.$('#fClose') && U.$('#fClose').addEventListener('click', function () { selected = ''; UI.refresh(); });
    U.$$('[data-enter]', root).forEach(function (b) {
      b.addEventListener('click', function () { selected = b.dataset.enter; UI.refresh(); });
    });
    U.$$('[data-help]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const fid = b.dataset.help;
        let done = 0;
        for (let i = 0; i < 6; i++) {
          const r = S.helpFriend(fid, i);
          if (r.ok) done++;
          else if (r.msg && r.msg.indexOf('上限') >= 0) break;
        }
        if (done) { U.toast('互助完成 ' + done + ' 次，花园经验 +' + done + '，积分 +' + (0.5 * done).toFixed(1), 'good'); UI.refresh(); }
        else U.toast('今日互助次数已用完，或这块地已经帮忙过了', 'bad');
      });
    });
    U.$$('[data-stealall]', root).forEach(function (b) {
      b.addEventListener('click', function (e) {
        const fid = b.dataset.stealall;
        const f = S.getFriends().find(function (x) { return x.id === fid; });
        if (!f) return;
        let got = 0, names = [];
        for (let i = 0; i < f.plots.length && got < 2; i++) {
          if (plotState(f.plots[i]) !== 'ready') continue;
          const r = S.stealFrom(fid, i);
          if (r.ok) { got++; names.push(r.seed.name); }
          else if (r.msg && (r.msg.indexOf('上限') >= 0 || r.msg.indexOf('用完') >= 0)) break;
        }
        if (got) {
          U.floatText(e.target, '🥷 +' + got, 'pink');
          U.toast('偷到 ' + names.join('、') + ' ×' + got, 'gold');
          UI.refresh();
        } else U.toast('没有可以偷的作物了', 'bad');
      });
    });
    U.$$('[data-steal]', root).forEach(function (b) {
      b.addEventListener('click', function (e) {
        const parts = b.dataset.steal.split(':');
        const r = S.stealFrom(parts[0], Number(parts[1]));
        U.toast(r.msg, r.ok ? 'gold' : 'bad');
        if (r.ok) { U.floatText(e.target, '🥷 +1', 'pink'); UI.refresh(); }
      });
    });
    U.$$('[data-fplot]', root).forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-steal]')) return;
        const parts = el.dataset.fplot.split(':');
        const r = S.helpFriend(parts[0], Number(parts[1]));
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
    U.$$('[data-pat]', root).forEach(function (b) {
      b.addEventListener('click', function (e) {
        const r = S.patFriend(b.dataset.pat);
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) { U.floatText(e.target, '+' + r.pts, 'pink'); UI.refresh(); }
      });
    });
    U.$$('[data-prank]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const parts = b.dataset.prank.split(':');
        const r = S.prankFriend(parts[0], parts[1]);
        U.toast(r.msg, r.ok ? 'gold' : 'bad');
      });
    });
    const msgSend = U.$('#msgSend', root);
    if (msgSend) msgSend.addEventListener('click', function () {
      const fid = U.$('#msgFriend', root).value;
      const txt = (U.$('#msgInput', root).value || '').trim();
      if (!txt) { U.toast('请输入留言内容', 'bad'); return; }
      S.addMessage(fid, txt);
      U.$('#msgInput', root).value = '';
      U.toast('留言已发送', 'good');
      UI.refresh();
    });
  }

  global.WG.ui.pages.friends = page;
})(window);
