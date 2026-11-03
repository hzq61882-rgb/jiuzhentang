#!/usr/bin/env node
/* 久真堂 · 静态页面生成器（2026 改版：宣纸 · 墨色 · 守中）
   用法（在站点根目录）：node tools/build.js
   读取 tools/content.js 里的 CONTENT，生成 index.html 与 xueguang.html（所有文字预先写入 HTML，
   关闭 JavaScript 也能完整显示）。js/main.js 只负责交互与动效，不渲染内容。 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const CONTENT = require("./content.js");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// 【…】 占位标记自动高亮
const t = s => esc(s).replace(/【([^】]*)】/g, '<span class="ph" title="占位：请替换为真实信息">【$1】</span>');
const CN = "一二三四五六七八九十";
const head = (c, id) => `<header class="sec-head reveal"><h2 id="${id}-h">${t(c.title)}</h2><p class="en">${t(c.kicker)}</p>${c.intro ? `<p class="intro">${t(c.intro)}</p>` : ""}</header>`;
const B = CONTENT.brand, H = CONTENT.hero;

/* ---------- 堂史 ---------- */
const G = CONTENT.tang;
const tang = `<div class="wrap">${head(G, "tang")}
    <p class="tang-core reveal">${t(G.core)}</p>
    <p class="tang-text" data-chars>${t(G.text)}</p>
    <div class="veins">${G.veins.map((v, i) => `
      <article class="vein reveal" style="--d:${i * 100}ms"><p class="vno" aria-hidden="true">${t(v.n)}</p><div><small>双脉 · 其${t(v.n)}</small><h3>${t(v.t)}</h3><p>${t(v.d)}</p><ul>${v.tags.map(x => `<li>${t(x)}</li>`).join("")}</ul></div></article>`).join("")}
    </div>
    <div class="fuse reveal"><span class="fuse-k">融</span>${G.fuse.map(x => `<b>${t(x)}</b>`).join('<i aria-hidden="true">·</i>')}</div>
    <p class="tang-motto reveal">${t(G.motto)}</p>
  </div>`;

