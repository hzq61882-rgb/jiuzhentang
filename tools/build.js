#!/usr/bin/env node
/* 久真堂 · 静态页面生成器
   用法（在站点根目录）：node tools/build.js
   读取 tools/content.js 里的 CONTENT，生成完整的 index.html（所有文字预先写入 HTML，
   关闭 JavaScript 也能完整显示）。js/main.js 只负责交互，不再渲染内容。 */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const CONTENT = require("./content.js");

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// 【…】 占位标记自动高亮
const t = s => esc(s).replace(/【([^】]*)】/g, '<span class="ph" title="占位：请替换为真实信息">【$1】</span>');
const head = c => `<div class="sec-head reveal"><span class="kicker">${t(c.kicker)}</span><h2>${t(c.title)}</h2><i class="rule"></i>${c.intro ? `<p class="intro">${t(c.intro)}</p>` : ""}</div>`;
const B = CONTENT.brand, H = CONTENT.hero;

const G = CONTENT.tang;
const tang = `<div class="wrap">${head(G)}
    <p class="tang-core reveal">${t(G.core)}</p>
    <p class="tang-text reveal">${t(G.text)}</p>
    <div class="veins">${G.veins.map((v, i) => `
      <article class="vein reveal" style="--d:${i * 100}ms"><span class="vno">${t(v.n)}</span><small>双脉 · 其${t(v.n)}</small><h3>${t(v.t)}</h3><p>${t(v.d)}</p><ul>${v.tags.map(x => `<li>${t(x)}</li>`).join("")}</ul></article>`).join("")}
    </div>
    <div class="fuse reveal"><span class="fuse-k">融</span>${G.fuse.map(x => `<b>${t(x)}</b>`).join('<i aria-hidden="true">·</i>')}</div>
    <p class="tang-motto reveal">${t(G.motto)}</p>
  </div>`;

