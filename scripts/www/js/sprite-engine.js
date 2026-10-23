/* ============================================================
   精灵引擎 · 轻量 Canvas 2D 动画系统
   零外部美术资源 · Emoji 自动生 Sprite Sheet · 状态机驱动
   ============================================================ */
(function (global) {
  'use strict';

  /**
   * EmojiSpriteSheet — 运行时把 emoji 绘成多帧 Sprite Sheet (Data URI)
   * 对每个状态生成 frameCount 帧，帧间做微小变换制造动画感
   */
  function EmojiSpriteSheet(emoji, state, frameCount, opts) {
    opts = opts || {};
    const size = opts.size || 128;
    const gap = opts.gap || 8;
    const sheetW = frameCount * size + (frameCount - 1) * gap;
    const sheetH = size;
    const cvs = document.createElement('canvas');
    cvs.width = sheetW; cvs.height = sheetH;
    const ctx = cvs.getContext('2d');
    ctx.imageSmoothingEnabled = true;

    for (let f = 0; f < frameCount; f++) {
      const x = f * (size + gap);
      drawFrame(ctx, emoji, x, 0, size, state, f, frameCount);
    }
    return cvs.toDataURL('image/png');
  }

  function drawFrame(ctx, emoji, ox, oy, size, state, frame, total) {
    ctx.clearRect(ox, oy, size, size);
    const cx = ox + size / 2;
    const cy = oy + size / 2;

    // 基座阴影（让"站"的感觉）
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, oy + size - 10, size * 0.32, size * 0.07, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    // 各状态的帧变换（让 emoji 自己动起来）
    let ty = 0, scale = 1, rot = 0, sx = 1;
    const t = frame / Math.max(1, total - 1);

    switch (state) {
      case 'idle':
        // 呼吸：上下浮动 + 微缩
        ty = Math.sin(t * Math.PI * 2) * 3;
        scale = 1 + Math.sin(t * Math.PI * 2) * 0.03;
        break;
      case 'walk':
        // 走：两帧一组上下 + 微摇摆
        ty = Math.sin(t * Math.PI * 2) * 4;
        rot = Math.sin(t * Math.PI * 4) * 0.08;
        sx = (frame % 2 === 0) ? -1 : 1;  // 脚左右
        break;
      case 'happy':
        // 高兴：跳跃 + 弹性
        ty = -Math.abs(Math.sin(t * Math.PI)) * 16;
        scale = 1 + Math.abs(Math.sin(t * Math.PI)) * 0.15;
        rot = Math.sin(t * Math.PI * 4) * 0.12;
        break;
      case 'sleep':
        // 睡：头下垂 + 微呼吸
        ty = 2;
        rot = 0.15;
        scale = 0.92;
        break;
      case 'graze':
        // 吃：左右摆头
        rot = Math.sin(t * Math.PI * 2) * 0.18;
        ty = Math.abs(Math.sin(t * Math.PI * 2)) * 4;
        break;
      case 'swim':
        // 游：蛇形左右
        sx = Math.sin(t * Math.PI * 2) > 0 ? 1 : -1;
        rot = Math.sin(t * Math.PI * 2) * 0.25;
        ty = Math.sin(t * Math.PI * 4) * 3;
        break;
      case 'float':
        // 浮（睡莲/成熟态）: 缓慢上下
        ty = Math.sin(t * Math.PI * 2) * 5;
        scale = 1 + Math.sin(t * Math.PI * 2) * 0.02;
        break;
      case 'ripe':
        // 成熟果实/花朵：微摇摆 + 闪光
        rot = Math.sin(t * Math.PI * 2) * 0.1;
        break;
      case 'grow':
        // 生长中：从小到大缩放
        scale = 0.5 + t * 0.5;
        break;
      default:
        break;
    }

    ctx.translate(cx, cy + ty);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.scale(sx, 1);

    // emoji 主绘制
    const fontSize = size * 0.7;
    ctx.font = fontSize + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Android Emoji","Twitter Color Emoji",system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 2);
    ctx.restore();

    // 状态特效叠加
    if (state === 'sleep') {
      ctx.save();
      ctx.font = (size * 0.22) + 'px system-ui,sans-serif';
      ctx.fillStyle = 'rgba(90,120,160,0.75)';
      ctx.fillText('Z', cx + size * 0.2, cy - size * 0.35);
      ctx.fillText('z', cx + size * 0.3, cy - size * 0.2);
      ctx.restore();
    }
    if (state === 'ripe') {
      // 闪光星星
      ctx.save();
      ctx.fillStyle = 'rgba(255,220,120,' + (0.4 + Math.sin(t * Math.PI * 2) * 0.4) + ')';
      ctx.beginPath();
      const sp = 4;
      const sr = size * 0.05;
      ctx.arc(cx - size * 0.28 + Math.sin(t * 6) * 4, cy - size * 0.38, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * 预生成一整个动物/物品的所有状态 Sprite Sheet
   * 返回 { idle: DataURI, walk: DataURI, ... }
   */
  function buildCreatureSheets(cfg) {
    // cfg: { emoji, states: { stateName: frameCount }, size }
    const out = {};
    Object.keys(cfg.states).forEach(function (st) {
      out[st] = EmojiSpriteSheet(cfg.emoji, st, cfg.states[st], { size: cfg.size || 128 });
    });
    return out;
  }

  /* ---------- Sprite 类 ---------- */
  class Sprite {
    constructor(scene, cfg) {
      this.scene = scene;
      this.sheets = cfg.sheets;       // { stateName: DataURI }
      this.state = cfg.initState || 'idle';
      this.frames = cfg.frames || {}; // { stateName: count }
      this.frame = 0;
      this.frameTime = cfg.frameTime || 160;  // ms per frame
      this.lastTick = 0;
      this.x = cfg.x || 0;
      this.y = cfg.y || 0;
      this.vx = cfg.vx || 0;
      this.vy = cfg.vy || 0;
      this.scale = cfg.scale || 1;
      this.facing = cfg.facing || 1;   // 1 or -1
      this.w = cfg.size || 64;
      this.h = cfg.size || 64;
      this.radius = (this.w + this.h) / 4;
      this.onClick = cfg.onClick || null;
      this.onBubble = cfg.onBubble || null;
      this.bubble = null;
      this.bubbleUntil = 0;
      this.tag = cfg.tag || 'creature';
      this.stateUntil = 0;   // 临时状态截止时间
      this.id = Math.random().toString(36).slice(2, 9);

      // 寻路目标：设置后自动朝该点走过去（用于指针跟随）
      this.target = null;
      this.speed = cfg.speed || 62;     // 寻路速度 px/s
      this.stopDist = cfg.stopDist || 8;
      this.emoteIcon = null;            // 头顶情绪表情（❤️ 💤 ❗ 等）
      this.emoteUntil = 0;
      this.emoteDur = 0;

      // 预加载图像
      this.imgs = {};
      Object.keys(this.sheets).forEach(function (k) {
        const img = new Image();
        img.src = this.sheets[k];
        this.imgs[k] = img;
      }.bind(this));
    }

    setState(st, duration) {
      if (this.state !== st) {
        this.state = st;
        this.frame = 0;
      }
      if (duration) this.stateUntil = global.performance.now() + duration;
    }

    say(text, duration) {
      this.bubble = text;
      this.bubbleUntil = global.performance.now() + (duration || 2000);
      this.setState('happy', 900);
    }

    /** 头顶冒出情绪表情（❤️ 💤 ❗ 🎵 😠 等），带弹出动画 */
    emote(icon, duration) {
      this.emoteIcon = icon;
      this.emoteDur = duration || 1200;
      this.emoteUntil = global.performance.now() + this.emoteDur;
    }

    /** 朝某个点走过去；到达后自动停下 */
    moveTo(x, y) {
      this.target = { x: x, y: y };
    }

    update(dt, now) {
      // 帧推进
      this.lastTick += dt;
      while (this.lastTick >= this.frameTime) {
        this.lastTick -= this.frameTime;
        const total = this.frames[this.state] || 1;
        this.frame = (this.frame + 1) % total;
      }
      // 寻路优先：朝 target 直线走，到达后落回 idle
      if (this.target) {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.stopDist) {
          this.target = null;
          this.vx = this.vy = 0;
          this.setState('idle');
        } else {
          const step = this.speed * dt / 1000;
          this.x += dx / dist * step;
          this.y += dy / dist * step;
          this.facing = dx >= 0 ? 1 : -1;
          if (this.state !== 'walk') this.setState('walk');
        }
      } else if (this.state === 'walk') {
        // 自由行走模式（寻路目标为空时）
        this.x += this.vx * dt / 1000;
        this.y += this.vy * dt / 1000;
        // 边界反弹
        const s = this.scene.size;
        if (this.x < 20 || this.x > s.w - 20) { this.vx *= -1; this.facing = this.vx >= 0 ? 1 : -1; }
        if (this.y < 40 || this.y > s.h - 30) { this.vy *= -1; }
      }
      // 状态到期回 idle
      if (this.stateUntil && now > this.stateUntil && this.state !== 'idle' && this.state !== 'sleep') {
        this.setState('idle');
      }
      // 气泡到期
      if (this.bubble && now > this.bubbleUntil) this.bubble = null;
      // 表情到期
      if (this.emoteIcon && now > this.emoteUntil) this.emoteIcon = null;
    }

    draw(ctx, now) {
      const img = this.imgs[this.state];
      if (!img || !img.complete) {
        // 占位 fallback
        ctx.save();
        ctx.font = (this.w * 0.6) + 'px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('❓', this.x, this.y);
        ctx.restore();
        return;
      }
      const fw = this.w, fh = this.h;
      const gap = 8;
      const total = this.frames[this.state] || 1;
      const sx = this.frame * (fw + gap);
      const sy = 0;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.facing * this.scale, this.scale);
      // 淡入动画（刚创建时）
      // ctx.globalAlpha = Math.min(1, (now - this.createdAt) / 400);
      ctx.drawImage(img, sx, sy, fw, fh, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();

      // 气泡层
      if (this.bubble) {
        drawBubble(ctx, this.x, this.y - this.h * 0.85, this.bubble, now);
      }
      // 情绪表情层（弹跳 + 淡出）
      if (this.emoteIcon) {
        const left = (this.emoteUntil - now) / (this.emoteDur || 1200);
        const p = 1 - Math.max(0, Math.min(1, left));     // 0 → 1
        const pop = 1 + Math.sin(Math.min(1, p * 2.6) * Math.PI) * 0.35;
        ctx.save();
        ctx.globalAlpha = left < 0.22 ? left / 0.22 : 1;
        ctx.font = (this.h * 0.26 * pop) + 'px "Apple Color Emoji","Segoe UI Emoji",system-ui,sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoteIcon, this.x + this.h * 0.26, this.y - this.h * 0.6 - p * 12);
        ctx.restore();
      }
    }

    hitTest(mx, my) {
      const dx = mx - this.x, dy = my - this.y;
      return (dx * dx + dy * dy) < this.radius * this.radius;
    }
  }

  function drawBubble(ctx, x, y, text, now) {
    ctx.save();
    const t = Math.min(1, (now % 500) / 500);
    // 气泡框
    ctx.font = 'bold 11px system-ui,sans-serif';
    const tw = ctx.measureText(text).width;
    const pad = 7, bw = tw + pad * 2, bh = 18;
    const bx = x - bw / 2, by = y - bh;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = 'rgba(90,120,80,0.35)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill(); ctx.stroke();
    // 小尾巴
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bh);
    ctx.lineTo(x, by + bh + 5);
    ctx.lineTo(x + 5, by + bh);
    ctx.fill();
    // 文字
    ctx.fillStyle = '#3b4a3e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, by + bh / 2);
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- 粒子系统 ---------- */
  class Particle {
    constructor(x, y, cfg) {
      cfg = cfg || {};
      this.icon = cfg.icon || '✨';
      this.x = x;
      this.y = y;
      this.size = cfg.size || 14;
      const ang = cfg.angle != null ? cfg.angle : (Math.random() * Math.PI * 2);
      const sp = (cfg.speed || 40) * (0.6 + Math.random() * 0.8);
      this.vx = Math.cos(ang) * sp;
      this.vy = Math.sin(ang) * sp - (cfg.up || 30);
      this.gravity = cfg.gravity != null ? cfg.gravity : 40;
      this.life = cfg.life || 900;
      this.maxLife = this.life;
      this.spin = (Math.random() - 0.5) * 6;
      this.rot = 0;
    }
    update(dt) {
      this.vy += this.gravity * dt / 1000;
      this.x += this.vx * dt / 1000;
      this.y += this.vy * dt / 1000;
      this.rot += this.spin * dt / 1000;
      this.life -= dt;
      return this.life > 0;
    }
    draw(ctx) {
      const p = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = p < 0.35 ? p / 0.35 : 1;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.font = this.size + 'px "Apple Color Emoji","Segoe UI Emoji",system-ui,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.icon, 0, 0);
      ctx.restore();
    }
  }

  /* ---------- 状态机 ---------- */
  /**
   * 声明式状态机：每个状态声明持续时间区间与下一状态权重，自动游走
   * cfg = {
   *   states: {
   *     idle: { min, max, next: { walk: 2, idle: 3 }, enter(sprite) },
   *     walk: { min, max, next: { idle: 1 }, enter(sprite) },
   *   },
   *   unless: fn(sprite, now) => 强制状态名 | null,
   *   tick:   fn(sprite, scene, dt, now),   // 每帧钩子，用来做指针跟随
   * }
   */
  class StateMachine {
    constructor(sprite, cfg) {
      this.sprite = sprite;
      this.states = cfg.states || {};
      this.unless = cfg.unless || null;
      this.tick = cfg.tick || null;
      this.nextAt = 0;
      this.enabled = true;
      this.now = 0;
    }

    update(dt, now) {
      this.now = now;
      const sp = this.sprite;
      if (!this.enabled) return;

      // 每帧行为钩子（指针跟随等）
      if (this.tick) this.tick(sp, sp.scene, dt, now);

      // 强制的优先状态（如饱腹过低 → 睡觉）
      if (this.unless) {
        const forced = this.unless(sp, now);
        if (forced) {
          if (sp.state !== forced || !sp.stateUntil) {
            sp.setState(forced);
            this.schedule(now, forced);
          }
          return;
        }
      }

      // 临时状态（说话/跳跃）或寻路进行中 → 不打断
      if (sp.stateUntil && now < sp.stateUntil) return;
      if (sp.target) return;

      if (now >= this.nextAt) this.transition(now);
    }

    schedule(now, st) {
      const def = this.states[st] || {};
      const min = def.min || 1000;
      const max = def.max || min * 2;
      this.nextAt = now + min + Math.random() * (max - min);
    }

    transition(now) {
      const cur = this.sprite.state;
      const def = this.states[cur] || this.states.idle;
      if (!def) return;
      const next = def.next || {};
      const keys = Object.keys(next);
      if (!keys.length) { this.schedule(now, cur); return; }

      let total = 0;
      keys.forEach(function (k) { total += next[k]; });
      let r = Math.random() * total;
      let pick = keys[0];
      for (let i = 0; i < keys.length; i++) {
        r -= next[keys[i]];
        if (r <= 0) { pick = keys[i]; break; }
      }
      this.enter(pick, now);
    }

    enter(st, now) {
      const def = this.states[st];
      this.sprite.setState(st);
      if (def && def.enter) def.enter(this.sprite, this.sprite.scene);
      this.schedule(now, st);
    }

    /** 立刻切到某状态并重新计时（外部交互后调用） */
    force(st, now) {
      this.enter(st, now || this.now);
    }
  }

  /* ---------- 行为预设 ---------- */
  const BEHAVIORS = {
    /** 随机漫步：走走停停 */
    wander: function (opts) {
      opts = opts || {};
      return {
        states: {
          idle: { min: 1000, max: 3000, next: { walk: 2, idle: 3 } },
          walk: {
            min: 1200, max: 3000, next: { idle: 4, walk: 1 },
            enter: function (sp) {
              const dir = Math.random() > 0.5 ? 1 : -1;
              sp.vx = dir * (opts.speed || 38);
              sp.vy = (Math.random() - 0.5) * 14;
              sp.facing = dir;
            }
          },
          sleep: { min: 4000, max: 9000, next: { idle: 1 } }
        },
        unless: opts.unless
      };
    },

    /**
     * 萌宠行为：望远/跟随鼠标 + 好奇张望 + 困了睡觉
     * opts.fullness 低时强制 sleep
     */
    pet: function (opts) {
      opts = opts || {};
      return {
        states: {
          idle: { min: 800, max: 2200, next: { walk: 3, idle: 2 } },
          walk: {
            min: 900, max: 2000, next: { idle: 3 },
            enter: function (sp) {
              const dir = Math.random() > 0.5 ? 1 : -1;
              sp.vx = dir * (opts.speed || 44);
              sp.vy = (Math.random() - 0.5) * 12;
              sp.facing = dir;
            }
          },
          sleep: { min: 5000, max: 11000, next: { idle: 1 } },
          happy: { min: 700, max: 1100, next: { idle: 1 } }
        },
        // 困了自动睡
        unless: function (sp) {
          if (opts.fullness != null && opts.fullness < 18) return 'sleep';
          return null;
        },
        // 指针跟随：靠近时转头看，稍远时走过去
        tick: function (sp, scene, dt, now) {
          const p = scene.pointer;
          if (!p) {
            if (sp.state === 'idle' && sp.target) sp.target = null;
            return;
          }
          const dx = p.x - sp.x;
          const dist = Math.sqrt(dx * dx + (p.y - sp.y) * (p.y - sp.y));
          // 永远面向指针
          if (sp.state !== 'sleep') sp.facing = dx >= 0 ? 1 : -1;
          if (sp.state === 'sleep') return;
          // 好奇：指针在 60~280px 之间 → 走过去
          if (dist > 60 && dist < 280) {
            sp.moveTo(p.x, Math.min(scene.size.h - 34, p.y + 14));
          } else if (dist <= 60) {
            sp.target = null;
          }
        }
      };
    },

    /** 水里的鱼：靠近指针就游过去，否则随机游 */
    swim: function (opts) {
      opts = opts || {};
      return {
        states: {
          swim: {
            min: 1200, max: 2600, next: { swim: 1 },
            enter: function (sp) {
              const dir = Math.random() > 0.5 ? 1 : -1;
              sp.vx = dir * (opts.speed || 34);
              sp.vy = (Math.random() - 0.5) * 18;
              sp.facing = dir;
            }
          }
        },
        tick: function (sp, scene, dt, now) {
          const p = scene.pointer;
          if (!p) return;
          const dx = p.x - sp.x;
          if (Math.abs(dx) < 120) {
            sp.moveTo(p.x, p.y);
            sp.speed = opts.chaseSpeed || 70;
          }
        }
      };
    }
  };

  /* ---------- Scene 类 ---------- */
  class Scene {
    constructor(cvs, opts) {
      this.cvs = cvs;
      this.ctx = cvs.getContext('2d');
      this.bgFn = opts.bgFn || null;
      this.size = { w: cvs.width, h: cvs.height };
      this.sprites = [];
      this.nextId = 1;
      this.running = false;
      this.lastTime = 0;
      this.spawners = opts.spawners || []; // 自定义渲染元素
      this.interactions = [];               // 可点击的非 Sprite 元素 {x,y,r,fn}
      this.machines = [];                   // 绑定到 sprite 的状态机
      this.particles = [];                  // 粒子（爱心/金币/星光）
      this.pointer = null;                  // 指针位置（场景内坐标），供行为策略使用

      // 适配高 DPI
      const dpr = window.devicePixelRatio || 1;
      this.dpr = dpr;
      const cssW = cvs.clientWidth || cvs.width;
      const cssH = cvs.clientHeight || cvs.height;
      cvs.width = cssW * dpr;
      cvs.height = cssH * dpr;
      this.size.w = cssW; this.size.h = cssH;
      this.ctx.scale(dpr, dpr);

      // 事件
      cvs.addEventListener('click', this.onClick.bind(this));
      cvs.addEventListener('pointerdown', this.onClick.bind(this));
      // 指针跟随（鼠标/触摸移动时更新场景内坐标）
      cvs.addEventListener('pointermove', function (e) {
        const r = cvs.getBoundingClientRect();
        this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      }.bind(this));
      cvs.addEventListener('pointerleave', function () { this.pointer = null; }.bind(this));

      // 自动 resize
      this._ro = new ResizeObserver(function () {
        // 重新适配
        const w = cvs.clientWidth, h = cvs.clientHeight;
        if (w > 0 && h > 0) {
          cvs.width = w * dpr; cvs.height = h * dpr;
          this.size.w = w; this.size.h = h;
          this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (this.bgFn) this.bgFn(this.ctx, this.size);
        }
      }.bind(this));
      this._ro.observe(cvs);
    }

    addSprite(sprite) {
      this.sprites.push(sprite);
      return sprite;
    }

    removeSprite(sprite) {
      this.sprites = this.sprites.filter(function (s) { return s !== sprite; });
    }

    addInteraction(x, y, r, fn) {
      this.interactions.push({ x: x, y: y, r: r, fn: fn });
    }

    /** 给精灵绑定状态机 */
    addMachine(machine) {
      this.machines.push(machine);
      return machine;
    }

    /** 在指定位置炸出一簇粒子 */
    burst(x, y, cfg) {
      cfg = cfg || {};
      const icons = cfg.icons || ['✨'];
      const count = cfg.count || 6;
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(x, y, {
          icon: icons[i % icons.length],
          size: cfg.size || 15,
          speed: cfg.speed || 46,
          up: cfg.up != null ? cfg.up : 44,
          gravity: cfg.gravity != null ? cfg.gravity : 46,
          life: cfg.life || 900
        }));
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = global.performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }

    stop() { this.running = false; }

    loop(now) {
      if (!this.running) return;
      const dt = Math.min(64, now - this.lastTime);  // 限制最大 dt 防跳帧
      this.lastTime = now;
      this.render(dt, now);
      requestAnimationFrame(this.loop.bind(this));
    }

    render(dt, now) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.size.w, this.size.h);

      // 背景
      if (this.bgFn) this.bgFn(ctx, this.size, now);

      // 自定义 spawners
      this.spawners.forEach(function (s) { s(ctx, this.size, now); }.bind(this));

      // 状态机（先跑行为逻辑，再让精灵更新）
      this.machines.forEach(function (m) { m.update(dt, now); });

      // sprites 按 y 排序（后面的压住前面的 = 近大远小）
      const sorted = this.sprites.slice().sort(function (a, b) { return a.y - b.y; });
      sorted.forEach(function (s) {
        s.update(dt, now);
        s.draw(ctx, now);
      });

      // 粒子层（画在最上层）
      if (this.particles.length) {
        this.particles = this.particles.filter(function (p) { return p.update(dt); });
        this.particles.forEach(function (p) { p.draw(ctx); });
      }
    }

    onClick(e) {
      const rect = this.cvs.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // 先测自定义交互层
      for (let i = this.interactions.length - 1; i >= 0; i--) {
        const it = this.interactions[i];
        const dx = mx - it.x, dy = my - it.y;
        if (dx * dx + dy * dy < it.r * it.r) { it.fn(); return; }
      }
      // 再测 sprites (从顶层往下)
      for (let i = this.sprites.length - 1; i >= 0; i--) {
        const s = this.sprites[i];
        if (s.hitTest(mx, my)) {
          if (s.onClick) s.onClick(s, e);
          return;
        }
      }
    }
  }

  /* ---------- 预设生物/物品配置 ---------- */
  const CREATURE_LIBRARY = {
    // 宠物（7 种）
    cat: { emoji: '🐱', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    dog: { emoji: '🐶', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    rabbit: { emoji: '🐰', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    hamster: { emoji: '🐹', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    parrot: { emoji: '🦜', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    deer: { emoji: '🦌', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    unicorn: { emoji: '🦄', frames: { idle: 1, walk: 4, happy: 4, sleep: 1 }, size: 128 },
    // 鱼
    carp: { emoji: '🐟', frames: { idle: 1, swim: 4, happy: 4 }, size: 96 },
    koi: { emoji: '🎏', frames: { idle: 1, swim: 4, happy: 4 }, size: 96 },
    goldfish: { emoji: '🐡', frames: { idle: 1, swim: 4, happy: 4 }, size: 96 },
    tropical: { emoji: '🦑', frames: { idle: 1, swim: 4, happy: 4 }, size: 96 },
    arowana: { emoji: '🐉', frames: { idle: 1, swim: 4, happy: 4 }, size: 112 },
    // 禽畜
    chicken: { emoji: '🐔', frames: { idle: 1, walk: 4, happy: 4, graze: 4 }, size: 112 },
    duck: { emoji: '🦆', frames: { idle: 1, walk: 4, happy: 4, graze: 4 }, size: 112 },
    cow: { emoji: '🐄', frames: { idle: 1, walk: 4, happy: 4 }, size: 144 },
    sheep: { emoji: '🐑', frames: { idle: 1, walk: 4, happy: 4 }, size: 128 },
    // 树木
    apple: { emoji: '🍎', frames: { grow: 3, ripe: 4 }, size: 112 },
    pear: { emoji: '🍐', frames: { grow: 3, ripe: 4 }, size: 112 },
    peach: { emoji: '🍑', frames: { grow: 3, ripe: 4 }, size: 112 },
    // 植物
    cabbage: { emoji: '🥬', frames: { grow: 3, ripe: 1 }, size: 96 },
    tomato: { emoji: '🍅', frames: { grow: 3, ripe: 4 }, size: 96 },
    sunflower: { emoji: '🌻', frames: { grow: 3, ripe: 4 }, size: 112 },
    rose: { emoji: '🌹', frames: { grow: 3, ripe: 4 }, size: 112 },
  };

  /**
   * 便捷方法：根据 CREATURE_LIBRARY 配置创建 Sprite
   */
  function makeSprite(scene, key, opts) {
    const cfg = CREATURE_LIBRARY[key];
    if (!cfg) { console.warn('[SpriteEngine] 未注册生物 key:', key); return null; }
    opts = opts || {};
    const sheets = buildCreatureSheets({
      emoji: cfg.emoji,
      states: cfg.frames,
      size: cfg.size
    });
    return new Sprite(scene, {
      sheets: sheets,
      frames: cfg.frames,
      initState: opts.state || 'idle',
      x: opts.x || scene.size.w / 2,
      y: opts.y || scene.size.h / 2,
      scale: opts.scale || 1,
      frameTime: opts.frameTime || 180,
      onClick: opts.onClick,
      facing: opts.facing || 1,
      size: cfg.size,
      tag: opts.tag || key
    });
  }

  /* ---------- 背景预设 ---------- */
  const BACKGROUNDS = {
    garden: function (ctx, size, now) {
      // 天空渐变
      const g = ctx.createLinearGradient(0, 0, 0, size.h);
      g.addColorStop(0, '#cdecc6');
      g.addColorStop(0.55, '#e6f6dc');
      g.addColorStop(1, '#b6d9a5');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
      // 远处小山
      ctx.fillStyle = '#9cc68a';
      ctx.beginPath();
      ctx.moveTo(0, size.h * 0.55);
      ctx.quadraticCurveTo(size.w * 0.25, size.h * 0.38, size.w * 0.5, size.h * 0.5);
      ctx.quadraticCurveTo(size.w * 0.75, size.h * 0.4, size.w, size.h * 0.52);
      ctx.lineTo(size.w, size.h * 0.6);
      ctx.lineTo(0, size.h * 0.6);
      ctx.closePath();
      ctx.fill();
      // 草地
      ctx.fillStyle = '#8fc478';
      ctx.fillRect(0, size.h * 0.6, size.w, size.h * 0.4);
      // 草地纹理（短线）
      ctx.strokeStyle = 'rgba(70,110,50,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < size.w; i += 12) {
        ctx.beginPath();
        const h = 3 + (i % 5);
        ctx.moveTo(i, size.h * 0.6);
        ctx.lineTo(i + Math.sin(i * 0.3) * 2, size.h * 0.6 - h);
        ctx.stroke();
      }
      // 几朵云（缓慢漂移）
      const t = now * 0.00002;
      drawCloud(ctx, size.w * 0.2 + Math.sin(t) * 15, size.h * 0.15, 40);
      drawCloud(ctx, size.w * 0.75 + Math.sin(t + 1) * 10, size.h * 0.1, 32);
      // 太阳
      ctx.fillStyle = 'rgba(255,220,120,0.85)';
      ctx.beginPath();
      ctx.arc(size.w - 50, 45, 22, 0, Math.PI * 2);
      ctx.fill();
    },

    orchard: function (ctx, size, now) {
      // 果园：暖色调，橙黄渐变
      const g = ctx.createLinearGradient(0, 0, 0, size.h);
      g.addColorStop(0, '#ffe8cc');
      g.addColorStop(0.6, '#fff3e0');
      g.addColorStop(1, '#f5d39a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
      // 地平线远山
      ctx.fillStyle = '#d4a978';
      ctx.beginPath();
      ctx.moveTo(0, size.h * 0.5);
      ctx.lineTo(size.w * 0.3, size.h * 0.38);
      ctx.lineTo(size.w * 0.6, size.h * 0.45);
      ctx.lineTo(size.w, size.h * 0.4);
      ctx.lineTo(size.w, size.h * 0.55);
      ctx.lineTo(0, size.h * 0.55);
      ctx.closePath();
      ctx.fill();
      // 果园土壤
      ctx.fillStyle = '#c89a6a';
      ctx.fillRect(0, size.h * 0.55, size.w, size.h * 0.45);
      // 草纹
      ctx.strokeStyle = 'rgba(120,80,40,0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < size.w; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, size.h * 0.55);
        ctx.lineTo(i + 2, size.h * 0.55 - 2 - (i % 3));
        ctx.stroke();
      }
      // 太阳
      ctx.fillStyle = 'rgba(255,180,80,0.85)';
      ctx.beginPath();
      ctx.arc(size.w - 50, 45, 24, 0, Math.PI * 2);
      ctx.fill();
    },

    fish: function (ctx, size, now) {
      // 鱼塘：水纹渐变 + 气泡
      const g = ctx.createLinearGradient(0, 0, 0, size.h);
      g.addColorStop(0, '#b8e2f4');
      g.addColorStop(0.4, '#7bc4e8');
      g.addColorStop(1, '#4e9cc6');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
      // 水面波纹
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      const t = now * 0.001;
      for (let row = 0; row < 4; row++) {
        ctx.beginPath();
        const baseY = 40 + row * 30;
        ctx.moveTo(0, baseY);
        for (let x = 0; x < size.w; x += 4) {
          ctx.lineTo(x, baseY + Math.sin(x * 0.04 + t + row) * 3);
        }
        ctx.stroke();
      }
      // 气泡
      for (let i = 0; i < 6; i++) {
        const bx = (i * 80 + (now * 0.03) % 80) % size.w;
        const by = size.h - ((now * 0.05 + i * 60) % size.h);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(bx, by, 3 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    livestock: function (ctx, size, now) {
      // 牧场：草绿 + 木栅栏
      const g = ctx.createLinearGradient(0, 0, 0, size.h);
      g.addColorStop(0, '#ffe2cc');
      g.addColorStop(0.5, '#e4f3d4');
      g.addColorStop(1, '#b7dc9a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size.w, size.h);
      // 远山
      ctx.fillStyle = '#a5c89a';
      ctx.beginPath();
      ctx.moveTo(0, size.h * 0.4);
      ctx.quadraticCurveTo(size.w * 0.5, size.h * 0.2, size.w, size.h * 0.38);
      ctx.lineTo(size.w, size.h * 0.48);
      ctx.lineTo(0, size.h * 0.48);
      ctx.closePath();
      ctx.fill();
      // 地面
      ctx.fillStyle = '#9fd07e';
      ctx.fillRect(0, size.h * 0.48, size.w, size.h * 0.52);
      // 木栅栏
      const fenceY = size.h * 0.47;
      ctx.strokeStyle = '#9c6b3a';
      ctx.lineWidth = 3;
      for (let x = 10; x < size.w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, fenceY - 12);
        ctx.lineTo(x, fenceY + 6);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, fenceY - 2); ctx.lineTo(size.w, fenceY - 2);
      ctx.stroke();
    }
  };

  function drawCloud(ctx, x, y, r) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    ctx.arc(x + r * 0.5, y - r * 0.15, r * 0.5, 0, Math.PI * 2);
    ctx.arc(x + r, y, r * 0.55, 0, Math.PI * 2);
    ctx.arc(x - r * 0.4, y + r * 0.05, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 导出
  global.WG = global.WG || {};
  global.WG.sprite = {
    EmojiSpriteSheet, buildCreatureSheets, Sprite, Scene,
    StateMachine, BEHAVIORS, Particle,
    makeSprite, BACKGROUNDS, CREATURE_LIBRARY, roundRect
  };
})(window);
