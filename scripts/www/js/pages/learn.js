/* ============================================================
   单词学习中心：15 种学习模式 + 统计 + 错题本
   所有答对的单词都会发放学习积分（背单词专属货币），
   用于购买种子 / 鱼苗 / 禽畜幼崽 / 果苗，打通农场经济闭环。
   ============================================================ */
(function (global) {
  'use strict';

  const D = global.WG.data;
  const U = global.WG.util;
  const S = global.WG.state;
  const UI = global.WG.ui;
  const page = {};

  /* ---------------- 模式状态 ---------------- */
  const ps = {
    tab: 'recite',
    book: null,
    queue: [],
    qi: 0,
    masked: false,
    // 拼写
    spellValue: '', spellTip: '', spellState: '',
    // 翻转卡
    flipped: false,
    // 四选一（看义选词）
    choiceKey: '', choiceOpts: [], choicePick: '', choiceState: '', choiceTip: '',
    // 看词选义
    en2cnKey: '', en2cnOpts: [], en2cnPick: '', en2cnState: '', en2cnTip: '',
    // 闯关
    quiz: null, qIdx: 0, qScore: 0, qAnswered: false, qChoice: null, qDone: false, fillValue: '', fillTip: '',
    // 连线配对
    matchWords: [], matchLeft: '', matchDone: 0, matchPairs: [],
    // 字母重组
    anaWord: '', anaLetters: [], anaAnswer: [], anaUsed: [], anaState: '', anaTip: '',
    // 英文猜词
    tabooInput: '', tabooState: '', tabooTip: '',
    // 句子填空
    clozeWord: '', clozeSentence: '', clozeOpts: [], clozePick: '', clozeState: '', clozeTip: '',
    // 打地鼠
    moleGrid: [], moleTarget: null, moleScore: 0, moleCombo: 0, moleBest: 0,
    moleLeft: 30, moleStatus: 'idle', moleTimer: null, moleSpawnTimer: null,
    // Wordle
    wdAnswer: null, wdGuesses: [], wdRow: 0, wdInput: '', wdState: 'idle', wdTip: '',
    // 消消乐
    m3Grid: [], m3Sel: null, m3Score: 0, m3Combo: 0, m3Steps: 30, m3Matched: 0,
    // 塔防
    tdMonsters: [], tdAmmo: [], tdScore: 0, tdLives: 5, tdWave: 0, tdStatus: 'idle',
    tdTimer: null, tdSpawnTimer: null, tdSel: null, tdReward: 0
  };

  /* ---------------- 工具函数 ---------------- */
  function bookWords() { return D.BOOK_WORDS[S.get().learn.book] || []; }

  // 取 n 个与 w 不同的单词作为干扰项
  function others(w, n) {
    const pool = bookWords().filter(function (x) { return x.key !== w.key; });
    return U.shuffle(pool).slice(0, n);
  }

  // 生成 4 个中文释义选项（看词选义）
  function buildEn2cnOpts(w) {
    const dist = others(w, 3);
    ps.en2cnOpts = U.shuffle([w].concat(dist)).map(function (x) {
      return { key: x.key, mean: x.mean };
    });
    ps.en2cnKey = w.key;
    ps.en2cnPick = ''; ps.en2cnState = ''; ps.en2cnTip = '';
  }

  // 生成句子填空题（挖空目标词，4 个英文选项）
  function buildCloze(w) {
    const dist = others(w, 3);
    ps.clozeOpts = U.shuffle([w].concat(dist)).map(function (x) { return { key: x.key, word: x.word }; });
    ps.clozeWord = w;
    ps.clozeSentence = makeSentence(w);
    ps.clozePick = ''; ps.clozeState = ''; ps.clozeTip = '';
  }

  // 英文简单描述（不含中文）：首字母 + 长度 + 音标 + 模板句
  function makeTabooHint(w) {
    const len = w.word.replace(/[^a-zA-Z]/g, '').length;
    const first = w.word.charAt(0).toUpperCase();
    let hint = 'Guess the word. It starts with "' + first + '" and has ' + len + ' letters.';
    if (w.phon) hint += ' Phonetic: /' + w.phon + '/.';
    hint += ' Example: ' + makeSentence(w, true);
    return hint;
  }

  // 构造一个带空格的英文例句（blank=true 时把目标词替换为 ____）
  function makeSentence(w, blank) {
    const word = w.word;
    const lower = word.toLowerCase();
    const templates = [
      'The ____ is very important in our daily work.',
      'We need to check the ____ before starting the machine.',
      'This ____ helps us improve efficiency.',
      'Please turn on the ____ now.',
      'The ____ has a problem and needs repair.',
      'A good ____ can save a lot of time.',
      'He is operating the ____ carefully.',
      'The new ____ works very well.'
    ];
    let t = w.example || templates[Math.floor(Math.random() * templates.length)];
    // 把目标词所在位置替换为 ____
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    t = t.replace(re, '____');
    if (blank) {
      // 已经有 ____，保持
    } else {
      t = t.replace('____', word);
    }
    return t;
  }

  // 字母打乱
  function shuffleLetters(word) {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = letters[i]; letters[i] = letters[j]; letters[j] = tmp;
    }
    // 确保打乱后不等于原词
    if (letters.join('') === word && word.length > 1) {
      const t = letters[0]; letters[0] = letters[1]; letters[1] = t;
    }
    return letters;
  }

  // 重置某模式的专属状态
  function resetModeState(mode) {
    ps.masked = false;
    ps.spellValue = ''; ps.spellTip = ''; ps.spellState = '';
    ps.flipped = false;
    ps.choiceKey = ''; ps.choiceOpts = []; ps.choicePick = ''; ps.choiceState = ''; ps.choiceTip = '';
    ps.en2cnKey = ''; ps.en2cnOpts = []; ps.en2cnPick = ''; ps.en2cnState = ''; ps.en2cnTip = '';
    ps.qAnswered = false; ps.qChoice = null; ps.fillValue = ''; ps.fillTip = '';
    ps.matchLeft = ''; ps.matchDone = 0; ps.matchPairs = [];
    ps.anaLetters = []; ps.anaAnswer = []; ps.anaUsed = []; ps.anaState = ''; ps.anaTip = '';
    ps.tabooInput = ''; ps.tabooState = ''; ps.tabooTip = '';
    ps.clozeOpts = []; ps.clozePick = ''; ps.clozeState = ''; ps.clozeTip = '';
    ps.m3Sel = null; ps.m3Matched = 0;
    ps.tdSel = null;
    if (mode !== 'mole') stopMole();
    if (mode !== 'td') stopTd();
    if (mode !== 'wordle') { ps.wdGuesses = []; ps.wdRow = 0; ps.wdInput = ''; ps.wdState = 'idle'; ps.wdAnswer = null; ps.wdTip = ''; }
  }

  function resetQueue(mode) {
    const st = S.get();
    const book = st.learn.book;
    ps.book = book;
    ps.qi = 0;
    if (mode === 'review') {
      let due = S.dueWords(20);
      if (!due.length) due = U.shuffle(S.learnedOfBook(book)).slice(0, 10);
      ps.queue = due;
    } else if (mode === 'match' || mode === 'match3') {
      // 配对 / 消消乐：取 6~8 个词
      const pool = U.shuffle(bookWords());
      ps.queue = pool.slice(0, mode === 'match3' ? 8 : 6);
    } else if (mode === 'mole' || mode === 'td') {
      ps.queue = U.shuffle(bookWords()).slice(0, 12);
    } else if (mode === 'wordle') {
      // Wordle 只用 5 字母单词
      const pool = bookWords().filter(function (w) {
        return /^[a-zA-Z]{5}$/.test(w.word);
      });
      ps.queue = pool.length ? [U.shuffle(pool)[0]] : [];
    } else {
      const learned = st.learn.words;
      let pool = bookWords().filter(function (w) {
        return !(learned[w.key] && learned[w.key].stage > 0);
      });
      if (!pool.length) pool = U.shuffle(S.learnedOfBook(book));
      ps.queue = U.shuffle(pool).slice(0, 20);
    }
    resetModeState(mode);
    // 各模式初始化
    if (mode === 'match') initMatch();
    if (mode === 'anagram' && ps.queue.length) initAnagram(ps.queue[0]);
    if (mode === 'en2cn' && ps.queue.length) buildEn2cnOpts(ps.queue[0]);
    if (mode === 'cloze' && ps.queue.length) buildCloze(ps.queue[0]);
    if (mode === 'wordle' && ps.queue.length) initWordle();
    if (mode === 'match3') initMatch3();
  }

  /* ---------------- 主渲染 ---------------- */
  page.render = function (root) {
    const st = S.get();
    if (ps.book !== st.learn.book) { ps.book = st.learn.book; resetQueue(ps.tab); }
    if (!ps.queue.length && ps.tab !== 'quiz' && ps.tab !== 'mole' && ps.tab !== 'td') resetQueue(ps.tab);

    const book = D.BOOKS.find(function (b) { return b.id === st.learn.book; }) || D.BOOKS[0];
    const learnedInBook = S.learnedOfBook(book.id).length;
    const totalWords = D.BOOKS.reduce(function (a, b) { return a + b.total; }, 0);
    const stats = S.stats();
    const scholarLeft = S.scholarActive() ? (st.learn.scholarBuffUntil - U.now()) / 1000 : 0;
    const tabs = [
      { id: 'recite', name: '📖 背诵', tip: '看词认义' },
      { id: 'flip', name: '🔄 闪卡', tip: '翻转记忆' },
      { id: 'en2cn', name: '🔤 看词选义', tip: '英→中' },
      { id: 'choice', name: '🎯 看义选词', tip: '中→英' },
      { id: 'spell', name: '⌨️ 听音拼写', tip: '听写' },
      { id: 'match', name: '🔗 连线配对', tip: '连连看' },
      { id: 'anagram', name: '🔀 字母重组', tip: '拼词' },
      { id: 'taboo', name: '💡 英文猜词', tip: '英解英' },
      { id: 'cloze', name: '✍️ 句子填空', tip: '语境' },
      { id: 'mole', name: '🔨 打地鼠', tip: '竞速' },
      { id: 'wordle', name: '🟩 Wordle', tip: '猜词' },
      { id: 'match3', name: '🧩 消消乐', tip: '消除' },
      { id: 'td', name: '🏰 单词塔防', tip: '打怪' },
      { id: 'quiz', name: '🏆 闯关', tip: '综合' },
      { id: 'review', name: '🔁 复习', tip: '艾宾浩斯' }
    ];

    root.innerHTML =
      '<div class="page-head"><div class="page-title">📖 单词学习中心</div>' +
      '<div class="page-sub">答题赚积分，是农场 / 鱼塘 / 牧场 / 果园的唯一积分来源 · 共 ' + totalWords + ' 词</div><div class="spacer"></div>' +
      '<button class="btn btn-sm" id="lWrong">📕 错题本（' + stats.wrongCount + '）</button></div>' +

      '<div class="book-bar">' +
      '<select class="select" id="lBook">' + D.BOOKS.map(function (b) {
        return '<option value="' + b.id + '"' + (b.id === book.id ? ' selected' : '') + '>' + b.icon + ' ' + b.name + '（' + b.group + ' · ' + b.total + ' 词）</option>';
      }).join('') + '</select>' +
      '<span class="tag">已掌握 ' + learnedInBook + ' / ' + book.total + '</span>' +
      '<span class="tag ok">今日新词 ' + st.learn.newToday + '/50</span>' +
      '<span class="tag ' + (stats.dueCount ? 'due' : '') + '">待复习 ' + stats.dueCount + '</span>' +
      (scholarLeft > 0 ? '<span class="tag" style="background:#fff0e0;color:#d4940a;border-color:#f0d070">🎓 学霸暴击 ' + U.fmtDur(scholarLeft) + '</span>' : '') +
      '<span style="margin-left:auto;font-size:11.5px;color:#8b968c">正确率 ' + stats.acc + '%</span>' +
      '</div>' +

      '<div class="learn-tabs">' + tabs.map(function (t) {
        return '<button class="ltab' + (ps.tab === t.id ? ' on' : '') + '" data-tab="' + t.id + '" title="' + U.esc(t.tip) + '">' + t.name + '</button>';
      }).join('') + '</div>' +

      '<div id="learnBody">' + renderMode() + '</div>' +

      '<div class="section-gap"></div>' +
      '<div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px" class="learn-bottom">' +
      '<div class="card"><div class="card-title"><span class="ct-ic">📊</span>今日学习看板</div>' +
      '<div class="data-grid">' +
      '<div class="dg-item"><b>' + stats.newToday + '</b><span>今日新词</span></div>' +
      '<div class="dg-item blue"><b>' + stats.reviewToday + '</b><span>今日复习</span></div>' +
      '<div class="dg-item gold"><b>' + st.learn.quizToday + '</b><span>今日闯关</span></div>' +
      '<div class="dg-item pink"><b>' + stats.acc + '%</b><span>累计正确率</span></div>' +
      '<div class="dg-item"><b>' + stats.totalNew + '</b><span>累计背诵</span></div>' +
      '<div class="dg-item blue"><b>' + stats.streak + '</b><span>连续打卡</span></div>' +
      '</div>' +
      '<div class="bar-meta" style="margin-top:10px"><span>学习 Lv' + st.learn.level + ' · ' + S.learnDef().name + '</span>' +
      '<span>' + U.fmtNum(st.learn.exp) + (S.nextLearnLevel() ? ' / ' + S.nextLearnLevel().exp : '') + ' EXP</span></div>' +
      '<div class="bar blue" style="margin-top:5px"><i style="width:' + (S.nextLearnLevel() ? U.clamp(st.learn.exp / S.nextLearnLevel().exp * 100, 0, 100) : 100) + '%"></i></div>' +
      '</div>' +

      '<div class="card"><div class="card-title"><span class="ct-ic">⏰</span>艾宾浩斯复习推荐' +
      '<span class="ct-more" id="lGoReview">去复习 →</span></div>' +
      '<div style="max-height:210px;overflow-y:auto">' + dueListHtml() + '</div></div>' +
      '</div>';

    bind(root);
    if (ps.tab === 'spell' && U.$('#spellInput', root)) U.$('#spellInput', root).focus();
    if (ps.tab === 'taboo' && U.$('#tabooInput', root)) U.$('#tabooInput', root).focus();
    if (ps.tab === 'anagram' && ps.anaState) { /* noop */ }
  };

  function dueListHtml() {
    const due = S.dueWords(12);
    if (!due.length) return U.empty('暂无待复习单词，继续保持！', '🌿');
    return due.map(function (w) {
      return '<div class="st-item info" style="margin-bottom:6px"><span>' + U.esc(w.word) + '</span>' +
        '<span style="color:#8b968c;font-size:11px;flex:1">' + U.esc(w.mean) + '</span>' +
        '<span style="font-size:10px;color:#c67b3f">待复习</span></div>';
    }).join('');
  }

  /* ---------------- 模式分发 ---------------- */
  function renderMode() {
    switch (ps.tab) {
      case 'recite': return renderRecite();
      case 'flip': return renderFlip();
      case 'en2cn': return renderEn2cn();
      case 'choice': return renderChoice();
      case 'spell': return renderSpell();
      case 'match': return renderMatch();
      case 'anagram': return renderAnagram();
      case 'taboo': return renderTaboo();
      case 'cloze': return renderCloze();
      case 'mole': return renderMole();
      case 'wordle': return renderWordle();
      case 'match3': return renderMatch3();
      case 'td': return renderTd();
      case 'quiz': return renderQuiz();
      default: return renderReview();
    }
  }

  function highlight(sentence, word) {
    if (!sentence) return '';
    const safe = U.esc(sentence);
    const re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'gi');
    return safe.replace(re, '<b>$1</b>');
  }

  function wordCard(w, extra) {
    const rec = S.get().learn.words[w.key];
    let stageTxt = '新词';
    if (rec && rec.stage > 0) stageTxt = '复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶';
    else if (rec && rec.stage < 0) stageTxt = '生词待攻克';
    return '<div class="word-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar green"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="ws-word">' + U.esc(w.word) + '</div>' +
      (w.phon ? '<div class="ws-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="ws-meaning' + (ps.masked ? ' masked' : '') + '" id="wsMeaning">' + U.esc(w.mean) + '</div>' +
      (w.example ? '<div class="ws-example">' + highlight(w.example, w.word) + '</div>' : '') +
      extra +
      '</div>';
  }

  function completeCard(text) {
    return '<div class="card" style="text-align:center;padding:34px 20px">' +
      '<div style="font-size:50px">🌳</div>' +
      '<div style="font-size:16px;font-weight:800;margin-top:10px">' + text + '</div>' +
      '<div style="font-size:12px;color:#8b968c;margin-top:8px">换个模式继续学习，或去农场打理作物</div>' +
      '<div class="ws-actions" style="justify-content:center">' +
      '<button class="btn btn-primary btn-sm" data-go="garden">🌻 去花园</button>' +
      '<button class="btn btn-sm" id="restartQueue">🔄 再来一轮</button></div></div>';
  }

  /* ---------- 模式1：背诵 ---------- */
  function renderRecite() {
    if (!ps.queue.length) return completeCard('本词库的新词已经全部背完啦');
    if (ps.qi >= ps.queue.length) return completeCard('本轮背诵完成，休息一下继续下一轮');
    const w = ps.queue[ps.qi];
    return wordCard(w,
      '<div class="ws-actions">' +
      '<button class="btn btn-sm" id="wsMask">' + (ps.masked ? '👁 显示释义' : '🙈 遮挡释义') + '</button>' +
      '<button class="btn btn-primary" id="wsKnow">✅ 我记住了</button>' +
      '<button class="btn" id="wsNo">🤔 不认识</button>' +
      '<button class="btn btn-sm btn-ghost" id="wsSkip">跳过</button>' +
      '</div>' +
      '<div style="font-size:11px;color:#a9b2a6;margin-top:12px">掌握 1 个新词 = +' + D.scalePoint(2) + ' 学习积分 +2 学习经验；复习 1 个旧词 = +' + D.scalePoint(1) + ' 学习积分</div>');
  }

  /* ---------- 模式2：翻转闪卡 ---------- */
  function renderFlip() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮闪卡练习完成，共翻转 ' + ps.queue.length + ' 张卡片');
    const w = ps.queue[ps.qi];
    const rec = S.get().learn.words[w.key];
    const stageTxt = rec && rec.stage > 0 ? ('复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶')
      : (rec && rec.stage < 0 ? '生词待攻克' : '新词');
    return '<div class="word-stage flip-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar green"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="flip-card' + (ps.flipped ? ' flipped' : '') + '" id="flipCard" role="button" tabindex="0" aria-label="翻转单词卡">' +
      '<div class="flip-inner">' +
      '<div class="flip-face flip-front">' +
      '<div class="ff-word">' + U.esc(w.word) + '</div>' +
      (w.phon ? '<div class="ff-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ff-hint">👆 点击卡片，翻到中文释义</div>' +
      '</div>' +
      '<div class="flip-face flip-back">' +
      '<div class="ff-mean">' + U.esc(w.mean) + '</div>' +
      (w.example ? '<div class="ff-ex">' + highlight(w.example, w.word) + '</div>' : '') +
      '<div class="ff-hint">👆 再点一次，翻回英文</div>' +
      '</div>' +
      '</div></div>' +
      '<div class="ws-actions">' +
      '<button class="btn btn-sm" id="wsSound">🔊 听读音</button>' +
      '<button class="btn btn-primary" id="wsKnow">✅ 认识</button>' +
      '<button class="btn" id="wsNo">🤔 不认识</button>' +
      '</div>' +
      '<div class="flip-tip">掌握 1 个新词 = +' + D.scalePoint(2) + ' 学习积分 · 复习旧词按阶段计分</div>' +
      '</div>';
  }

  /* ---------- 模式3：看词选义（英→中） ---------- */
  function renderEn2cn() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮看词选义练习完成，共作答 ' + ps.queue.length + ' 题');
    const w = ps.queue[ps.qi];
    if (ps.en2cnKey !== w.key || ps.en2cnOpts.length !== 4) buildEn2cnOpts(w);
    const rec = S.get().learn.words[w.key];
    const stageTxt = rec && rec.stage > 0 ? ('复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶')
      : (rec && rec.stage < 0 ? '生词待攻克' : '新词');
    return '<div class="word-stage choice-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar gold"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="cq-stem">' + U.esc(w.word) + '</div>' +
      (w.phon ? '<div class="ws-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="cq-opts">' + ps.en2cnOpts.map(function (o, i) {
        let cls = 'cq-opt';
        if (ps.en2cnState) {
          if (o.key === w.key) cls += ' right';
          else if (o.key === ps.en2cnPick) cls += ' wrong';
        }
        return '<button class="' + cls + '" data-en2cn="' + U.esc(o.key) + '"' + (ps.en2cnState ? ' disabled' : '') + '>' +
          '<span class="cq-idx">' + String.fromCharCode(65 + i) + '</span>' + U.esc(o.mean) + '</button>';
      }).join('') + '</div>' +
      (ps.en2cnTip ? '<div class="cq-tip ' + ps.en2cnState + '">' + ps.en2cnTip + '</div>' : '') +
      (ps.en2cnState ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="en2cnNext">' +
        (ps.qi + 1 >= ps.queue.length ? '查看结果' : '下一个 →') + '</button></div>' : '') +
      '<div class="flip-tip">答对 1 题 = +' + D.scalePoint(2) + ' 学习积分（新词）· 复习按阶段计分</div>' +
      '</div>';
  }

  /* ---------- 模式4：看义选词（中→英） ---------- */
  function buildChoice(w) {
    const dist = others(w, 3);
    ps.choiceOpts = U.shuffle([w].concat(dist)).map(function (x) { return { key: x.key, word: x.word }; });
    ps.choiceKey = w.key; ps.choicePick = ''; ps.choiceState = ''; ps.choiceTip = '';
  }
  function renderChoice() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮看义选词练习完成，共作答 ' + ps.queue.length + ' 题');
    const w = ps.queue[ps.qi];
    if (ps.choiceKey !== w.key || ps.choiceOpts.length !== 4) buildChoice(w);
    const rec = S.get().learn.words[w.key];
    const stageTxt = rec && rec.stage > 0 ? ('复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶')
      : (rec && rec.stage < 0 ? '生词待攻克' : '新词');
    return '<div class="word-stage choice-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar gold"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="cq-stem">' + U.esc(w.mean) + '</div>' +
      (w.phon ? '<div class="ws-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="cq-opts">' + ps.choiceOpts.map(function (o, i) {
        let cls = 'cq-opt';
        if (ps.choiceState) {
          if (o.key === w.key) cls += ' right';
          else if (o.key === ps.choicePick) cls += ' wrong';
        }
        return '<button class="' + cls + '" data-choice="' + U.esc(o.key) + '"' + (ps.choiceState ? ' disabled' : '') + '>' +
          '<span class="cq-idx">' + String.fromCharCode(65 + i) + '</span>' + U.esc(o.word) + '</button>';
      }).join('') + '</div>' +
      (ps.choiceTip ? '<div class="cq-tip ' + ps.choiceState + '">' + ps.choiceTip + '</div>' : '') +
      (ps.choiceState ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="choiceNext">' +
        (ps.qi + 1 >= ps.queue.length ? '查看结果' : '下一个 →') + '</button></div>' : '') +
      '<div class="flip-tip">答对 1 题 = +' + D.scalePoint(2) + ' 学习积分（新词）· 复习按阶段计分</div>' +
      '</div>';
  }

  /* ---------- 模式5：听音拼写 ---------- */
  function renderSpell() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮拼写练习完成，共练习 ' + ps.queue.length + ' 个单词');
    const w = ps.queue[ps.qi];
    return '<div class="word-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar blue"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">拼写模式</span></div>' +
      '<div style="font-size:13px;color:#8b968c">听发音，根据释义拼写单词</div>' +
      '<div class="ws-meaning" style="margin-top:12px">' + U.esc(w.mean) + '</div>' +
      (w.phon ? '<div class="ws-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="spell-box">' +
      '<input class="spell-input ' + ps.spellState + '" id="spellInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入英文单词" value="' + U.esc(ps.spellValue) + '">' +
      '<button class="btn btn-primary" id="spellOk">检查</button>' +
      '</div>' +
      (ps.spellTip ? '<div style="margin-top:12px;font-size:12.5px;font-weight:700;color:' + (ps.spellState === 'ok' ? '#4f9e57' : '#c05a44') + '">' + ps.spellTip + '</div>' : '') +
      (ps.spellState ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="spellNext">下一个 →</button></div>' : '') +
      '<div style="font-size:11px;color:#a9b2a6;margin-top:12px">拼写正确判定为掌握：新词 +' + D.scalePoint(2) + ' 学习积分，旧词按复习计分</div>' +
      '</div>';
  }

  /* ---------- 模式6：连线配对 ---------- */
  function initMatch() {
    ps.matchWords = U.shuffle(ps.queue.slice()).slice(0, Math.min(6, ps.queue.length));
    ps.matchPairs = ps.matchWords.map(function (w) { return { key: w.key, done: false }; });
    ps.matchLeft = ''; ps.matchDone = 0;
  }
  function renderMatch() {
    if (!ps.matchWords.length) return completeCard('当前词库单词不足，无法开始配对');
    if (ps.matchDone >= ps.matchWords.length) {
      return '<div class="card" style="text-align:center;padding:34px 20px">' +
        '<div style="font-size:50px">🎉</div>' +
        '<div style="font-size:16px;font-weight:800;margin-top:10px">全部配对完成！</div>' +
        '<div style="font-size:12px;color:#8b968c;margin-top:6px">已掌握 ' + ps.matchDone + ' 个单词，积分已发放到学习积分</div>' +
        '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary btn-sm" id="restartQueue">🔄 再来一轮</button></div></div>';
    }
    const lefts = U.shuffle(ps.matchWords.slice());
    const rights = U.shuffle(ps.matchWords.slice());
    return '<div class="word-stage match-stage">' +
      '<div class="ws-progress"><span>已配对 ' + ps.matchDone + ' / ' + ps.matchWords.length + '</span>' +
      '<div class="bar green"><i style="width:' + (ps.matchDone / ps.matchWords.length * 100) + '%"></i></div>' +
      '<span class="tag">连连看</span></div>' +
      '<div style="font-size:12.5px;color:#8b968c;margin-bottom:10px">先点英文，再点对应的中文释义，配对成功即消除</div>' +
      '<div class="match-board">' +
      '<div class="match-col">' + lefts.map(function (w) {
        const pair = ps.matchPairs.find(function (p) { return p.key === w.key; });
        const done = pair && pair.done;
        const sel = ps.matchLeft === w.key;
        return '<div class="match-item' + (sel ? ' sel' : '') + (done ? ' done' : '') + '" data-mleft="' + U.esc(w.key) + '"' + (done ? '' : '') + '>' +
          '<div class="mi-en">' + U.esc(w.word) + '</div>' +
          (w.phon ? '<div class="mi-phon">' + U.esc(w.phon) + '</div>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<div class="match-col">' + rights.map(function (w) {
        const pair = ps.matchPairs.find(function (p) { return p.key === w.key; });
        const done = pair && pair.done;
        return '<div class="match-item' + (done ? ' done' : '') + '" data-mright="' + U.esc(w.key) + '">' +
          '<div class="mi-cn">' + U.esc(w.mean) + '</div>' +
          '</div>';
      }).join('') + '</div>' +
      '</div>' +
      '<div class="flip-tip">配对成功 = 掌握该词 +' + D.scalePoint(2) + ' 学习积分</div>' +
      '</div>';
  }

  /* ---------- 模式7：字母重组（Anagram） ---------- */
  function initAnagram(w) {
    ps.anaWord = w.word;
    ps.anaLetters = shuffleLetters(w.word);
    ps.anaAnswer = [];
    ps.anaUsed = [];
    ps.anaState = ''; ps.anaTip = '';
  }
  function renderAnagram() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮字母重组完成，共拼出 ' + ps.queue.length + ' 个单词');
    const w = ps.queue[ps.qi];
    if (ps.anaWord !== w.word) initAnagram(w);
    const rec = S.get().learn.words[w.key];
    const stageTxt = rec && rec.stage > 0 ? ('复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶')
      : (rec && rec.stage < 0 ? '生词待攻克' : '新词');
    const answerLen = w.word.length;
    return '<div class="word-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar pink"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="ws-meaning">' + U.esc(w.mean) + '</div>' +
      (w.phon ? '<div class="ws-phon">' + U.esc(w.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="ana-slots">' +
      Array(answerLen).fill(0).map(function (_, i) {
        return '<span class="ana-slot' + (ps.anaState === 'ok' ? ' ok' : ps.anaState === 'bad' ? ' bad' : '') + '">' + (ps.anaAnswer[i] || '') + '</span>';
      }).join('') +
      '</div>' +
      '<div class="ana-letters">' +
      ps.anaLetters.map(function (ch, i) {
        const used = ps.anaUsed.indexOf(i) >= 0;
        return '<button class="ana-letter' + (used ? ' used' : '') + '" data-ana="' + i + '"' + (used ? ' disabled' : '') + '>' + U.esc(ch) + '</button>';
      }).join('') +
      '</div>' +
      (ps.anaTip ? '<div class="cq-tip ' + ps.anaState + '" style="margin-top:12px">' + ps.anaTip + '</div>' : '') +
      '<div class="ws-actions">' +
      '<button class="btn btn-sm" id="anaReset">↩ 重置</button>' +
      '<button class="btn btn-sm" id="anaHint">💡 提示</button>' +
      (ps.anaState ? '<button class="btn btn-primary" id="anaNext">下一个 →</button>' : '') +
      '</div>' +
      '<div style="font-size:11px;color:#a9b2a6;margin-top:12px">拼对 = 掌握该词 +' + D.scalePoint(2) + ' 学习积分</div>' +
      '</div>';
  }

  /* ---------- 模式8：英文猜词（Taboo） ---------- */
  function renderTaboo() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮英文猜词完成，共猜出 ' + ps.queue.length + ' 个单词');
    const w = ps.queue[ps.qi];
    const rec = S.get().learn.words[w.key];
    const stageTxt = rec && rec.stage > 0 ? ('复习第 ' + Math.min(rec.stage + 1, 6) + ' 阶')
      : (rec && rec.stage < 0 ? '生词待攻克' : '新词');
    return '<div class="word-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar blue"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">' + stageTxt + '</span></div>' +
      '<div class="taboo-hint">' + makeTabooHint(w) + '</div>' +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="spell-box">' +
      '<input class="spell-input ' + ps.tabooState + '" id="tabooInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入你猜到的英文单词" value="' + U.esc(ps.tabooInput) + '">' +
      '<button class="btn btn-primary" id="tabooOk">提交</button>' +
      '</div>' +
      (ps.tabooTip ? '<div style="margin-top:12px;font-size:12.5px;font-weight:700;color:' + (ps.tabooState === 'ok' ? '#4f9e57' : '#c05a44') + '">' + ps.tabooTip + '</div>' : '') +
      (ps.tabooState ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="tabooNext">下一个 →</button></div>' : '') +
      '<div style="font-size:11px;color:#a9b2a6;margin-top:12px">用英文理解英文，猜出单词 = +' + D.scalePoint(2) + ' 学习积分</div>' +
      '</div>';
  }

  /* ---------- 模式9：句子填空 ---------- */
  function renderCloze() {
    if (!ps.queue.length) return completeCard('当前词库暂无可练习的单词');
    if (ps.qi >= ps.queue.length) return completeCard('本轮句子填空完成，共作答 ' + ps.queue.length + ' 题');
    const w = ps.queue[ps.qi];
    if (ps.clozeWord !== w) buildCloze(w);
    return '<div class="word-stage choice-stage">' +
      '<div class="ws-progress"><span>' + (ps.qi + 1) + ' / ' + ps.queue.length + '</span>' +
      '<div class="bar gold"><i style="width:' + ((ps.qi + 1) / ps.queue.length * 100) + '%"></i></div>' +
      '<span class="tag">句子填空</span></div>' +
      '<div class="cloze-sentence">' + U.esc(ps.clozeSentence) + '</div>' +
      '<div class="cq-opts">' + ps.clozeOpts.map(function (o, i) {
        let cls = 'cq-opt';
        if (ps.clozeState) {
          if (o.key === w.key) cls += ' right';
          else if (o.key === ps.clozePick) cls += ' wrong';
        }
        return '<button class="' + cls + '" data-cloze="' + U.esc(o.key) + '"' + (ps.clozeState ? ' disabled' : '') + '>' +
          '<span class="cq-idx">' + String.fromCharCode(65 + i) + '</span>' + U.esc(o.word) + '</button>';
      }).join('') + '</div>' +
      (ps.clozeTip ? '<div class="cq-tip ' + ps.clozeState + '">' + ps.clozeTip + '</div>' : '') +
      (ps.clozeState ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="clozeNext">' +
        (ps.qi + 1 >= ps.queue.length ? '查看结果' : '下一个 →') + '</button></div>' : '') +
      '<div class="flip-tip">选对 = +' + D.scalePoint(2) + ' 学习积分 · 学会在句子里使用单词</div>' +
      '</div>';
  }

  /* ---------- 模式10：打地鼠 ---------- */
  function stopMole() {
    if (ps.moleTimer) { clearInterval(ps.moleTimer); ps.moleTimer = null; }
    if (ps.moleSpawnTimer) { clearInterval(ps.moleSpawnTimer); ps.moleSpawnTimer = null; }
  }
  function startMole() {
    ps.moleStatus = 'playing';
    ps.moleScore = 0; ps.moleCombo = 0; ps.moleBest = 0; ps.moleLeft = 30;
    ps.moleGrid = Array(9).fill(null);
    ps.moleTarget = pickRandomWord();
    spawnMole();
    ps.moleSpawnTimer = setInterval(function () {
      if (ps.moleStatus !== 'playing') return;
      spawnMole();
    }, 900);
    ps.moleTimer = setInterval(function () {
      if (ps.moleStatus !== 'playing') return;
      ps.moleLeft--;
      if (ps.moleLeft <= 0) {
        stopMole();
        ps.moleStatus = 'done';
        const bonus = ps.moleScore > 0 ? S.addLearnPoints(Math.min(ps.moleScore * 0.3, 15), true) : 0;
        S.save();
        if (bonus > 0) U.toast('打地鼠奖励 +' + bonus + ' 学习积分', 'gold');
      }
      UI.refresh();
    }, 1000);
  }
  function pickRandomWord() {
    return ps.queue[Math.floor(Math.random() * ps.queue.length)];
  }
  function spawnMole() {
    // 在空格子随机生成，最多同时 5 个
    const empty = [];
    for (let i = 0; i < 9; i++) if (!ps.moleGrid[i]) empty.push(i);
    if (empty.length === 0) return;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    // 30% 概率生成目标词，70% 生成干扰词
    const isTarget = Math.random() < 0.4;
    let w;
    if (isTarget) {
      w = ps.moleTarget;
    } else {
      const dist = ps.queue.filter(function (x) { return x.key !== ps.moleTarget.key; });
      w = dist.length ? dist[Math.floor(Math.random() * dist.length)] : ps.moleTarget;
    }
    // 50% 显示英文，50% 显示中文
    const showEn = Math.random() < 0.5;
    ps.moleGrid[idx] = { key: w.key, word: w.word, mean: w.mean, showEn: showEn, target: w.key === ps.moleTarget.key, life: 2.5 };
  }
  function renderMole() {
    if (ps.moleStatus === 'idle') {
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">🔨</div>' +
        '<div style="font-size:17px;font-weight:800;margin-top:8px">单词打地鼠</div>' +
        '<div style="font-size:12.5px;color:#8b968c;margin-top:6px;line-height:1.9">屏幕上会弹出单词或释义，目标提示告诉你要点哪个。<br>快速点击匹配的地鼠，30 秒内连击越多积分越高！</div>' +
        '<button class="btn btn-primary" id="moleStart" style="margin-top:16px">开始游戏</button></div>';
    }
    if (ps.moleStatus === 'done') {
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">' + (ps.moleScore >= 15 ? '🏆' : ps.moleScore >= 8 ? '🎉' : '💪') + '</div>' +
        '<div style="font-size:20px;font-weight:800;margin-top:8px">得分 ' + ps.moleScore + ' · 最高连击 ' + ps.moleBest + '</div>' +
        '<div style="font-size:13px;color:#8b968c;margin-top:6px">积分奖励已发放到学习积分，答对的单词也计入掌握</div>' +
        '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary" id="moleStart">再来一局</button></div></div>';
    }
    const target = ps.moleTarget;
    return '<div class="mole-stage">' +
      '<div class="mole-bar">' +
      '<span class="tag">目标：' + U.esc(target.mean) + '</span>' +
      '<span>⏱ ' + ps.moleLeft + 's</span>' +
      '<span>🎯 ' + ps.moleScore + '</span>' +
      '<span>🔥 连击 ' + ps.moleCombo + '</span>' +
      '</div>' +
      '<div class="mole-grid">' +
      ps.moleGrid.map(function (m, i) {
        if (!m) return '<div class="mole-hole" data-hole="' + i + '"></div>';
        return '<div class="mole-hole active' + (m.target ? ' target' : '') + '" data-hole="' + i + '">' +
          '<div class="mole-content">' + (m.showEn ? U.esc(m.word) : U.esc(m.mean)) + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<div style="font-size:11px;color:#8b968c;margin-top:10px;text-align:center">点击与目标「' + U.esc(target.mean) + '」匹配的地鼠（不管显示的是英文还是中文）</div>' +
      '</div>';
  }

  /* ---------- 模式11：Wordle ---------- */
  function initWordle() {
    ps.wdAnswer = ps.queue[0];
    ps.wdGuesses = [];
    ps.wdRow = 0;
    ps.wdInput = '';
    ps.wdState = 'playing';
    ps.wdTip = '';
  }
  function wordleEval(guess, answer) {
    const g = guess.toLowerCase().split('');
    const a = answer.toLowerCase().split('');
    const res = Array(g.length).fill('absent');
    const used = Array(a.length).fill(false);
    // 先标 green
    for (let i = 0; i < g.length; i++) {
      if (g[i] === a[i]) { res[i] = 'correct'; used[i] = true; }
    }
    // 再标 yellow
    for (let i = 0; i < g.length; i++) {
      if (res[i] === 'correct') continue;
      for (let j = 0; j < a.length; j++) {
        if (!used[j] && g[i] === a[j]) { res[i] = 'present'; used[j] = true; break; }
      }
    }
    return res;
  }
  function renderWordle() {
    if (!ps.wdAnswer) {
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">🟩</div>' +
        '<div style="font-size:17px;font-weight:800;margin-top:8px">Wordle 猜词</div>' +
        '<div style="font-size:12.5px;color:#8b968c;margin-top:6px;line-height:1.9">根据中文释义，6 次机会猜出 5 字母单词。<br>绿色 = 字母和位置都对；黄色 = 字母对位置错；灰色 = 字母不存在。</div>' +
        '<button class="btn btn-primary" id="wdStart" style="margin-top:16px">开始猜词</button></div>';
    }
    const answer = ps.wdAnswer;
    const done = ps.wdState === 'won' || ps.wdState === 'lost';
    return '<div class="wordle-stage">' +
      '<div class="ws-progress"><span>第 ' + (ps.wdRow + (done ? 0 : 1)) + ' / 6 次</span>' +
      '<div class="bar green"><i style="width:' + Math.min(ps.wdRow, 6) / 6 * 100 + '%"></i></div>' +
      '<span class="tag">Wordle</span></div>' +
      '<div class="wd-mean">释义：' + U.esc(answer.mean) + '</div>' +
      (answer.phon ? '<div class="ws-phon">' + U.esc(answer.phon) + '</div>' : '') +
      '<div class="ws-sound" id="wsSound">🔊 听读音</div>' +
      '<div class="wd-grid">' +
      Array(6).fill(0).map(function (_, r) {
        const guess = ps.wdGuesses[r];
        const ev = guess ? wordleEval(guess, answer.word) : null;
        return '<div class="wd-row">' +
          Array(5).fill(0).map(function (_, c) {
            const ch = guess ? guess[c] : '';
            const cls = ev ? 'wd-cell ' + ev[c] : 'wd-cell';
            return '<div class="' + cls + '">' + (ch ? ch.toUpperCase() : '') + '</div>';
          }).join('') +
          '</div>';
      }).join('') +
      '</div>' +
      (!done ? '<div class="spell-box" style="margin:14px auto 0">' +
        '<input class="spell-input" id="wdInput" maxlength="5" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入 5 个字母" value="' + U.esc(ps.wdInput) + '">' +
        '<button class="btn btn-primary" id="wdGuess">猜</button>' +
        '</div>' : '') +
      (ps.wdTip ? '<div class="cq-tip" style="margin-top:12px;color:' + (ps.wdState === 'won' ? '#4f9e57' : ps.wdState === 'lost' ? '#c05a44' : '#8b968c') + '">' + ps.wdTip + '</div>' : '') +
      (done ? '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary btn-sm" id="wdStart">再来一题</button></div>' : '') +
      '<div style="font-size:11px;color:#a9b2a6;margin-top:12px;text-align:center">猜对 = 掌握该词 +' + D.scalePoint(3) + ' 学习积分；猜错也计入生词本</div>' +
      '</div>';
  }

  /* ---------- 模式12：单词消消乐 ---------- */
  function initMatch3() {
    const pairs = ps.queue.slice(0, 6);
    const cells = [];
    pairs.forEach(function (w) {
      cells.push({ key: w.key, type: 'en', text: w.word, matched: false });
      cells.push({ key: w.key, type: 'cn', text: w.mean, matched: false });
    });
    // 6x6 = 36 格，12 个词块，其余为空
    const grid = Array(36).fill(null);
    const positions = U.shuffle(Array(36).fill(0).map(function (_, i) { return i; }));
    cells.forEach(function (c, i) {
      grid[positions[i]] = c;
    });
    ps.m3Grid = grid;
    ps.m3Sel = null;
    ps.m3Score = 0; ps.m3Combo = 0; ps.m3Steps = 30; ps.m3Matched = 0;
  }
  function m3Adjacent(a, b) {
    const ra = Math.floor(a / 6), ca = a % 6;
    const rb = Math.floor(b / 6), cb = b % 6;
    return (Math.abs(ra - rb) + Math.abs(ca - cb)) === 1;
  }
  function renderMatch3() {
    if (!ps.m3Grid.length) initMatch3();
    const remaining = ps.m3Grid.filter(function (c) { return c && !c.matched; }).length;
    if (remaining === 0 || ps.m3Steps <= 0) {
      const win = remaining === 0;
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">' + (win ? '🏆' : '😅') + '</div>' +
        '<div style="font-size:20px;font-weight:800;margin-top:8px">' + (win ? '全部消除！' : '步数用完了') + '</div>' +
        '<div style="font-size:13px;color:#8b968c;margin-top:6px">得分 ' + ps.m3Score + ' · 消除 ' + ps.m3Matched / 2 + ' 对 · 积分已发放</div>' +
        '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary" id="restartQueue">🔄 再来一局</button></div></div>';
    }
    return '<div class="word-stage">' +
      '<div class="ws-progress"><span>步数 ' + ps.m3Steps + '</span>' +
      '<div class="bar gold"><i style="width:' + (ps.m3Steps / 30 * 100) + '%"></i></div>' +
      '<span class="tag">得分 ' + ps.m3Score + ' · 连击 ' + ps.m3Combo + '</span></div>' +
      '<div style="font-size:12px;color:#8b968c;margin-bottom:10px">点击相邻的英文和中文释义配对消除，连续消除触发连击加分</div>' +
      '<div class="m3-grid">' +
      ps.m3Grid.map(function (c, i) {
        if (!c) return '<div class="m3-cell empty" data-m3="' + i + '"></div>';
        const sel = ps.m3Sel === i;
        return '<div class="m3-cell ' + c.type + (sel ? ' sel' : '') + (c.matched ? ' matched' : '') + '" data-m3="' + i + '">' +
          '<span>' + U.esc(c.text) + '</span></div>';
      }).join('') +
      '</div>' +
      '<div class="flip-tip">成功配对 = 掌握该词 +' + D.scalePoint(1.5) + ' 学习积分 · 连击额外加分</div>' +
      '</div>';
  }

  /* ---------- 模式13：单词塔防 ---------- */
  function stopTd() {
    if (ps.tdTimer) { clearInterval(ps.tdTimer); ps.tdTimer = null; }
    if (ps.tdSpawnTimer) { clearInterval(ps.tdSpawnTimer); ps.tdSpawnTimer = null; }
  }
  function startTd() {
    ps.tdMonsters = [];
    ps.tdAmmo = U.shuffle(ps.queue.slice()).slice(0, 6);
    ps.tdScore = 0; ps.tdLives = 5; ps.tdWave = 0; ps.tdReward = 0;
    ps.tdStatus = 'playing'; ps.tdSel = null;
    ps.tdSpawnTimer = setInterval(function () {
      if (ps.tdStatus !== 'playing') return;
      spawnTdMonster();
    }, 2200);
    ps.tdTimer = setInterval(function () {
      if (ps.tdStatus !== 'playing') return;
      ps.tdMonsters.forEach(function (m) { m.pos += m.speed; });
      // 到终点
      for (let i = ps.tdMonsters.length - 1; i >= 0; i--) {
        if (ps.tdMonsters[i].pos >= 100) {
          ps.tdLives--;
          ps.tdReward = Math.max(0, ps.tdReward - 2);
          ps.tdMonsters.splice(i, 1);
          if (ps.tdLives <= 0) {
            stopTd(); ps.tdStatus = 'done';
            const r = S.addLearnPoints(ps.tdReward, true);
            S.save();
            U.toast('塔防结束，奖励 ' + r + ' 学习积分', 'gold');
          }
        }
      }
      UI.refresh();
    }, 300);
    spawnTdMonster();
  }
  function spawnTdMonster() {
    const w = ps.queue[Math.floor(Math.random() * ps.queue.length)];
    ps.tdMonsters.push({ key: w.key, word: w.word, mean: w.mean, pos: 0, speed: 1.5 + Math.random() * 1.5 });
  }
  function renderTd() {
    if (ps.tdStatus === 'idle') {
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">🏰</div>' +
        '<div style="font-size:17px;font-weight:800;margin-top:8px">单词塔防</div>' +
        '<div style="font-size:12.5px;color:#8b968c;margin-top:6px;line-height:1.9">怪物身上写着中文释义，从左向右走。<br>先点下方英文单词（弹药），再点怪物消灭它。<br>选对 = 消灭 + 积分；选错 = 怪物继续前进，到终点扣生命。</div>' +
        '<button class="btn btn-primary" id="tdStart" style="margin-top:16px">开始防御</button></div>';
    }
    if (ps.tdStatus === 'done') {
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">' + (ps.tdLives > 0 ? '🏆' : '💀') + '</div>' +
        '<div style="font-size:20px;font-weight:800;margin-top:8px">消灭 ' + ps.tdScore + ' 只怪物</div>' +
        '<div style="font-size:13px;color:#8b968c;margin-top:6px">奖励 ' + ps.tdReward + ' 学习积分已发放，答对的单词计入掌握</div>' +
        '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary" id="tdStart">再来一局</button></div></div>';
    }
    return '<div class="td-stage">' +
      '<div class="td-bar">' +
      '<span>❤️ ' + ps.tdLives + '</span>' +
      '<span>🎯 ' + ps.tdScore + '</span>' +
      '<span>💰 奖励 ' + ps.tdReward + '</span>' +
      '</div>' +
      '<div class="td-field">' +
      ps.tdMonsters.map(function (m) {
        return '<div class="td-monster" data-mon="' + U.esc(m.key) + '" style="left:' + m.pos + '%">' +
          '<div class="tdm-emoji">👾</div>' +
          '<div class="tdm-mean">' + U.esc(m.mean) + '</div>' +
          '</div>';
      }).join('') +
      '<div class="td-castle">🏰</div>' +
      '</div>' +
      '<div class="td-ammo">' +
      (ps.tdSel ? '<div style="font-size:12px;color:#4f9e57;margin-bottom:6px">已选择：<b>' + ps.tdSel.word + '</b>，点击怪物发射</div>' : '<div style="font-size:12px;color:#8b968c;margin-bottom:6px">选择一个英文单词作为弹药</div>') +
      ps.tdAmmo.map(function (w) {
        return '<button class="td-ammo-btn' + (ps.tdSel && ps.tdSel.key === w.key ? ' sel' : '') + '" data-ammo="' + U.esc(w.key) + '">' + U.esc(w.word) + '</button>';
      }).join('') +
      '</div>' +
      '</div>';
  }

  /* ---------- 模式14：闯关 ---------- */
  function renderQuiz() {
    if (!ps.quiz) {
      const canQuiz = S.get().learn.level >= 2;
      return '<div class="card" style="text-align:center;padding:34px 20px">' +
        '<div style="font-size:52px">🏆</div>' +
        '<div style="font-size:17px;font-weight:800;margin-top:8px">单词闯关</div>' +
        '<div style="font-size:12.5px;color:#8b968c;margin-top:6px;line-height:1.9">随机抽取 10 道题（选择 / 填空 / 判断）<br>' +
        '全对 +' + D.scalePoint(15) + ' 学习积分 +15 学习经验；正确率 80% 以上 +' + D.scalePoint(10) + ' 学习积分 +10 学习经验</div>' +
        '<div style="margin-top:8px;font-size:11.5px;color:#8b968c">今日已完成 ' + S.get().learn.quizToday + ' 轮 · 可用次数 ' +
        Math.max(0, 3 + S.buffs().quizBonus - S.get().learn.quizToday) + '</div>' +
        '<button class="btn btn-primary" id="quizStart" style="margin-top:16px" ' + (canQuiz ? '' : 'disabled') + '>' +
        (canQuiz ? '开始闯关' : '学习 Lv2 解锁闯关模式') + '</button></div>';
    }
    if (ps.qDone) {
      const rate = Math.round(ps.qScore / ps.quiz.length * 100);
      return '<div class="card" style="text-align:center;padding:30px 20px">' +
        '<div style="font-size:52px">' + (rate >= 100 ? '🥇' : rate >= 80 ? '🎉' : '💪') + '</div>' +
        '<div style="font-size:20px;font-weight:800;margin-top:8px">' + ps.qScore + ' / ' + ps.quiz.length + ' 正确 · ' + rate + '%</div>' +
        '<div style="font-size:13px;color:#8b968c;margin-top:6px">' + (ps.rewardText || '继续加油，正确率 80% 以上才有积分奖励') + '</div>' +
        '<div class="ws-actions" style="justify-content:center"><button class="btn btn-primary" id="quizAgain">再来一轮</button>' +
        '<button class="btn" id="quizBack">返回</button></div></div>';
    }
    const q = ps.quiz[ps.qIdx];
    let body = '';
    if (q.type === 'choice') {
      body = '<div class="q-stem">' + U.esc(q.stem) + '<small>' + U.esc(q.sub) + '</small></div>' +
        '<div class="q-opts">' + q.opts.map(function (o) {
          let cls = 'q-opt';
          if (ps.qAnswered) {
            if (o === q.answer) cls += ' right';
            else if (o === ps.qChoice) cls += ' wrong';
          }
          return '<button class="' + cls + '" data-opt="' + U.esc(o) + '"' + (ps.qAnswered ? ' disabled' : '') + '>' + U.esc(o) + '</button>';
        }).join('') + '</div>';
    } else if (q.type === 'fill') {
      body = '<div class="q-stem">' + U.esc(q.stem) + '<small>' + U.esc(q.sub) + '</small></div>' +
        '<div class="spell-box" style="margin:18px auto 0">' +
        '<input class="spell-input" id="fillInput" autocomplete="off" spellcheck="false" placeholder="拼写单词" value="' + U.esc(ps.fillValue) + '"' + (ps.qAnswered ? ' disabled' : '') + '>' +
        (ps.qAnswered ? '' : '<button class="btn btn-primary" id="fillOk">提交</button>') +
        '</div>' +
        (ps.qAnswered ? '<div style="text-align:center;margin-top:14px;font-size:13px;font-weight:700;color:' + (ps.fillTip === 'right' ? '#4f9e57' : '#c05a44') + '">' +
          (ps.fillTip === 'right' ? '✅ 回答正确' : '❌ 正确答案：' + U.esc(q.answer)) + '</div>' : '');
    } else {
      body = '<div class="q-stem">' + U.esc(q.stem) + '<small style="line-height:1.7">' + U.esc(q.sub) + '</small></div>' +
        '<div class="q-opts" style="flex-direction:row;justify-content:center">' +
        ['正确', '错误'].map(function (o) {
          let cls = 'q-opt';
          if (ps.qAnswered) {
            if ((o === '正确') === q.answer) cls += ' right';
            else if (o === ps.qChoice) cls += ' wrong';
          }
          return '<button class="' + cls + '" style="flex:1;text-align:center" data-judge="' + o + '"' + (ps.qAnswered ? ' disabled' : '') + '>' + o + '</button>';
        }).join('') + '</div>';
    }
    return '<div class="quiz-wrap"><div class="quiz-bar"><span>第 ' + (ps.qIdx + 1) + ' / ' + ps.quiz.length + ' 题</span>' +
      '<div class="bar gold"><i style="width:' + ((ps.qIdx + 1) / ps.quiz.length * 100) + '%"></i></div>' +
      '<span>得分 ' + ps.qScore + '</span></div>' +
      '<div class="q-card">' + body +
      (ps.qAnswered ? '<div class="ws-actions"><button class="btn btn-primary btn-sm" id="quizNext">' + (ps.qIdx + 1 >= ps.quiz.length ? '查看结果' : '下一题 →') + '</button></div>' : '') +
      '</div></div>';
  }

  /* ---------- 模式15：复习 ---------- */
  function renderReview() {
    if (!ps.queue.length) return completeCard('暂时没有需要复习的单词，去背新词吧');
    if (ps.qi >= ps.queue.length) return completeCard('本轮复习完成，记忆更牢固了');
    const w = ps.queue[ps.qi];
    return wordCard(w,
      '<div class="ws-actions">' +
      '<button class="btn btn-sm" id="wsMask">' + (ps.masked ? '👁 显示释义' : '🙈 遮挡释义') + '</button>' +
      '<button class="btn btn-blue" id="wsKnow">🔁 记得（复习 +' + D.scalePoint(1) + ' 学习积分）</button>' +
      '<button class="btn" id="wsNo">😵 忘了，稍后再来</button>' +
      '</div>' +
      (S.get().reviewBuffUntil > U.now() ? '<div style="font-size:11px;color:#e2698b;margin-top:10px">复习加倍卡生效中，复习积分 ×2</div>' : ''));
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind(root) {
    U.$('#lBook', root).addEventListener('change', function (e) {
      S.get().learn.book = e.target.value;
      S.save();
      ps.book = e.target.value;
      resetQueue(ps.tab);
      UI.refresh();
    });
    U.$$('[data-tab]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        ps.tab = b.dataset.tab;
        resetQueue(ps.tab);
        ps.quiz = null; ps.qDone = false;
        UI.refresh();
      });
    });
    U.$('#lWrong', root).addEventListener('click', wrongModal);
    const goRev = U.$('#lGoReview', root);
    if (goRev) goRev.addEventListener('click', function () { ps.tab = 'review'; resetQueue('review'); UI.refresh(); });

    const goBtn = U.$('[data-go="garden"]', root);
    if (goBtn) goBtn.addEventListener('click', function () { UI.go('garden'); });
    const restart = U.$('#restartQueue', root);
    if (restart) restart.addEventListener('click', function () { resetQueue(ps.tab); UI.refresh(); });

    const sound = U.$('#wsSound', root);
    if (sound) sound.addEventListener('click', function () {
      const w = ps.queue[ps.qi] || ps.wdAnswer;
      if (w) U.speak(w.word);
    });
    const mask = U.$('#wsMask', root);
    if (mask) mask.addEventListener('click', function () { ps.masked = !ps.masked; UI.refresh(); });

    // 翻转卡
    const flipCard = U.$('#flipCard', root);
    if (flipCard) {
      const doFlip = function () { ps.flipped = !ps.flipped; UI.refresh(); };
      flipCard.addEventListener('click', doFlip);
      flipCard.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFlip(); }
      });
    }

    // 看词选义
    U.$$('[data-en2cn]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.en2cnState) return;
        const w = ps.queue[ps.qi];
        if (!w) return;
        const right = b.dataset.en2cn === w.key;
        ps.en2cnPick = b.dataset.en2cn;
        ps.en2cnState = right ? 'ok' : 'bad';
        const r = S.learnWord(w.key, right, 'en2cn');
        ps.en2cnTip = right ? '✅ 回答正确！' + (r.msg || '') : '❌ 正确答案：' + w.mean;
        if (right) U.toast(r.msg || '回答正确', 'good');
        UI.refresh();
      });
    });
    const en2cnNext = U.$('#en2cnNext', root);
    if (en2cnNext) en2cnNext.addEventListener('click', nextWord);

    // 看义选词
    U.$$('[data-choice]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.choiceState) return;
        const w = ps.queue[ps.qi];
        if (!w) return;
        const right = b.dataset.choice === w.key;
        ps.choicePick = b.dataset.choice;
        ps.choiceState = right ? 'ok' : 'bad';
        const r = S.learnWord(w.key, right, 'choice');
        ps.choiceTip = right ? '✅ 回答正确！' + (r.msg || '') : '❌ 正确答案是「' + w.word + '」 · ' + w.mean;
        if (right) U.toast(r.msg || '回答正确', 'good');
        UI.refresh();
      });
    });
    const choiceNext = U.$('#choiceNext', root);
    if (choiceNext) choiceNext.addEventListener('click', nextWord);

    // 背诵 / 复习
    const know = U.$('#wsKnow', root);
    const no = U.$('#wsNo', root);
    const skip = U.$('#wsSkip', root);
    if (know) know.addEventListener('click', function () { mark(true); });
    if (no) no.addEventListener('click', function () { mark(false); });
    if (skip) skip.addEventListener('click', function () { ps.qi++; ps.masked = false; UI.refresh(); });

    // 拼写
    const spellInput = U.$('#spellInput', root);
    if (spellInput) {
      spellInput.addEventListener('input', function () { ps.spellValue = spellInput.value; });
      spellInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkSpell(); });
      const ok = U.$('#spellOk', root);
      if (ok) ok.addEventListener('click', checkSpell);
      const next = U.$('#spellNext', root);
      if (next) next.addEventListener('click', function () {
        ps.qi++; ps.spellValue = ''; ps.spellTip = ''; ps.spellState = '';
        if (ps.qi >= ps.queue.length) resetQueue('spell');
        UI.refresh();
      });
    }

    // 连线配对
    U.$$('[data-mleft]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const key = b.dataset.mleft;
        const pair = ps.matchPairs.find(function (p) { return p.key === key; });
        if (pair && pair.done) return;
        ps.matchLeft = key;
        UI.refresh();
      });
    });
    U.$$('[data-mright]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!ps.matchLeft) { U.toast('请先点左边的英文', 'bad'); return; }
        const key = b.dataset.mright;
        const pair = ps.matchPairs.find(function (p) { return p.key === key; });
        if (pair && pair.done) return;
        if (ps.matchLeft === key) {
          pair.done = true;
          ps.matchDone++;
          const w = ps.matchWords.find(function (x) { return x.key === key; });
          S.learnWord(key, true, 'match');
          U.toast('配对成功 +' + D.scalePoint(2) + ' 学习积分', 'good');
        } else {
          U.toast('配对错误，再想想', 'bad');
        }
        ps.matchLeft = '';
        UI.refresh();
      });
    });

    // 字母重组
    U.$$('[data-ana]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.anaState) return;
        const idx = Number(b.dataset.ana);
        if (ps.anaUsed.indexOf(idx) >= 0) return;
        const ch = ps.anaLetters[idx];
        ps.anaUsed.push(idx);
        ps.anaAnswer.push(ch);
        UI.refresh();
      });
    });
    const anaReset = U.$('#anaReset', root);
    if (anaReset) anaReset.addEventListener('click', function () { ps.anaAnswer = []; ps.anaUsed = []; ps.anaState = ''; ps.anaTip = ''; UI.refresh(); });
    const anaHint = U.$('#anaHint', root);
    if (anaHint) anaHint.addEventListener('click', function () {
      const w = ps.queue[ps.qi];
      U.toast('提示：首字母是 ' + w.word.charAt(0).toUpperCase(), 'info');
    });
    // 当答案填满自动检查
    if (ps.tab === 'anagram' && ps.anaLetters.length > 0 && ps.anaAnswer.length === ps.anaLetters.length && !ps.anaState) {
      const w = ps.queue[ps.qi];
      if (!w) return;
      const guess = ps.anaAnswer.join('').toLowerCase();
      if (guess === w.word.toLowerCase()) {
        const r = S.learnWord(w.key, true, 'anagram');
        ps.anaState = 'ok';
        ps.anaTip = '✅ 拼对了！' + (r.msg || '');
      } else {
        S.learnWord(w.key, false, 'anagram');
        ps.anaState = 'bad';
        ps.anaTip = '❌ 正确拼写：' + w.word;
      }
      UI.refresh();
    }
    const anaNext = U.$('#anaNext', root);
    if (anaNext) anaNext.addEventListener('click', nextWord);

    // 英文猜词
    const tabooInput = U.$('#tabooInput', root);
    if (tabooInput) {
      tabooInput.addEventListener('input', function () { ps.tabooInput = tabooInput.value; });
      tabooInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkTaboo(); });
    }
    const tabooOk = U.$('#tabooOk', root);
    if (tabooOk) tabooOk.addEventListener('click', checkTaboo);
    const tabooNext = U.$('#tabooNext', root);
    if (tabooNext) tabooNext.addEventListener('click', nextWord);

    // 句子填空
    U.$$('[data-cloze]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.clozeState) return;
        const w = ps.queue[ps.qi];
        if (!w) return;
        const right = b.dataset.cloze === w.key;
        ps.clozePick = b.dataset.cloze;
        ps.clozeState = right ? 'ok' : 'bad';
        const r = S.learnWord(w.key, right, 'cloze');
        ps.clozeTip = right ? '✅ 填对了！' + (r.msg || '') : '❌ 正确答案：' + w.word;
        if (right) U.toast(r.msg || '填对了', 'good');
        UI.refresh();
      });
    });
    const clozeNext = U.$('#clozeNext', root);
    if (clozeNext) clozeNext.addEventListener('click', nextWord);

    // 打地鼠
    const moleStart = U.$('#moleStart', root);
    if (moleStart) moleStart.addEventListener('click', function () { startMole(); UI.refresh(); });
    U.$$('[data-hole]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.moleStatus !== 'playing') return;
        const idx = Number(b.dataset.hole);
        const m = ps.moleGrid[idx];
        if (!m) return;
        if (m.target) {
          ps.moleScore++;
          ps.moleCombo++;
          ps.moleBest = Math.max(ps.moleBest, ps.moleCombo);
          ps.tdReward = ps.tdReward; // noop
          // 掌握该词
          S.learnWord(m.key, true, 'mole');
          if (ps.moleCombo > 0 && ps.moleCombo % 5 === 0) {
            S.addLearnPoints(2, true);
            S.save();
            U.toast('🔥 ' + ps.moleCombo + ' 连击！+2 学习积分', 'gold');
          }
          // 换一个新目标
          ps.moleTarget = pickRandomWord();
        } else {
          ps.moleCombo = 0;
        }
        ps.moleGrid[idx] = null;
        UI.refresh();
      });
    });

    // Wordle
    const wdStart = U.$('#wdStart', root);
    if (wdStart) wdStart.addEventListener('click', function () { resetQueue('wordle'); UI.refresh(); });
    const wdInput = U.$('#wdInput', root);
    if (wdInput) {
      wdInput.addEventListener('input', function () { ps.wdInput = wdInput.value; });
      wdInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') guessWordle(); });
    }
    const wdGuess = U.$('#wdGuess', root);
    if (wdGuess) wdGuess.addEventListener('click', guessWordle);

    // 消消乐
    U.$$('[data-m3]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const idx = Number(b.dataset.m3);
        const cell = ps.m3Grid[idx];
        if (!cell || cell.matched) return;
        if (ps.m3Sel === null) {
          ps.m3Sel = idx;
        } else if (ps.m3Sel === idx) {
          ps.m3Sel = null;
        } else {
          const a = ps.m3Grid[ps.m3Sel];
          if (a && !a.matched && m3Adjacent(ps.m3Sel, idx) && a.type !== cell.type && a.key === cell.key) {
            a.matched = true; cell.matched = true;
            ps.m3Score += 10 + ps.m3Combo * 2;
            ps.m3Combo++;
            ps.m3Matched += 2;
            const r = S.learnWord(a.key, true, 'match3');
            S.addLearnPoints(D.scalePoint(1.5), true);
            if (ps.m3Combo % 3 === 0) {
              S.addLearnPoints(D.scalePoint(2), true);
              U.toast('🔥 ' + ps.m3Combo + ' 连击！额外 +' + D.scalePoint(2) + ' 学习积分', 'gold');
            }
            S.save();
            ps.m3Sel = null;
            ps.m3Steps--;
          } else {
            ps.m3Combo = 0;
            ps.m3Sel = idx;
            ps.m3Steps--;
          }
        }
        UI.refresh();
      });
    });

    // 塔防
    const tdStart = U.$('#tdStart', root);
    if (tdStart) tdStart.addEventListener('click', function () { startTd(); UI.refresh(); });
    U.$$('[data-ammo]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        const w = ps.tdAmmo.find(function (x) { return x.key === b.dataset.ammo; });
        ps.tdSel = w || null;
        UI.refresh();
      });
    });
    U.$$('[data-mon]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (!ps.tdSel) { U.toast('请先选择英文弹药', 'bad'); return; }
        const key = b.dataset.mon;
        const idx = ps.tdMonsters.findIndex(function (m) { return m.key === key; });
        if (idx < 0) return;
        const m = ps.tdMonsters[idx];
        if (ps.tdSel.key === m.key) {
          ps.tdMonsters.splice(idx, 1);
          ps.tdScore++;
          ps.tdReward += 3;
          S.learnWord(m.key, true, 'td');
          U.toast('命中！+3 奖励积分', 'good');
        } else {
          U.toast('选错了，怪物继续前进', 'bad');
        }
        ps.tdSel = null;
        UI.refresh();
      });
    });

    // 闯关
    const start = U.$('#quizStart', root);
    if (start) start.addEventListener('click', function () {
      ps.quiz = S.buildQuiz(10);
      ps.qIdx = 0; ps.qScore = 0; ps.qAnswered = false; ps.qChoice = null; ps.qDone = false;
      ps.rewardText = '';
      UI.refresh();
    });
    U.$$('[data-opt]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.qAnswered) return;
        const q = ps.quiz[ps.qIdx];
        ps.qChoice = b.dataset.opt;
        ps.qAnswered = true;
        if (ps.qChoice === q.answer) ps.qScore++;
        UI.refresh();
      });
    });
    U.$$('[data-judge]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        if (ps.qAnswered) return;
        const q = ps.quiz[ps.qIdx];
        ps.qChoice = b.dataset.judge;
        ps.qAnswered = true;
        if ((ps.qChoice === '正确') === q.answer) ps.qScore++;
        UI.refresh();
      });
    });
    const fillInput = U.$('#fillInput', root);
    if (fillInput) {
      fillInput.addEventListener('input', function () { ps.fillValue = fillInput.value; });
      fillInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitFill(); });
      const ok = U.$('#fillOk', root);
      if (ok) ok.addEventListener('click', submitFill);
    }
    const qNext = U.$('#quizNext', root);
    if (qNext) qNext.addEventListener('click', function () {
      if (ps.qIdx + 1 >= ps.quiz.length) {
        ps.qDone = true;
        const r = S.finishQuiz(ps.qScore, ps.quiz.length);
        ps.rewardText = r.points ? ('奖励 +' + r.points + ' 学习积分 +' + r.exp + ' 学习经验') : '正确率未达 80%，本轮无积分奖励';
        if (r.scholar) ps.rewardText += ' · 🎓 学霸暴击触发！';
        if (r.points) U.toast('闯关奖励 +' + r.points + ' 学习积分' + (r.scholar ? ' · 学霸暴击触发！' : ''), 'gold');
      } else {
        ps.qIdx++;
        ps.qAnswered = false; ps.qChoice = null; ps.fillValue = ''; ps.fillTip = '';
      }
      UI.refresh();
    });
    const again = U.$('#quizAgain', root);
    if (again) again.addEventListener('click', function () {
      ps.quiz = S.buildQuiz(10);
      ps.qIdx = 0; ps.qScore = 0; ps.qAnswered = false; ps.qDone = false; ps.qChoice = null;
      UI.refresh();
    });
    const back = U.$('#quizBack', root);
    if (back) back.addEventListener('click', function () { ps.quiz = null; ps.qDone = false; UI.refresh(); });
  }

  function nextWord() {
    ps.qi++;
    ps.choiceKey = ''; ps.choiceOpts = []; ps.choicePick = ''; ps.choiceState = ''; ps.choiceTip = '';
    ps.en2cnKey = ''; ps.en2cnOpts = []; ps.en2cnPick = ''; ps.en2cnState = ''; ps.en2cnTip = '';
    ps.clozeOpts = []; ps.clozePick = ''; ps.clozeState = ''; ps.clozeTip = '';
    ps.spellValue = ''; ps.spellTip = ''; ps.spellState = '';
    ps.tabooInput = ''; ps.tabooState = ''; ps.tabooTip = '';
    ps.anaLetters = []; ps.anaAnswer = []; ps.anaUsed = []; ps.anaState = ''; ps.anaTip = '';
    ps.flipped = false;
    if (ps.qi >= ps.queue.length) resetQueue(ps.tab);
    UI.refresh();
  }

  function checkSpell() {
    const w = ps.queue[ps.qi];
    if (!w) return;
    const val = (ps.spellValue || '').trim().toLowerCase();
    if (!val) { U.toast('请先输入单词', 'bad'); return; }
    if (val === w.word.toLowerCase()) {
      const r = S.learnWord(w.key, true, 'spell');
      ps.spellState = 'ok';
      ps.spellTip = '✅ 拼写正确！' + (r.msg || '');
    } else {
      S.learnWord(w.key, false, 'spell');
      ps.spellState = 'bad';
      ps.spellTip = '❌ 正确拼写：' + w.word + '（已加入生词本）';
    }
    UI.refresh();
  }

  function checkTaboo() {
    const w = ps.queue[ps.qi];
    if (!w) return;
    const val = (ps.tabooInput || '').trim().toLowerCase();
    if (!val) { U.toast('请先输入单词', 'bad'); return; }
    if (val === w.word.toLowerCase()) {
      const r = S.learnWord(w.key, true, 'taboo');
      ps.tabooState = 'ok';
      ps.tabooTip = '✅ 猜对了！' + (r.msg || '');
    } else {
      S.learnWord(w.key, false, 'taboo');
      ps.tabooState = 'bad';
      ps.tabooTip = '❌ 正确答案：' + w.word;
    }
    UI.refresh();
  }

  function guessWordle() {
    if (ps.wdState !== 'playing') return;
    const guess = (ps.wdInput || '').trim().toLowerCase();
    if (guess.length !== 5) { U.toast('请输入 5 个字母', 'bad'); return; }
    if (!/^[a-z]{5}$/.test(guess)) { U.toast('只能输入字母', 'bad'); return; }
    ps.wdGuesses.push(guess);
    ps.wdInput = '';
    const answer = ps.wdAnswer.word.toLowerCase();
    if (guess === answer) {
      ps.wdState = 'won';
      const r = S.learnWord(ps.wdAnswer.key, true, 'wordle');
      ps.wdTip = '🎉 猜对了！' + (r.msg || '');
    } else if (ps.wdGuesses.length >= 6) {
      ps.wdState = 'lost';
      S.learnWord(ps.wdAnswer.key, false, 'wordle');
      ps.wdTip = '❌ 答案是：' + ps.wdAnswer.word;
    } else {
      ps.wdRow = ps.wdGuesses.length;
    }
    UI.refresh();
  }

  function submitFill() {
    if (ps.qAnswered) return;
    const q = ps.quiz[ps.qIdx];
    const val = (ps.fillValue || '').trim().toLowerCase();
    if (!val) { U.toast('请先填写答案', 'bad'); return; }
    ps.qAnswered = true;
    if (val === q.answer.toLowerCase()) { ps.qScore++; ps.fillTip = 'right'; }
    else ps.fillTip = 'wrong';
    UI.refresh();
  }

  function mark(known) {
    const w = ps.queue[ps.qi];
    if (!w) return;
    const r = S.learnWord(w.key, known, ps.tab);
    U.toast(r.msg || (known ? ('掌握 +' + D.scalePoint(2) + ' 学习积分') : '已加入生词本'), r.ok ? (known ? 'good' : 'bad') : 'bad');
    ps.qi++;
    ps.masked = false; ps.flipped = false;
    UI.refresh();
  }

  /* ---------------- 错题本 ---------------- */
  function wrongModal() {
    const list = S.wrongList();
    U.modal({
      title: '错题本（' + list.length + '）', icon: '📕',
      body: list.length ? '<div style="max-height:52vh;overflow-y:auto">' + list.map(function (w) {
        return '<div class="st-item warn" style="margin-bottom:7px;flex-wrap:wrap">' +
          '<span style="min-width:110px"><b>' + U.esc(w.word) + '</b><span style="font-size:10px;color:#8b968c"> ' + (w.phon ? U.esc(w.phon) : '') + '</span></span>' +
          '<span style="flex:1;font-size:11.5px">' + U.esc(w.mean) + '</span>' +
          '<span style="font-size:10px;color:#c05a44">错 ' + w.count + ' 次</span>' +
          '<button class="btn btn-xs" data-fix="' + w.key + '">订正 +' + D.scalePoint(0.5) + '</button></div>';
      }).join('') + '</div>'
        : U.empty('错题本是空的，保持住！', '🌿'),
      footer: '<button class="btn btn-sm" id="wClear">🧽 使用错题清零卡</button><button class="btn btn-primary" data-close>关闭</button>',
      onMount: function (box, close) {
        U.$$('[data-fix]', box).forEach(function (b) {
          b.addEventListener('click', function () {
            const r = S.fixWrong(b.dataset.fix);
            U.toast(r.ok ? ('订正完成 +' + (r.points || D.scalePoint(0.5)) + ' 学习积分') : '订正失败', r.ok ? 'good' : 'bad');
            if (r.ok) { close(); UI.refresh(); }
          });
        });
        U.$('#wClear', box).addEventListener('click', function () {
          if (S.inv('wrongClearCard') <= 0) { U.toast('没有错题清零卡，可在商城兑换', 'bad'); return; }
          const r = S.useStudyItem('wrongClearCard');
          U.toast(r.msg, r.ok ? 'good' : 'bad');
          if (r.ok) { close(); UI.refresh(); }
        });
      }
    });
  }

  global.WG.ui.pages.learn = page;
})(window);