/* ---------- 药师 ---------- */
const A = CONTENT.about;
const about = `<div class="wrap">${head(A, "about")}
    <div class="about-grid">
      <figure class="portrait reveal">
        <img class="photo" src="assets/portrait.jpg" alt="黄忠强（德明）" width="640" height="640" loading="lazy" decoding="async">
        <span class="seal">${t(A.motto)}</span>
      </figure>
      <div class="about-txt reveal" style="--d:100ms">
        <p class="lead">${t(A.lead)}</p>
        ${A.paras.map(p => `<p>${t(p)}</p>`).join("\n        ")}
        <dl class="facts">${A.facts.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${t(v)}</dd></div>`).join("")}</dl>
        <p class="source">${t(A.lineagePh)}</p>
      </div>
    </div>
    <ol class="story">${A.story.map(([k, v], i) => `<li class="reveal" style="--d:${i * 80}ms"><b>${t(k)}</b><p>${t(v)}</p></li>`).join("")}</ol>
  </div>`;

/* ---------- 九针 ---------- */
const N = CONTENT.needles;
const needles = `<div class="wrap">${head(N, "needles")}
    <div class="needle-grid">${N.list.map((x, i) => `
      <button class="ncard reveal" type="button" data-i="${i}" data-n="${esc(x.n)}" data-py="${esc(x.py)}" data-len="${esc(x.len)}" data-shape="${esc(x.shape)}" data-use="${esc(x.use)}" data-today="${esc(x.today)}" data-quote="${esc(x.quote)}" style="--d:${(i % 3) * 70}ms">
        <span class="nno" aria-hidden="true">${CN[i]}</span>
        <svg class="nicon" viewBox="0 0 20 120" aria-hidden="true"><path d="M7 4h6M7 9h6M7 14h6M7 19h6" /><path d="M10 22 V${60 + i * 5}" /><path d="M8.6 ${58 + i * 5} L10 ${70 + i * 5} L11.4 ${58 + i * 5}Z" class="tip"/></svg>
        <span class="nbody"><h3>${t(x.n)}<small>${t(x.py)}</small></h3>
        <span class="nshape">${t(x.shape)} · ${t(x.len)}</span>
        <span class="nuse">${t(x.use)}</span>
        <span class="ntoday">${t(x.today)}</span></span>
        <span class="nmore" aria-hidden="true">读原文</span>
      </button>`).join("")}
    </div>
    <p class="source reveal">${t(N.source)}</p>
    <div class="philo">${N.philosophy.map(([k, v], i) => `<div class="reveal" style="--d:${i * 80}ms"><b>${t(k)}</b><p>${t(v)}</p></div>`).join("")}</div>
  </div>`;

/* ---------- 传承 ---------- */
const L = CONTENT.lineage;
const lineage = `<div class="wrap">${head(L, "lineage")}
    <ol class="timeline">${L.items.map(([d, h, p]) => `
      <li class="reveal"><time>${t(d)}</time><div><h3>${t(h)}</h3><p>${t(p)}</p></div></li>`).join("")}
    </ol></div>`;

/* ---------- 养生 ---------- */
const W = CONTENT.wellness;
const wellness = `<div class="wrap">${head(W, "wellness")}
    <div class="wlist">${W.cards.map((c, i) => `
      <article class="wcard reveal" style="--d:${i * 80}ms"><h3>${t(c.t)}</h3><small>${t(c.en)}</small><p>${t(c.d)}</p><span class="tag">${t(c.tag)}</span></article>`).join("")}
    </div><p class="source reveal">${t(W.note)}</p></div>`;

/* ---------- 专长 ---------- */
const C = CONTENT.cases;
const cases = `<div class="wrap">${head(C, "cases")}
    <div class="xqs">${C.method.map(([k, e, d], i) => `<div class="xq reveal" style="--d:${i * 120}ms"><span class="xq-ch">${t(k)}</span><small>${t(e)}</small><p>${t(d)}</p></div>`).join('<i class="xq-arrow" aria-hidden="true"></i>')}</div>
    <div class="clist">${C.list.map((c, i) => `
      <article class="ccard reveal" style="--d:${i * 80}ms"><span class="badge">专长 ${CN[i] || i + 1}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p></article>`).join("")}
    </div>
    <p class="principle reveal">${t(C.principle)}</p>
    <p class="slot reveal">${t(C.slot)}</p>
    <div class="disclaimer reveal">${t(C.disclaimer)}</div></div>`;

/* ---------- 课程 ---------- */
const K = CONTENT.courses;
const courses = `<div class="wrap">${head(K, "courses")}
    <div class="klist">${K.list.map((c, i) => `
      <article class="kcard reveal" style="--d:${i * 80}ms"><span class="kno" aria-hidden="true">${CN[i]}</span>
        <div class="kmain"><span class="lvl">${t(c.lvl)}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p>
        <ul>${c.items.map(x => `<li>${t(x)}</li>`).join("")}</ul></div>
        <div class="kfoot"><p class="sched">${t(c.sched || "")}</p><span class="price">${t(c.price)}</span><a class="btn sm ghost" href="#contact">${t(K.cta)}</a></div></article>`).join("")}
    </div></div>`;

/* ---------- 联系 ---------- */
const T = CONTENT.contact;
const contact = `<div class="wrap">${head(T, "contact")}
    <div class="contact-grid reveal">
      <dl class="crow">${T.rows.map(([k, v]) => `<div><dt>${t(k)}</dt><dd><button class="copy" type="button" data-v="${esc(v)}">${t(v)}</button></dd></div>`).join("")}</dl>
      <div class="qr"><div class="qr-box"><img src="assets/wechat-qr.jpg" alt="久真堂 黄药师 微信二维码" width="480" height="480" loading="lazy" decoding="async"></div><p>${t(T.qr)}</p><small>${t(T.copyHint)}</small></div>
    </div></div>`;

const F = CONTENT.footer;
const P = CONTENT.app;
const footer = `<div class="wrap"><img src="assets/logo.svg" alt="" width="44" height="44"><p class="fline">${t(F.line)}</p><p class="flinks"><a href="xueguang.html">${t(P.name)}</a><span aria-hidden="true">·</span><span>${t(P.slogan)}</span></p><p class="fdis">${t(F.disclaimer)}</p><p class="fcopy">${t(F.copy)}</p></div>`;
// 导航：首页用 #锚点；其他页面（如 xueguang.html）用 index.html#锚点。以 .html 结尾的条目是独立页面。
const navLinks = (home, current) => CONTENT.nav.map(([id, l], i) => {
  const isPage = /\.html$/.test(id), href = isPage ? id : (home ? "#" : "index.html#") + id;
  const on = isPage && id === current ? ' class="on" aria-current="page"' : "";
  return `<a href="${href}"${on} style="--i:${i}">${t(l)}</a>`;
}).join("");
const navBar = (home, current) => `<header class="nav${home ? "" : " solid"}" id="nav">
  <a class="brand" href="${home ? "#top" : "index.html"}" aria-label="${esc(B.name)} 首页">
    <img src="assets/logo.svg" alt="" width="34" height="34">
    <span class="brand-txt"><b>${t(B.name)}</b><small>${t(B.en)}</small></span>
  </a>
  <button class="menu-btn" id="menuBtn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  <nav class="menu" id="menu" aria-label="主导航">${navLinks(home, current)}</nav>
