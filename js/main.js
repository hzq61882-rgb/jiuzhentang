/* ==========================================================================
   久真堂 · Jiu Zhen Tang —— 全站文案（唯一编辑处）
   --------------------------------------------------------------------------
   · 所有可见文字都在下面的 CONTENT 里。改字、增删卡片，只改这里即可。
   · 凡是 【待补充…】【…待填】【…待定】 形式的文字，页面上会自动显示为
     虚线金框的“占位标记”，方便店主逐一找到并替换成真实信息。
   · 请勿在此填写未经核实的资质、证书编号、从业年限、师承姓名、价格。
   ========================================================================== */
const CONTENT = {
  brand: { name: "久真堂", en: "Jiu Zhen Tang" },

  nav: [
    ["about", "药师"], ["needles", "九针"], ["lineage", "传承"], ["wellness", "养生"],
    ["cases", "专长"], ["courses", "课程"], ["contact", "联系"]
  ],

  hero: {
    eyebrow: "中医针灸 · 武医同源 · 养生文化",
    en: "Golden Needle · Snow Ridge · Benevolence",
    tagline: "雪岭守一针，金针济天下",
    sub: "承《灵枢》九针之制，守仁心仁术之道 —— 返本归元。",
    cta1: "认识九针", cta2: "广仁堂 · 联系"
  },

  about: {
    kicker: "About", title: "黄忠强 · 黄药师",
    lead: "黄忠强，字德明，号黄药师 —— 武医 · 雪岭守护者 · 金针济世",
    story: [
      ["少时", "幼年随父站桩，父亲以一根枪杆校正身形。桩功与呼吸，自此成为一生的底子。"],
      ["求学", "就读山西中医药大学，系统研习中医理论；寻访南怀瑾先生旧居与隐修之处，背着针包走进山里。"],
      ["行医", "临床三十余年，坚持武医结合；每日门诊之前，先行晨间站桩调息。"]
    ],
    paras: [
      "山西省省级非物质文化遗产代表性传承人（泉派中医 · 新九针疗法），古传形意拳第七代嫡传传人，北京广仁堂中医研究院院长。",
      "师从王文德、李亮、余成麟诸先生，习新九针，兼及河洛针法；从张大辉先生习孙式太极。并兼修峨眉点穴（指压法）、道家针法与太上玄灵门调神法。",
      "主张绿色非药物疗法优先——运动、正骨、金针；以“形·气·神”三层诊断看人，以运动处方把调理延伸到日常。曾在古传形意拳论坛、全国九针临床交流会上分享经验。"
    ],
    facts: [
      ["非遗", "山西省省级非物质文化遗产代表性传承人（泉派中医 · 新九针疗法）"],
      ["武学", "古传形意拳第七代嫡传传人 · 孙式太极"],
      ["机构", "北京广仁堂中医研究院 院长"],
      ["临床", "三十余年 · 武医结合"]
    ],
    lineagePh: "【待补充：传承谱系图（可选）】",
    motto: "返本归元"
  },

  needles: {
    kicker: "The Nine Needles", title: "九针",
    intro: "九针之名，出自《黄帝内经·灵枢》。《九针十二原》《九针论》记述了九种形制、长短、用途各异的针具，“各不同形，各以任其所宜”。久真堂以此为名，意在溯源古制、守正创新。点击卡片可阅读原文摘句。",
    source: "形制与长度据《灵枢·九针十二原》。后世对应仅为学界常见观点，供文化了解。",
    list: [
      { n: "镵针", py: "chán zhēn", len: "长一寸六分", shape: "头大末锐", use: "浅刺皮肤，以泻阳气（热在头身者）", today: "后世皮肤针、浅刺法多溯源于此", quote: "镵针者，头大末锐，去泻阳气。" },
      { n: "员针", py: "yuán zhēn", len: "长一寸六分", shape: "针如卵形", use: "揩摩分肉之间，不伤肌肉，以泻分气", today: "近似按摩、点按类器具", quote: "员针者，针如卵形，揩摩分间，不得伤肌肉，以泻分气。" },
      { n: "鍉针", py: "dī zhēn", len: "长三寸半", shape: "锋如黍粟之锐", use: "按压经脉而不刺入，以致其气", today: "今之推针、按压针的古源", quote: "鍉针者，锋如黍粟之锐，主按脉勿陷，以致其气。" },
      { n: "锋针", py: "fēng zhēn", len: "长一寸六分", shape: "刃三隅", use: "刺络放血，以发痼疾", today: "即后世三棱针之前身", quote: "锋针者，刃三隅，以发痼疾。" },
      { n: "铍针", py: "pí zhēn", len: "长四寸，广二分半", shape: "末如剑锋", use: "切开排脓，以取大脓", today: "古代外科刀针", quote: "铍针者，末如剑锋，以取大脓。" },
      { n: "员利针", py: "yuán lì zhēn", len: "长一寸六分", shape: "大如氂，且员且锐，中身微大", use: "以取暴气（急性痹痛）", today: "后世粗针类的古源之一", quote: "员利针者，大如氂，且员且锐，中身微大，以取暴气。" },
      { n: "毫针", py: "háo zhēn", len: "长三寸六分", shape: "尖如蚊虻喙", use: "静以徐往，微以久留，以取痛痹", today: "今日针灸临床最常用的针具", quote: "毫针者，尖如蚊虻喙，静以徐往，微以久留之而养，以取痛痹。" },
      { n: "长针", py: "cháng zhēn", len: "长七寸", shape: "锋利身薄", use: "深刺，以取远痹", today: "后世芒针的古源", quote: "长针者，锋利身薄，可以取远痹。" },
      { n: "大针", py: "dà zhēn", len: "长四寸", shape: "尖如梃，其锋微员", use: "以泻机关之水（关节积水）", today: "后世有以之与火针相联系之说", quote: "大针者，尖如梃，其锋微员，以泻机关之水也。" }
    ],
    philosophy: [
      ["一针", "九针各司其职，“针各有所宜”。针为器，道在人。"],
      ["守神", "《灵枢》言“粗守形，上守神”。用针之要，先在调神。"],
      ["武医", "武以强身，医以济人。导引吐纳与针道同出一源。"]
    ]
  },

  lineage: {
    kicker: "Inheritance", title: "传承",
    intro: "从《黄帝内经》到联合国教科文组织名录，针灸之学两千余年薪火不绝。",
    items: [
      ["约成书于战国至西汉", "《黄帝内经》", "分《素问》《灵枢》两部。《灵枢》又称《针经》，系统记述经络、腧穴与九针，为针灸学奠基。"],
      ["西晋 · 3 世纪", "皇甫谧《针灸甲乙经》", "现存最早的针灸学专著，系统整理腧穴与针法。"],
      ["唐 · 652 年", "孙思邈《备急千金要方》", "载“阿是”取穴之法，绘明堂三人图，倡“大医精诚”之医德。"],
      ["北宋 · 1026–1027 年", "王惟一《铜人腧穴针灸图经》与天圣针灸铜人", "官修腧穴标准，并铸针灸铜人用于教学与考核。"],
      ["元 · 1341 年", "滑寿《十四经发挥》", "以十二经合任督二脉为“十四经”，经穴体系更趋完备。"],
      ["明 · 1601 年", "杨继洲《针灸大成》", "集明以前针灸之大成，流传极广。"],
      ["2006 年", "国家级非物质文化遗产", "针灸列入第一批国家级非物质文化遗产名录（传统医药类）。"],
      ["2010 年", "人类非物质文化遗产代表作", "联合国教科文组织将“中医针灸”列入人类非物质文化遗产代表作名录。"],
      ["2011 年", "世界记忆名录", "《黄帝内经》与《本草纲目》入选联合国教科文组织《世界记忆名录》。"],
      ["今日", "久真堂", "【待补充：久真堂 / 黄药师 传承谱系与代际】"]
    ]
  },

  wellness: {
    kicker: "Health Preservation", title: "养生文化",
    intro: "《素问》云：“法于阴阳，和于术数，食饮有节，起居有常，不妄作劳。”养生不在一时，在于日常。",
    cards: [
      { t: "节气养生", en: "Solar Terms", d: "顺四时而适寒暑。如霜降重在一个“收”字：早卧早起，收敛神气；可日常按揉足三里、太溪，以养脾肾。", tag: "近期：霜降 · 深秋安眠" },
      { t: "导引 · 八段锦", en: "Daoyin & Baduanjin", d: "导引吐纳，动静相兼。八段锦舒展筋骨、调和呼吸；黄药师每日门诊前亦以站桩调息为功课——武医同源，功在日常。", tag: "武医同源" },
      { t: "饮食有节", en: "Diet", d: "五谷为养，五果为助。深秋燥气当令，可选百合、莲子、红枣、小米等温和食材，饮食清淡有度。", tag: "食养" },
      { t: "起居有常", en: "Daily Rhythm", d: "睡前温水泡脚、按揉神门与内关、缓慢呼吸（吸四呼六），帮身体从“外放”转入“内收”。", tag: "安神小流程" }
    ],
    note: "以上为中医养生文化科普，个人体质不同，如有不适请及时就医。"
  },

  cases: {
    kicker: "Clinical Focus", title: "临床专长 · 诊疗思路",
    intro: "先看形，再察气，终守神。以下为黄药师的诊疗思路与临床专长方向，属文化与方法介绍，不作疗效承诺。",
    method: [
      ["形", "Form", "看筋骨、姿态、脊柱与关节——身体的结构与力线。"],
      ["气", "Qi", "察呼吸、经络与气机的通滞——身体的运行状态。"],
      ["神", "Spirit", "观精神魂魄意——情志、睡眠与心神的安定。"]
    ],
    list: [
      { t: "疼痛难症", d: "以金针为主，配合运动处方，关注疼痛背后的“形”与“气”。" },
      { t: "脊柱关节", d: "以正骨、金针与桩功、导引相结合，调整结构，再以运动维持。" },
      { t: "精神魂魄意相关问题", d: "运用太上玄灵门调神针法，常取百会、神庭、内关、太冲等穴，重在调神。" }
    ],
    principle: "绿色非药物疗法优先：运动 · 正骨 · 金针",
    slot: "【真实案例待授权补充】",
    disclaimer: "以上内容为诊疗思路与中医文化介绍，不构成医疗建议，亦不代表疗效承诺。具体诊疗请面诊；针刺、正骨等操作须由合格医师完成。"
  },

  courses: {
    kicker: "Courses", title: "课程 · 广仁堂传习",
    intro: "黄药师在广仁堂授课：从桩功、呼吸入门，到太极技法与九针理论。课程以文化传习与系统学习为主，不替代面诊。",
    list: [
      { t: "桩功", lvl: "根基 · 站桩", d: "从幼年随父站桩而来的功课。立身中正，松静自然，是武与医共同的根。", items: ["站桩要领", "身形校正", "日常练习"], sched: "【课时 / 排期待定】", price: "【价格待定】" },
      { t: "呼吸 · 调息", lvl: "根基 · 调息", d: "晨间站桩调息，是黄药师每日门诊前的功课。以息调气，以气养神。", items: ["调息方法", "桩功配合呼吸", "形·气·神 中的“气”"], sched: "【课时 / 排期待定】", price: "【价格待定】" },
      { t: "太极技法", lvl: "武学 · 孙式太极", d: "承张大辉先生所授孙式太极，讲练结合，体会武医同源。", items: ["孙式太极技法", "武医结合", "运动处方思路"], sched: "【课时 / 排期待定】", price: "【价格待定】" },
      { t: "九针理论", lvl: "医学 · 新九针", d: "溯《灵枢》九针古制，讲新九针疗法理论。经络科普视频《久真堂新九针》（已有：手太阴肺经、手阳明大肠经、手厥阴心包经）可作配套。", items: ["《灵枢》九针源流", "新九针理论", "十二经络视频课"], sched: "【课时 / 排期待定】", price: "【价格待定】" }
    ],
    cta: "咨询课程"
  },

  contact: {
    kicker: "Contact", title: "联系 · 广仁堂",
    intro: "欢迎来访交流。授课与诊疗请提前预约，面诊为准。",
    rows: [
      ["机构", "北京广仁堂中医研究院"],
      ["地址", "【地址待填】"],
      ["电话", "【电话待填】"],
      ["邮箱", "hzq61882@gmail.com"],
      ["微信", "【微信号待填】"],
      ["公众号", "【公众号名称待填】"],
      ["时间", "【营业 / 门诊时间待填】"]
    ],
    qr: "【二维码待放置】",
    copyHint: "点击信息可复制"
  },

  footer: {
    line: "久真堂 · Jiu Zhen Tang —— 金针济世 · 返本归元",
    disclaimer: "本网站内容为中医文化科普，不构成医疗建议。具体诊疗请面诊，针刺等操作须由合格医师完成。",
    copy: "© 久真堂 · 广仁堂 【待补充：备案号（如需）】"
  }
};

