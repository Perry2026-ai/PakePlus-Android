/* ============================================================
   积分商城
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const page = {};
  let cat = 'plant';

  page.render = function (root) {
    const st = S.get();
    const goods = S.shopGoods().filter(function (g) { return g.cat === cat; });
    const ownedCrops = Object.keys(st.inventory).filter(function (k) { return k.indexOf('crop_') === 0; });

    root.innerHTML =
      '<div class="page-head"><div class="page-title">🛍️ 积分商城</div>' +
      '<div class="page-sub">零充值 · 学习积分换生产投入品，收获积分换养料与周边</div><div class="spacer"></div>' +
      '<span class="stat-chip cur-learn"><span class="ic">📚</span><b>' + U.fmtNum(st.learnPoints) + '</b><span>学习积分</span></span>' +
      '<span class="stat-chip cur-farm" style="margin-left:8px"><span class="ic">🪙</span><b>' + U.fmtNum(st.points) + '</b><span>收获积分</span></span></div>' +

      '<div class="card" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding:13px 16px">' +
      '<span style="font-size:24px">♻️</span>' +
      '<div style="flex:1;min-width:160px"><b style="font-size:13px">多余作物一键回收</b>' +
      '<div style="font-size:11px;color:#8b968c">背包中的收获作物可兑换等额积分，实现资源循环</div></div>' +
      '<button class="btn btn-sm btn-gold" id="shRecycle">一键回收</button>' +
      '</div>' +

      '<div class="currency-note">' +
      '<span class="cn-item learn"><b>📚 学习积分</b>背单词获得 → 可兑换种子 / 果苗 / 鱼苗 / 禽畜幼崽 / 学习辅助</span>' +
      '<span class="cn-item farm"><b>🪙 收获积分</b>收获出售获得 → 仅兑换养料（水肥饲料）与周边（装饰、宠物用品）</span>' +
      '</div>' +

      '<div class="shop-cats">' + D.SHOP_CATS.map(function (c) {
        return '<button class="ltab' + (cat === c.id ? ' on' : '') + '" data-cat="' + c.id + '">' + c.icon + ' ' + c.name + '</button>';
      }).join('') + '</div>' +

      '<div class="shop-grid">' + goods.map(function (g) {
        const tagCls = g.kind === 'seed' ? (g.seed.tier === 3 ? ' epic' : g.seed.tier === 2 ? ' rare' : '') : '';
        const tagTxt = g.kind === 'seed' ? D.TIER_NAME[g.seed.tier] : '';
        const meta = S.currencyMeta(g.currency);
        const isLearn = g.currency === D.CUR.LEARN;
        const balance = S.balanceOf(g.currency);
        const afford = balance >= g.price;
        const soldOut = g.limit > 0 && (g.bought || 0) >= g.limit;
        const disabled = g.locked || soldOut || !afford;
        const btnTxt = g.locked ? (g.lockMsg || '未解锁') : (soldOut ? '今日已售完' : (afford ? '兑换' : '积分不足'));
        return '<div class="goods' + (g.locked ? ' locked' : '') + (isLearn ? ' cur-learn' : ' cur-farm') + '">' +
          (tagTxt ? '<span class="goods-tag' + tagCls + '">' + tagTxt + '</span>' : '') +
          '<div class="goods-ic">' + g.icon + '</div>' +
          '<div class="goods-nm">' + U.esc(g.name) + '</div>' +
          '<div class="goods-ds">' + U.esc(g.desc) + '</div>' +
          '<div class="goods-foot"><span class="price ' + (isLearn ? 'price-learn' : 'price-farm') + '">' + meta.icon + ' ' + g.price + '</span>' +
          '<span class="goods-limit">' + (g.limit ? '今日 ' + (g.bought || 0) + '/' + g.limit : '不限购') + '</span></div>' +
          '<button class="btn btn-sm ' + (disabled ? '' : 'btn-primary') + '" data-buy="' + g.id + '"' + (disabled ? ' disabled' : '') + '>' +
          btnTxt + '</button></div>';
      }).join('') + '</div>' +

      '<div class="section-gap"></div>' +
      '<div class="card" style="font-size:11.5px;color:#8b968c;line-height:1.9">' +
      '<b style="color:#3b4a3e">商城规则</b><br>' +
      '· 📚 学习积分只从背单词、复习、闯关、学习打卡中获得，是购买种子与幼崽的唯一途径；<br>' +
      '· 🪙 收获积分来自作物收获、出售、偷菜、任务等经营行为，只能换养料与周边；<br>' +
      '· 每日 0 点刷新商城库存；花园 Lv13 解锁种植道具 5% 折扣，Lv15 解锁道具无限制兑换；<br>' +
      '· 种子兑换后进入背包，在花园播种时优先使用库存种子。</div>';

    bind(root);
  };

  function bind(root) {
    U.$$('[data-cat]', root).forEach(function (b) {
      b.addEventListener('click', function () { cat = b.dataset.cat; UI.refresh(); });
    });
    U.$$('[data-buy]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        const r = S.buy(b.dataset.buy, 1);
        U.toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) UI.refresh();
      });
    });
    U.$('#shRecycle', root).addEventListener('click', function (e) {
      const r = S.recycleAll();
      if (!r.ok) { U.toast(r.msg, 'bad'); return; }
      U.floatText(e.target, '+' + r.points + ' 积分', 'green');
      U.toast('回收 ' + r.count + ' 个作物，获得 ' + r.points + ' 积分', 'gold');
      UI.refresh();
    });
  }

  global.WG.ui.pages.shop = page;
})(window);
