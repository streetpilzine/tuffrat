"""
Genera le quattro fanzine StreetPIL (verde, rossa, blu, rave) come pagine WebP più un manifest per ciascuna.

Uso (dalla radice del repo):
  python tools/streetpil_select.py

Ogni numero è una fanzine orizzontale di 8 pagine in rapporto 3:2: copertina generata, pagina del titolo, le 5 foto della cartella in ordine alfabetico, colophon. Le pagine generate sono 1500×1000; le foto vengono ritagliate al centro al rapporto esatto 3:2 e ridimensionate solo verso il basso (lato lungo ≤ 1600). WebP qualità 85, senza metadati EXIF.

Output: public/assets/img/edizioni/<slug>/cover.webp, pages/01.webp … 08.webp e manifest.json. Lo script riscrive sempre gli stessi file (idempotente).

Sorgenti: solo le quattro cartelle costanti qui sotto, sotto SORGENTI_ROOT. Lo script non elenca né apre altro: se una cartella ammessa non contiene esattamente 5 immagini si ferma con errore. Le fotografie non hanno un anno: non viene scritto, né dedotto da nomi file o EXIF, da nessuna parte.

Font: Manrope (variable, OFL) in tools/sorgenti/fonts/. Se non si carica, si ripiega su un sans di sistema e lo si dichiara nel manifest (campo `font`) e a console.
"""
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.path.join(REPO, "public", "assets", "img", "edizioni")
FONTS_DIR = os.path.join(REPO, "tools", "sorgenti", "fonts")
MANROPE_VAR = os.path.join(FONTS_DIR, "Manrope[wght].ttf")
WEB_BASE = "/assets/img/edizioni"

SORGENTI_ROOT = r"D:\ANALOGIC_DREAM\malli\StreetPIL"

IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff")
PER_CARTELLA = 5

PAGE_W, PAGE_H = 1500, 1000
RATIO = PAGE_W / PAGE_H
FOTO_MAX = 1600
QUALITY = 85
WEBP_OPTS = dict(format="WEBP", quality=QUALITY, method=6)

FONDO_CHIARO = "#f7f7f5"
TESTO_SCURO = "#111111"

FANZINE = [
    dict(cartella="1-verde", slug="streetpil-verde", numero=1, titolo="Muschio", colore="#2f6f4f", coloreTesto="#f7f7f5"),
    dict(cartella="2-rossa", slug="streetpil-rossa", numero=2, titolo="Ruggine", colore="#a8322b", coloreTesto="#f7f7f5"),
    dict(cartella="3-blu", slug="streetpil-blu", numero=3, titolo="Cianotipo", colore="#1f4a8a", coloreTesto="#f7f7f5"),
    dict(cartella="4-rave", slug="streetpil-rave", numero=4, titolo="Acido", colore="#111111", coloreTesto="#e0309a"),
]

