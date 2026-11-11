"""
Converte una cartella di foto (jpg/png/tif) in webp ottimizzate per il sito.

Uso:
  python tools/foto_to_webp.py <cartella_input> [--out assets/img/fotografia/full] [--max 1400] [--quality 85]

Ogni foto viene ridimensionata a larghezza massima `--max` e salvata come webp.
Il nome file di output è lo slug (minuscole, spazi -> trattini) del nome originale.
"""
import argparse
import os

from PIL import Image

EXTS = (".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp")


def slugify(name: str) -> str:
    out = []
    for ch in name:
        if ch.isalnum():
            out.append(ch.lower())
        elif ch in " -_":
            out.append("-")
    return "".join(out).strip("-") or "foto"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input_dir")
    ap.add_argument("--out", default="assets/img/fotografia/full")
    ap.add_argument("--max", type=int, default=1400)
    ap.add_argument("--quality", type=int, default=85)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    done = []

    for name in sorted(os.listdir(args.input_dir)):
        src = os.path.join(args.input_dir, name)
        if not os.path.isfile(src) or os.path.splitext(name)[1].lower() not in EXTS:
            continue
        dest = os.path.join(args.out, slugify(os.path.splitext(name)[0]) + ".webp")
        im = Image.open(src)
        if im.mode != "RGB":
            im = im.convert("RGB")
        if im.width > args.max:
            ratio = args.max / im.width
            im = im.resize((args.max, round(im.height * ratio)), Image.LANCZOS)
        im.save(dest, "WEBP", quality=args.quality)
        done.append(dest)

    print(f"Convertite {len(done)} foto in {args.out}")
    for d in done:
        print("  " + d)


if __name__ == "__main__":
    main()
