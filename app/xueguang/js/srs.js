"use strict";
/* ============================================================
 * 穴光 · 复习调度器（srs.js）v2
 * 采用 FSRS（Free Spaced Repetition Scheduler）——与新版 Anki 同源的算法，
 * 通过本地随附的 ts-fsrs 5.4.2（MIT）实现，接口形状对齐 word-atlas 的 srs.ts。
 * 卡片序列化：日期存 epoch 毫秒，字段短名以压缩备份体积。
 * ============================================================ */

/* ts-fsrs 以 window.FSRS 暴露（js/vendor/ts-fsrs.umd.js 先于本文件加载） */
const FSRS = window.FSRS;
if (!FSRS || typeof FSRS.fsrs !== "function") {
  console.error("[穴光] ts-fsrs 未加载，请检查 js/vendor/ts-fsrs.umd.js");
}

const { Rating, State, createEmptyCard } = FSRS;

/** 序列化卡片：{due,s,d,el,sd,ls,reps,lapses,st,last,seen} */
const toCard = (c) => ({
  due: new Date(c.due),
  stability: c.s,
  difficulty: c.d,
  elapsed_days: c.el,
  scheduled_days: c.sd,
  learning_steps: c.ls,
  reps: c.reps,
  lapses: c.lapses,
  state: c.st,
  last_review: c.last ? new Date(c.last) : undefined,
});

const fromCard = (c, seen) => ({
  due: c.due.getTime(),
  s: c.stability,
  d: c.difficulty,
  el: c.elapsed_days,
  sd: c.scheduled_days,
  ls: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  st: c.state,
  last: c.last_review ? c.last_review.getTime() : undefined,
  seen: seen,
});

const schedulers = new Map();
const scheduler = (retention) => {
  let s = schedulers.get(retention);
  if (!s) {
    s = FSRS.fsrs({
      request_retention: retention,
      enable_fuzz: true,
      enable_short_term: true,
      learning_steps: ["1m", "10m"],
      relearning_steps: ["10m"],
    });
    schedulers.set(retention, s);
  }
  return s;
};

/** 核心调度：给定旧卡片与评分，返回新卡片 */
function reviewCard(prev, grade, now, retention) {
  const r = retention || 0.9;
  const card = prev ? toCard(prev) : createEmptyCard(new Date(now));
  const next = scheduler(r).next(card, new Date(now), grade).card;
  return fromCard(next, (prev && prev.seen) || now);
}

/** 四档按钮的间隔预览（毫秒） */
function previewCard(prev, now, retention) {
  const r = retention || 0.9;
  const card = prev ? toCard(prev) : createEmptyCard(new Date(now));
  const p = scheduler(r).repeat(card, new Date(now));
  const out = {};
  [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy].forEach((g) => {
    out[g] = p[g].card.due.getTime() - now;
  });
  return out;
}

/** 可提取性（记忆保留率，0~1） */
function retrievability(c, now, retention) {
  if (!c || c.st === 0) return 0;
  try {
    return scheduler(retention || 0.9).get_retrievability(toCard(c), new Date(now), false);
  } catch (e) { return 0.9; }
}

/** 掌握判定：处于复习态且稳定度 ≥ 21 天（对齐原作 MASTERED_STABILITY） */
const MASTERED_STABILITY = 21;
const isMastered = (c) => !!c && c.st === State.Review && c.s >= MASTERED_STABILITY;
const isLearning = (c) => !!c && !isMastered(c);

function formatInterval(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1分";
  if (m < 60) return `${m}分`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}小时`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d}天`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}个月`;
  return `${(d / 365).toFixed(1)}年`;
}

/* ============================================================
 * 进度存储（localStorage）
 * schema：{ v:2, cards:{[id]:card}, settings:{newPerDay,sound,retention}, daily:{} }
 * ============================================================ */
const STORE_KEY = "xueguang.progress.v1";

/** v1（SM-2）卡片 → FSRS 卡片 */
function migrateCard(c) {
  if (!c) return null;
  if (typeof c.st === "number") return c; // 已是 FSRS 卡
  const base = {
    due: c.due || Date.now(),
    s: Math.max(0.5, c.interval || 0.5),
    d: Math.max(1, Math.min(10, 11 - (c.ease || 2.5) * 2)),
    el: 0,
    sd: c.interval || 0,
    ls: 0,
    reps: c.reps || 0,
    lapses: c.lapses || 0,
    st: c.st === "review" ? State.Review : c.st === "relearning" ? State.Relearning : State.Learning,
    last: c.last || undefined,
    seen: c.seen || Date.now(),
  };
  if (c.st === "new") return null;
  return base;
}

const Progress = {
  data: null,

  defaults() {
    return {
      v: 2,
      cards: {},
      settings: { newPerDay: 10, sound: true, retention: 0.9, voice: true, voiceRate: 0.92, autoRead: true, flow: true, obsLat: 31.23, obsLon: 121.47, obsName: "上海" },
      daily: {},
    };
  },

  load() {
    let raw = null;
    try { raw = localStorage.getItem(STORE_KEY); } catch (e) { /* 隐私模式 */ }
    if (!raw) { this.data = this.defaults(); return this.data; }
    try {
      const obj = JSON.parse(raw);
      this.data = Object.assign(this.defaults(), obj);
      this.data.settings = Object.assign(this.defaults().settings, obj.settings || {});
      // 旧版卡片迁移
      let migrated = 0;
      Object.keys(this.data.cards || {}).forEach((id) => {
        const before = this.data.cards[id];
        const after = migrateCard(before);
        if (after === null) delete this.data.cards[id];
        else if (after !== before) { this.data.cards[id] = after; migrated += 1; }
      });
      this.data.v = 2;
      if (migrated) { this.save(); console.info(`[穴光] 已迁移 ${migrated} 张旧卡到 FSRS`); }
    } catch (e) {
      this.data = this.defaults();
    }
    return this.data;
  },

  save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(this.data)); } catch (e) { /* 存储不可用 */ }
  },

  card(id) {
    if (!this.data) this.load();
    return this.data.cards[id] || null;
  },

  apply(id, grade, now) {
    if (!this.data) this.load();
    const prev = this.data.cards[id] || null;
    const next = reviewCard(prev, grade, now, this.settings().retention);
    this.data.cards[id] = next;
    const today = this.todayKey(now);
    const d = (this.data.daily[today] = this.data.daily[today] || { newCount: 0, reviews: 0 });
    if (!prev) d.newCount += 1;
    d.reviews += 1;
    this.save();
    return next;
  },

  todayKey(now) {
    const d = new Date(now || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  },

  todayStats(now) {
    if (!this.data) this.load();
    return this.data.daily[this.todayKey(now)] || { newCount: 0, reviews: 0 };
  },

  settings() {
    if (!this.data) this.load();
    return this.data.settings;
  },

  setSetting(k, v) {
    if (!this.data) this.load();
    this.data.settings[k] = v;
    this.save();
  },

  exportJSON() { return JSON.stringify(this.data, null, 2); },

  importJSON(text) {
    const obj = JSON.parse(text);
    if (!obj || !obj.cards) throw new Error("格式不符");
    this.data = Object.assign(this.defaults(), obj);
    this.data.settings = Object.assign(this.defaults().settings, obj.settings || {});
    Object.keys(this.data.cards).forEach((id) => {
      const fixed = migrateCard(this.data.cards[id]);
      if (fixed === null) delete this.data.cards[id]; else this.data.cards[id] = fixed;
    });
    this.save();
  },

  reset() { this.data = this.defaults(); this.save(); },
};
