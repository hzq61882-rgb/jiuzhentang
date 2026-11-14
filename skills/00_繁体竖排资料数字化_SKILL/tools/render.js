import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'node:fs';
import { basename } from 'node:path';

// NodeCanvasFactory compatible with pdfjs-dist rendering
function makeCanvasFactory() {
  return {
    create(width, height) {
      const canvas = createCanvas(width, height);
      const context = canvas.getContext('2d');
      return {
        canvas,
        context,
      };
    },
    reset(canvasAndContext, width, height) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    },
    destroy(canvasAndContext) {
      // no-op
    },
  };
}

const SCALE = Number(process.env.SCALE || '2');

async function renderPdf(pdfPath, outDir, startPage = 1, endPage = null) {
  mkdirSync(outDir, { recursive: true });
  const buf = await import('node:fs').then((m) => m.readFileSync(pdfPath));
  const data = new Uint8Array(buf);
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const total = doc.numPages;
  const end = endPage ?? total;
  console.error(`[${basename(pdfPath)}] pages=${total}, rendering ${startPage}-${end} at scale ${SCALE}`);
  let count = 0;
  for (let p = startPage; p <= end; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: SCALE });
    const factory = makeCanvasFactory();
    const canvasAndContext = factory.create(viewport.width, viewport.height);
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport,
      canvasFactory: factory,
    };
    await page.render(renderContext).promise;
    const buf = canvasAndContext.canvas.toBuffer('image/jpeg', { quality: 0.9 });
    const out = `${outDir}/page_${String(p).padStart(4, '0')}.jpg`;
    writeFileSync(out, buf);
    count++;
    if (p % 10 === 0) console.error(`  rendered ${p}/${end}`);
  }
  console.error(`[${basename(pdfPath)}] done: ${count} pages -> ${outDir}`);
  return { total, count };
}

const [pdfPath, outDir, sp, ep] = process.argv.slice(2);
if (!pdfPath || !outDir) {
  console.error('usage: node render.js <pdf> <outDir> [startPage] [endPage]');
  process.exit(1);
}
const r = await renderPdf(pdfPath, outDir, sp ? Number(sp) : 1, ep ? Number(ep) : null);
console.log(JSON.stringify(r));
