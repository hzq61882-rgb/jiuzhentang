const fs = require('fs');
const path = require('path');

const dir = 'E:/jiuzhentang/.work/hdbook_ocr/ocr';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort();

const pages = new Map(); // pageNum -> text
const collisions = [];

const markerRe = /(?:【第(\d+)頁】|〔(\d{1,3})〕|======== 第 (\d+) 頁 ========|（第(\d+)頁）)/g;

for (const f of files) {
  const full = path.join(dir, f);
  const raw = fs.readFileSync(full, 'utf8');
  const m = f.match(/page_(\d+)\.txt/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (pages.has(n)) collisions.push(`${f} vs existing ${n}`);
    else pages.set(n, raw.trim());
    continue;
  }
  // split by markers
  markerRe.lastIndex = 0;
  let match;
  let lastIdx = -1;
  let lastNum = null;
  const segments = [];
  while ((match = markerRe.exec(raw)) !== null) {
    const num = parseInt(match[1] || match[2] || match[3] || match[4], 10);
    if (lastNum !== null) {
      segments.push({ num: lastNum, start: lastIdx, end: match.index });
    }
    lastNum = num;
    lastIdx = markerRe.lastIndex;
  }
  if (lastNum !== null) {
    segments.push({ num: lastNum, start: lastIdx, end: raw.length });
  }
  for (const s of segments) {
    const text = raw.slice(s.start, s.end).replace(markerRe, '').trim();
    if (pages.has(s.num)) collisions.push(`${f} dup page ${s.num}`);
    else pages.set(s.num, text);
  }
}

const nums = [...pages.keys()].sort((a, b) => a - b);
const out = [];
for (const n of nums) {
  out.push(`【第${n}頁】\n${pages.get(n)}`);
}

const header = `《回到你的內在權威》（繁體豎排版）全文本\nJoyce Huang（喬宜思）著\n—— 由內嵌掃描圖（image1–image324）逐頁視覺轉錄，繁體豎排，自右向左、由上而下讀取 ——\n\n`;
const result = header + out.join('\n\n');

const outPath = 'E:/jiuzhentang/人类图/散件与单篇/教材译本/回到你的内在权威（繁体版）_全文.txt';
fs.writeFileSync(outPath, result, 'utf8');

// diagnostics
const missing = [];
for (let i = 1; i <= 324; i++) if (!pages.has(i)) missing.push(i);
console.log('total page segments:', nums.length);
console.log('range:', nums[0], '..', nums[nums.length - 1]);
console.log('collisions:', collisions.length ? collisions.join(' | ') : 'none');
console.log('missing 1-324:', missing.length ? missing.join(',') : 'none');
console.log('bytes written:', Buffer.byteLength(result, 'utf8'));
console.log('outPath:', outPath);
