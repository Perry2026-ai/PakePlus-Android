/* ============================================================
   通用工具：DOM / 时间 / 提示 / 弹窗 / 语音
   ============================================================ */
(function (global) {
  'use strict';

  const U = {};
  const doc = document;

  U.$ = function (sel, root) { return (root || doc).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };

  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  U.clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
  U.pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  U.now = function () { return Date.now(); };

  U.dateStr = function (d) {
    const t = d || new Date();
    return t.getFullYear() + '-' + U.pad(t.getMonth() + 1) + '-' + U.pad(t.getDate());
  };

  U.dayStart = function (ts) {
    const d = new Date(ts || Date.now());
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  U.fmtNum = function (n) {
    const v = Number(n) || 0;
    if (v >= 100000) return (v / 10000).toFixed(1) + 'w';
    return Math.round(v * 10) / 10 % 1 === 0 ? String(Math.round(v)) : v.toFixed(1);
  };

  // 秒 -> 10:20 / 2小时30分
  U.fmtTime = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return h + ':' + U.pad(m) + ':' + U.pad(s);
    return U.pad(m) + ':' + U.pad(s);
  };

  U.fmtDur = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    if (sec < 60) return sec + ' 秒';
    if (sec < 3600) return Math.floor(sec / 60) + ' 分钟';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return m ? h + ' 小时 ' + m + ' 分' : h + ' 小时';
  };

  U.rand = function (min, max) { return min + Math.random() * (max - min); };
  U.randInt = function (min, max) { return Math.floor(min + Math.random() * (max - min + 1)); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  // 稳定伪随机（同一天同一好友花园内容一致）
  U.seedRand = function (seed) {
    let s = 0;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) | 0;
    s = Math.abs(s) || 1;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };

  /* ---------------- Toast ---------------- */
  U.toast = function (msg, type) {
    const layer = U.$('#toastLayer');
    if (!layer) return;
    const t = doc.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.innerHTML = (type === 'good' ? '<span>✅</span>' : type === 'bad' ? '<span>⚠️</span>' : type === 'gold' ? '<span>✨</span>' : '') +
      '<span>' + U.esc(msg) + '</span>';
    layer.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 260);
    }, 2000);
  };

  /* ---------------- 飘字 ---------------- */
  U.floatText = function (target, text, cls) {
    const layer = U.$('#floatLayer');
    if (!layer) return;
    let rect = { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    if (target && target.getBoundingClientRect) rect = target.getBoundingClientRect();
    const span = doc.createElement('span');
    span.className = 'float-txt' + (cls ? ' ' + cls : '');
    span.textContent = text;
    span.style.left = (rect.left + rect.width / 2 - 24) + 'px';
    span.style.top = (rect.top + rect.height / 3) + 'px';
    layer.appendChild(span);
    setTimeout(function () { span.remove(); }, 1050);
  };

  /* ---------------- 弹窗 ---------------- */
  let modalCloseFn = null;
  U.modal = function (opt) {
    const layer = U.$('#modalLayer');
    if (!layer) return;
    const opts = opt || {};
    layer.innerHTML = '';
    const box = doc.createElement('div');
    box.className = 'modal';
    box.innerHTML =
      '<div class="modal-head"><span>' + (opts.icon || '') + '</span><span>' + U.esc(opts.title || '') + '</span>' +
      '<span class="mh-x" data-close>✕</span></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.footer === false ? '' : '<div class="modal-foot">' + (opts.footer || '<button class="btn btn-primary" data-close>我知道了</button>') + '</div>');
    layer.appendChild(box);
    layer.classList.remove('hidden');

    const close = function () {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      modalCloseFn = null;
      if (typeof opts.onClose === 'function') opts.onClose();
    };
    modalCloseFn = close;
    U.$$('[data-close]', box).forEach(function (b) { b.addEventListener('click', close); });
    layer.onclick = function (e) { if (e.target === layer) close(); };
    if (typeof opts.onMount === 'function') opts.onMount(box, close);
    return close;
  };

  U.closeModal = function () { if (modalCloseFn) modalCloseFn(); };

  U.confirm = function (title, text, onOk, okText) {
    U.modal({
      title: title, icon: '❓',
      body: '<div style="padding:4px 2px;line-height:1.8">' + (text || '') + '</div>',
      footer: '<button class="btn" data-close>取消</button><button class="btn btn-primary" data-act="ok">' + (okText || '确定') + '</button>',
      onMount: function (box, close) {
        U.$('[data-act="ok"]', box).addEventListener('click', function () { close(); onOk && onOk(); });
      }
    });
  };

  /* ---------------- 朗读 ---------------- */
  let voiceReady = false;
  U.speak = function (word) {
    try {
      if (!('speechSynthesis' in window)) { U.toast('当前浏览器不支持语音朗读', 'bad'); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US';
      u.rate = 0.92;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(function (x) { return /en[-_]US/i.test(x.lang); }) ||
        voices.find(function (x) { return /^en/i.test(x.lang); });
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
      voiceReady = true;
    } catch (e) { /* 静默失败 */ }
  };

  // 预加载语音列表
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.getVoices(); } catch (e) { }
  }

  /* ---------------- 下载 ---------------- */
  U.download = function (filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  U.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { U.toast('已复制到剪贴板', 'good'); },
        function () { U.toast('复制失败，请手动选择', 'bad'); });
    } else {
      U.toast('当前环境不支持自动复制', 'bad');
    }
  };

  U.empty = function (text, icon) {
    return '<div class="empty-hint" style="padding:26px 0">' + (icon || '🌾') + '<div style="margin-top:6px">' + U.esc(text) + '</div></div>';
  };

  global.WG = global.WG || {};
  global.WG.util = U;
})(window);