# Alt text e volti per foto (chiave: "cartella/nome file"). Rivisti il 16/11/2026 guardando le pagine prodotte; `volti` vale True quando si riconosce un viso.
FOTO_INFO = {
    "1-verde/001064160001.jpg": ("Superficie giallo verde con una fascia chiara lungo il bordo destro, cosparsa di bolle rosa della pellicola", False),
    "1-verde/001064160004.jpg": ("Due campiture verdi divise da una linea obliqua, con un piccolo oggetto scuro al centro, sotto bolle rosa", False),
    "1-verde/001064160005 (2).jpg": ("Un sottopasso di cemento visto di fronte, con l'apertura scura al centro, sotto bolle rosa", False),
    "1-verde/001064160006.jpg": ("Terreno con sassi e detriti ai piedi di un muro, in toni verdi, sotto bolle rosa", False),
    "1-verde/001064160015.jpg": ("Una persona con la maglia a righe piegata in avanti con la testa tra le mani, accanto a un pannello chiaro, in toni gialli e verdi", False),
    "2-rossa/001064160010.jpg": ("Un viadotto ferroviario con la ringhiera e i pali della linea elettrica contro il cielo arancio, sotto bolle rosa", False),
    "2-rossa/001064160016.jpg": ("Primo piano di due mani che stringono una bottiglia e, dietro, una persona con la barba che sorride, in toni arancio", True),
    "2-rossa/001064160024.jpg": ("Una persona attraversa i binari di una ferrovia, con case, alberi e una montagna sullo sfondo, in toni arancio", False),
    "2-rossa/001064160029.jpg": ("Foglie di una pianta rampicante e la loro ombra su un muro, in toni arancio, sotto bolle rosa", False),
    "2-rossa/001064160031.jpg": ("Il volto di una persona sdraiata, di profilo e con gli occhi chiusi, con una mano sopra la testa, in luce arancio", True),
    "3-blu/001064160007 (2).jpg": ("Sassi e foglie sul terreno in toni azzurri, sotto bolle rosa", False),
    "3-blu/FB_IMG_1603893597811.jpg": ("Una persona in piedi dietro una consolle, sotto un telo teso tra gli alberi, accanto a una cassa acustica", False),
    "3-blu/FB_IMG_1603893602652.jpg": ("Un bosco di abeti con un tavolo e una figura in lontananza, e un bagliore giallo sul lato destro", False),
    "3-blu/FB_IMG_1603893604941.jpg": ("Tronchi d'albero e, a destra, una persona in piedi sotto un ombrello, tra aloni marroni e rossi della pellicola", False),
    "3-blu/FB_IMG_1603893684600 (2).jpg": ("Un graffito chiaro su un muro accanto a una scala di cemento, in toni grigi e azzurri", False),
    "4-rave/FB_IMG_1603893595367 (2).jpg": ("Tendoni e furgoni decorati davanti a una fila di alberi, in colori invertiti gialli e blu", False),
    "4-rave/FB_IMG_1603893655258 (2).jpg": ("Una folla in un prato sotto fasci di luce diagonali, con le colline sullo sfondo, in giallo e blu", False),
    "4-rave/FB_IMG_1603893695090 (2).jpg": ("Persone di spalle sotto un tendone davanti a un muro di casse acustiche, in giallo e blu", False),
    "4-rave/FB_IMG_1603893701401 (2).jpg": ("Camper e auto parcheggiati in un prato, con le colline sullo sfondo, in giallo e blu", False),
    "4-rave/IMG_20220615_0111.jpg": ("Persone di spalle davanti a un palco, con alberi spogli e un traliccio, in giallo e blu", False),
}

ALT_GENERICO = "Fotografia senza didascalia."


# ---------------------------------------------------------------- font

