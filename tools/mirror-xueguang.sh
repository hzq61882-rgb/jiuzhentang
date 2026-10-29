#!/usr/bin/env bash
# 穴光 · AcuAtlas —— 把应用从 workbuddy 镜像到本站 app/xueguang/（纯静态，无服务器接口）
# 用法（在站点根目录）：bash tools/mirror-xueguang.sh
# 之后检查 git diff，再提交推送。学习进度存于浏览器 localStorage，按域名区分。
set -euo pipefail
SRC="${XG_SRC:-https://xueguang-acuatlas.app.workbuddy.host/}"
SHARE="${XG_SHARE:-3IVJJXNYKC}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/app/xueguang"
TMP="$(mktemp -d)"; JAR="$TMP/jar"; trap 'rm -rf "$TMP"' EXIT
get() { # $1=相对路径（可含 ?v=）  $2=保存路径
  mkdir -p "$(dirname "$2")"
  curl -fsSL --retry 3 -c "$JAR" -b "$JAR" -o "$2" "$SRC$1"
  echo "  $1 -> ${2#$TMP/out/} ($(wc -c <"$2") bytes)"
}
mkdir -p "$TMP/out"
echo "首页…"; get "?sharecode=$SHARE" "$TMP/out/index.html"
# 1) index.html 中引用的 css / js / 图片（相对路径，去掉 ?v= 保存）
refs=$(grep -oE '(src|href)="[^"#:]+"' "$TMP/out/index.html" | sed -E 's/^(src|href)="//; s/"$//' | sort -u)
# 2) CSS 中的 url(...) 与 @import；JS 中的 import / fetch 相对路径
scan() { grep -ohE "url\((['\"]?)[^)'\"]+\1\)|@import ['\"][^'\"]+['\"]|(import|from) ['\"]\.{0,2}/[^'\"]+['\"]|fetch\(['\"][^'\"]+['\"]" "$@" 2>/dev/null \
  | sed -E "s/^url\(['\"]?//; s/['\"]?\)$//; s/^@import ['\"]//; s/^(import|from) ['\"]//; s/^fetch\(['\"]//; s/['\"]$//" | grep -vE '^(data:|https?:|//|#)' || true; }
seen=""
while [ -n "$refs" ]; do
  next=""
  for r in $refs; do
    p="${r%%\?*}"; p="${p#./}"
    case " $seen " in *" $p "*) continue;; esac; seen="$seen $p"
    get "$r" "$TMP/out/$p"
    case "$p" in *.css|*.js) d=$(dirname "$p"); for x in $(scan "$TMP/out/$p"); do
        [ "${x#/}" != "$x" ] && { echo "!! 根绝对路径：$x（在 $p）"; next="$next ${x#/}"; continue; }
        next="$next $(python3 -c 'import os,sys;print(os.path.normpath(os.path.join(sys.argv[1],sys.argv[2])))' "$d" "$x")"; done;; esac
  done
  refs="$next"
done
# 去掉指向不存在 .map 的注释，避免 404
find "$TMP/out" -name '*.js' -exec sed -i -E '/^\/\/# sourceMappingURL=/d' {} +
# 外部地址检查（注释中的 @see 链接除外）
if grep -rnE '(src|href)="https?://|url\(["'\'']?https?://|import .*https?://|fetch\(["'\'']https?://' "$TMP/out"; then
  echo "!! 发现外部依赖，请先本地化后再发布"; exit 1; fi
rm -rf "$DEST"; mkdir -p "$DEST"; cp -r "$TMP/out/." "$DEST/"
[ -f "$DEST/js/vendor/ts-fsrs.umd.js" ] && printf '%s\n' "ts-fsrs.umd.js — open-spaced-repetition/ts-fsrs, MIT License" "https://github.com/open-spaced-repetition/ts-fsrs" > "$DEST/js/vendor/ts-fsrs.LICENSE.txt"
echo "完成：$(find "$DEST" -type f | wc -l) 个文件，$(du -sh "$DEST" | cut -f1)"
