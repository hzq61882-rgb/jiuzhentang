"use strict";
/* ============================================================
 * 穴光 · AcuAtlas 主程序
 * 星图（Canvas 2D）+ 今日学习（四题型）+ 穴卡 + 本地进度
 * ============================================================ */

/* ---------- 小工具 ---------- */
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const normPinyin = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

/* 定位默写判分：把标准定位按标点切成分句，看用户写中了几个分句 */
const CN_NUM = { 零: "0", 一: "1", 二: "2", 两: "2", 三: "3", 四: "4", 五: "5", 六: "6", 七: "7", 八: "8", 九: "9", 十: "10" };
const normLoc = (s) =>
  String(s || "")
    .replace(/[零一二两三四五六七八九十]/g, (c) => CN_NUM[c] || c)
    .replace(/[^\u4e00-\u9fa5A-Za-z0-9.]/g, "")
    .replace(/\./g, "")
    .toLowerCase();

/* 两条定位的相似度（0~1，双向取大） */
function simLoc(a, b) {
  const A = normLoc(a), B = normLoc(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  return Math.max(bestMatch(A, B), bestMatch(B, A));
}

/* 定位里出现的人体部位（长词优先，避免「小腿」被「腿」抢走） */
const BODY_PARTS = ["掌指", "跖趾", "耳后", "耳", "鼻", "目", "眉", "额", "颞", "枕", "头", "面", "项", "颈", "肩胛", "肩", "腋", "胸", "乳", "上腹", "下腹", "腹", "脐", "腰", "骶", "会阴", "臀", "大腿", "膝", "腘", "小腿", "踝", "跟", "足背", "足底", "足", "趾", "手掌", "手背", "掌", "腕", "前臂", "肘", "上臂", "臂", "指", "背"];
const BODY_ZONES = [
  ["头颈", ["耳后", "耳", "鼻", "目", "眉", "额", "颞", "枕", "头", "面", "项", "颈"]],
  ["躯干", ["肩胛", "肩", "腋", "胸", "乳", "上腹", "下腹", "腹", "脐", "腰", "骶", "会阴", "臀", "背"]],
  ["上肢", ["手掌", "手背", "掌", "腕", "前臂", "肘", "上臂", "臂", "指"]],
  ["下肢", ["大腿", "膝", "腘", "小腿", "踝", "跟", "足背", "足底", "足", "趾"]],
];
function bodyZone(part) {
  if (!part) return "";
  for (const [z, ws] of BODY_ZONES) if (ws.includes(part)) return z;
  return "";
}

function bodyPart(p) {
  /* 只看定位的第一句：免得「肱二头肌」的“头”、“犊鼻”的“鼻”把部位带偏 */
  const t = String((p && p.loc) || "")
    .replace(/（[^）]*）|\([^)]*\)/g, "")
    .split(/[，,。；;：:]/)[0];
  for (const w of BODY_PARTS) if (t.includes(w)) return w;
  return "";
}

/* 挑 n 个「位置相近、容易混淆」的穴做干扰项（分层取，先同部位/同经相邻） */
function locDecoys(pt, n) {
  const partOf = bodyPart;
  const part = partOf(pt);
  const noOf = (p) => { const g = /(\d+)\s*$/.exec(String(p.id).replace(/^EX-?/, "")); return g ? +g[1] : 0; };
  const me = noOf(pt);
  const pool = POINTS.filter((p) => p.id !== pt.id && p.loc).map((p) => ({
    p,
    sim: simLoc(p.loc, pt.loc),
    samePart: partOf(p) === part,
    sameZone: !!part && bodyZone(partOf(p)) === bodyZone(part),
    sameMer: p.m === pt.m,
    gap: p.m === pt.m ? Math.abs(noOf(p) - me) : 999,
  })).filter((x) => x.sim < 0.94)                    /* 位置几乎一样的排除，免得一题两解 */
     .filter((x) => !String(x.p.loc).includes(pt.n)); /* 干扰项定位里若写了本穴名，等于送答案 */

  /* 三档：①同部位/同经相邻/高度相似 ②同经或较像 ③同部位 */
  const tiers = [
    (x) => x.samePart,                    /* ①同一部位：胸对胸、腕对腕 */
    (x) => x.sameZone && x.sim >= 0.15,   /* ②同一大区、且定位说法沾边 */
    (x) => x.sameMer && x.gap <= 4,       /* ③同一条经上紧挨着的几穴 */
    (x) => x.sim >= 0.55,                 /* ④定位文字极像 */
    (x) => x.sameMer && x.gap <= 12,      /* ⑤同一经、距离不远的穴 */
  ];
  const out = [], used = new Set();
  for (const f of tiers) {
    if (out.length >= n) break;
    const cand = pool.filter((x) => !used.has(x.p.id) && f(x))
      .sort((a, b) => (b.sim + (b.samePart ? 0.35 : 0) + (b.sameZone ? 0.15 : 0) + (b.gap <= 3 ? 0.1 : 0))
                    - (a.sim + (a.samePart ? 0.35 : 0) + (a.sameZone ? 0.15 : 0) + (a.gap <= 3 ? 0.1 : 0)));
    /* 靠前的候选里随机挑，同一穴每次出的题不完全一样 */
    for (const x of shuffle(cand.slice(0, 9))) {
      if (out.length >= n) break;
      out.push(x.p); used.add(x.p.id);
    }
  }
  if (out.length < n) {                             /* 实在不够，按相似度兜底 */
    pool.filter((x) => !used.has(x.p.id)).sort((a, b) => b.sim - a.sim)
      .forEach((x) => { if (out.length < n) { out.push(x.p); used.add(x.p.id); } });
  }
  return out;
}


function locGrade(input, loc) {
  const a = normLoc(input);
  /* 只考核心定位，去掉「简便取穴」这类补充 */
  const core = String(loc || "").split(/简便取穴|简便定位/)[0];
  /* 括注里的细节（如「乳头外1寸」）作为加分项，不作硬要求 */
  const asides = [];
  const plain = core.replace(/（([^）]*)）|\(([^)]*)\)/g, (m, p1, p2) => {
    const x = (p1 || p2 || "").trim();
    if (normLoc(x).length >= 2) asides.push(x);
    return "，";
  });
  const segs = plain.split(/[，,。；;：:\/]/).map((s) => s.trim()).filter((s) => normLoc(s).length >= 2);
  if (!segs.length) {
    const target = normLoc(core);
    const ok = a.length >= 2 && (a === target || bestMatch(target, a) >= 0.7);
    return { ok, hit: ok ? [core.trim()] : [], miss: ok ? [] : [core.trim()], score: ok ? 1 : 0 };
  }
  /* 测量类关键信息：有它才算真的说清位置 */
  const MEAS = /寸|横指|凹陷|之间|中点|横纹|棘突|旁开|连线上|水平/;
  const hit = [], miss = [];
  let got = 0, total = 0, hitMeas = false;
  const weigh = (s) => (normLoc(s).length <= 4 ? 0.7 : 1);
  segs.forEach((seg) => {
    const w = weigh(seg);
    total += w;
    if (a.includes(normLoc(seg)) || bestMatch(normLoc(seg), a) >= 0.58) {
      hit.push(seg); got += w;
      if (MEAS.test(seg)) hitMeas = true;
    } else miss.push(seg);
  });
  /* 括注命中只加分、不扣分（细节写出来是加分项） */
  asides.forEach((x) => {
    if (a.includes(normLoc(x)) || bestMatch(normLoc(x), a) >= 0.58) { got += 0.4; total += 0.4; }
  });
  const score = total ? got / total : 0;
  /* 数值与单位必须对上：2寸 不能当 3寸 算，差一寸就是差一寸 */
  const locN = normLoc(core);
  const nums = locN.match(/\d+(?:寸|横指|分|厘米|cm)/g) || [];
  const numOK = !nums.length || nums.some((n) => a.includes(n));

  /* 全句都写中，当然算对；只写中一部分时，必须含测量信息才算说清位置 */
  const ok = a.length >= 2 && numOK && (score >= 0.999 || (score >= 0.5) || (score >= 0.35 && hitMeas));
  return { ok, hit, miss, score };
}

