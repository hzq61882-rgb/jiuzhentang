'use strict';
// 最小 CFB(OLE2) 读取器：列出流 + 导出指定流
const fs = require('fs');

function readCfb(buf) {
  const sectorSize = 1 << buf.readUInt16LE(0x1E);
  const miniSize = 1 << buf.readUInt16LE(0x20);
  const numFat = buf.readUInt32LE(0x2C);
  const dirStart = buf.readUInt32LE(0x30);
  const miniCut = buf.readUInt32LE(0x38);
  const miniFatStart = buf.readUInt32LE(0x3C);
  const difatStart = buf.readUInt32LE(0x44);
  const numDifat = buf.readUInt32LE(0x48);

  const secOff = s => (s + 1) * sectorSize;

  // DIFAT
  const fatSectors = [];
  for (let i = 0; i < 109; i++) {
    const s = buf.readUInt32LE(0x4C + i * 4);
    if (s !== 0xFFFFFFFF) fatSectors.push(s);
  }
  let d = difatStart, guard = 0;
  while (d !== 0xFFFFFFFF && d !== 0xFFFFFFFE && guard++ < 1000) {
    const off = secOff(d);
    for (let i = 0; i < sectorSize / 4 - 1; i++) {
      const s = buf.readUInt32LE(off + i * 4);
      if (s !== 0xFFFFFFFF) fatSectors.push(s);
    }
    d = buf.readUInt32LE(off + sectorSize - 4);
  }

  // FAT
  const fat = [];
  for (const fs2 of fatSectors) {
    const off = secOff(fs2);
    for (let i = 0; i < sectorSize / 4; i++) fat.push(buf.readUInt32LE(off + i * 4));
  }

  const chain = start => {
    const out = [];
    let s = start, g = 0;
    while (s !== 0xFFFFFFFE && s !== 0xFFFFFFFF && g++ < 200000) {
      out.push(s);
      s = fat[s];
    }
    return out;
  };

  const readChain = start => {
    const parts = chain(start).map(s => buf.slice(secOff(s), secOff(s) + sectorSize));
    return Buffer.concat(parts);
  };

  // directory
  const dirBuf = readChain(dirStart);
  const entries = [];
  for (let i = 0; i + 128 <= dirBuf.length; i += 128) {
    const nameLen = dirBuf.readUInt16LE(i + 64);
    if (!nameLen) continue;
    const name = dirBuf.toString('utf16le', i, i + nameLen - 2);
    const type = dirBuf[i + 66];
    const start = dirBuf.readUInt32LE(i + 116);
    const size = dirBuf.readUInt32LE(i + 120);
    entries.push({ name, type, start, size });
  }

  // mini stream
  const root = entries.find(e => e.type === 5);
  const miniStream = root ? readChain(root.start).slice(0, root.size) : Buffer.alloc(0);
  const miniFatBuf = readChain(miniFatStart);
  const miniFat = [];
  for (let i = 0; i + 4 <= miniFatBuf.length; i += 4) miniFat.push(miniFatBuf.readUInt32LE(i));

  const readStream = e => {
    if (e.size >= miniCut) return readChain(e.start).slice(0, e.size);
    const out = [];
    let s = e.start, g = 0;
    while (s !== 0xFFFFFFFE && s !== 0xFFFFFFFF && g++ < 200000) {
      out.push(miniStream.slice(s * miniSize, s * miniSize + miniSize));
      s = miniFat[s];
    }
    return Buffer.concat(out).slice(0, e.size);
  };

  return { entries, readStream };
}

const file = process.argv[2];
const want = process.argv[3];
const cfb = readCfb(fs.readFileSync(file));
for (const e of cfb.entries) {
  if (e.type === 2) console.log(`${e.name}\t${e.size}`);
}
if (want) {
  const e = cfb.entries.find(x => x.name === want);
  if (!e) { console.error('no stream ' + want); process.exit(1); }
  const out = process.argv[4] || 'stream.bin';
  fs.writeFileSync(out, cfb.readStream(e));
  console.error(`wrote ${out} ${e.size}`);
}
