/* ==========================================================================
   久真堂 · Jiu Zhen Tang —— 交互脚本（只负责交互，不渲染文字）
   · 页面文字已直接写在 index.html 里（由 tools/build.js 根据 tools/content.js 生成），
     关闭 JavaScript 也能完整显示。改文案请看 README.md。
   · 这里只做：手机菜单、吸顶导航与栏目高亮、滚动渐显、九针原文弹窗、复制联系方式、首屏飘雪。
   ========================================================================== */
(function () {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const t = s => esc(s).replace(/【([^】]*)】/g, '<span class="ph" title="占位：请替换为真实信息">【$1】</span>');
  const reveals = $$(".reveal");
  const showAll = () => reveals.forEach(el => el.classList.add("in"));

  // 告诉 <head> 里的保险脚本：main.js 已运行（不要再强制取消渐显）
  root.classList.add("ready");
  if (!root.classList.contains("js")) { showAll(); }

  try {
    /* ---------- 导航 / 手机菜单 ---------- */
    const nav = $("#nav"), btn = $("#menuBtn"), menu = $("#menu");
    if (nav && btn && menu) {
      const closeMenu = () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
      btn.addEventListener("click", () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(o)); });
      menu.addEventListener("click", e => { if (e.target.tagName === "A") closeMenu(); });
      addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
      const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
      addEventListener("scroll", onScroll, { passive: true }); onScroll();

      // 当前栏目高亮
      const links = $$("a", menu);
      if ("IntersectionObserver" in window) {
        const spy = new IntersectionObserver(es => es.forEach(e => {
          if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
        }), { rootMargin: "-45% 0px -50% 0px" });
        links.forEach(a => { const s = document.getElementById(a.getAttribute("href").slice(1)); if (s) spy.observe(s); });
      }
    }

    /* ---------- 滚动渐显 ---------- */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
      reveals.forEach(el => io.observe(el));
    }

    /* ---------- 九针原文弹窗（文字取自卡片的 data-* 属性） ---------- */
    const modal = $("#modal"), body = $("#modalBody");
    if (modal && body) {
      const closeM = () => { modal.classList.remove("show"); setTimeout(() => (modal.hidden = true), 250); };
      const openM = c => { const x = c.dataset;
        body.innerHTML = `<span class="kicker">《灵枢·九针十二原》</span><h3 id="modalTitle">${t(x.n)} <small>${t(x.py)}</small></h3><blockquote>${t(x.quote)}</blockquote><p><b>形制</b>${t(x.shape)} · ${t(x.len)}</p><p><b>古用</b>${t(x.use)}</p><p><b>今观</b>${t(x.today)}</p><p class="source">文化科普，非操作指导。针刺须由合格医师完成。</p>`;
        modal.hidden = false; requestAnimationFrame(() => modal.classList.add("show")); const x2 = $(".modal-x"); if (x2) x2.focus(); };
      $$(".ncard").forEach(c => c.addEventListener("click", () => openM(c)));
      modal.addEventListener("click", e => { if (e.target === modal || e.target.classList.contains("modal-x")) closeM(); });
      addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeM(); });
    }

    /* ---------- 复制联系方式（占位内容不复制） ---------- */
    $$(".copy").forEach(b => b.addEventListener("click", async () => {
      const v = b.dataset.v; if (!v || /【/.test(v)) return;
      try { await navigator.clipboard.writeText(v); b.classList.add("ok"); setTimeout(() => b.classList.remove("ok"), 1200); } catch (_) {}
    }));

    /* ---------- 雪花（尊重“减少动态效果”设置） ---------- */
    const cv = $("#snow"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (cv && cv.getContext && !reduce) {
      const ctx = cv.getContext("2d"); let W, H, flakes = [];
      const size = () => { W = cv.width = cv.offsetWidth * devicePixelRatio; H = cv.height = cv.offsetHeight * devicePixelRatio;
        flakes = Array.from({ length: Math.round(W * H / 26000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.4 + .4) * devicePixelRatio, s: Math.random() * .4 + .15, w: Math.random() * 6.28 })); };
      size(); addEventListener("resize", size);
      (function tick() { ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(243,234,214,.72)";
        for (const f of flakes) { f.y += f.s * devicePixelRatio; f.w += .01; f.x += Math.sin(f.w) * .25; if (f.y > H) { f.y = -4; f.x = Math.random() * W; }
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
        requestAnimationFrame(tick); })();
    }
  } catch (err) {
    // 任何交互出错都不能让文字消失
    showAll();
    if (window.console) console.warn("久真堂交互脚本出错：", err);
  }
})();