/* 逐窗比对：输入里有没有与某分句足够相近的一段（容错漏字、多字） */
function bestMatch(seg, input) {
  if (!seg || !input) return 0;
  if (input.includes(seg)) return 1;
  const bg = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const k = s.slice(i, i + 2);
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  };
  const B = bg(seg);
  const len = seg.length;
  let best = 0;
  for (let i = 0; i + Math.max(2, len - 2) <= input.length; i++) {
    for (const w of [len - 2, len, len + 1, len + 3]) {
      if (w < 2 || i + w > input.length) continue;
      const win = input.slice(i, i + w);
      const A = bg(win);
      let inter = 0, ta = 0, tb = 0;
      A.forEach((v, k) => { ta += v; inter += Math.min(v, B.get(k) || 0); });
      B.forEach((v) => { tb += v; });
      const d = (2 * inter) / (ta + tb || 1);
      if (d > best) best = d;
      if (best >= 1) return 1;
    }
  }
  return best;
}
const hashCode = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
};

/* 观测地（纬度决定北斗的周日轨迹；经度只影响几十分钟的恒星时） */
const OBS_CITIES = {
  上海: [31.23, 121.47], 北京: [39.90, 116.41], 广州: [23.13, 113.26], 成都: [30.57, 104.07],
  西安: [34.34, 108.94], 武汉: [30.59, 114.31], 昆明: [25.04, 102.71], 哈尔滨: [45.80, 126.53],
  乌鲁木齐: [43.83, 87.62], 香港: [22.32, 114.17], 台北: [25.03, 121.56],
};

/* ---------- 音效（WebAudio 木琴感） ---------- */
const Sfx = {
  ctx: null,
  ensure() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* 无音频 */ }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  tone(freq, delay, dur, type, vol) {
    if (!Progress.settings().sound) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },
  ok() { this.tone(660, 0, 0.15); this.tone(880, 0.09, 0.22); },
  no() { this.tone(196, 0, 0.2, "triangle", 0.1); },
  star() { this.tone(523, 0, 0.14); this.tone(659, 0.08, 0.14); this.tone(784, 0.16, 0.26); },
  click() { this.tone(440, 0, 0.06, "sine", 0.05); },
};

/* ---------- 语音：统一走 Voice 层（js/voice.js） ---------- */
const TTS = {
  ok() { return Voice.supported; },
  speak(text) { return Voice.say(text, { force: true }); },
};

/** 小喇叭：点一下朗读，再点停止 */
function speakBtn(text, cls) {
  const b = el("button", "spk" + (cls ? " " + cls : ""), "🔊");
  b.type = "button";
  b.title = "朗读";
  b._vt = b;
  b.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    Sfx.click();
    if (!Voice.supported) { toast("此浏览器不支持语音朗读"); return; }
    if (!Progress.settings().voice) { toast("语音已关闭，可在设置里打开"); return; }
    Voice.toggle(typeof text === "function" ? text() : text, b);
  };
  return b;
}

// 朗读状态 → 按钮高亮
Voice.subscribe(() => {
  document.querySelectorAll(".spk").forEach((b) => {
    b.classList.toggle("on", Voice.speaking && b._vt === Voice.tag);
  });
});

/* ============================================================
 * 星图
 * ============================================================ */
