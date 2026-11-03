/* ==========================================================================
   久真堂 · Jiu Zhen Tang —— 交互与动效脚本（只负责交互，不渲染文字）
   · 页面文字已直接写在 HTML 里（由 tools/build.js 根据 tools/content.js 生成），
     关闭 JavaScript 也能完整显示。
   · 这里只做：手机菜单、吸顶导航与栏目高亮、滚动渐显、堂史逐字显影、首屏“一气周流 · 金针归中”动画、
     九针原文弹窗、复制联系方式。系统开启“减少动态效果”时，全部直接显示终态。
   ========================================================================== */
(function () {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const t = s => esc(s).replace(/【([^】]*)】/g, '<span class="ph" title="占位：请替换为真实信息">【$1】</span>');
  const reveals = $$(".reveal");
  const showAll = () => reveals.forEach(el => el.classList.add("in"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 告诉 <head> 里的保险脚本：main.js 已运行（不要再强制取消渐显）
  root.classList.add("ready");
  if (!root.classList.contains("js")) { showAll(); }

  try {
    /* ---------- 导航 / 手机菜单 ---------- */
    const nav = $("#nav"), btn = $("#menuBtn"), menu = $("#menu");
    if (nav && btn && menu) {
      const setOpen = o => {
        nav.classList.toggle("open", o); btn.setAttribute("aria-expanded", String(o));
        btn.setAttribute("aria-label", o ? "关闭菜单" : "打开菜单");
        document.body.style.overflow = o ? "hidden" : "";
      };
      btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
      menu.addEventListener("click", e => { if (e.target.closest("a")) setOpen(false); });
      addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); btn.focus(); } });
      addEventListener("resize", () => { if (innerWidth > 1100 && nav.classList.contains("open")) setOpen(false); });
      const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
      addEventListener("scroll", onScroll, { passive: true }); onScroll();

      // 当前栏目高亮（仅首页锚点）
      const links = $$("a", menu).filter(a => a.getAttribute("href").charAt(0) === "#");
      if (links.length && "IntersectionObserver" in window) {
        const spy = new IntersectionObserver(es => es.forEach(e => {
          if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
        }), { rootMargin: "-45% 0px -50% 0px" });
        links.forEach(a => { const s = document.getElementById(a.getAttribute("href").slice(1)); if (s) spy.observe(s); });
      }
    }

    /* ---------- 滚动渐显 ---------- */
    if (reduce || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12, rootMargin: "0px 0px -6% 0px" });
      reveals.forEach(el => io.observe(el));
    }

    /* ---------- 堂史正文：随滚动逐字显影 ---------- */
    const para = $("[data-chars]");
    if (para && !reduce && para.children.length === 0) {
      const txt = para.textContent;
      para.setAttribute("aria-label", txt);
      para.innerHTML = [...txt].map(ch => `<span class="c" aria-hidden="true">${esc(ch)}</span>`).join("");
      const cs = $$(".c", para), n = cs.length;
      let ticking = false;
      const paint = () => {
        ticking = false;
        const r = para.getBoundingClientRect(), vh = innerHeight;
        const p = Math.min(1, Math.max(0, (vh * .88 - r.top) / (r.height + vh * .35)));
        const head = p * n * 1.15;
        for (let i = 0; i < n; i++) {
          const o = Math.min(1, Math.max(0, (head - i) / (n * .14)));
          cs[i].style.setProperty("--o", (.16 + o * .84).toFixed(3));
        }
      };
      addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
      addEventListener("resize", paint); paint();
    }

    /* ---------- 首屏：一气周流（墨圆）· 金针归中 ---------- */
    const hero = $("#hero"), G = window.gsap;
    if (hero && G && !reduce) {
      const stroke = $(".enso-reveal", hero), needle = $(".needle", hero), ripples = $$(".ripple", hero);
      const chars = $$(".hero-title span", hero), copy = $$(".hero-copy > *", hero), ridges = $$(".rg", hero);
      const len = stroke.getTotalLength();
      G.set(stroke, { strokeDasharray: len, strokeDashoffset: len });
      const tl = G.timeline({ defaults: { ease: "power3.out" } });
      tl.from("#nav", { y: -16, opacity: 0, duration: .7, clearProps: "transform,opacity" }, 0)
        .from(ridges, { y: 40, opacity: 0, duration: 1.4, stagger: .12, ease: "power2.out" }, 0)
        .to(stroke, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, .05)
        .from(".enso-ghost", { opacity: 0, duration: 1 }, .05)
        .from(chars, { yPercent: 24, opacity: 0, filter: "blur(8px)", duration: .9, stagger: .12 }, .2)
        .from(needle, { yPercent: -70, opacity: 0, duration: .95, ease: "expo.out" }, .4)
        .from(".enso-core", { scale: 0, transformOrigin: "50% 50%", duration: .5, ease: "back.out(2)" }, 1.15)
        .fromTo(ripples, { scale: .2, opacity: .8 }, { scale: 2.2, opacity: 0, duration: 1.4, stagger: .25, ease: "power2.out" }, 1.15)
        .from(copy, { y: 22, opacity: 0, duration: .8, stagger: .08 }, .65);
      // 安全网：动画若被打断，2.5 秒后强制到终态
      setTimeout(() => tl.progress(1), 2500);

      if (window.ScrollTrigger) {
        G.registerPlugin(window.ScrollTrigger);
        G.to(".enso", { rotate: 24, scale: 1.06, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .6 } });
        G.to(needle, { yPercent: 18, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: .6 } });
        G.to(".hero-title", { yPercent: -8, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .6 } });
      }
    }

    /* ---------- 九针原文弹窗（文字取自卡片的 data-* 属性） ---------- */
    const modal = $("#modal"), body = $("#modalBody");
    if (modal && body) {
      let last = null;
      const closeM = () => { modal.classList.remove("show"); setTimeout(() => { modal.hidden = true; }, 300); document.body.style.overflow = ""; if (last) last.focus(); };
      const openM = c => {
        last = c; const x = c.dataset;
        body.innerHTML = `<span class="kicker">《灵枢·九针十二原》</span><h3 id="modalTitle">${t(x.n)} <small>${t(x.py)}</small></h3><blockquote>${t(x.quote)}</blockquote><p><b>形制</b>${t(x.shape)} · ${t(x.len)}</p><p><b>古用</b>${t(x.use)}</p><p><b>今观</b>${t(x.today)}</p><p class="source">文化科普，非操作指导。针刺须由合格医师完成。</p>`;
        modal.hidden = false; document.body.style.overflow = "hidden";
        requestAnimationFrame(() => modal.classList.add("show")); const x2 = $(".modal-x"); if (x2) x2.focus(); };
      $$(".ncard").forEach(c => c.addEventListener("click", () => openM(c)));
      modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".modal-x")) closeM(); });
      addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeM(); });
    }

    /* ---------- 复制联系方式（占位内容不复制） ---------- */
    $$(".copy").forEach(b => b.addEventListener("click", async () => {
      const v = b.dataset.v; if (!v || /【/.test(v)) return;
      try { await navigator.clipboard.writeText(v); b.classList.add("ok"); setTimeout(() => b.classList.remove("ok"), 1400); } catch (_) {}
    }));
  } catch (err) {
    // 任何交互出错都不能让文字消失
    showAll();
    if (window.gsap) { try { window.gsap.globalTimeline.progress(1); } catch (_) {} }
    if (window.console) console.warn("久真堂交互脚本出错：", err);
  }
})();
