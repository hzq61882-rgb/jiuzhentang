# 久真堂 · Jiu Zhen Tang — 宣传网站（静态）

纯 HTML / CSS / JS。所有文字已直接写进 `index.html`，**关闭 JavaScript 或脚本加载失败时也能完整显示**。未发布、未部署。

## 文件
- `index.html` — 完整页面（所有栏目文字已预先写入；首屏金针 + 雪岭线描 SVG 动画）。由 `tools/build.js` 生成
- `css/style.css` — 全部样式（深色底 + 金色点缀，响应式）
- `js/main.js` — **只负责交互**（手机菜单、导航高亮、滚动渐显、九针弹窗、复制、飘雪），不再生成文字
- `tools/content.js` — **全站文案唯一编辑处**（`CONTENT` 对象）
- `tools/build.js` — 根据 `tools/content.js` 重新生成 `index.html`
- `tools/hero-art.svg` — 首屏金针 / 雪岭 SVG（build.js 会把它嵌进 index.html）
- `assets/logo.svg` — 金针 + 雪岭 圆形标志
- `assets/favicon.svg` — 网站图标
- `shots/` — 预览截图（desktop.png / mobile.png / hero.png，不随 zip 打包）

## 修改文案
1. 打开 `tools/content.js`，修改 `CONTENT` 里的文字（`【…】` 形式的文字会显示为金色虚线占位框）。
2. 在站点根目录运行：`node tools/build.js`（需要 Node.js，任何版本 ≥ 14 均可），`index.html` 会被重新生成。
3. 没有 Node.js 也可以直接改 `index.html` 里的文字——但之后如果再运行 build.js，手改的内容会被 `content.js` 覆盖，记得同步。

> 九针卡片的弹窗原文保存在 `index.html` 中每张 `.ncard` 的 `data-quote` 等属性里（build.js 会自动写入）。

## 加载与显示的保险机制
- 文字是静态 HTML，不依赖 JS。
- “滚动渐显”只在 `<html class="js">` 时生效（由 `<head>` 里一行内联脚本添加）；若 1.5 秒内 `main.js` 没有运行，会自动取消隐藏，全部内容直接显示。
- 首屏入场动画以“可见”为终态；系统开启“减少动态效果”时所有内容立即显示、动画关闭。
- Google Fonts 以非阻塞方式加载（`media="print"` + `onload`，附 `<noscript>` 回退），国内网络访问不到时不会卡住页面，自动使用系统字体：宋体类（Noto Serif SC / Source Han Serif SC / Songti SC / STSong / SimSun）、楷体（标题：STKaiti / KaiTi）、黑体类（PingFang SC / Microsoft YaHei）。

## 预览
- 直接双击打开 `index.html`；或
- 在本目录运行 `python3 -m http.server 8000`，浏览器打开 http://localhost:8000

字体来自 Google Fonts（Ma Shan Zheng / Noto Serif SC / Noto Sans SC / Cormorant Garamond），非阻塞加载；若网络无法访问 Google Fonts，会自动回退到系统中文字体。

## 交互
吸顶导航（滚动高亮当前栏目）、平滑滚动、手机端菜单、滚动渐显、九针卡片点击弹出《灵枢》原文、联系信息点击复制、首屏飘雪（系统开启“减少动态效果”时自动关闭动画）。

## 待填占位（页面上显示为虚线金框，搜索 `【` 即可全部找到）
关于（tools/content.js → CONTENT.about）
- 【待补充：传承谱系图（可选）】

传承（CONTENT.lineage）
- 【待补充：久真堂 / 黄药师 传承谱系与代际】（时间轴末条）

临床专长（CONTENT.cases）
- 【真实案例待授权补充】（须患者书面授权并匿名化）

课程（CONTENT.courses，四门：桩功 / 呼吸·调息 / 太极技法 / 九针理论）
- 每门各一处 【课时 / 排期待定】
- 每门各一处 【价格待定】

联系 · 久真堂（CONTENT.contact）
- 【地址待填】【电话待填】【微信号待填】【公众号名称待填】【营业 / 门诊时间待填】

页脚（CONTENT.footer）
- 【待补充：备案号（如需）】

## 内容说明
- 人物信息仅来自店主本人提供的简介；未加任何年份、奖项或数字。
- 九针形制/长度据《灵枢·九针十二原》；“今观”一栏为常见学界观点，仅作文化介绍。
- 传承时间轴：《黄帝内经》、《针灸甲乙经》（西晋）、《备急千金要方》（652）、《铜人腧穴针灸图经》与天圣铜人（1026–1027）、《十四经发挥》（1341）、《针灸大成》（1601）、2006 国家级非遗、2010 联合国教科文组织人类非遗代表作、2011 世界记忆名录。
- “临床专长”为诊疗思路介绍，附免责声明：不构成医疗建议，具体诊疗请面诊。
- 品牌名已统一为“久真堂”（与已有课件《久真堂新九针》一致）。

## 穴光 · AcuAtlas（app/xueguang/）
- `xueguang.html` 由 `tools/build.js` 生成，用 iframe 嵌入本站自带的 `app/xueguang/index.html`（地址在 `tools/content.js → CONTENT.app.url`）。
- `app/xueguang/` 是应用的静态镜像（HTML + CSS + JS，含本地化的 ts-fsrs），运行时不访问 workbuddy 或任何境外 CDN。
- **更新应用**：在站点根目录运行 `bash tools/mirror-xueguang.sh`（会重新抓取 workbuddy 上的最新版本并覆盖 `app/xueguang/`；脚本发现外部依赖会报错退出），检查 `git diff` 后提交推送。
- 学习进度保存在浏览器 localStorage，按域名区分：workbuddy 链接上的旧进度不会自动带过来（可在应用设置里“导出 / 导入进度”）。