const StarMap = {
  canvas: null, ctx: null,
  stars: [],        // {pt, r, theta, size, phase}
  labels: [],       // {text, color, r, theta}
  rotation: 0,
  hoverId: null,
  showDipper: true,
  showFlow: true,
  lz: null,
  dipperNodes: [],
  dipperSize: 200,
  ringR: null,
  W: 0, H: 0,
  cyBias: 26,       // 顶栏让位

  init() {
    this.canvas = $("#sky");
    this.ctx = this.canvas.getContext("2d");
    this.layout();
    window.addEventListener("resize", () => this.layout());
    this.canvas.addEventListener("mousemove", (e) => this.onMove(e));
    this.canvas.addEventListener("mouseleave", () => { this.hoverId = null; });
    this.canvas.addEventListener("click", (e) => {
      const hit = this.pick(e);
      if (!hit) return;
      Sfx.click();
      if (hit.dipper) openDipperPanel(hit.dipper.star.key);
      else openCard(hit.pt.id);
    });
    requestAnimationFrame(() => this.draw());
  },

  layout() {
    const dpr = window.devicePixelRatio || 1;
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const maxR = Math.min(this.W, this.H) * 0.42;
    const BEND = 0.42;          // 旋臂弯曲强度
    const cx = this.W / 2, cy = this.H / 2 + this.cyBias;
    this.center = { x: cx, y: cy };
    const ARM_IN = 0.375;       // 旋臂起点：中心让给「北斗斗心 + 任督双环」
    this.stars = [];
    this.labels = [];

    // 十二经 = 十二条旋臂（任、督、奇穴另置）
    const ARMS = MERIDIAN_INFO.filter((m) => m.code !== "RN" && m.code !== "DU" && m.code !== "EX");
    ARMS.forEach((m, i) => {
      const base = -Math.PI / 2 + (i * Math.PI * 2) / ARMS.length;
      const pts = POINTS_BY_MERIDIAN[m.code] || [];
      const n = pts.length;
      /* 穴位多的经分股排布（BL 67 穴 → 三股），避免星点重叠、便于点选 */
      const strands = n > 48 ? 3 : n > 24 ? 2 : 1;
      const spread = 0.020;
      pts.forEach((pt, k) => {
        const t = n > 1 ? k / (n - 1) : 0;
        const r = maxR * (ARM_IN + (1 - ARM_IN) * t);
        const jit = (hashCode(pt.id) % 100) / 100;
        const lane = strands === 1 ? 0 : (k % strands) - (strands - 1) / 2;
        const theta = base + BEND * t + lane * spread + (jit - 0.5) * 0.028;
        const baseSize = strands === 1 ? 2.5 : strands === 2 ? 2.0 : 1.7;
        const size = baseSize + (hashCode(pt.id + "z") % 8) / 10;
        this.stars.push({ pt, r, theta, size, phase: jit * Math.PI * 2 });
      });
      this.labels.push({ text: m.name, color: m.color, r: maxR * 1.05, theta: base + BEND, code: m.code });
    });

    // 任督：中心双环——任脉里圈，督脉外圈（外移，让出斗心）
    const rn = POINTS_BY_MERIDIAN["RN"] || [];
    const du = POINTS_BY_MERIDIAN["DU"] || [];
    const ringR1 = maxR * 0.225;   // 任脉（里圈）
    const ringR2 = maxR * 0.300;   // 督脉（外圈）
    this.ringR = [ringR1, ringR2];
    rn.forEach((pt, k) => {
      this.stars.push({ pt, r: ringR1, theta: (k / rn.length) * Math.PI * 2 - Math.PI / 2, size: 2.2, phase: hashCode(pt.id) % 6 });
    });
    du.forEach((pt, k) => {
      const step = (k + 0.5) / du.length * Math.PI * 2;
      this.stars.push({ pt, r: ringR2, theta: step - Math.PI / 2, size: 2.4, phase: hashCode(pt.id) % 6 });
    });
    // 环名标注：任在内、督在外（固定方位，不随星图旋转）
    this.labels.push({ text: "任 · 里", color: "#e0aaff", r: ringR1 + 16, theta: -Math.PI / 2, small: true, fixed: true });
    this.labels.push({ text: "督 · 外", color: "#adb5bd", r: ringR2 + 16, theta: Math.PI / 2, small: true, fixed: true });

    // 经外奇穴：最外一圈
    const ex = POINTS_BY_MERIDIAN["EX"] || [];
    ex.forEach((pt, k) => {
      this.stars.push({ pt, r: maxR * 1.02, theta: (k / ex.length) * Math.PI * 2, size: 1.9, phase: hashCode(pt.id) % 6 });
    });
    this.labels.push({ text: "经外奇穴", color: "#d9a7ff", r: maxR * 1.155, theta: Math.PI * 0.885 });

    /* 北斗图层：置于圆心正中，为全图「斗心」
       方向取自真实天象——斗柄此刻在地平面上的方位角（详见 js/astro.js） */
    const boxW = Math.min(maxR * 0.40, 210);
    this.dipperSize = boxW;
    this.dipperCenter = { x: cx, y: cy };
    this.dipperNodes = this.layoutDipper(this.dipperSize, this.dipperCenter, Date.now());

    this.maxR = maxR;
    // 穴位 id → 星，供流注连线取用
    this.starById = {};
    for (const s of this.stars) this.starById[s.pt.id] = s;
  },

  /* ---------- 北斗：按真实天象落位 ---------- */

  /** 七点基准形（斗心在 0.5/0.46，纵向压扁 0.62），转成以斗心为原点 */
  dipperBase() {
    const SQUASH = 0.62;
    return [[0.10, 0.28], [0.05, 0.56], [0.30, 0.64], [0.35, 0.32], [0.54, 0.42], [0.73, 0.52], [0.93, 0.64]]
      .map(([x, y]) => ({ x: x - 0.5, y: (y - 0.46) * SQUASH }));
  },

  /**
   * 按此刻真实天象摆放北斗
   * 斗柄在地平面上的方位角 → 决定整个斗的旋转；斗柄上扬角度 → 沿柄轴做透视缩短。
   */
  layoutDipper(boxW, c, now) {
    const s = Progress.settings();
    const sky = Astro.dipper(now || Date.now(), s.obsLat, s.obsLon);
    this.sky = sky;

    const base = this.dipperBase();
    const baseAngle = Math.atan2(base[6].y - base[3].y, base[6].x - base[3].x);  // 基准柄角
    const tilt = Math.abs(sky.handleTilt) * Math.PI / 180;
    const sq = 0.58 + 0.42 * Math.abs(Math.cos(tilt));   // 越朝天，柄轴越短

    const a1 = -baseAngle, c1 = Math.cos(a1), s1 = Math.sin(a1);
    const a2 = (sky.handleAz - 90) * Math.PI / 180, c2 = Math.cos(a2), s2 = Math.sin(a2);
    const pts = base.map((p) => {
      const x = (p.x * c1 - p.y * s1) * sq;
      const y = p.x * s1 + p.y * c1;
      return { x: x * c2 - y * s2, y: x * s2 + y * c2 };
    });
    let m = 0;
    for (const p of pts) m = Math.max(m, Math.hypot(p.x, p.y));
    const k = (boxW * 0.36) / (m || 1);

    return DIPPER_STARS.map((st, i) => ({ star: st, x: c.x + pts[i].x * k, y: c.y + pts[i].y * k }));
  },

  /** 天象随时在变，每 8 秒重新落位一次（斗柄约 0.25°/分，看不出跳） */
  refreshDipper(force) {
    const t = Date.now();
    if (!force && this._dipAt && t - this._dipAt < 8000) return;
    this._dipAt = t;
    if (!this.dipperCenter) return;
    this.dipperNodes = this.layoutDipper(this.dipperSize, this.dipperCenter, t);
  },

  pos(s) {
    const cx = this.W / 2, cy = this.H / 2 + this.cyBias;
    const a = s.theta + this.rotation;
    return { x: cx + Math.cos(a) * s.r, y: cy + Math.sin(a) * s.r };
  },

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    /* 斗心在上，优先命中 */
    if (this.showDipper) {
      const dpick = this.maxR < 260 ? 8 : 10;
      let best = null, bestD = dpick;
      for (const n of this.dipperNodes) {
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d < bestD) { bestD = d; best = { dipper: n }; }
      }
      if (best) return best;
    }
    let best = null, bestD = 11;
    for (const s of this.stars) {
      const p = this.pos(s);
      const d = Math.hypot(p.x - mx, p.y - my);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  },

  onMove(e) {
    const hit = this.pick(e);
    this.hoverId = hit ? (hit.dipper ? "D:" + hit.dipper.star.key : hit.pt.id) : null;
    this.canvas.style.cursor = hit ? "pointer" : "default";
  },

  starState(pt) {
    const c = Progress.card(pt.id);
    const now = Date.now();
    if (!c || c.st === "new") return "dim";
    if (isMastered(c)) return "mastered";
    const seenDay = c.seen ? Progress.todayKey(c.seen) : "";
    if (seenDay === Progress.todayKey(now)) return "today";
    return "learning";
  },

  draw() {
    const ctx = this.ctx;
    this.rotation += 0.00022;
    ctx.clearRect(0, 0, this.W, this.H);

    // 背景微星尘
    ctx.save();
    for (let i = 0; i < 70; i++) {
      const x = (hashCode("dust" + i) % this.W);
      const y = (hashCode("dust2" + i) % this.H);
      ctx.globalAlpha = 0.05 + (i % 5) * 0.015;
      ctx.fillStyle = "#aab4d4";
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    ctx.restore();

    const cx = this.W / 2, cy = this.H / 2 + this.cyBias;
    const now = Date.now();
    const lz = this.showFlow ? Liuzhu.at(now) : null;
    this.lz = lz;

    // 经脉连线（淡）——任督环与经外环自身成圈，不参与连线
    MERIDIAN_INFO.forEach((m) => {
      if (m.code === "RN" || m.code === "DU" || m.code === "EX") return;
      const pts = this.stars.filter((s) => s.pt.m === m.code && s.r > this.maxR * 0.2);
      pts.sort((a, b) => a.r - b.r);
      if (pts.length < 2) return;
      ctx.beginPath();
      pts.forEach((s, i) => {
        const p = this.pos(s);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = m.color;
      ctx.globalAlpha = 0.10;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // 斗心光晕（北斗居圆心）
    if (this.showDipper) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.maxR * 0.30);
      halo.addColorStop(0, "rgba(244,185,66,.075)");
      halo.addColorStop(0.62, "rgba(244,185,66,.028)");
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, this.maxR * 0.30, 0, Math.PI * 2);
      ctx.fill();
    }

    // 任督双环引导线（任在内、督在外）
    if (this.ringR) {
      this.ringR.forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? "rgba(224,170,255,.20)" : "rgba(173,181,189,.18)";
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }

    // 子午流注：当令经「已点亮」诸穴串成暖线，光从井穴顺经流向当下
    if (lz && lz.idx > 0) {
      const chain = lz.points.slice(0, lz.idx + 1).map((pt) => this.starById[pt.id]).filter(Boolean);
      if (chain.length > 1) {
        ctx.beginPath();
        chain.forEach((s, i) => {
          const p = this.pos(s);
          if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = "rgba(244,185,66,.34)";
        ctx.lineWidth = 1.7;
        ctx.stroke();
      }
    }

    // 星
    for (const s of this.stars) {
      const p = this.pos(s);
      const state = this.starState(s.pt);
      const tw = 0.78 + 0.22 * Math.sin(now / 900 + s.phase);
      let color, glow, glowR;
      if (state === "dim") { color = "#5a6472"; glow = "rgba(90,100,114,0.25)"; glowR = s.size * 2; }
      else if (state === "learning") { color = "#f4b942"; glow = "rgba(244,185,66,0.5)"; glowR = s.size * 3.2; }
      else if (state === "today") { color = "#6be2ff"; glow = "rgba(107,226,255,0.65)"; glowR = s.size * 4; }
      else { color = "#ffffff"; glow = "rgba(255,255,255,0.6)"; glowR = s.size * 4; }

      /* 子午流注：当令经另有三种光态——已过（暖金）、当下（亮金脉冲）、未到（微光待燃） */
      let flow = null;
      if (lz && s.pt.m === lz.code) {
        flow = s.pt.o < lz.idx + 1 ? "past" : s.pt.o === lz.idx + 1 ? "cur" : "next";
        if (flow === "cur") { color = "#fff1c0"; glow = "rgba(255,209,102,.85)"; glowR = s.size * 7.5; }
        else if (flow === "past") { color = "#f4b942"; glow = "rgba(244,185,66,.5)"; glowR = s.size * 3.6; }
        else { color = "#6f6244"; glow = "rgba(244,185,66,.10)"; glowR = s.size * 2.2; }
      }

      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      g.addColorStop(0, glow);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      const baseAlpha = state === "dim" && !flow ? 0.55 * tw + 0.2 : tw;
      ctx.globalAlpha = flow === "next" ? 0.42 : baseAlpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.size * (state === "dim" && !flow ? 1 : 1.15), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // 当令穴：一圈扩散的光环
      if (flow === "cur") {
        const t = (now % 2400) / 2400;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s.size + 4 + t * 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,209,102,${(0.6 * (1 - t)).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      if (this.hoverId === s.pt.id) {
        ctx.fillStyle = "#e8ecf4";
        ctx.font = "600 14px 'PingFang SC','Microsoft YaHei',sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(s.pt.n, p.x, p.y - s.size - 8);
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#9aa5bd";
        ctx.fillText((MERIDIAN_BY_CODE[s.pt.m] || {}).short + "经 · " + s.pt.p, p.x, p.y - s.size - 24);
      }
    }

    // 经脉名标签（当令经的名字加亮）
    for (const L of this.labels) {
      const a = L.theta + (L.fixed ? 0 : this.rotation);
      const x = cx + Math.cos(a) * L.r;
      const y = cy + Math.sin(a) * L.r;
      if (x < -40 || x > this.W + 40) continue;
      if (y < 60 || y > this.H - 44) continue;   // 避让顶栏与底部提示/图例
      const on = lz && L.code === lz.code;
      ctx.fillStyle = on ? "#ffe3a3" : L.color;
      ctx.globalAlpha = on ? 1 : 0.8;
      ctx.font = (on ? "700 13px" : (L.small ? "10px" : "12px")) + " 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.textAlign = "center";
      if (on) {
        ctx.shadowColor = "rgba(255,209,102,.8)";
        ctx.shadowBlur = 10;
      }
      ctx.fillText(L.text, x, y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // 北斗图层（天星十二穴）
    if (this.showDipper) this.drawDipper(ctx, now);

    requestAnimationFrame(() => this.draw());
  },

  drawDipper(ctx, now) {
    this.refreshDipper(false);
    const nodes = this.dipperNodes;
    if (!nodes.length) return;
    const LINKS = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]];
    const compact = this.maxR < 260;
    const c = this.dipperCenter || this.center || { x: this.W / 2, y: this.H / 2 };
    const boxW = this.dipperSize || 150;
    const ringR = boxW * 0.52;
    const sky = this.sky || {};

    ctx.save();

    /* 罗盘方位环：北在上、东在右——斗柄指哪个方位，一眼可读 */
    ctx.beginPath();
    ctx.arc(c.x, c.y, ringR, 0, Math.PI * 2);
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = "rgba(232,236,244,.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    if (!compact) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "8px 'PingFang SC','Microsoft YaHei',sans-serif";
      [["北", 0], ["东", Math.PI / 2], ["南", Math.PI], ["西", -Math.PI / 2]].forEach(([t, a]) => {
        const x = c.x + Math.sin(a) * ringR, y = c.y - Math.cos(a) * ringR;
        ctx.fillStyle = "rgba(154,165,189,.40)";
        ctx.fillText(t, x, y);
      });
      ctx.restore();
    }

    /* 斗柄指向：自斗心射出的一支细箭 */
    if (sky.handleAz != null) {
      const a = sky.handleAz * Math.PI / 180;
      const ux = Math.sin(a), uy = -Math.cos(a);
      const r0 = ringR * 0.30, r1 = ringR * 0.96;
      ctx.beginPath();
      ctx.moveTo(c.x + ux * r0, c.y + uy * r0);
      ctx.lineTo(c.x + ux * r1, c.y + uy * r1);
      ctx.strokeStyle = "rgba(244,185,66,.45)";
      ctx.lineWidth = 1.1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      // 箭头
      const tip = ringR * 0.99, hw = 3.2, hl = 6;
      ctx.beginPath();
      ctx.moveTo(c.x + ux * tip, c.y + uy * tip);
      ctx.lineTo(c.x + ux * (tip - hl) - uy * hw, c.y + uy * (tip - hl) + ux * hw);
      ctx.lineTo(c.x + ux * (tip - hl) + uy * hw, c.y + uy * (tip - hl) - ux * hw);
      ctx.closePath();
      ctx.fillStyle = "rgba(244,185,66,.55)";
      ctx.fill();
    }

    // 斗魁方框 + 斗柄折线
    ctx.beginPath();
    LINKS.forEach(([a, b]) => { ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); });
    ctx.strokeStyle = "rgba(244,185,66,.34)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const R = compact ? 2.4 : 3.1;
    nodes.forEach((n, idx) => {
      const st = sky.stars ? sky.stars[idx] : null;
      const up = st ? st.up : true;          // 没入地平线的星，画得暗些
      const m = dipperMastery(n.star);
      const full = m.mastered === m.total;
      const touched = m.mastered + m.learning > 0;
      const hover = this.hoverId === "D:" + n.star.key;
      const col = full ? "#ffffff" : touched || hover ? "#f4b942" : "#7c85a0";
      const glowR = full ? 15 : hover ? 14 : 11;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
      g.addColorStop(0, full ? "rgba(255,255,255,.6)" : touched || hover ? "rgba(244,185,66,.55)" : "rgba(124,133,160,.30)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = up ? 1 : 0.35;
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2); ctx.fill();

      const tw = 0.82 + 0.18 * Math.sin(now / 800 + n.star.no);
      ctx.globalAlpha = (up ? 1 : 0.35) * tw;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;

      if (!compact) {
        // 星名向外侧引出，避免斗身旋转后互相压字
        const dx = n.x - c.x, dy = n.y - c.y;
        const d = Math.hypot(dx, dy) || 1;
        ctx.save();
        ctx.globalAlpha = up ? 1 : 0.4;
        ctx.font = (hover ? "600 9.5px" : "9px") + " 'PingFang SC','Microsoft YaHei',sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = hover ? "#ffe3a3" : "rgba(154,165,189,.68)";
        ctx.fillText(n.star.key, n.x + (dx / d) * 11, n.y + (dy / d) * 11);
        ctx.restore();
      }
    });

    ctx.restore();
  },

  /** 今日队列（新卡按经脉顺序轮转取样） */
  buildQueue() {
    const settings = Progress.settings();
    const now = Date.now();
    const due = [], fresh = [];
    const miIndex = {};
    MERIDIAN_INFO.forEach((m, i) => { miIndex[m.code] = i; });
    for (const pt of POINTS) {
      const c = Progress.data.cards[pt.id];
      if (!c || c.st === "new") fresh.push(pt);
      else if (c.due <= now) due.push(pt);
    }
    due.sort((a, b) => Progress.data.cards[a.id].due - Progress.data.cards[b.id].due);
    fresh.sort((a, b) => (miIndex[a.m] - miIndex[b.m]) || (a.o - b.o));
    const today = Progress.todayStats(now);
    const allow = Math.max(0, settings.newPerDay - today.newCount);
    return { due, fresh: fresh.slice(0, allow) };
  },
};

/* ============================================================
 * 今日学习（三题型）
 * ============================================================ */
const TYPES = [
  { key: "ind2acu", label: "见主治 · 选穴" },
  { key: "loc-tf", label: "定位 · 判断" },
  { key: "spell", label: "辨位 · 四选一" },
];

const Learn = {
  queue: [],        // [{pt, retried}]
  total: 0,
  done: 0,
  current: null,
  retries: {},      // id -> 重排次数

  start() {
    const { due, fresh } = StarMap.buildQueue();
    this.queue = due.map((pt) => ({ pt })).concat(shuffle(fresh).map((pt) => ({ pt })));
    this.total = this.queue.length;
    this.done = 0;
    this.retries = {};
    if (this.total === 0) {
      showView("learn");
      this.renderDone(true);
      return;
    }
    showView("learn");
    this.next();
  },

  requeue(pt) {
    const n = this.retries[pt.id] || 0;
    if (n >= 2) return;
    this.retries[pt.id] = n + 1;
    this.queue.push({ pt });
    this.total += 1;
  },

  next() {
    this.current = this.queue.shift() || null;
    this.updateBar();
    if (!this.current) { this.renderDone(false); return; }
    this.renderQuestion();
  },

  updateBar() {
    $("#learn-bar").style.width = this.total ? `${(this.done / this.total) * 100}%` : "0%";
    $("#learn-count").textContent = `${this.done} / ${this.total}`;
  },

  pickType() {
    const pool = [0, 1, 2];
    return pool[Math.floor(Math.random() * pool.length)];
  },

  /** 自动朗读（可关）：题目换了就念，不打断用户操作 */
  say(text, btn) {
    if (!Progress.settings().autoRead || !Progress.settings().voice) return;
    setTimeout(() => {
      if ($("#view-learn").hidden) return;
      Voice.say(text, { tag: btn || null });
    }, 300);
  },

  renderQuestion() {
    const pt = this.current.pt;
    const typeIdx = this.current.type != null ? this.current.type : this.pickType();
    this.current.type = typeIdx;
    const area = $("#quiz-area");
    area.innerHTML = "";
    const card = el("div", "quiz-card");
    const qhead = el("div", "q-head");
    qhead.appendChild(el("span", "q-type", TYPES[typeIdx].label));
    card.appendChild(qhead);

    if (typeIdx === 0) this.renderInd2Acu(card, pt);
    else if (typeIdx === 1) this.renderLocTF(card, pt);
    else this.renderSpell(card, pt);

    area.appendChild(card);
    this.updateBar();
  },

  /* 题干：主治 → 选穴 */
  renderInd2Acu(card, pt) {
    const indMain = pt.ind.split("；").slice(0, 2).join("；");
    const prompt = el("div", "q-prompt",
      `<b>主治：</b>${indMain}${pt.ind.split("；").length > 2 ? "……" : ""}<br><span class="py">以上病证，首选哪一穴？</span>`);
    const spk = speakBtn(`主治：${indMain}。以上病证，首选哪一穴？`);
    prompt.appendChild(spk);
    card.appendChild(prompt);
    this.say(`主治：${indMain}。以上病证，首选哪一穴？`, spk);
    const opts = this.makeOptions(pt, (p) => p.n, (p) => p.p);
    const wrap = el("div", "options");
    opts.forEach((o) => {
      const b = el("button", "opt", `${o.value}<span class="opt-sub">${o.sub || ""}</span>`);
      b.onclick = () => this.answer(b, wrap, o.correct, pt, {
        verdict: o.correct ? `正是 ${pt.n}（${pt.p}）` : `正确答案是 ${pt.n}（${pt.p}）`,
        truth: `<b>定位：</b>${pt.loc}<br><b>主治：</b>${pt.ind}`,
      });
      wrap.appendChild(b);
    });
    card.appendChild(wrap);
  },

  /* 题干：定位判断 */
  renderLocTF(card, pt) {
    const wrong = Math.random() < 0.5;
    let shownLoc = pt.loc;
    if (wrong) {
      const others = POINTS.filter((p) => p.id !== pt.id && (p.m === pt.m || Math.random() < 0.15));
      const decoy = others[Math.floor(Math.random() * others.length)] || POINTS[0];
      shownLoc = decoy.loc;
    }
    const prompt = el("div", "q-prompt",
      `<span class="big">${pt.n} <span class="py" style="letter-spacing:0">${pt.p}</span></span><b>定位：</b>${shownLoc}<br><span class="py">这一定位描述是否正确？</span>`);
    const spk = speakBtn(`${pt.n}。定位：${shownLoc}。这一定位描述是否正确？`);
    prompt.appendChild(spk);
    card.appendChild(prompt);
    this.say(`${pt.n}。定位：${shownLoc}。这一定位描述是否正确？`, spk);
    const wrap = el("div", "tf");
    const mk = (label, val) => {
      const b = el("button", "opt", label);
      b.onclick = () => this.answer(b, wrap, val === !wrong, pt, {
        verdict: val === !wrong ? "判断正确" : `判断失误——${wrong ? "这是别的穴的定位" : "没错，正是它"}`,
        truth: `<b>${pt.n} 的定位：</b>${pt.loc}<br><b>主治：</b>${pt.ind}`,
      });
      wrap.appendChild(b);
    };
    mk("✓ 正确", true);
    mk("✕ 错误", false);
    card.appendChild(wrap);
  },

  /* 题干：辨位（四条定位，直接点选，点完即判） */
  renderSpell(card, pt) {
    const hintInd = pt.ind.split("；")[0];
    const opts = shuffle([{ p: pt }].concat(locDecoys(pt, 3).map((p) => ({ p }))));
    const answerNo = opts.findIndex((o) => o.p.id === pt.id) + 1;

    const prompt = el("div", "q-prompt",
      `<span class="big">${pt.n} <span class="py" style="letter-spacing:0">${pt.p}</span></span>`
      + `<span class="py">主治：${hintInd}……</span><br>`
      + `<span class="py">下面四条定位，哪一条是 <b>${pt.n}</b> 的？点一下选它</span>`);
    const spk = speakBtn(`${pt.n}。主治：${hintInd}。下面有四条定位，请选出属于${pt.n}的那一条，点一下即可。`);
    prompt.appendChild(spk);
    card.appendChild(prompt);
    this.say(`${pt.n}。下面四条定位，请选出属于它的一条，点一下即可。`, spk);

    const box = el("div", "locopts");
    const rows = [];
    const judge = (n) => {
      if (!this.current || this.current.answered) return;
      const ok = n === answerNo;
      const chosen = opts[n - 1].p;
      rows.forEach((r, i) => {
        r.disabled = true;
        r.classList.add(i + 1 === answerNo ? "is-right" : (i + 1 === n ? "is-wrong" : "is-dim"));
      });
      const list = opts.map((o, i) => `${i + 1}. ${o.p.n}`).join("　");
      this.answer(null, box, ok, pt, {
        verdict: ok ? `第 ${n} 条，正是 ${pt.n} 的定位` : `第 ${n} 条是「${chosen.n}」的定位：${chosen.loc}`,
        truth: `<b>正确答案：第 ${answerNo} 条</b> —— ${pt.loc}`
          + `<br><span class="py">四条依次是：${list}</span>`,
      }, true);
    };
    opts.forEach((o, i) => {
      const r = el("button", "locopt");
      r.type = "button";
      r.appendChild(el("i", "lo-no", String(i + 1)));
      r.appendChild(el("span", "lo-txt", o.p.loc));
      r.onclick = () => judge(i + 1);
      box.appendChild(r);
      rows.push(r);
    });
    card.appendChild(box);
    card.appendChild(el("div", "pick-hint", "点上面任意一条，立刻判对错"));
  },

  /* 选项生成：同经优先做干扰项 */
  makeOptions(pt, valueOf, subOf) {
    const same = POINTS.filter((p) => p.m === pt.m && p.id !== pt.id);
    const others = POINTS.filter((p) => p.m !== pt.m && p.id !== pt.id);
    const pool = shuffle(same).slice(0, 3);
    while (pool.length < 3) {
      const o = others[Math.floor(Math.random() * others.length)];
      if (!pool.find((p) => p.id === o.id)) pool.push(o);
    }
    const all = shuffle([{ p: pt, correct: true }].concat(shuffle(pool).map((p) => ({ p, correct: false }))));
    return all.map((x) => ({ value: valueOf(x.p), sub: subOf ? subOf(x.p) : "", correct: x.correct }));
  },

  /* 答题反馈 + 自动评分（错→忘记，对→良好） */
  answer(btn, wrap, correct, pt, fbTexts, keepRow) {
    if (this.current && this.current.answered) return;
    if (this.current) this.current.answered = true;
    if (wrap && !keepRow) {
      wrap.querySelectorAll(".opt").forEach((b) => { b.disabled = true; });
    }
    if (btn && !keepRow) btn.classList.add(correct ? "correct" : "wrong");
    if (!correct && wrap && !keepRow) {
      const right = wrap.querySelector(".opt[data-right]");
      // 高亮正确项：重新按 value 找不到就跳过（feedback 里已有答案）
    }
    if (correct) Sfx.ok(); else Sfx.no();

    const quiz = $("#quiz-area .quiz-card");
    const fb = el("div", "feedback");
    const tx = tianxingOf(pt.id);
    const fbSpeech = [
      fbTexts.verdict,
      pt.tip ? `记忆钩子：${pt.tip}` : "",
      tx ? `天星十二穴，属北斗${tx.star.key}。歌诀「${tx.songLine}」` : "",
    ].filter(Boolean).join("。");
    const spk = speakBtn(fbSpeech);
    const verdict = el("div", "verdict " + (correct ? "ok" : "no"), (correct ? "✓ " : "✕ ") + fbTexts.verdict);
    verdict.appendChild(spk);
    fb.appendChild(verdict);
    if (pt.tip) fb.appendChild(el("div", "hook", "🕯 " + pt.tip));
    const njBrief = briefOf(pt);
    if (njBrief) fb.appendChild(el("div", "fb-namejie", `📖 名解：${njBrief}`));
    if (tx) {
      fb.appendChild(el("div", "hook tx-line",
        `✦ 天星十二穴 · 北斗${tx.star.key}（第${tx.star.no}星）　歌诀「${tx.songLine}」<br>${tx.star.combo}`));
    }
    fb.appendChild(el("div", "truth", fbTexts.truth));

    // 评分（第一次作答才计分，由 answer 置 answered 保证）
    const grade = correct ? Rating.Good : Rating.Again;
    const before = Progress.card(pt.id);
    const wasNew = !before || before.st === "new";
    Progress.apply(pt.id, grade, Date.now());
    const after = Progress.card(pt.id);
    if (wasNew && after.st !== "new") Sfx.star();
    if (!correct) this.requeue(pt);

    const nextBtn = el("button", "btn btn-primary", "下一题 →");
    nextBtn.onclick = () => { this.done += 1; this.updateBar(); this.next(); };
    const nr = el("div", "next-row");
    nr.appendChild(nextBtn);
    fb.appendChild(nr);
    quiz.appendChild(fb);
    this.say(fbSpeech, spk);
    nextBtn.focus();
    updateStats();
  },

  renderDone(allClear) {
    const area = $("#quiz-area");
    area.innerHTML = "";
    const { due } = StarMap.buildQueue();
    const stats = Progress.todayStats();
    const card = el("div", "quiz-card done-card");
    const dhead = el("div", "q-head");
    dhead.appendChild(el("span", "q-type", "本 轮 小 结"));
    card.appendChild(dhead);
    card.appendChild(el("h2", "", allClear ? "✦ 今日无待学" : "✦ 今日圆满"));
    card.appendChild(el("p", "",
      allClear
        ? "队列里暂时没有要学的穴位。<br>去星图上看看已经点亮的那些星吧。"
        : `本轮完成。<br>今日已学 <b>${stats.newCount}</b> 穴 · 答题 <b>${stats.reviews}</b> 次。<br>${due.length ? "稍后还有 " + due.length + " 穴到期复习。" : "今日没有其他到期复习。"}`));
    const back = el("button", "btn btn-primary", "回到星图");
    back.onclick = () => { showView("map"); updateStats(); };
    card.appendChild(back);
    area.appendChild(card);
    updateStats();
  },
};

/* ============================================================
 * 穴卡
 * ============================================================ */
function openCard(id) {
  const pt = POINTS_BY_ID[id];
  if (!pt) return;
  const m = MERIDIAN_BY_CODE[pt.m];
  const tx = tianxingOf(pt.id);
  const body = $("#card-body");
  body.innerHTML = "";
  Voice.stop();

  const head = el("div", "acu-head");
  head.appendChild(el("span", "acu-name", pt.n));
  head.appendChild(el("span", "acu-py", pt.p));
  head.appendChild(el("span", "acu-id", pt.id));
  body.appendChild(head);

  // 朗读：穴名 / 全篇
  const acts = el("div", "acu-acts");
  const nameBtn = speakBtn(`${pt.n}。${m ? m.name : ""}${pt.attr ? "，" + pt.attr : ""}`, "spk-lg");
  const allBtn = speakBtn(() => cardSpeech(pt, m, tx), "spk-wide");
  allBtn.textContent = "🔊 全篇朗读";
  acts.appendChild(nameBtn);
  acts.appendChild(allBtn);
  body.appendChild(acts);

  const meri = el("div");
  const badge = el("span", "acu-meri", m ? m.name : "");
  if (m) badge.style.borderColor = m.color, badge.style.color = m.color;
  meri.appendChild(badge);
  if (pt.attr) meri.appendChild(el("span", "acu-attr", pt.attr));
  body.appendChild(meri);

  /* 名解（精简一句）——置于最显眼处 */
  const brief = briefOf(pt);
  if (brief) {
    const box = el("div", "nj-brief");
    box.appendChild(el("span", "nj-tag", "名解"));
    box.appendChild(el("span", "nj-text", brief));
    box.appendChild(speakBtn(`名解。${brief}`));
    body.appendChild(box);
  }

  const sec = (title, text, dim, speech) => {
    if (!text) return;
    const s = el("div", "acu-sec");
    const h = el("h4", "", title);
    h.appendChild(speakBtn(speech || text));
    s.appendChild(h);
    s.appendChild(el("p", dim ? "dim" : "", text));
    body.appendChild(s);
  };
  sec("定 位", pt.loc, false, `定位：${pt.loc}`);
  sec("主 治", pt.ind, false, `主治：${pt.ind}`);
  sec("操 作", pt.op, false, `操作：${pt.op}`);
  sec("配 伍", pt.px, true, `配伍：${pt.px}`);

  /* 天星十二穴 · 北斗归属 */
  if (tx) {
    const badge = el("span", "acu-meri acu-tianxing", `天星十二穴 · ${tx.star.key}`);
    badge.style.marginLeft = "8px";
    meri.appendChild(badge);
    const s = el("div", "acu-sec");
    const h = el("h4", "", "天 星 · 北 斗");
    h.appendChild(speakBtn(`${tx.star.key}。${tx.star.theme}：${tx.star.use}。${tx.star.combo}。同星：${tx.partners.map((pid) => POINTS_BY_ID[pid].n).join("、")}`));
    s.appendChild(h);
    s.appendChild(el("p", "", `所属 <b>${tx.star.key}</b>（北斗第 ${tx.star.no} 星 · ${tx.star.part}）　歌诀「${tx.songLine}」`));
    s.appendChild(el("p", "dim",
      `${tx.star.theme}：${tx.star.use}<br>${tx.star.combo}<br>同星：${tx.partners.map((pid) => POINTS_BY_ID[pid].n).join("、")}`));
    body.appendChild(s);
  }

  const tipEl = el("div", "acu-tip", `<b>记忆钩子</b> · ${pt.tip}`);
  tipEl.appendChild(speakBtn(`记忆钩子：${pt.tip}`));
  body.appendChild(tipEl);

  // 复习区（评分档位随 FSRS：1 忘记 / 2 模糊 / 3 良好 / 4 轻松）
  const c = Progress.card(id);
  const grades = el("div", "card-grades");
  if (!c) {
    grades.appendChild(el("div", "label", "此穴还未进入你的学习计划——遇到它再复习不迟，也可现在就认下："));
  } else {
    const stName = c.st === State.Review ? "复习中 · 间隔 " + (c.sd || 0) + " 天"
      : c.st === State.Relearning ? "重学中"
      : "学习中";
    grades.appendChild(el("div", "label",
      `当前：${stName}${isMastered(c) ? " · 已点亮 ✦" : ""}　稳定度 ${(c.s || 0).toFixed(1)} 天，难度 ${(c.d || 0).toFixed(1)}。刚才感觉如何？`));
  }
  const grid = el("div", "grades");
  const prev = previewCard(c || null, Date.now(), Progress.settings().retention);
  const GRADE_META = [
    { g: Rating.Again, name: "忘记", cls: "g-btn g-again" },
    { g: Rating.Hard, name: "模糊", cls: "g-btn" },
    { g: Rating.Good, name: "良好", cls: "g-btn g-good" },
    { g: Rating.Easy, name: "轻松", cls: "g-btn" },
  ];
  GRADE_META.forEach((meta) => {
    const b = el("button", meta.cls, `${meta.name}<small>${formatInterval(prev[meta.g])}后</small>`);
    b.onclick = () => {
      const wasNew = !c;
      Progress.apply(id, meta.g, Date.now());
      if (wasNew) Sfx.star(); else Sfx.click();
      toast(`已记下：${pt.n} · ${meta.name}`);
      $("#card-modal").hidden = true;
      updateStats();
      if ($("#dipper-panel").hidden === false) renderDipperPanel();
    };
    grid.appendChild(b);
  });
  grades.appendChild(grid);
  body.appendChild(grades);

  $("#card-modal").hidden = false;
  if (Progress.settings().autoRead && Progress.settings().voice) {
    setTimeout(() => {
      if ($("#card-modal").hidden) return;
      Voice.say(`${pt.n}。${m ? m.name : ""}。${pt.loc}`, { tag: nameBtn });
    }, 180);
  }
}

/** 穴卡整篇朗读稿 */
/* 名解精简句（去掉开头的穴名，卡片上穴名已单列） */
function briefOf(pt) {
  if (typeof NAMEJIE_BRIEF === "undefined" || !pt) return null;
  const s = NAMEJIE_BRIEF[pt.id];
  if (!s) return null;
  return s.replace(new RegExp("^" + pt.n + "[：:]\\s*"), "").trim();
}

function cardSpeech(pt, m, tx) {
  const brief = briefOf(pt);
  return [
    `${pt.n}，${m ? m.name : ""}${pt.attr ? "，" + pt.attr : ""}`,
    brief ? `名解：${brief}` : "",
    `定位：${pt.loc}`,
    `主治：${pt.ind}`,
    `操作：${pt.op}`,
    pt.px ? `配伍：${pt.px}` : "",
    tx ? `天星十二穴，属北斗${tx.star.key}。歌诀「${tx.songLine}」。${tx.star.theme}：${tx.star.use}。${tx.star.combo}` : "",
    `记忆钩子：${pt.tip}`,
  ].filter(Boolean).join("。");
}

/* ============================================================
 * 北斗面板（天星十二穴总览）
 * ============================================================ */
function renderSkyBlock() {
  const box = $("#dipper-sky");
  if (!box) return;
  box.innerHTML = "";
  const s = Progress.settings();
  const d = Astro.dipper(Date.now(), s.obsLat, s.obsLon);
  const card = el("div", "sky-row");

  const az = d.handleAz;
  const dial = el("div", "sky-dial");
  dial.innerHTML = `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(232,236,244,.16)" stroke-dasharray="2 4"/>
      <text x="32" y="9.5" text-anchor="middle" font-size="7" fill="rgba(154,165,189,.65)">北</text>
      <text x="57" y="34.5" text-anchor="middle" font-size="7" fill="rgba(154,165,189,.65)">东</text>
      <text x="32" y="59.5" text-anchor="middle" font-size="7" fill="rgba(154,165,189,.65)">南</text>
      <text x="7" y="34.5" text-anchor="middle" font-size="7" fill="rgba(154,165,189,.65)">西</text>
      <g transform="rotate(${az.toFixed(1)} 32 32)">
        <line x1="32" y1="36" x2="32" y2="17" stroke="rgba(244,185,66,.75)" stroke-width="1.4"/>
        <polygon points="32,10 28.4,18 35.6,18" fill="#f4b942"/>
      </g>
      <circle cx="32" cy="32" r="3" fill="rgba(244,185,66,.55)"/>
    </svg>`;
  card.appendChild(dial);

  const txt = el("div", "sky-txt");
  txt.appendChild(el("div", "sky-h",
    `斗柄指 <b>${d.handleDir}</b> · ${az.toFixed(0)}°`
    + `<span>${Math.abs(d.handleTilt) > 70 ? "近于朝天" : d.handleTilt >= 0 ? "上扬" : "低垂"} ${Math.abs(d.handleTilt).toFixed(0)}°</span>`));
  txt.appendChild(el("div", "sky-m",
    `${s.obsName || "上海"}（北纬 ${(s.obsLat || 31.23).toFixed(1)}°）　此刻 · `
    + new Date().toTimeString().slice(0, 5)
    + `　七星在地平线上 ${d.upCount}/7`));
  txt.appendChild(el("div", "sky-m",
    "北斗绕北极周日转动，一时辰约转 30°，早晚指向自然不同。"
    + "古法初昏观斗柄以定四时——<b>东指春、南指夏、西指秋、北指冬</b>。"));
  card.appendChild(txt);
  box.appendChild(card);
}

function renderDipperPanel() {
  const body = $("#dipper-body");
  body.innerHTML = "";
  renderSkyBlock();
  DIPPER_STARS.forEach((s) => {
    const m = dipperMastery(s);
    const row = el("div", "dp-row");
    const head = el("div", "dp-head");
    head.appendChild(el("span", "dp-star", `${s.key}`));
    head.appendChild(el("span", "dp-part", `北斗第${s.no}星 · ${s.part}`));
    head.appendChild(el("span", "dp-prog", `${m.mastered}/${m.total} 已掌握`));
    head.appendChild(speakBtn(
      `${s.key}，北斗第${s.no}星，${s.part}。${s.theme}：${s.use}。${s.combo}。下属：${s.points.map((id) => POINTS_BY_ID[id].n).join("、")}`
    ));
    row.appendChild(head);
    const meta = el("div", "dp-meta", `${s.theme}　—　${s.use}`);
    row.appendChild(meta);
    const chips = el("div", "dp-chips");
    s.points.forEach((id) => {
      const p = POINTS_BY_ID[id];
      const c = Progress.card(id);
      const cls = "dp-chip" + (isMastered(c) ? " done" : c ? " learn" : "");
      const chip = el("button", cls, `${p.n}<em>${p.p}</em>`);
      chip.onclick = () => openCard(id);
      chips.appendChild(chip);
    });
    row.appendChild(chips);
    row.appendChild(el("div", "dp-combo", s.combo));
    body.appendChild(row);
  });
  $("#dipper-song").textContent = TIANXING_SONG;
  const st = document.querySelector(".song-title");
  if (st && !st.querySelector(".spk")) st.appendChild(speakBtn(TIANXING_SONG));
}

function openDipperPanel(key) {
  renderDipperPanel();
  $("#dipper-panel").hidden = false;
  if (key) {
    const rows = $("#dipper-body").children;
    const idx = DIPPER_STARS.findIndex((s) => s.key === key);
    if (rows[idx]) rows[idx].classList.add("hl");
  }
}

/* ============================================================
 * 全局 UI
 * ============================================================ */
function showView(name) {
  const learn = name === "learn";
  $("#view-map").hidden = name !== "map";
  $("#view-learn").hidden = learn ? false : true;
  /* 学习页里收起星图专属浮层：状态标签、开始今日、图例、斗柄/时辰 */
  ["#stats", "#corner-stack", "#legend", "#sky-hud", "#map-hint"].forEach((sel) => {
    document.querySelectorAll(sel).forEach((n) => { n.classList.toggle("in-learn", learn); });
  });
  if (name !== "learn") { $("#quiz-area").innerHTML = ""; Voice.stop(); }
}

function updateStats() {
  const now = Date.now();
  let learned = 0, mastered = 0, dueN = 0;
  const today = Progress.todayKey(now);
  let newToday = 0;
  for (const pt of POINTS) {
    const c = Progress.data.cards[pt.id];
    if (c && c.st !== "new") {
      learned += 1;
      if (isMastered(c)) mastered += 1;
    }
    if (c && c.seen && Progress.todayKey(c.seen) === today) newToday += 1;
    if (c && c.st !== "new" && c.due <= now) dueN += 1;
  }
  const allow = Progress.settings().newPerDay;
  const txDone = TIANXING_IDS.filter((id) => isMastered(Progress.card(id))).length;
  $("#chip-new").textContent = `新学 ${newToday}/${allow}`;
  $("#chip-due").textContent = `待复习 ${dueN}`;
  $("#chip-mastered").textContent = `已点亮 ${learned}/${POINTS.length}`;
  const chipTx = $("#chip-tianxing");
  if (chipTx) chipTx.textContent = `北斗 ${txDone}/12`;
  if (mastered) $("#chip-mastered").textContent += ` · 掌握 ${mastered}`;
}

/* ---------- 子午流注 HUD ---------- */
function updateLiuzhu() {
  const box = $("#liuzhu");
  if (!box) return;
  const on = Progress.settings().flow !== false;
  box.hidden = !on;
  if (!on) return;
  const st = Liuzhu.at(Date.now());
  $("#lz-zhi").textContent = st.zi;
  $("#lz-mer").textContent = st.merName;
  $("#lz-range").textContent = st.range;
  $("#lz-cur").innerHTML = st.cur ? `${st.cur.n} <em>${st.cur.id}</em>` : "—";
  const frac = st.n ? (st.idx + st.frac) / st.n : 0;
  $("#lz-fill").style.width = (frac * 100).toFixed(2) + "%";
  $("#lz-left").textContent = `${st.idx + 1}/${st.n} · 剩 ${Liuzhu.fmtShort(st.restSec)}`;
  box.dataset.id = st.cur ? st.cur.id : "";
  box.title = `子午流注 · ${st.zi}时当令${st.merName}（${st.range}）\n`
    + `本经 ${st.n} 穴，每穴约 ${Liuzhu.fmtRest(st.slotSec)}，自${st.points[0].n}起顺经依次点亮。\n`
    + `点击查看当令穴：${st.cur ? st.cur.n : "—"}`;
}

let toastTimer = null;function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

/* ---------- 启动 ---------- */
function boot() {
  Progress.load();
  StarMap.showFlow = Progress.settings().flow !== false;
  StarMap.init();
  updateStats();
  updateLiuzhu();
  setInterval(updateLiuzhu, 1000);

  $("#btn-learn").onclick = () => { Sfx.ensure(); Learn.start(); };
  $("#brand").onclick = () => showView("map");
  $("#brand-seal").onclick = (e) => {
    e.stopPropagation();
    toast("久真堂出品 · 一穴一星，点亮经络");
  };
  $("#btn-back").onclick = () => showView("map");

  $("#btn-settings").onclick = () => {
    const s = Progress.settings();
    $("#set-newperday").value = String(s.newPerDay);
    $("#set-retention").value = String(s.retention || 0.9);
    $("#set-sound").checked = !!s.sound;
    $("#set-voice").checked = !!s.voice;
    $("#set-rate").value = String(s.voiceRate || 0.92);
    $("#set-autoread").checked = !!s.autoRead;
    $("#set-flow").checked = s.flow !== false;
    $("#set-obs").value = s.obsName || "上海";
    $("#settings-sheet").hidden = false;
  };
  $("#settings-close").onclick = () => { $("#settings-sheet").hidden = true; };
  $("#set-newperday").onchange = (e) => { Progress.setSetting("newPerDay", +e.target.value); updateStats(); };
  $("#set-retention").onchange = (e) => { Progress.setSetting("retention", +e.target.value); toast("目标记忆率已更新，新评分起生效"); };
  $("#set-sound").onchange = (e) => { Progress.setSetting("sound", e.target.checked); };
  $("#set-voice").onchange = (e) => {
    Progress.setSetting("voice", e.target.checked);
    if (!e.target.checked) Voice.stop();
    else toast("语音已开启——点任意 🔊 即可朗读");
  };
  $("#set-rate").onchange = (e) => {
    Progress.setSetting("voiceRate", +e.target.value);
    Voice.say("足三里，足阳明胃经合穴。肚腹三里留。", { force: true });
  };
  $("#set-autoread").onchange = (e) => { Progress.setSetting("autoRead", e.target.checked); };
  $("#set-flow").onchange = (e) => {
    Progress.setSetting("flow", e.target.checked);
    StarMap.showFlow = e.target.checked;
    updateLiuzhu();
    toast(e.target.checked ? "子午流注已开启" : "子午流注已关闭");
  };
  $("#liuzhu").onclick = () => {
    const id = $("#liuzhu").dataset.id;
    if (id) { Sfx.click(); openCard(id); }
  };
  $("#set-obs").onchange = (e) => {
    const c = OBS_CITIES[e.target.value];
    if (!c) return;
    Progress.setSetting("obsLat", c[0]);
    Progress.setSetting("obsLon", c[1]);
    Progress.setSetting("obsName", e.target.value);
    StarMap.refreshDipper(true);
    toast(`观测地改为${e.target.value}，北斗已按当地天象重排`);
  };
  $("#btn-test-voice").onclick = () => {
    if (!Voice.supported) { toast("此浏览器不支持语音朗读"); return; }
    Voice.say("穴光，一穴一星。合谷，手阳明大肠经原穴。面口合谷收。", { force: true });
  };

  /* 北斗面板 */
  $("#btn-dipper").onclick = () => openDipperPanel(null);
  $("#dipper-close").onclick = () => { $("#dipper-panel").hidden = true; Voice.stop(); };
  $("#dipper-panel").addEventListener("click", (e) => {
    if (e.target.id === "dipper-panel") { e.target.hidden = true; Voice.stop(); }
  });
  const toggleLayer = $("#toggle-dipper-layer");
  toggleLayer.checked = StarMap.showDipper;
  toggleLayer.onchange = () => { StarMap.showDipper = toggleLayer.checked; };

  $("#card-close").onclick = () => { $("#card-modal").hidden = true; Voice.stop(); };
  $("#card-modal").addEventListener("click", (e) => {
    if (e.target.id === "card-modal") { e.target.hidden = true; Voice.stop(); }
  });
  $("#settings-sheet").addEventListener("click", (e) => { if (e.target.id === "settings-sheet") e.target.hidden = true; });

  $("#btn-export").onclick = () => {
    const blob = new Blob([Progress.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xueguang-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("已导出进度文件");
  };
  $("#btn-import").onclick = () => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json";
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { Progress.importJSON(r.result); updateStats(); toast("导入成功"); }
        catch (e) { toast("导入失败：文件格式不符"); }
      };
      r.readAsText(f);
    };
    inp.click();
  };
  $("#btn-reset").onclick = () => {
    if (!confirm("确定清空全部学习进度？此操作不可撤销。")) return;
    if (!confirm("再次确认：真的要清空重来吗？")) return;
    Progress.reset();
    updateStats();
    toast("已清空，从头开始");
  };

  // 语音列表异步加载后才能匹配中文声
  if (TTS.ok()) speechSynthesis.onvoiceschanged = () => {};
}

document.addEventListener("DOMContentLoaded", boot);
