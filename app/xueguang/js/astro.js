"use strict";
/* ============================================================
 * 穴光 · 星空指向（astro.js）
 * 只做一件事：算出此刻北斗七星在天上的位置与斗柄指向。
 *
 * 原理：J2000 赤经赤纬 + 格林尼治恒星时 → 时角 → 地平坐标（方位角/高度角）。
 *       斗柄方向取「天权 → 摇光」在天球上的方向，投影到地平面。
 * 古法：「斗柄东指，天下皆春；南指皆春…」——《鹖冠子》，初昏观斗柄以定四时。
 * 纯函数、无依赖，可在 Node 里直接单测。
 * ============================================================ */
const Astro = (function () {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  /* 北斗七星 J2000.0 赤道坐标（度）：天枢 天璇 天玑 天权 玉衡 开阳 摇光 */
  const STARS = [
    { key: "天枢", ra: 165.932, dec: 61.751 },   // α UMa Dubhe
    { key: "天璇", ra: 165.460, dec: 56.383 },   // β UMa Merak
    { key: "天玑", ra: 178.458, dec: 53.695 },   // γ UMa Phecda
    { key: "天权", ra: 183.857, dec: 57.033 },   // δ UMa Megrez
    { key: "玉衡", ra: 193.507, dec: 55.960 },   // ε UMa Alioth
    { key: "开阳", ra: 200.981, dec: 54.925 },   // ζ UMa Mizar
    { key: "摇光", ra: 206.885, dec: 49.313 },   // η UMa Alkaid
  ];

  const DIRS8 = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const SEASON_OF = { 北: "冬", 东: "春", 南: "夏", 西: "秋" };

  /* ---------- 基础天球换算 ---------- */

  function jd(ms) { return ms / 86400000 + 2440587.5; }

  /** 格林尼治平恒星时（度） */
  function gmst(ms) {
    const g = 280.46061837 + 360.98564736629 * (jd(ms) - 2451545.0);
    return ((g % 360) + 360) % 360;
  }

  /** 地方恒星时（度），lon 东经为正 */
  function lstDeg(ms, lon) { return ((gmst(ms) + lon) % 360 + 360) % 360; }

  /** 赤道坐标 → 地平坐标。方位角自正北起顺时针，高度角向上为正 */
  function toHorizon(ra, dec, lst, lat) {
    const H = (lst - ra) * D2R, dr = dec * D2R, lr = lat * D2R;
    const s = Math.sin(dr) * Math.sin(lr) + Math.cos(dr) * Math.cos(lr) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, s))) * R2D;
    const az = Math.atan2(-Math.sin(H) * Math.cos(dr),
      Math.sin(dr) * Math.cos(lr) - Math.cos(dr) * Math.sin(lr) * Math.cos(H)) * R2D;
    return { alt, az: (az + 360) % 360 };
  }

  /** 地平坐标 → 单位向量 [东, 北, 天顶] */
  function unit(alt, az) {
    const a = alt * D2R, z = az * D2R;
    return [Math.cos(a) * Math.sin(z), Math.cos(a) * Math.cos(z), Math.sin(a)];
  }

  /** 太阳赤经赤纬（低精度，误差 < 0.01°，足够判暮光） */
  function sunEq(ms) {
    const n = jd(ms) - 2451545.0;
    const L = ((280.460 + 0.9856474 * n) % 360 + 360) % 360;
    const g = (((357.528 + 0.9856003 * n) % 360 + 360) % 360) * D2R;
    const lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
    const eps = (23.439 - 0.0000004 * n) * D2R;
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * R2D;
    return { ra: (ra + 360) % 360, dec: Math.asin(Math.sin(eps) * Math.sin(lam)) * R2D };
  }

  function sunAlt(ms, lat, lon) {
    const s = sunEq(ms);
    return toHorizon(s.ra, s.dec, lstDeg(ms, lon), lat).alt;
  }

  /* ---------- 斗柄方向 ---------- */

  /**
   * 斗柄（天权→摇光）在天球上的走向
   * 用「切线方向」而非「水平投影差」——后者在斗柄近乎朝天时分量趋零、指向乱跳。
   * @returns {{bearing:number, tilt:number}} bearing 方位角（正北 0，顺时针）；
   *          tilt 斗柄上扬角（正=朝天，负=俯向地平）
   */
  function handleDirAt(ms, lat, lon) {
    const L = lstDeg(ms, lon);
    const A = toHorizon(STARS[3].ra, STARS[3].dec, L, lat);   // 天权
    const B = toHorizon(STARS[6].ra, STARS[6].dec, L, lat);   // 摇光
    const a = unit(A.alt, A.az), b = unit(B.alt, B.az);
    const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    let d = [b[0] - dot * a[0], b[1] - dot * a[1], b[2] - dot * a[2]];  // 切向分量
    const len = Math.hypot(d[0], d[1], d[2]);
    if (len < 1e-9) return { bearing: 0, tilt: 0 };
    d = [d[0] / len, d[1] / len, d[2] / len];
    return {
      bearing: (Math.atan2(d[0], d[1]) * R2D + 360) % 360,   // d[0] 东, d[1] 北
      tilt: Math.asin(Math.max(-1, Math.min(1, d[2]))) * R2D,
    };
  }

  /** 只要方位角的简写 */
  function handleAzAt(ms, lat, lon) { return handleDirAt(ms, lat, lon).bearing; }

  const duskCache = { key: "", val: null };

  /** 当日初昏（太阳降至 -6°，民用暮光终）的时刻；极昼极夜返回 null */
  function dusk(ms, lat, lon) {
    const d = new Date(ms);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}|${lat.toFixed(1)}|${lon.toFixed(1)}`;
    if (duskCache.key === key) return duskCache.val;

    let t0 = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
    let found = null, prev = sunAlt(t0, lat, lon);
    for (let i = 1; i <= 96; i++) {                 // 5 分钟一步，扫 8 小时
      const t = t0 + i * 300000;
      const a = sunAlt(t, lat, lon);
      if (prev > -6 && a <= -6) {                   // 找到穿越，回到上一格逐分钟精修
        let lo = t - 300000, hit = null;
        for (let k = 0; k < 5; k++) {
          const tt = lo + k * 60000;
          if (sunAlt(tt, lat, lon) <= -6) { hit = tt; break; }
        }
        found = hit != null ? hit : t;
        break;
      }
      prev = a;
    }
    duskCache.key = key; duskCache.val = found;
    return found;
  }

  /* ---------- 对外 ---------- */

  function dirName(az) {
    const i = Math.round(((az % 360) + 360) % 360 / 45) % 8;
    return DIRS8[i];
  }

  function cardinal(az) {
    const i = Math.round(((az % 360) + 360) % 360 / 90) % 4;
    return ["北", "东", "南", "西"][i];
  }

  /**
   * 此刻北斗天象
   * @returns {{stars:Array, handleAz:number, handleDir:string, cardinal:string,
   *            season:string|null, twilightAz:number|null, lst:number, upCount:number}}
   */
  function dipper(ms, lat, lon) {
    if (!isFinite(ms)) ms = Date.now();
    if (lat == null || !isFinite(lat)) lat = 31.23;
    if (lon == null || !isFinite(lon)) lon = 121.47;

    const L = lstDeg(ms, lon);
    const stars = STARS.map((s) => {
      const h = toHorizon(s.ra, s.dec, L, lat);
      return { key: s.key, alt: h.alt, az: h.az, up: h.alt > 0 };
    });
    const hd = handleDirAt(ms, lat, lon);

    const tw = dusk(ms, lat, lon);
    const twAz = tw ? handleDirAt(tw, lat, lon).bearing : null;

    return {
      stars,
      handleAz: hd.bearing,
      handleTilt: hd.tilt,
      handleDir: dirName(hd.bearing),
      cardinal: cardinal(hd.bearing),
      season: twAz == null ? null : SEASON_OF[cardinal(twAz)],
      twilightAz: twAz,
      twilight: tw,
      lst: L,
      upCount: stars.filter((s) => s.up).length,
    };
  }

  /** 供测试：某一时刻斗柄指向 + 方位名 */
  function brief(ms, lat, lon) {
    const d = dipper(ms, lat, lon);
    return { az: d.handleAz, dir: d.handleDir, season: d.season, up: d.upCount };
  }

  return {
    STARS, DIRS8, gmst, lstDeg, toHorizon, sunAlt, dusk, handleDirAt, handleAzAt,
    dipper, brief, dirName, cardinal,
    deg: (d) => `${Math.round(d * 10) / 10}°`,
  };
})();

if (typeof window !== "undefined") window.Astro = Astro;