def carica_famiglia():
    """Ritorna (loader (peso, size) -> ImageFont, nome dichiarato). Prova Manrope variable, poi un sans di sistema."""
    if os.path.isfile(MANROPE_VAR):
        try:
            def manrope(peso, size):
                f = ImageFont.truetype(MANROPE_VAR, size)
                try:
                    f.set_variation_by_name(peso)
                except Exception:
                    pass
                return f

            # Prova: se una variazione non è disponibile il font resta caricabile comunque.
            for peso, size in (("Regular", 16), ("Bold", 16)):
                manrope(peso, size)
            return manrope, "Manrope (variable, pesi Regular/Bold)"
        except Exception as e:  # noqa: BLE001
            print(f"[font] Manrope non caricabile ({e}); ripiego su un sans di sistema", file=sys.stderr)

    for candidato in (
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        if os.path.isfile(candidato):
            path = candidato

            def system(peso, size, path=path):
                return ImageFont.truetype(path, size)

            nome = f"{os.path.basename(path)} (sans di sistema: Manrope non disponibile)"
            print(f"[font] ATTENZIONE: uso {nome}", file=sys.stderr)
            return system, nome
    raise SystemExit("Nessun font disponibile: né Manrope né un sans di sistema.")


# ---------------------------------------------------------------- sorgenti

def foto_della_cartella(cartella):
    """Elenca solo la cartella ammessa indicata; errore se non contiene esattamente 5 immagini."""
    percorso = os.path.join(SORGENTI_ROOT, cartella)
    if not os.path.isdir(percorso):
        raise SystemExit(f"[errore] cartella sorgente mancante: {percorso}")
    nomi = sorted(
        n for n in os.listdir(percorso)
        if os.path.isfile(os.path.join(percorso, n)) and os.path.splitext(n)[1].lower() in IMG_EXTS
    )
    if len(nomi) != PER_CARTELLA:
        raise SystemExit(f"[errore] {cartella}: attese {PER_CARTELLA} immagini, trovate {len(nomi)}: {nomi}")
    return nomi


def prepara_foto(src, cartella, nome):
    """Ritaglio centrale 3:2, poi ridimensiona solo verso il basso (lato lungo ≤ FOTO_MAX)."""
    with Image.open(src) as im:
        im = im.convert("RGB")
        w, h = im.size
        if w / h > RATIO:
            cw, ch = round(h * RATIO), h
        else:
            cw, ch = w, round(w / RATIO)
        left, top = (w - cw) // 2, (h - ch) // 2
        im = im.crop((left, top, left + cw, top + ch))
        lunga = max(im.size)
        if lunga > FOTO_MAX:
            scala = FOTO_MAX / lunga
            im = im.resize((round(im.width * scala), round(im.height * scala)), Image.LANCZOS)
        # Ricontrolla il rapporto dopo l'arrotondamento: deve restare esatto al pixel.
        if abs(im.width / im.height - RATIO) > 0.002:
            raise SystemExit(f"[errore] {cartella}/{nome}: rapporto {im.width}x{im.height} non è 3:2")
        buf = io.BytesIO()
        im.save(buf, **WEBP_OPTS)
        return buf.getvalue(), im.width, im.height, w, h


# ---------------------------------------------------------------- pagine generate

def testo(draw, xy, s, famiglia, peso, size, fill, anchor=None):
    draw.text(xy, s, font=famiglia(peso, size), fill=fill, anchor=anchor)


def pagina_copertina(conf, famiglia):
    im = Image.new("RGB", (PAGE_W, PAGE_H), conf["colore"])
    d = ImageDraw.Draw(im)
    col = conf["coloreTesto"]
    m = 80
    testo(d, (m, m), "StreetPIL", famiglia, "Regular", 28, col)
    testo(d, (PAGE_W - m, m), f"n. {conf['numero']}", famiglia, "Regular", 28, col, anchor="ra")
    testo(d, (m, PAGE_H - m), conf["titolo"], famiglia, "Bold", 140, col, anchor="ls")
    return im


def pagina_titolo(conf, famiglia):
    im = Image.new("RGB", (PAGE_W, PAGE_H), FONDO_CHIARO)
    d = ImageDraw.Draw(im)
    m = 80
    testo(d, (m, PAGE_H // 2 - 60), conf["titolo"], famiglia, "Bold", 130, TESTO_SCURO, anchor="ls")
    testo(d, (m, PAGE_H // 2 + 40), f"StreetPIL n. {conf['numero']}", famiglia, "Regular", 40, TESTO_SCURO, anchor="ls")
    testo(d, (m, PAGE_H // 2 + 110), "Cinque fotografie", famiglia, "Regular", 40, TESTO_SCURO, anchor="ls")
    return im


def pagina_colophon(conf, famiglia):
    im = Image.new("RGB", (PAGE_W, PAGE_H), FONDO_CHIARO)
    d = ImageDraw.Draw(im)
    m = 80
    righe = [
        f"StreetPIL n. {conf['numero']} · {conf['titolo']}",
        "Fotografie di TuffRat",
        "tuffrat.art",
        "Instagram @tuff_rat",
    ]
    y = PAGE_H - m
    for r in reversed(righe):
        testo(d, (m, y), r, famiglia, "Regular", 32, TESTO_SCURO, anchor="ls")
        y -= 52
    return im


def salva_webp(im, dest):
    im.save(dest, **WEBP_OPTS)


# ---------------------------------------------------------------- per fanzine

def costruisci(conf, famiglia, font_dichiarato, avvisi):
    cartella = conf["cartella"]
    slug = conf["slug"]
    nomi = foto_della_cartella(cartella)
    base = os.path.join(OUT_ROOT, slug)
    pages_dir = os.path.join(base, "pages")
    os.makedirs(pages_dir, exist_ok=True)

    pagine = []

    def voce(n, tipo, w, h):
        return dict(file=f"{WEB_BASE}/{slug}/pages/{n:02d}.webp", tipo=tipo, width=w, height=h)

    # 01 copertina
    im = pagina_copertina(conf, famiglia)
    p = os.path.join(pages_dir, "01.webp")
    salva_webp(im, p)
    with open(p, "rb") as fh:
        cover_bytes = fh.read()
    with open(os.path.join(base, "cover.webp"), "wb") as fh:
        fh.write(cover_bytes)
    pagine.append(dict(voce(1, "copertina", im.width, im.height), alt=f"Copertina di StreetPIL n. {conf['numero']}, {conf['titolo']}", volti=False))

    # 02 titolo
    im = pagina_titolo(conf, famiglia)
    salva_webp(im, os.path.join(pages_dir, "02.webp"))
    pagine.append(voce(2, "titolo", im.width, im.height))

    # 03-07 foto
    for i, nome in enumerate(nomi):
        n = 3 + i
        data, w, h, sw, sh = prepara_foto(os.path.join(SORGENTI_ROOT, cartella, nome), cartella, nome)
        with open(os.path.join(pages_dir, f"{n:02d}.webp"), "wb") as fh:
            fh.write(data)
        chiave = f"{cartella}/{nome}"
        if FOTO_INFO.get(chiave, ("PLACEHOLDER", None))[0] != "PLACEHOLDER":
            alt, volti = FOTO_INFO[chiave]
        else:
            alt, volti = ALT_GENERICO, None
            msg = f"[alt] manca alt per {chiave}: uso l'alt generico e volti=null"
            avvisi.append(msg)
            print(msg, file=sys.stderr)
        pagine.append(dict(
            voce(n, "foto", w, h),
            sorgente=dict(cartella=cartella, file=nome, width=sw, height=sh),
            alt=alt,
            volti=volti,
        ))

    # 08 colophon
    im = pagina_colophon(conf, famiglia)
    salva_webp(im, os.path.join(pages_dir, "08.webp"))
    pagine.append(voce(8, "colophon", im.width, im.height))

    manifest = dict(
        slug=slug,
        numero=conf["numero"],
        titolo=conf["titolo"],
        colore=conf["colore"],
        coloreTesto=conf["coloreTesto"],
        cartellaSorgente=cartella,
        font=font_dichiarato,
        pagine=pagine,
        copertina=dict(file=f"{WEB_BASE}/{slug}/cover.webp", width=PAGE_W, height=PAGE_H),
    )
    return manifest


def main():
    famiglia, font_dichiarato = carica_famiglia()
    os.makedirs(OUT_ROOT, exist_ok=True)
    avvisi = []
    for conf in FANZINE:
        manifest = costruisci(conf, famiglia, font_dichiarato, avvisi)
        dest = os.path.join(OUT_ROOT, conf["slug"], "manifest.json")
        with open(dest, "w", encoding="utf-8", newline="\n") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"{conf['slug']}: 8 pagine + cover + manifest")
    if avvisi:
        print(f"\n{len(avvisi)} foto senza alt:", file=sys.stderr)
        for a in avvisi:
            print("  " + a, file=sys.stderr)
    print(f"\nFont: {font_dichiarato}")


if __name__ == "__main__":
    main()
