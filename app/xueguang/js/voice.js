"use strict";
/* ============================================================
 * 穴光 · 语音层（Web Speech API 朗读）
 * - 全站文字统一走这里：穴名 / 定位 / 主治 / 操作 / 配伍 / 歌诀 / 题干 / 反馈
 * - 长文自动切句排队，规避 Chrome 长句中途断掉的毛病
 * - 无语音环境时静默降级（supported=false）
 * ============================================================ */
const Voice = {
  supported:
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined",

  _voice: null,
  _queue: [],
  _rate: 0.92,
  _onend: null,
  _listeners: [],
  _unlocked: false,

  speaking: false,
  tag: null,

  init() {
    if (!this.supported) return;
    const refresh = () => { this._voice = null; };
    try {
      window.speechSynthesis.addEventListener("voiceschanged", refresh);
    } catch (e) {
      window.speechSynthesis.onvoiceschanged = refresh;
    }
    // Chrome 在标签页切走时会把语音挂起，定时唤醒
    setInterval(() => {
      try {
        if (this.speaking && window.speechSynthesis.paused) window.speechSynthesis.resume();
      } catch (e) { /* 忽略 */ }
    }, 4000);
  },

  /** 挑一个中文音色：优先 zh-CN、本地、女声 */
  pick() {
    if (this._voice) return this._voice;
    if (!this.supported) return null;
    let vs = [];
    try { vs = window.speechSynthesis.getVoices() || []; } catch (e) { return null; }
    const zh = vs.filter((v) => /^zh/i.test(v.lang || "") || /chinese|mandarin|中文|普通话/i.test(v.name || ""));
    if (!zh.length) return null;
    const score = (v) => {
      let s = 0;
      if (/^zh[-_]?(CN|Hans)/i.test(v.lang || "")) s += 6;
      else if (/^zh/i.test(v.lang || "")) s += 3;
      if (v.localService) s += 2;
      if (/female|woman|女|Ting|Xiao|Hui|Yao|Mei|Lan/i.test(v.name || "")) s += 1;
      if (/Google/i.test(v.name || "")) s += 1;
      return s;
    };
    zh.sort((a, b) => score(b) - score(a));
    this._voice = zh[0];
    return this._voice;
  },

  /** 去掉 HTML、多余符号，留出可读文本 */
  clean(text) {
    if (!text) return "";
    return String(text)
      .replace(/<br\s*\/?>/gi, "。")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/[🕯✦▶🔊⚙✓✕·]/g, "")
      .replace(/[…]{2,}/g, "，")
      .replace(/[～~]/g, "至")
      .replace(/—{2,}/g, "，")
      .replace(/\s+/g, " ")
      .replace(/，(?=[。；：、，])/g, "")
      .replace(/。{2,}/g, "。")
      .replace(/([，。；：、])\s+/g, "$1")
      .trim();
  },

  /** 按句切块，每块 ≤ max 字（Chrome 长句容易吞字/断流） */
  chunk(text, max) {
    const limit = max || 70;
    const parts = text.split(/(?<=[。；！？!?;\n])/).map((s) => s.trim()).filter(Boolean);
    const out = [];
    let buf = "";
    for (const p of parts) {
      if (!buf) buf = p;
      else if ((buf + p).length <= limit) buf += p;
      else { out.push(buf); buf = p; }
      while (buf.length > limit * 1.6) {
        out.push(buf.slice(0, limit));
        buf = buf.slice(limit);
      }
    }
    if (buf) out.push(buf);
    return out;
  },

  /** 朗读；opts: {force, rate, tag, onend} */
  say(text, opts) {
    opts = opts || {};
    if (!this.supported) return false;
    if (!opts.force && !Progress.settings().voice) return false;
    const clean = this.clean(text);
    if (!clean) return false;

    this.stop();
    this._queue = this.chunk(clean, opts.max || 70);
    this._rate = opts.rate || Progress.settings().voiceRate || 0.92;
    this._onend = opts.onend || null;
    this.tag = opts.tag || null;
    this.speaking = true;
    this._unlock();
    this.emit();
    this._next();
    return true;
  },

  _unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    } catch (e) { /* 忽略 */ }
  },

  _next() {
    const t = this._queue.shift();
    if (!t) {
      this.speaking = false;
      this.tag = null;
      const cb = this._onend;
      this._onend = null;
      this.emit();
      if (cb) cb();
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(t);
      const v = this.pick();
      u.lang = (v && v.lang) || "zh-CN";
      if (v) u.voice = v;
      u.rate = this._rate;
      u.pitch = 1;
      let done = false;
      const go = () => { if (!done) { done = true; this._next(); } };
      u.onend = go;
      u.onerror = go;
      window.speechSynthesis.speak(u);
    } catch (e) {
      this._queue = [];
      this.speaking = false;
      this.emit();
    }
  },

  stop() {
    this._queue = [];
    this._onend = null;
    if (this.supported) {
      try { window.speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    }
    if (this.speaking) { this.speaking = false; this.tag = null; this.emit(); }
  },

  /** 同一按钮再点即停 */
  toggle(text, tag, opts) {
    if (this.speaking && this.tag === tag) { this.stop(); return false; }
    return this.say(text, Object.assign({ tag }, opts || {}));
  },

  isSpeaking(text) {
    return this.speaking;
  },

  subscribe(fn) { this._listeners.push(fn); },
  emit() {
    for (const fn of this._listeners) {
      try { fn(this.speaking, this.tag); } catch (e) { /* 忽略 */ }
    }
  },
};

Voice.init();