</header>`;

const FONTS = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600;900&family=Cormorant+Garamond:ital,wght@1,400&display=swap";
const HEADC = `<meta name="theme-color" content="#f3eee4">
<!-- 有 JS 时才启用“渐显”隐藏；1.5 秒内 main.js 未运行则自动全部显示 -->
<script>(function(d){d.classList.add("js");setTimeout(function(){if(!d.classList.contains("ready")){d.classList.remove("js");}},1500);})(document.documentElement);</script>
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="stylesheet" href="css/style.css">
<!-- Google Fonts 非阻塞加载：加载失败（如国内网络）时直接使用系统宋体 / 楷体 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${FONTS}"></noscript>`;
const SCRIPTS = `<script src="js/vendor/gsap.min.js" defer></script>
<script src="js/vendor/ScrollTrigger.min.js" defer></script>
<script src="js/main.js" defer></script>`;

/* 墨圆：一笔“圆相”，起笔重、收笔枯（按角度生成粗细变化的闭合轮廓） */
const ENSO = (() => {
  const cx = 300, cy = 300, R = 250, a0 = 104, sweep = 334, N = 140, rad = d => d * Math.PI / 180;
  const w = u => 3 + 15 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15 + .04)), .55) * (1 - .45 * u) + 2.5 * Math.sin(u * 23);
  const outer = [], inner = [], arc = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, a = rad(a0 + sweep * u), r = R + 3 * Math.sin(u * 7.3), hw = Math.max(.6, w(u) / 2);
    outer.push([cx + (r + hw) * Math.cos(a), cy + (r + hw) * Math.sin(a)]);
    inner.push([cx + (r - hw) * Math.cos(a), cy + (r - hw) * Math.sin(a)]);
    arc.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const f = p => p.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1));
  return { shape: "M" + f(outer).join(" L") + " L" + f(inner.reverse()).join(" L") + "Z", arc: "M" + f(arc).join(" L") };
})();

/* 首屏：墨圆（一气周流）+ 金针（中气为本）+ 水墨山脊（雪岭） */
const heroArt = `<div class="hero-art" aria-hidden="true">
      <svg class="enso" viewBox="0 0 600 600">
        <defs><mask id="ensoMask" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600"><path class="enso-reveal" d="${ENSO.arc}" fill="none" stroke="#fff" stroke-width="46" stroke-linecap="round"/></mask></defs>
        <circle class="enso-ghost" cx="300" cy="300" r="250"/>
        <path class="enso-stroke" d="${ENSO.shape}" mask="url(#ensoMask)"/>
        <circle class="enso-core" cx="300" cy="300" r="4.5"/>
        <circle class="ripple" cx="300" cy="300" r="34"/>
        <circle class="ripple r2" cx="300" cy="300" r="34"/>
      </svg>
      <svg class="needle" viewBox="0 0 40 600" preserveAspectRatio="xMidYMax meet">
        <defs><linearGradient id="gn" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="600"><stop offset="0" stop-color="#d9b86a"/><stop offset=".7" stop-color="#a8813a"/><stop offset="1" stop-color="#6e5220"/></linearGradient></defs>
        <g stroke="url(#gn)" stroke-linecap="round" fill="none">
          <path d="M20 8 v12" stroke-width="4"/>
          <path d="M11 28 h18 M11 37 h18 M11 46 h18 M11 55 h18 M11 64 h18 M11 73 h18" stroke-width="3.2"/>
          <path d="M20 80 V586" stroke-width="2.2"/>
        </g>
        <path d="M18.6 582 L20 600 L21.4 582Z" fill="#6e5220"/>
      </svg>
      <svg class="ridges" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="ink1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a16" stop-opacity=".16"/><stop offset="1" stop-color="#1d1a16" stop-opacity="0"/></linearGradient>
          <linearGradient id="ink2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a16" stop-opacity=".24"/><stop offset=".8" stop-color="#1d1a16" stop-opacity=".02"/></linearGradient>
          <linearGradient id="ink3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a16" stop-opacity=".42"/><stop offset=".55" stop-color="#1d1a16" stop-opacity=".12"/><stop offset="1" stop-color="#f3eee4" stop-opacity="0"/></linearGradient>
        </defs>
        <path class="rg rg1" fill="url(#ink1)" d="M0 150 C 90 120 150 96 230 120 S 360 60 450 92 S 600 150 690 104 S 850 40 960 88 S 1120 130 1210 96 S 1360 70 1440 100 V360 H0Z"/>
        <path class="rg rg2" fill="url(#ink2)" d="M0 220 C 80 196 160 170 250 196 S 400 150 500 182 S 640 230 740 190 S 900 140 1010 178 S 1180 224 1290 186 S 1400 170 1440 180 V360 H0Z"/>
        <path class="rg rg3" fill="url(#ink3)" d="M0 290 C 120 262 220 250 330 274 S 520 240 640 268 S 820 304 940 272 S 1150 236 1260 266 S 1400 286 1440 280 V360 H0Z"/>
      </svg>
    </div>`;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(B.name)} · ${esc(B.en)} — 金针济世 · 返本归元</title>
