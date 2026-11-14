# -*- coding: utf-8 -*-
# organize_template.py — 繁体竖排资料整理模板
#
# 用途：把「带 【第N頁】 分页标记的裸文本」整理成
#   (1) 整理版 .txt（去分页标记、接回跨页段落、去页脚）
#   (2) 独立目录 .md（按卷分组、含每篇起页）
#   (3) 分卷/<卷名>.md（每卷带可点击小目录 + 篇题锚点）
#
# 用法：把本脚本放到源稿同目录，改下面的「=== 按书调整 ===」常量，
#       然后：python organize_template.py
# 换书只改常量，逻辑无需动。原型已验证于《九灵铁经·气功针经合璧》（7 卷 59 篇）。

import re, os
from collections import OrderedDict

# ==================== 按书调整 ====================
BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "全文.txt")                       # 带分页标记的源稿
OUT = os.path.join(BASE, "整理版.txt")                     # 整理版输出
TOC_OUT = os.path.join(BASE, "00_目录.md")                 # 独立目录
VOL_DIR = os.path.join(BASE, "分卷")                       # 分卷目录

# 正文起始行（仅此行之后抓取/拆分卷篇）。换书改成你的正文起始行；
# 若原稿繁简混用，写成元组：("九靈鐵經正文", "九灵铁经正文")
BODY_MARKERS = ("九靈鐵經正文", "九灵铁经正文")
PAGE_RE = re.compile(r'【第(\d+)頁】')   # 分页标记（按源稿样式改，可加其它样式）

# 卷首行必须以书名开头，否则会被「（卷之六」「參本書卷之五」之类
# 正文/注脚行误抓成卷。换书把 BOOK_PREFIXES 改成你的书名开头。
BOOK_PREFIXES = ("鐵經", "鍼經")
JUAN_RE = re.compile(r'^(%s).+?卷之[一二三四五六七八九十]+'
                     % "|".join(BOOK_PREFIXES))
# 篇题行：如「九靈鐵經氣功針經法天道卷之一篇第一　某某某」
PIAN_RE = re.compile(r'^(.+?篇第[一二三四五六七八九十]+)([　\s].+)?$')

# 识别「标题行」的关键词（这些行不参与段落接回）
HEAD_MARKERS = ("卷之", "篇第", "考注", "凡例", "說明", "书目", "目次",
               "正文", "重輯", "====")

# 纯页脚行（分页噪声，舍去）：如「（頁腳）一一」
PAGE_FOOT_RE = re.compile(r'^（頁腳）[〇一二三四五六七八九十百零\de\s]*$')
# =================================================

raw = open(SRC, encoding="utf-8").read()
lines = raw.split("\n")

# ---- 1) 提取目录：卷 -> 篇(起页) ----
tocs = []          # (juan, pian, page)
seen = set()
cur_juan = None
cur_page = None
in_body = False
page_seen = []

for l in lines:
    m = PAGE_RE.match(l)
    if m:
        cur_page = int(m.group(1))
        page_seen.append(cur_page)
        continue
    s = l.strip()
    if not s:
        continue
    if any(b in s for b in BODY_MARKERS):
        in_body = True
    jm = JUAN_RE.match(s)
    if jm and "目次" not in s:
        cur_juan = jm.group(0).strip()
        continue
    if in_body:
        pm = PIAN_RE.match(s)
        if pm and "目次" not in s and "書目" not in s:
            pian = pm.group(1).strip()
            if pian not in seen:
                seen.add(pian)
                tocs.append((cur_juan, pian, cur_page))

# ---- 2) 清洗正文：去分页标记、接回被切断的段落、去页脚 ----
def is_heading(s):
    if set(s.strip()) <= set("="):
        return True
    return any(mk in s for mk in HEAD_MARKERS)

PUNCT = ("。", "！", "？", "」", "）", "”")

clean = []
last_idx = None
page_break = False
for l in lines:
    m = PAGE_RE.match(l)
    if m:
        page_break = True
        continue
    s = l.rstrip()
    if s.strip() == "":
        clean.append("")
        continue
    st = s.strip()
    if PAGE_FOOT_RE.match(st):
        continue
    if page_break:
        page_break = False
        if last_idx is None or is_heading(st) or st.startswith("考注"):
            clean.append(s); last_idx = len(clean) - 1
        elif clean[last_idx].rstrip().endswith(PUNCT):
            if st.startswith("也。"):          # 句尾重复保护
                st = st[2:].lstrip()
                if st:
                    clean.append(st); last_idx = len(clean) - 1
            else:
                clean.append(s); last_idx = len(clean) - 1
        else:                                   # 上页未断句 -> 接回
            clean[last_idx] = clean[last_idx].rstrip() + st
        continue
    if last_idx is None:
        clean.append(s); last_idx = len(clean) - 1
    else:
        prev = clean[last_idx].strip()
        if (not is_heading(prev)) and (not prev.endswith(PUNCT)) \
           and (not is_heading(st)) and (not st.startswith("考注")):
            clean[last_idx] = prev.rstrip() + st
        else:
            clean.append(s); last_idx = len(clean) - 1

