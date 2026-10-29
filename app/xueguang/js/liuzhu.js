"use strict";
/* ============================================================
 * 子午流注 · 时辰点穴
 * 十二时辰各 120 分钟，依「肺→大肠→胃→脾→心→小肠→膀胱→肾→心包→三焦→胆→肝」
 * 流注次序当令。当令经的穴位数 n 均分 120 分钟，每穴停留 120/n 分钟，
 * 自井穴起顺经依次点亮。
 * ============================================================ */

/* 地支 → 当令经（子时胆，丑时肝，寅时肺……） */
const SHICHEN = [
  { zhi: "子", from: 23, to: 1, code: "GB", organ: "胆" },
  { zhi: "丑", from: 1, to: 3, code: "LR", organ: "肝" },
  { zhi: "寅", from: 3, to: 5, code: "LU", organ: "肺" },
  { zhi: "卯", from: 5, to: 7, code: "LI", organ: "大肠" },
  { zhi: "辰", from: 7, to: 9, code: "ST", organ: "胃" },
  { zhi: "巳", from: 9, to: 11, code: "SP", organ: "脾" },
  { zhi: "午", from: 11, to: 13, code: "HT", organ: "心" },
  { zhi: "未", from: 13, to: 15, code: "SI", organ: "小肠" },
  { zhi: "申", from: 15, to: 17, code: "BL", organ: "膀胱" },
  { zhi: "酉", from: 17, to: 19, code: "KI", organ: "肾" },
  { zhi: "戌", from: 19, to: 21, code: "PC", organ: "心包" },
  { zhi: "亥", from: 21, to: 23, code: "TE", organ: "三焦" },
];

const Liuzhu = {
  SLOT_MIN: 120,

  /** 当前时辰序号 0..11（子=0） */
  indexAt(now) {
    const d = new Date(now);
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    return Math.floor((((h + 1) % 24) + 24) % 24 / 2) % 12;
  },

  /** 某经在某时辰内的第几穴 */
  posInSlot(code, minutes) {
    const pts = POINTS_BY_MERIDIAN[code] || [];
    const n = pts.length || 1;
    const slot = this.SLOT_MIN / n;
    const idx = Math.max(0, Math.min(n - 1, Math.floor(minutes / slot)));
    return { pts, n, slot, idx };
  },

  /**
   * 当前流注状态
   * → {zi, code, merName, color, range, idx, n, cur, next, slotSec, restSec, frac, progress}
   */
  at(now) {
    now = now || Date.now();
    const d = new Date(now);
    const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    const i = this.indexAt(now);
    const sh = SHICHEN[i];
    const mer = MERIDIAN_BY_CODE[sh.code];

    // 本时辰已过分钟（子时跨午夜）
    let elapsed = sh.from > sh.to
      ? (h >= sh.from ? h - sh.from : h + 24 - sh.from) * 60
      : (h - sh.from) * 60;
    elapsed = Math.max(0, Math.min(this.SLOT_MIN - 0.001, elapsed));

    const { pts, n, slot, idx } = this.posInSlot(sh.code, elapsed);
    const intoSlot = elapsed - idx * slot;          // 本穴已过分钟
    const restSec = Math.max(0, Math.round((slot - intoSlot) * 60));
    const frac = slot > 0 ? intoSlot / slot : 0;

    return {
      zi: sh.zhi,
      organ: sh.organ,
      code: sh.code,
      merName: mer ? mer.name : sh.organ + "经",
      color: mer ? mer.color : "#f4b942",
      range: `${String(sh.from).padStart(2, "0")}:00–${String(sh.to === 0 ? 24 : sh.to).padStart(2, "0")}:00`,
      idx, n,
      points: pts,
      cur: pts[idx] || null,
      next: pts[idx + 1] || null,
      slotSec: Math.round(slot * 60),
      restSec, frac,
      progress: elapsed / this.SLOT_MIN,
      elapsedMin: elapsed,
    };
  },

  /** 剩余时间读法：4 分 27 秒 / 28 秒 */
  fmtRest(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec} 秒`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s ? `${m} 分 ${s} 秒` : `${m} 分`;
  },

  /* 紧凑写法：3′12″ / 12″ / 4′ */
  fmtShort(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}″`;
    const m = Math.floor(sec / 60), s = sec % 60;
    return s ? `${m}′${s}″` : `${m}′`;
  },
};