<meta name="description" content="${esc(B.name)}：由清代医家黄元御创立，以“中气为本、一气周流”为核心；当代黄忠强接续传承，双脉并承泉派中医与新九针。">
${HEADC}
</head>
<body>
<!-- 本文件由 tools/build.js 根据 tools/content.js 生成。改文案：编辑 tools/content.js 后运行 node tools/build.js；
     也可以直接修改本文件（但下次运行 build.js 会被覆盖）。 -->
<a class="skip" href="#tang">跳到正文</a>
${navBar(true)}

<main id="top">
  <!-- 1 HERO -->
  <section class="hero" id="hero" aria-labelledby="hero-title">
    ${heroArt}
    <div class="hero-inner">
      <h1 class="hero-title" id="hero-title" aria-label="${esc(B.name)}">${[...B.name].map(ch => `<span>${esc(ch)}</span>`).join("")}</h1>
      <div class="hero-copy">
        <p class="eyebrow">${t(H.eyebrow)}</p>
        <p class="hero-tag">${t(H.tagline)}</p>
        <p class="hero-sub">${t(H.sub)}</p>
        <div class="hero-cta">
          <a class="btn solid" href="#needles">${t(H.cta1)}</a>
          <a class="btn ghost" href="#contact">${t(H.cta2)}</a>
        </div>
        <p class="hero-en">${t(H.en)}</p>
      </div>
    </div>
    <a class="scroll-hint" href="#tang" aria-label="向下滚动"><span></span></a>
  </section>

  <section class="sec" id="tang" aria-labelledby="tang-h">${tang}</section>
  <section class="sec alt" id="about" aria-labelledby="about-h">${about}</section>
  <section class="sec night" id="needles" aria-labelledby="needles-h">${needles}</section>
  <section class="sec" id="lineage" aria-labelledby="lineage-h">${lineage}</section>
  <section class="sec alt" id="wellness" aria-labelledby="wellness-h">${wellness}</section>
  <section class="sec" id="cases" aria-labelledby="cases-h">${cases}</section>
  <section class="sec alt" id="courses" aria-labelledby="courses-h">${courses}</section>
  <section class="sec night" id="contact" aria-labelledby="contact-h">${contact}</section>
</main>

<footer class="footer" id="footer">${footer}</footer>
<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" hidden>
  <div class="modal-card"><button class="modal-x" type="button" aria-label="关闭"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button><div id="modalBody"></div></div>
</div>
${SCRIPTS}
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("index.html 已生成（" + Buffer.byteLength(html) + " bytes）");

/* ---------- 穴光 · AcuAtlas 独立页面：xueguang.html ---------- */
const xg = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(P.name)} — ${esc(P.slogan)} · ${esc(B.name)}</title>
<meta name="description" content="${esc(P.name)}：${esc(P.slogan)}。${esc(B.name)}出品的穴位学习应用。">
${HEADC}
</head>
<body class="xg-page">
<!-- 本文件由 tools/build.js 生成，请勿直接修改。应用地址在 tools/content.js → CONTENT.app.url -->
${navBar(false, "xueguang.html")}

<main id="top" class="xg-main">
  <div class="xg-strip">
    <h1 class="xg-title"><b>${t(P.name)}</b><span class="xg-slogan">${t(P.slogan)}</span><span class="xg-by">${t(P.by)}</span></h1>
    <a class="xg-open" href="${esc(P.url)}" target="_blank" rel="noopener">${t(P.open)} <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true"><path d="M3 9L9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></a>
  </div>
  <div class="xg-frame-wrap">
    <iframe class="xg-frame" id="xgFrame" src="${esc(P.url)}" title="${esc(P.name)} —— ${esc(B.name)}穴位学习应用" allow="fullscreen" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <noscript><p class="xg-fallback"><a href="${esc(P.url)}" target="_blank" rel="noopener">${t(P.fallback)}</a></p></noscript>
  </div>
  <p class="xg-note">学习进度保存在本浏览器中。<a href="${esc(P.url)}" target="_blank" rel="noopener">${t(P.fallback)}</a></p>
</main>

<footer class="footer" id="footer">${footer}</footer>
<script src="js/main.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "xueguang.html"), xg);
console.log("xueguang.html 已生成（" + Buffer.byteLength(xg) + " bytes）");