const A = CONTENT.about;
const about = `<div class="wrap">${head(A)}
    <div class="about-grid">
      <div class="portrait reveal">
        <img class="photo" src="assets/portrait.jpg" alt="黄忠强（德明）" width="640" height="640" loading="lazy">
        <span class="seal">${t(A.motto)}</span>
      </div>
      <div class="about-txt reveal">
        <p class="lead">${t(A.lead)}</p>
        ${A.paras.map(p => `<p>${t(p)}</p>`).join("\n        ")}
        <dl class="facts">${A.facts.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${t(v)}</dd></div>`).join("")}</dl>
        <p class="source">${t(A.lineagePh)}</p>
      </div>
    </div>
    <ol class="story">${A.story.map(([k, v], i) => `<li class="reveal" style="--d:${i * 80}ms"><b>${t(k)}</b><p>${t(v)}</p></li>`).join("")}</ol>
  </div>`;

const N = CONTENT.needles;
const needles = `<div class="wrap">${head(N)}
    <div class="needle-grid">${N.list.map((x, i) => `
      <button class="ncard reveal" type="button" data-i="${i}" data-n="${esc(x.n)}" data-py="${esc(x.py)}" data-len="${esc(x.len)}" data-shape="${esc(x.shape)}" data-use="${esc(x.use)}" data-today="${esc(x.today)}" data-quote="${esc(x.quote)}" style="--d:${i * 60}ms">
        <span class="nno">${"一二三四五六七八九"[i]}</span>
        <svg class="nicon" viewBox="0 0 20 120" aria-hidden="true"><path d="M7 4h6M7 9h6M7 14h6M7 19h6" /><path d="M10 22 V${60 + i * 5}" /><path d="M8.6 ${58 + i * 5} L10 ${70 + i * 5} L11.4 ${58 + i * 5}Z" class="tip"/></svg>
        <h3>${t(x.n)}<small>${t(x.py)}</small></h3>
        <p class="nshape">${t(x.shape)} · ${t(x.len)}</p>
        <p>${t(x.use)}</p>
        <p class="ntoday">${t(x.today)}</p>
      </button>`).join("")}
    </div>
    <p class="source reveal">${t(N.source)}</p>
    <div class="philo">${N.philosophy.map(([k, v]) => `<div class="reveal"><b>${t(k)}</b><p>${t(v)}</p></div>`).join("")}</div>
  </div>`;

const L = CONTENT.lineage;
const lineage = `<div class="wrap">${head(L)}
    <ol class="timeline">${L.items.map(([d, h, p], i) => `
      <li class="reveal ${i % 2 ? "r" : "l"}"><span class="dot"></span><div class="tl-card"><time>${t(d)}</time><h3>${t(h)}</h3><p>${t(p)}</p></div></li>`).join("")}
    </ol></div>`;

const W = CONTENT.wellness;
const wellness = `<div class="wrap">${head(W)}
    <div class="cards4">${W.cards.map((c, i) => `
      <article class="wcard reveal" style="--d:${i * 80}ms"><span class="wnum">0${i + 1}</span><h3>${t(c.t)}</h3><small>${t(c.en)}</small><p>${t(c.d)}</p><span class="tag">${t(c.tag)}</span></article>`).join("")}
    </div><p class="source reveal">${t(W.note)}</p></div>`;

const C = CONTENT.cases;
const cases = `<div class="wrap">${head(C)}
    <div class="xqs">${C.method.map(([k, e, d], i) => `<div class="xq reveal" style="--d:${i * 100}ms"><span class="xq-ch">${t(k)}</span><small>${t(e)}</small><p>${t(d)}</p></div>`).join('<i class="xq-arrow" aria-hidden="true"></i>')}</div>
    <div class="cards3">${C.list.map((c, i) => `
      <article class="ccard reveal" style="--d:${i * 80}ms"><span class="badge">专长 ${"一二三"[i] || i + 1}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p></article>`).join("")}
    </div>
    <p class="principle reveal">${t(C.principle)}</p>
    <p class="slot reveal">${t(C.slot)}</p>
    <div class="disclaimer reveal">${t(C.disclaimer)}</div></div>`;

const K = CONTENT.courses;
const courses = `<div class="wrap">${head(K)}
    <div class="cards4 courses">${K.list.map((c, i) => `
      <article class="kcard reveal" style="--d:${i * 80}ms"><div class="kthumb" aria-hidden="true"><span class="play"></span></div>
        <span class="lvl">${t(c.lvl)}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p>
        <ul>${c.items.map(x => `<li>${t(x)}</li>`).join("")}</ul><p class="sched">${t(c.sched || "")}</p>
        <div class="kfoot"><span class="price">${t(c.price)}</span><a class="btn sm ghost" href="#contact">${t(K.cta)}</a></div></article>`).join("")}
    </div></div>`;

const T = CONTENT.contact;
const contact = `<div class="wrap">${head(T)}
    <div class="contact-grid reveal">
      <dl class="crow">${T.rows.map(([k, v]) => `<div><dt>${t(k)}</dt><dd><button class="copy" type="button" data-v="${esc(v)}">${t(v)}</button></dd></div>`).join("")}</dl>
      <div class="qr"><div class="qr-box"><img src="assets/logo.svg" alt=""></div><p>${t(T.qr)}</p><small>${t(T.copyHint)}</small></div>
    </div></div>`;

const F = CONTENT.footer;
const footer = `<div class="wrap"><img src="assets/logo.svg" alt="" width="44" height="44"><p class="fline">${t(F.line)}</p><p class="fdis">${t(F.disclaimer)}</p><p class="fcopy">${t(F.copy)}</p></div>`;

const FONTS = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap";

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(B.name)} · ${esc(B.en)} — 金针济世 · 返本归元</title>
<meta name="description" content="${esc(B.name)}：由清代医家黄元御创立，以“中气为本、一气周流”为核心；当代黄忠强接续传承，双脉并承泉派中医与新九针。">
<meta name="theme-color" content="#0b0d10">
<!-- 有 JS 时才启用“渐显”隐藏；1.5 秒内 main.js 未运行则自动全部显示 -->
<script>(function(d){d.classList.add("js");setTimeout(function(){if(!d.classList.contains("ready")){d.classList.remove("js");}},1500);})(document.documentElement);</script>
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="stylesheet" href="css/style.css">
<!-- Google Fonts 非阻塞加载：加载失败（如国内网络）时直接使用系统中文字体 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${FONTS}"></noscript>
</head>
<body>
<!-- 本文件由 tools/build.js 根据 tools/content.js 生成。改文案：编辑 tools/content.js 后运行 node tools/build.js；
     也可以直接修改本文件（但下次运行 build.js 会被覆盖）。 -->
<header class="nav" id="nav">
  <a class="brand" href="#top" aria-label="${esc(B.name)} 首页">
    <img src="assets/logo.svg" alt="" width="36" height="36">
    <span class="brand-txt"><b>${t(B.name)}</b><small>${t(B.en)}</small></span>
  </a>
  <button class="menu-btn" id="menuBtn" type="button" aria-label="打开菜单" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  <nav class="menu" id="menu" aria-label="主导航">${CONTENT.nav.map(([id, l]) => `<a href="#${id}">${t(l)}</a>`).join("")}</nav>
</header>

<main id="top">
  <!-- 1 HERO -->
  <section class="hero" id="hero">
${fs.readFileSync(path.join(__dirname, "hero-art.svg"), "utf8").trimEnd()}
    <canvas class="snow" id="snow" aria-hidden="true"></canvas>
    <div class="hero-inner">
      <p class="eyebrow">${t(H.eyebrow)}</p>
      <h1 class="hero-title">${t(B.name)}</h1>
      <p class="hero-en">${t(H.en)}</p>
      <p class="hero-tag">${t(H.tagline)}</p>
      <p class="hero-sub">${t(H.sub)}</p>
      <div class="hero-cta">
        <a class="btn gold" href="#needles">${t(H.cta1)}</a>
        <a class="btn ghost" href="#contact">${t(H.cta2)}</a>
      </div>
    </div>
    <a class="scroll-hint" href="#tang" aria-label="向下滚动"><span></span></a>
  </section>

  <section class="sec alt" id="tang">${tang}</section>
  <section class="sec" id="about">${about}</section>
  <section class="sec alt" id="needles">${needles}</section>
  <section class="sec" id="lineage">${lineage}</section>
  <section class="sec alt" id="wellness">${wellness}</section>
  <section class="sec" id="cases">${cases}</section>
  <section class="sec alt" id="courses">${courses}</section>
  <section class="sec" id="contact">${contact}</section>
</main>

<footer class="footer" id="footer">${footer}</footer>
<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" hidden>
  <div class="modal-card"><button class="modal-x" type="button" aria-label="关闭">×</button><div id="modalBody"></div></div>
</div>
<script src="js/main.js" defer></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("index.html 已生成（" + Buffer.byteLength(html) + " bytes）");
