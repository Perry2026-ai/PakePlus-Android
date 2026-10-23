/* ============================================================
   应用启动
   ============================================================ */
(function (global) {
  'use strict';

  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;

  function boot() {
    S.init();
    const st = S.get();

    if (!st.logged || !st.profile.nickname) {
      UI.renderLogin();
    } else {
      UI.enterGame();
    }

    window.addEventListener('hashchange', function () {
      if (!S.get().logged) return;
      const r = (location.hash || '').replace('#/', '');
      if (r && r !== UI.route && UI.pages[r]) UI.go(r);
    });

    const mask = U.$('#drawerMask');
    if (mask) mask.addEventListener('click', function () {
      U.$('#sidebar').classList.remove('open');
      mask.classList.remove('on');
    });

    // 页面重新可见时同步离线期间的成长与每日重置
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        S.syncPets();
        S.ensureDaily();
        if (S.get().logged) UI.refresh();
      }
    });

    window.addEventListener('beforeunload', function () { S.save(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
