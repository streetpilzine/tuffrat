"""
Rende un PDF (fanzina) in pagine webp per il flipbook del sito.

Uso:
  python tools/fanzine_to_pages.py <file.pdf> --slug streetpil-1 [--dpi 150] [--quality 85] [--max 1800]

Crea:
  assets/img/edizioni/<slug>/pages/01.webp, 02.webp, ...
  assets/img/edizioni/<slug>/cover.webp   (copia della prima pagina)

Poi aggiungi in edizioni/index.html una card .flipbook-trigger con data-folder e data-count.
"""
import argparse
import io
import os
import shutil

import pymupdf
from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--quality", type=int, default=85)
    ap.add_argument("--max", type=int, default=1800)
    ap.add_argument("--out", default="assets/img/edizioni")
    args = ap.parse_args()

    out_dir = os.path.join(args.out, args.slug, "pages")
    os.makedirs(out_dir, exist_ok=True)

    doc = pymupdf.open(args.pdf)
    n = doc.page_count
    zoom = args.dpi / 72.0
    matrix = pymupdf.Matrix(zoom, zoom)
    pad = 3 if n >= 100 else 2

    for i, page in enumerate(doc, start=1):
        pix = page.get_pixmap(matrix=matrix)
        png = pix.tobytes("png")
        im = Image.open(io.BytesIO(png)).convert("RGB")
        if im.width > args.max:
            ratio = args.max / im.width
            im = im.resize((args.max, round(im.height * ratio)), Image.LANCZOS)
        dest = os.path.join(out_dir, f"{str(i).zfill(pad)}.webp")
        im.save(dest, "WEBP", quality=args.quality)
        print(f"  {dest}")

    first = os.path.join(out_dir, f"{str(1).zfill(pad)}.webp")
    cover = os.path.join(args.out, args.slug, "cover.webp")
    shutil.copyfile(first, cover)

    print(f"\nFanzine '{args.slug}': {n} pagine -> {out_dir}")
    print(f"Cover: {cover}")


if __name__ == "__main__":
    main()
