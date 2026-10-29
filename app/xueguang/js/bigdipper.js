"use strict";
/* ============================================================
 * 穴光 · 天星十二穴 × 北斗七星（bigdipper.js）
 * 本文件是「天星十二穴系统」与星图之间的接口层，
 * 只放配置，不含界面逻辑——师父那边的配穴算法可直接替换此表。
 *
 * 内容依据：《针灸大成·马丹阳天星十二穴并治杂病歌》。
 * 分组说明：十二穴 → 北斗七星的归属为**暂定框架**（v0.1），
 *   斗魁四星各辖一对表里/上下穴，斗柄三星各辖单穴；
 *   待师父校准后修改 DIPPER_STARS 即可，界面自动跟随。
 * ============================================================ */

/** 天星十二穴总歌 */
const TIANXING_SONG =
  "三里内庭穴，曲池合谷接，委中配承山，太冲昆仑穴，环跳与阳陵，通里并列缺。" +
  "合担用法担，合截用法截。三百六十穴，不出十二诀。";

/**
 * 北斗七星 → 天星十二穴
 * key  星名   no 斗序   part 斗魁/斗柄   points 归属穴位（标准代码）
 * theme 该星所主的治法轴   use 主治提要   combo 配伍说明
 */
const DIPPER_STARS = [
  {
    key: "天枢", no: 1, part: "斗魁", glyph: "枢", color: "#f4b942",
    points: ["LI4", "LI11"],
    theme: "手阳明一对：头面 ↔ 上肢",
    use: "头面风热、齿痛咽痛、上肢痿痹",
    combo: "合谷（原穴）+ 曲池（合穴）——表里同经、一上一下，是「面口合谷收」的扩展",
  },
  {
    key: "天璇", no: 2, part: "斗魁", glyph: "璇", color: "#f4b942",
    points: ["ST36", "ST44"],
    theme: "足阳明一对：中焦 ↔ 热证",
    use: "胃痛腹胀、消化不良、胃火牙痛",
    combo: "足三里（合穴）+ 内庭（荥穴）——一补一泻，虚证实证同调",
  },
  {
    key: "天玑", no: 3, part: "斗魁", glyph: "玑", color: "#f4b942",
    points: ["BL40", "BL57"],
    theme: "足太阳一对：腰背 ↔ 筋脉",
    use: "腰背痛、小腿转筋、痔疾",
    combo: "委中（合穴）+ 承山——上下呼应，「腰背委中求」的完整一圈",
  },
  {
    key: "天权", no: 4, part: "斗魁", glyph: "权", color: "#f4b942",
    points: ["LR3", "GB34"],
    theme: "肝胆一对：风 ↔ 筋",
    use: "眩晕头痛、胁痛、筋脉拘挛",
    combo: "太冲（原穴）+ 阳陵泉（筋会）——平肝息风、舒筋缓急",
  },
  {
    key: "玉衡", no: 5, part: "斗柄", glyph: "衡", color: "#ffd166",
    points: ["GB30", "BL60"],
    theme: "太阳上下：髋 ↔ 踝",
    use: "坐骨神经痛、腰腿痛、头痛项强",
    combo: "环跳 + 昆仑——一髋一踝，通彻整条下肢",
  },
  {
    key: "开阳", no: 6, part: "斗柄", glyph: "阳", color: "#ffd166",
    points: ["LU7"],
    theme: "手太阴：头项 ↔ 肺系",
    use: "头项强痛、咳嗽气喘、咽喉肿痛",
    combo: "列缺（络穴，通任脉）——「头项寻列缺」，一穴兼走肺系与任脉",
  },
  {
    key: "摇光", no: 7, part: "斗柄", glyph: "光", color: "#ffd166",
    points: ["HT5"],
    theme: "手少阴：舌 ↔ 神志",
    use: "暴喑、舌强不语、心悸怔忡",
    combo: "通里（络穴）——心开窍于舌，声与神同调",
  },
];

/** 歌诀中与该穴同句的分组（用于穴卡展示原文） */
const SONG_LINES = {
  "ST36": "三里内庭穴", "ST44": "三里内庭穴",
  "LI11": "曲池合谷接", "LI4": "曲池合谷接",
  "BL40": "委中配承山", "BL57": "委中配承山",
  "LR3": "太冲昆仑穴", "BL60": "太冲昆仑穴",
  "GB30": "环跳与阳陵", "GB34": "环跳与阳陵",
  "HT5": "通里并列缺", "LU7": "通里并列缺",
};

/** 反查表：穴位代码 → {星, 同星伙伴, 歌诀句} */
const DIPPER_BY_POINT = {};
DIPPER_STARS.forEach((s) => {
  s.points.forEach((id) => {
    DIPPER_BY_POINT[id] = {
      star: s,
      partners: s.points.filter((x) => x !== id),
      songLine: SONG_LINES[id] || "",
    };
  });
});

const TIANXING_IDS = DIPPER_STARS.reduce((acc, s) => acc.concat(s.points), []);

/** 该穴的天星信息；非十二穴返回 null */
function tianxingOf(id) {
  return DIPPER_BY_POINT[id] || null;
}

/** 一组穴位的整体掌握度：返回 {total, mastered, learning} */
function dipperMastery(star) {
  let mastered = 0, learning = 0;
  star.points.forEach((id) => {
    const c = Progress.card(id);
    if (!c) return;
    if (isMastered(c)) mastered += 1; else learning += 1;
  });
  return { total: star.points.length, mastered, learning };
}

/* 供师父的「天星十二穴·北斗七星·智能配穴系统」接入：
 * window.XueGuangBridge = { TIANXING_SONG, DIPPER_STARS, DIPPER_BY_POINT, tianxingOf, dipperMastery }
 */
if (typeof window !== "undefined") {
  window.XueGuangBridge = { TIANXING_SONG, DIPPER_STARS, DIPPER_BY_POINT, TIANXING_IDS, tianxingOf, dipperMastery };
}
