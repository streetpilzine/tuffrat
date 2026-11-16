"""
Traccia la tag TuffRat (foto ad alto contrasto, nero su bianco) in un SVG a tracciato pieno.

Uso:
  python tools/trace_tag.py [--src tools/sorgenti/tuffrat-tag.png] [--out src/assets/tag.svg]

Passi: scala di grigi sfocata e ingrandita 2x -> soglia -> via le macchie piccole e ciò che tocca il bordo
-> contorni sui lati dei pixel -> semplificazione (Douglas-Peucker) -> curve di Bézier (Catmull-Rom).
L'SVG ha un solo <path fill-rule="evenodd"> e il viewBox ritagliato sull'inchiostro. Serve solo Pillow, numpy e scipy.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SCALA = 2  # sovracampionamento prima della soglia: contorni più morbidi


def maschera(src: str) -> np.ndarray:
    im = Image.open(src).convert("RGBA")
    bianco = Image.new("RGBA", im.size, (255, 255, 255, 255))
    grigio = Image.alpha_composite(bianco, im).convert("L")
    grigio = grigio.resize((im.width * SCALA, im.height * SCALA), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
    m = np.asarray(grigio) < 128
    etichette, n = ndimage.label(m)
    aree = ndimage.sum(m, etichette, range(1, n + 1))
    h, w = m.shape
    pulita = np.zeros_like(m)
    for i, fetta in enumerate(ndimage.find_objects(etichette), start=1):
        ys, xs = fetta
        tocca_bordo = ys.start == 0 or xs.start == 0 or ys.stop == h or xs.stop == w
        if aree[i - 1] >= 120 * SCALA * SCALA and not tocca_bordo:
            pulita |= etichette == i
    return pulita


def contorni(m: np.ndarray) -> list[list[tuple[int, int]]]:
    """Anelli chiusi lungo i lati dei pixel, con l'inchiostro sempre a destra del verso di percorrenza."""
    p = np.pad(m, 1)
    archi: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def aggiungi(a, b):
        archi.setdefault(a, []).append(b)

    ys, xs = np.nonzero(p)
    for y, x in zip(ys.tolist(), xs.tolist()):
        if not p[y - 1, x]:
            aggiungi((x, y), (x + 1, y))
        if not p[y, x + 1]:
            aggiungi((x + 1, y), (x + 1, y + 1))
        if not p[y + 1, x]:
            aggiungi((x + 1, y + 1), (x, y + 1))
        if not p[y, x - 1]:
            aggiungi((x, y + 1), (x, y))
    anelli = []
    while archi:
        inizio = next(iter(archi))
        anello = [inizio]
        corrente = inizio
        while True:
            uscite = archi[corrente]
            prossimo = uscite.pop()
            if not uscite:
                del archi[corrente]
            if prossimo == inizio:
                break
            anello.append(prossimo)
            corrente = prossimo
        anelli.append([(x - 1, y - 1) for x, y in anello])
    return anelli


def semplifica(punti: np.ndarray, eps: float) -> np.ndarray:
    """Douglas-Peucker iterativo su una polilinea aperta."""
    tieni = np.zeros(len(punti), dtype=bool)
    tieni[0] = tieni[-1] = True
    pila = [(0, len(punti) - 1)]
    while pila:
        a, b = pila.pop()
        if b <= a + 1:
            continue
        seg = punti[b] - punti[a]
        lung = np.hypot(*seg)
        rel = punti[a + 1 : b] - punti[a]
        dist = np.abs(seg[0] * rel[:, 1] - seg[1] * rel[:, 0]) / lung if lung > 0 else np.hypot(rel[:, 0], rel[:, 1])
        i = int(np.argmax(dist))
        if dist[i] > eps:
            k = a + 1 + i
            tieni[k] = True
            pila += [(a, k), (k, b)]
    return punti[tieni]


def anello_semplice(anello, eps: float) -> np.ndarray:
    pts = np.array(anello, dtype=float)
    # Si spezza l'anello nel punto più lontano dal primo, così DP lavora su due polilinee aperte.
    lontano = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
    a = semplifica(pts[: lontano + 1], eps)
    b = semplifica(np.vstack([pts[lontano:], pts[:1]]), eps)
    return np.vstack([a[:-1], b[:-1]])


def bezier(pts: np.ndarray, f) -> str:
    """Anello chiuso come curva di Catmull-Rom convertita in cubiche."""
    n = len(pts)
    d = [f"M{f(pts[0])}"]
    for i in range(n):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        d.append(f"C{f(c1)} {f(c2)} {f(p2)}")
    return "".join(d) + "Z"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=os.path.join("tools", "sorgenti", "tuffrat-tag.png"))
    ap.add_argument("--out", default=os.path.join("src", "assets", "tag.svg"))
    ap.add_argument("--eps", type=float, default=1.1, help="tolleranza di semplificazione, in pixel sovracampionati")
    args = ap.parse_args()

    m = maschera(args.src)
    ys, xs = np.nonzero(m)
    margine = 12 * SCALA
    x0, y0 = xs.min() - margine, ys.min() - margine
    larg = (xs.max() - xs.min() + 2 * margine) / SCALA
    alt = (ys.max() - ys.min() + 2 * margine) / SCALA

    def f(p):
        return f"{(p[0] - x0) / SCALA:.1f},{(p[1] - y0) / SCALA:.1f}"

    pezzi = []
    for anello in contorni(m):
        pts = anello_semplice(anello, args.eps)
        if len(pts) >= 4:
            pezzi.append(bezier(pts, f))
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {larg:.0f} {alt:.0f}" role="img" aria-label="TuffRat">'
        f'<path fill="currentColor" fill-rule="evenodd" d="{"".join(pezzi)}"/></svg>\n'
    )
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(svg)
    print(f"{args.out}: {len(pezzi)} anelli, viewBox {larg:.0f}x{alt:.0f}, {len(svg) // 1024} kB")


if __name__ == "__main__":
    main()