body = "\n".join(clean)

# ---- 2.5) 按卷动态分组 ----
juan_map = OrderedDict()
for (j, p, pg) in tocs:
    juan_map.setdefault(j, []).append((p, pg))
juan_order = list(juan_map.keys())
page_desc = "第 %d–%d 頁" % (min(page_seen), max(page_seen)) if page_seen else "頁碼未識別"
vol_desc = "、".join(juan_order) if juan_order else "（未識別卷）"
n_vol = len(juan_order)
n_pian = len(tocs)

# ---- 3) 拼装整理版 ----
lines_out = []
lines_out.append("整理版")
lines_out.append("=" * 50)
lines_out.append("已轉錄：%s，含 %s 全文（共 %d 篇，分 %d 卷）。" % (page_desc, vol_desc, n_pian, n_vol))
lines_out.append("整理：去除分頁標記、接回被頁碼切斷之段落；篇題與考注保留。")
lines_out.append("=" * 50)
lines_out.append("")
lines_out.append("【目錄】共 %d 篇，分 %d 卷" % (n_pian, n_vol))
lines_out.append("")
for j in juan_order:
    items = juan_map[j]
    lines_out.append("· %s（共 %d 篇）" % (j, len(items)))
    for i, (p, pg) in enumerate(items, 1):
        lines_out.append("    %2d. %s　（起第%d頁）" % (i, p, pg))
    lines_out.append("")
lines_out.append("=" * 50)
lines_out.append("")
lines_out.append(body)
lines_out.append("")
open(OUT, "w", encoding="utf-8").write("\n".join(lines_out))

# ---- 4) 独立目录 md ----
md = []
md.append("# 目录")
md.append("")
md.append("> 已轉錄 **%s**，含 %s 全文（共 %d 篇，分 %d 卷）。" % (page_desc, vol_desc, n_pian, n_vol))
md.append("")
for j in juan_order:
    items = juan_map[j]
    md.append("## %s（%d 篇）" % (j, len(items)))
    md.append("")
    md.append("| 序 | 篇名 | 起頁 |")
    md.append("|----|------|------|")
    for i, (p, pg) in enumerate(items, 1):
        md.append("| %d | %s | %d |" % (i, p, pg))
    md.append("")
open(TOC_OUT, "w", encoding="utf-8").write("\n".join(md) + "\n")

# ---- 5) 按卷拆分 + 小目录 + 锚点 ----
os.makedirs(VOL_DIR, exist_ok=True)
tocs_pian = set(p for (_, p, _) in tocs)
pian_id_re = re.compile(r'篇第[一二三四五六七八九十]+')

body_start = 0
for i, ln in enumerate(clean):
    if any(b in ln.strip() for b in BODY_MARKERS):
        body_start = i
        break

segments = OrderedDict()
cur = None
for ln in clean[body_start:]:
    st = ln.strip()
    jm = JUAN_RE.match(st)
    if jm and "目次" not in st:
        cur = jm.group(0).strip()
        segments.setdefault(cur, [])
    if cur is not None:
        pm = PIAN_RE.match(st)
        if pm and "目次" not in st and "書目" not in st:
            pian = pm.group(1).strip()
            # 仅真实篇题（排除考注提及他篇）注入锚点
            if pian in tocs_pian and st.startswith(pian):
                aid = pian_id_re.search(pian)
                if aid:
                    segments[cur].append('<a id="%s"></a>' % aid.group(0))
        segments[cur].append(ln)

vol_pian = OrderedDict()
for (j, p, pg) in tocs:
    vol_pian.setdefault(j, []).append((p, pg))

for old in os.listdir(VOL_DIR):
    if old.endswith(".txt") or old.endswith(".md"):
        os.remove(os.path.join(VOL_DIR, old))

split_files = []
for vol, lines_v in segments.items():
    items = vol_pian.get(vol, [])
    npian = len(items)
    mini = ["【本卷目錄】（共 %d 篇）" % npian, ""]
    for i, (p, pg) in enumerate(items, 1):
        aid = pian_id_re.search(p).group(0)
        mini.append("  %2d. [%s　（起第%d頁）](#%s)" % (i, p, pg, aid))
    mini.append("")
    head = [vol, "=" * 40,
            "（本卷共 %d 篇；點鏈接可跳轉）" % npian, "=" * 40, ""]
    fpath = os.path.join(VOL_DIR, "%s.md" % vol)
    open(fpath, "w", encoding="utf-8").write("\n".join(head + mini + lines_v) + "\n")
    split_files.append(fpath)

print("整理版行数:", len(clean))
print("目录篇数:", len(tocs), "卷数:", n_vol)
print("分卷:", VOL_DIR, "（%d 卷）" % len(split_files))
for f in split_files:
    print("  -", os.path.basename(f))
