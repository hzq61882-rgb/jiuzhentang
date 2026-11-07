#!/usr/bin/env python3
"""
批量 PDF 转 Word（含 OCR 回退）
依赖: pip install pdfplumber python-docx pytesseract pillow
系统: 安装 tesseract-ocr，中文需 chi_sim 语言包
      Ubuntu/Debian: sudo apt install tesseract-ocr tesseract-ocr-chi-sim
      macOS: brew install tesseract tesseract-lang
用法: python pdf2word.py <输入目录> [输出目录]
"""
import sys
from pathlib import Path

import pdfplumber
from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn
from PIL import Image
import pytesseract

OCR_MIN_CHARS = 40  # 提取文字少于这个数，判定为扫描页，启用 OCR


def set_run_font(run, name="宋体", size=12):
    run.font.size = Pt(size)
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:eastAsia"), name)


def ocr_page(page):
    """将 pdfplumber 页面渲染为图像后 OCR"""
    pil_img = page.to_image(resolution=300).original
    text = pytesseract.image_to_string(pil_img, lang="chi_sim+eng")
    return text


def pdf_to_docx(pdf_path, docx_path):
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "宋体"
    style.font.size = Pt(12)
    style.element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")

    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            used_ocr = False
            if len(text.strip()) < OCR_MIN_CHARS:
                try:
                    text = ocr_page(page)
                    used_ocr = True
                except Exception as e:
                    text = f"[OCR 失败: {e}]\n" + text
            if i > 0:
                doc.add_page_break()
            for line in text.splitlines():
                p = doc.add_paragraph()
                run = p.add_run(line)
                set_run_font(run)
            tag = "OCR" if used_ocr else "文本"
            print(f"    第 {i+1} 页: {tag}, {len(text.strip())} 字")
    doc.save(docx_path)


def main():
    if len(sys.argv) < 2:
        print("用法: python pdf2word.py <输入目录> [输出目录]")
        sys.exit(1)

    src = Path(sys.argv[1]).expanduser().resolve()
    dst = Path(sys.argv[2]).expanduser().resolve() if len(sys.argv) > 2 else src / "docx_out"
    dst.mkdir(parents=True, exist_ok=True)

    files = sorted(src.rglob("*.pdf"))
    if not files:
        print(f"未找到 PDF: {src}")
        sys.exit(1)

    ok, fail = 0, 0
    for f in files:
        out = dst / (f.stem + ".docx")
        print(f"处理: {f.name}")
        try:
            pdf_to_docx(f, out)
            print(f"[OK] {f.name} -> {out.name}")
            ok += 1
        except Exception as e:
            print(f"[FAIL] {f.name}: {e}")
            fail += 1

    print(f"\n完成: 成功 {ok}, 失败 {fail}, 输出目录: {dst}")


if __name__ == "__main__":
    main()
