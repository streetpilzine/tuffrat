"""
Texture delle quattro tessere di Roundabout per il RoundaboutBoard 3D (PLAN fase 2).

Uso:
  python tools/roundabout_tiles.py [--src ../fotuzze/serie-02_Roundabout] [--out public/assets/img/opere/serie-02/tiles]

Per ogni 2024_Roundabout_0N.jpg (N = 1..4) scrive:
  tile-0N.webp        2048 px, quadrata (desktop)
  tile-0N-1024.webp   1024 px, quadrata (mobile)

Il ritaglio è il quadrato centrale: le foto sorgente sono già quasi quadrate, si toglie solo l'eccesso sul lato lungo.
"""
import argparse
import os

from PIL import Image

Image.MAX_IMAGE_PIXELS = None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join("..", "fotuzze", "serie-02_Roundabout"))
    ap.add_argument("--out", default=os.path.join("public", "assets", "img", "opere", "serie-02", "tiles"))
    ap.add_argument("--quality", type=int, default=86)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    for n in range(1, 5):
        src = os.path.join(args.src, f"2024_Roundabout_0{n}.jpg")
        im = Image.open(src).convert("RGB")
        lato = min(im.size)
        sx = (im.width - lato) // 2
        sy = (im.height - lato) // 2
        quadrata = im.crop((sx, sy, sx + lato, sy + lato))
        for px, suffisso in ((2048, ""), (1024, "-1024")):
            dest = os.path.join(args.out, f"tile-0{n}{suffisso}.webp")
            quadrata.resize((px, px), Image.LANCZOS).save(dest, "WEBP", quality=args.quality, method=6)
            print(f"  {src} ({im.width}x{im.height}) -> {dest} ({os.path.getsize(dest) // 1024} kB)")


if __name__ == "__main__":
    main()