/* ============================ 渲染逻辑（一般无需修改） ============================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // 【…】 占位标记自动高亮
  const t = s => esc(s).replace(/【([^】]*)】/g, '<span class="ph" title="占位：请替换为真实信息">【$1】</span>');
  const get = p => p.split(".").reduce((o, k) => (o || {})[k], CONTENT);
  const head = (c) => `<div class="sec-head reveal"><span class="kicker">${t(c.kicker)}</span><h2>${t(c.title)}</h2><i class="rule"></i>${c.intro ? `<p class="intro">${t(c.intro)}</p>` : ""}</div>`;

  document.querySelectorAll("[data-c]").forEach(el => { el.innerHTML = t(get(el.dataset.c) || ""); });
  $("#menu").innerHTML = CONTENT.nav.map(([id, l]) => `<a href="#${id}">${t(l)}</a>`).join("");

  const A = CONTENT.about;
  $("#about").innerHTML = `<div class="wrap">${head(A)}
    <div class="about-grid">
      <div class="portrait reveal" aria-hidden="true">
        <img src="assets/logo.svg" alt="">
        <span class="seal">${t(A.motto)}</span>
        <p class="portrait-ph"><span class="ph">【待放置：黄药师 肖像照片】</span></p>
      </div>
      <div class="about-txt reveal">
        <p class="lead">${t(A.lead)}</p>
        ${A.paras.map(p => `<p>${t(p)}</p>`).join("")}
        <dl class="facts">${A.facts.map(([k, v]) => `<div><dt>${t(k)}</dt><dd>${t(v)}</dd></div>`).join("")}</dl>
        <p class="source">${t(A.lineagePh)}</p>
      </div>
    </div>
    <ol class="story">${A.story.map(([k, v], i) => `<li class="reveal" style="--d:${i * 80}ms"><b>${t(k)}</b><p>${t(v)}</p></li>`).join("")}</ol>
  </div>`;

  const N = CONTENT.needles;
  $("#needles").innerHTML = `<div class="wrap">${head(N)}
    <div class="needle-grid">${N.list.map((x, i) => `
      <button class="ncard reveal" data-i="${i}" style="--d:${i * 60}ms">
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
  $("#lineage").innerHTML = `<div class="wrap">${head(L)}
    <ol class="timeline">${L.items.map(([d, h, p], i) => `
      <li class="reveal ${i % 2 ? "r" : "l"}"><span class="dot"></span><div class="tl-card"><time>${t(d)}</time><h3>${t(h)}</h3><p>${t(p)}</p></div></li>`).join("")}
    </ol></div>`;

  const W = CONTENT.wellness;
  $("#wellness").innerHTML = `<div class="wrap">${head(W)}
    <div class="cards4">${W.cards.map((c, i) => `
      <article class="wcard reveal" style="--d:${i * 80}ms"><span class="wnum">0${i + 1}</span><h3>${t(c.t)}</h3><small>${t(c.en)}</small><p>${t(c.d)}</p><span class="tag">${t(c.tag)}</span></article>`).join("")}
    </div><p class="source reveal">${t(W.note)}</p></div>`;

  const C = CONTENT.cases;
  $("#cases").innerHTML = `<div class="wrap">${head(C)}
    <div class="xqs">${C.method.map(([k, e, d], i) => `<div class="xq reveal" style="--d:${i * 100}ms"><span class="xq-ch">${t(k)}</span><small>${t(e)}</small><p>${t(d)}</p></div>`).join('<i class="xq-arrow" aria-hidden="true"></i>')}</div>
    <div class="cards3">${C.list.map((c, i) => `
      <article class="ccard reveal" style="--d:${i * 80}ms"><span class="badge">专长 ${"一二三"[i] || i + 1}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p></article>`).join("")}
    </div>
    <p class="principle reveal">${t(C.principle)}</p>
    <p class="slot reveal">${t(C.slot)}</p>
    <div class="disclaimer reveal">${t(C.disclaimer)}</div></div>`;

  const K = CONTENT.courses;
  $("#courses").innerHTML = `<div class="wrap">${head(K)}
    <div class="cards4 courses">${K.list.map((c, i) => `
      <article class="kcard reveal" style="--d:${i * 80}ms"><div class="kthumb" aria-hidden="true"><span class="play"></span></div>
        <span class="lvl">${t(c.lvl)}</span><h3>${t(c.t)}</h3><p>${t(c.d)}</p>
        <ul>${c.items.map(x => `<li>${t(x)}</li>`).join("")}</ul><p class="sched">${t(c.sched || "")}</p>
        <div class="kfoot"><span class="price">${t(c.price)}</span><a class="btn sm ghost" href="#contact">${t(K.cta)}</a></div></article>`).join("")}
    </div></div>`;

  const T = CONTENT.contact;
  $("#contact").innerHTML = `<div class="wrap">${head(T)}
    <div class="contact-grid reveal">
      <dl class="crow">${T.rows.map(([k, v]) => `<div><dt>${t(k)}</dt><dd><button class="copy" data-v="${esc(v)}">${t(v)}</button></dd></div>`).join("")}</dl>
      <div class="qr"><div class="qr-box"><img src="assets/logo.svg" alt=""></div><p>${t(T.qr)}</p><small>${t(T.copyHint)}</small></div>
    </div></div>`;

  const F = CONTENT.footer;
  $("#footer").innerHTML = `<div class="wrap"><img src="assets/logo.svg" alt="" width="44" height="44"><p class="fline">${t(F.line)}</p><p class="fdis">${t(F.disclaimer)}</p><p class="fcopy">${t(F.copy)}</p></div>`;

  /* ---------- 交互 ---------- */
  const nav = $("#nav"), btn = $("#menuBtn"), menu = $("#menu");
  const closeMenu = () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => { const o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", String(o)); });
  menu.addEventListener("click", e => { if (e.target.tagName === "A") closeMenu(); });
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // 当前栏目高亮
  const links = [...menu.querySelectorAll("a")];
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  CONTENT.nav.forEach(([id]) => spy.observe(document.getElementById(id)));

  // 滚动渐显
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // 九针原文弹窗
  const modal = $("#modal"), body = $("#modalBody");
  const openM = i => { const x = N.list[i];
    body.innerHTML = `<span class="kicker">《灵枢·九针十二原》</span><h3 id="modalTitle">${t(x.n)} <small>${t(x.py)}</small></h3><blockquote>${t(x.quote)}</blockquote><p><b>形制</b>${t(x.shape)} · ${t(x.len)}</p><p><b>古用</b>${t(x.use)}</p><p><b>今观</b>${t(x.today)}</p><p class="source">文化科普，非操作指导。针刺须由合格医师完成。</p>`;
    modal.hidden = false; requestAnimationFrame(() => modal.classList.add("show")); $(".modal-x").focus(); };
  const closeM = () => { modal.classList.remove("show"); setTimeout(() => (modal.hidden = true), 250); };
  document.querySelectorAll(".ncard").forEach(c => c.addEventListener("click", () => openM(+c.dataset.i)));
  modal.addEventListener("click", e => { if (e.target === modal || e.target.classList.contains("modal-x")) closeM(); });
  addEventListener("keydown", e => { if (e.key === "Escape") { closeM(); closeMenu(); } });

  // 复制联系方式（占位内容不复制）
  document.querySelectorAll(".copy").forEach(b => b.addEventListener("click", async () => {
    const v = b.dataset.v; if (/【/.test(v)) return;
    try { await navigator.clipboard.writeText(v); b.classList.add("ok"); setTimeout(() => b.classList.remove("ok"), 1200); } catch (_) {}
  }));

  // 雪花（尊重“减少动态效果”设置）
  const cv = $("#snow"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (cv && !reduce) {
    const ctx = cv.getContext("2d"); let W, H, flakes = [];
    const size = () => { W = cv.width = cv.offsetWidth * devicePixelRatio; H = cv.height = cv.offsetHeight * devicePixelRatio;
      flakes = Array.from({ length: Math.round(W * H / 26000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.4 + .4) * devicePixelRatio, s: Math.random() * .4 + .15, w: Math.random() * 6.28 })); };
    size(); addEventListener("resize", size);
    (function tick() { ctx.clearRect(0, 0, W, H); ctx.fillStyle = "rgba(233,237,242,.55)";
      for (const f of flakes) { f.y += f.s * devicePixelRatio; f.w += .01; f.x += Math.sin(f.w) * .25; if (f.y > H) { f.y = -4; f.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
      requestAnimationFrame(tick); })();
  }
})();
