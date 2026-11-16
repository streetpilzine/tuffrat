"""
Converte in WebP le fotografie dei due rullini «gialla» e «ben» e scrive un manifest per ciascuno.

Uso (dalla radice del repo):
  python tools/rullini_select.py

Sorgenti, in costanti qui sotto: tutti i .jpg direttamente dentro la cartella del rullino «gialla» (28 file) e i file foto_20241231_*.jpg direttamente dentro la cartella del rullino «ben» (24 file). Elenco non ricorsivo; se i conteggi non sono esatti lo script si ferma con errore. Lo script non legge né elenca altre cartelle delle sorgenti.

Ogni foto resta diritta come nella sorgente: la rotazione da applicare sulla striscia sta solo nel manifest come numero di gradi in senso orario (gialla 90, ben 0) e la applica il componente 3D. Niente date o anni: il nome del file sorgente è riportato così com'è e basta.

Output: public/assets/img/fotografia/<id>/NN.webp (lato lungo ≤ 1600, solo riduzione, rapporto originale) e, solo se il lato lungo della versione grande supera 1024, NN-1024.webp. WebP qualità 85, method 6, senza EXIF né ICC: i pixel vengono passati per ImageOps.exif_transpose e convertiti in RGB/sRGB prima del salvataggio. Lo script riscrive sempre gli stessi file (idempotente).

Gli alt e il flag volti stanno in FOTO_INFO, con chiave id del rullino e nome file sorgente, così una riesecuzione li conserva; una foto senza voce riceve l'alt generico e lo script lo segnala a console.
"""
import io
import json
import os
import re
import sys

from PIL import Image, ImageOps

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ROOT = os.path.join(REPO, "public", "assets", "img", "fotografia")
WEB_BASE = "/assets/img/fotografia"

GIALLA_DIR = r"D:\ANALOGIC_DREAM\malli\StreetPIL\gialla"
BEN_DIR = r"D:\ANALOGIC_DREAM\bEn_ultimoAnno"
BEN_PATTERN = re.compile(r"^foto_20241231_\d+\.jpg$", re.IGNORECASE)

GRANDE_MAX = 1600
PICCOLA_MAX = 1024
QUALITY = 85
WEBP_OPTS = dict(format="WEBP", quality=QUALITY, method=6)

RULLINI = [
    dict(id="gialla", rotazione=90, cartella=GIALLA_DIR, attese=28),
    dict(id="ben", rotazione=0, cartella=BEN_DIR, attese=24),
]

# Alt e volti per foto (chiave: "<id>/<nome file sorgente>"). Compilati guardando i WebP prodotti.
FOTO_INFO = {
    # gialla: file verticali, luce notturna gialla e arancio. Alt rivisti il 16/11/2026; descrivono il file diritto, non la foto ruotata sulla striscia.
    "gialla/foto_20221126_0037.jpg": ("Un muro giallo con un tubo verticale e scritte a mano sbiadite", False),
    "gialla/foto_20221126_0038.jpg": ("Un edificio illuminato con un albero davanti, visto attraverso un arco e capovolto nell'inquadratura, su fondo blu scuro", False),
    "gialla/foto_20221126_0039.jpg": ("Un grattacielo visto dal basso e, sotto, un graffito a lettere tonde su una vetrina", False),
    "gialla/foto_20221126_0040.jpg": ("La punta di un grattacielo in forte scorcio, capovolta nell'inquadratura", False),
    "gialla/foto_20221126_0041.jpg": ("Una strada con tende da sole chiare e un cartello con la freccia, girata di lato", False),
    "gialla/foto_20221126_0042.jpg": ("Una tenda da sole chiara su una facciata con un'inferriata, girata di lato", False),
    "gialla/foto_20221126_0043.jpg": ("Una saracinesca abbassata con un graffito a lettere tonde, in un palazzo a bugnato", False),
    "gialla/foto_20221126_0044.jpg": ("Una via con case a balconi, auto parcheggiate e nuvole nel cielo", False),
    "gialla/foto_20221126_0045.jpg": ("Una persona seduta su un muretto accanto a un cartello di proprietà privata e a due armadi dei contatori", False),
    "gialla/foto_20221126_0046.jpg": ("Una persona in piedi davanti a un muro con un graffito, sotto una grande velatura di luce", False),
    "gialla/foto_20221126_0047.jpg": ("Un graffito a lettere tonde su un muro, in toni verdi, girato di lato", False),
    "gialla/foto_20221126_0048.jpg": ("Una superficie verde quasi vuota con una macchia rossastra al centro", False),
    "gialla/foto_20221126_0049.jpg": ("Una sagoma chiara e sfocata sul bordo sinistro di un fotogramma scuro", False),
    "gialla/foto_20221126_0050.jpg": ("Il volto di una persona che ride, capovolto nell'inquadratura, su fondo scuro", True),
    "gialla/foto_20221126_0051.jpg": ("Una persona che ride vista dall'alto, capovolta nell'inquadratura, su fondo scuro", True),
    "gialla/foto_20221126_0052.jpg": ("Un segnale stradale a strisce illuminato nel buio", False),
    "gialla/foto_20221126_0053.jpg": ("La vetrina di un locale di specialità turche con una bicicletta appesa, capovolta nell'inquadratura", False),
    "gialla/foto_20221126_0054.jpg": ("Un uomo con la barba guarda verso l'obiettivo dal basso, con una gamba in primo piano", True),
    "gialla/foto_20221126_0055.jpg": ("Una scia di luce gialla su fondo verde scuro", False),
    "gialla/foto_20221126_0056.jpg": ("Una persona che sorride con un braccio alzato, capovolta nell'inquadratura, su fondo blu", True),
    "gialla/foto_20221126_0057.jpg": ("Il volto di una persona illuminato dal lampo, in basso a sinistra, su fondo nero", True),
    "gialla/foto_20221126_0058.jpg": ("Scie di luce arancione su fondo verde", False),
    "gialla/foto_20221126_0059.jpg": ("Un muro coperto di murales girato di lato, in toni arancio", False),
    "gialla/foto_20221126_0060.jpg": ("Un animale chiaro tra i rami, dietro una rete metallica, di notte", False),
    "gialla/foto_20221126_0061.jpg": ("Una via tra i palazzi girata di lato, in toni arancio", False),
    "gialla/foto_20221126_0062.jpg": ("Un graffito a lettere tonde su una saracinesca vista in scorcio", False),
    "gialla/foto_20221126_0063.jpg": ("Una vetrina illuminata con manichini e una sagoma scura davanti, girata di lato", False),
    "gialla/foto_20221126_0064.jpg": ("Un orizzonte scuro sotto un cielo molto chiaro, con un riquadro bianco in alto", False),
    # ben: scansioni in bianco e nero.
    "ben/foto_20241231_0001.jpg": ("La riva di un fiume di notte, con riflessi di luce sull'acqua e una panchina tra i cespugli, in bianco e nero", False),
    "ben/foto_20241231_0002.jpg": ("Un palazzo con i balconi bianchi visto dal basso contro il cielo nero, in bianco e nero", False),
    "ben/foto_20241231_0003.jpg": ("La facciata curva di un edificio a lamelle verticali, in bianco e nero", False),
    "ben/foto_20241231_0004.jpg": ("Due sagome in controluce davanti a una finestra, in bianco e nero", False),
    "ben/foto_20241231_0005.jpg": ("Un neonato in tutina a pois sdraiato su un fondo scuro, in bianco e nero", True),
    "ben/foto_20241231_0006.jpg": ("Un cielo stellato con la sagoma di un palazzo a balconi sulla destra, in bianco e nero", False),
    "ben/foto_20241231_0007.jpg": ("Una fascia bianca di luce a sinistra e, a destra, il bordo di una carrozzina davanti a un edificio, in bianco e nero", False),
    "ben/foto_20241231_0008.jpg": ("Una carrozzina vista dall'alto con un neonato che dorme tra le coperte, su un marciapiede a lastre, in bianco e nero", True),
    "ben/foto_20241231_0009.jpg": ("Una carrozzina vista dall'alto con un neonato tra le coperte, in bianco e nero", True),
    "ben/foto_20241231_0010.jpg": ("Un parco giochi con uno scivolo di legno, palazzi e montagne sullo sfondo, in controluce, in bianco e nero", False),
    "ben/foto_20241231_0011.jpg": ("Un porticato buio con una persona seduta e un'apertura luminosa in fondo, in bianco e nero", False),
    "ben/foto_20241231_0012.jpg": ("Un pupazzo a forma di pecora accanto a un neonato con il ciuccio, in bianco e nero", True),
    "ben/foto_20241231_0013.jpg": ("Una scia di luce bianca aggrovigliata su fondo nero, in bianco e nero", False),
    "ben/foto_20241231_0014.jpg": ("Un primo piano mosso e sfocato di un volto in penombra, in bianco e nero", True),
    "ben/foto_20241231_0015.jpg": ("La sagoma di una persona con il cappuccio davanti a una fascia luminosa, in bianco e nero", False),
    "ben/foto_20241231_0016.jpg": ("Palazzi in controluce visti dal basso, con un ramo di pino in alto, in bianco e nero", False),
    "ben/foto_20241231_0017.jpg": ("Una riva scoscesa coperta di sterpi, di notte, in bianco e nero", False),
    "ben/foto_20241231_0018.jpg": ("Un fiume con alberi spogli sulla riva e le montagne sullo sfondo, al crepuscolo, in bianco e nero", False),
    "ben/foto_20241231_0019.jpg": ("Il profilo scuro di case e colline sotto un cielo notturno, in bianco e nero", False),
    "ben/foto_20241231_0020.jpg": ("Un neonato in tutina guarda verso l'obiettivo, su fondo nero, in bianco e nero", True),
    "ben/foto_20241231_0021.jpg": ("Una persona accanto a una carrozzina davanti a un muro con una cancellata, di notte, in bianco e nero", False),
    "ben/foto_20241231_0022.jpg": ("Una carrozzina con la capote chiara vista dall'alto, mossa, in bianco e nero", False),
    "ben/foto_20241231_0023.jpg": ("Due persone di spalle attraversano una strada verso le strisce pedonali, in bianco e nero", False),
    "ben/foto_20241231_0024.jpg": ("Un neonato seduto con una felpa e un bavaglino, in penombra, in bianco e nero", True),
}

ALT_GENERICO = "Fotografia senza didascalia."


# ---------------------------------------------------------------- sorgenti

def foto_della_cartella(rullino):
    """Elenca solo i file direttamente nella cartella indicata, col filtro del rullino; errore se il conteggio non torna."""
    cartella = rullino["cartella"]
    if not os.path.isdir(cartella):
        raise SystemExit(f"[errore] cartella sorgente mancante: {cartella}")
    if rullino["id"] == "gialla":
        def ammesso(n):
            return os.path.splitext(n)[1].lower() in (".jpg", ".jpeg")
    else:
        def ammesso(n):
            return bool(BEN_PATTERN.match(n))
    nomi = sorted(
        n for n in os.listdir(cartella)
        if os.path.isfile(os.path.join(cartella, n)) and ammesso(n)
    )
    if len(nomi) != rullino["attese"]:
        raise SystemExit(f"[errore] {rullino['id']}: attese {rullino['attese']} foto, trovate {len(nomi)}: {nomi}")
    return nomi


# ---------------------------------------------------------------- conversione

def riduci(im, lato_max):
    """Riduce il lato lungo a lato_max se lo supera; non ingrandisce mai."""
    if max(im.size) <= lato_max:
        return im
    scala = lato_max / max(im.size)
    return im.resize((round(im.width * scala), round(im.height * scala)), Image.LANCZOS)


def salva_webp(im, dest):
    im.save(dest, **WEBP_OPTS)


def converti(src, dest_grande, dest_piccola):
    """Orienta secondo l'EXIF, converte in sRGB/RGB e salva la grande (e la piccola se serve). Ritorna le misure."""
    with Image.open(src) as im:
        # Dopo il transpose le misure sono quelle dell'immagine diritta; l'EXIF letto prima dice se i lati erano scambiati.
        orientamento = im.getexif().get(0x0112, 1)
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        orig_w, orig_h = im.size
        if orientamento in (5, 6, 7, 8):
            sorgente = (orig_h, orig_w)
        else:
            sorgente = (orig_w, orig_h)
        grande = riduci(im, GRANDE_MAX)
        if grande.width > orig_w or grande.height > orig_h:
            raise SystemExit(f"[errore] {src}: la versione grande ({grande.size}) supera la sorgente ({orig_w}x{orig_h})")
        salva_webp(grande, dest_grande)
        if max(grande.size) > PICCOLA_MAX:
            piccola = riduci(grande, PICCOLA_MAX)
            salva_webp(piccola, dest_piccola)
            return grande.size, piccola.size, sorgente
        return grande.size, None, sorgente


# ---------------------------------------------------------------- per rullino

def costruisci(rullino, avvisi):
    rid = rullino["id"]
    nomi = foto_della_cartella(rullino)
    base = os.path.join(OUT_ROOT, rid)
    os.makedirs(base, exist_ok=True)

    foto = []
    for i, nome in enumerate(nomi):
        n = f"{i + 1:02d}"
        src = os.path.join(rullino["cartella"], nome)
        file_grande = f"{WEB_BASE}/{rid}/{n}.webp"
        dest_grande = os.path.join(base, f"{n}.webp")
        dest_piccola = os.path.join(base, f"{n}-1024.webp")
        (gw, gh), piccola, (sw, sh) = converti(src, dest_grande, dest_piccola)
        if piccola is None:
            file_piccola = file_grande
            pw, ph = gw, gh
            # Pulizia solo del file che questo script avrebbe potuto scrivere in una run precedente.
            if os.path.isfile(dest_piccola):
                os.remove(dest_piccola)
        else:
            file_piccola = f"{WEB_BASE}/{rid}/{n}-1024.webp"
            pw, ph = piccola

        chiave = f"{rid}/{nome}"
        if chiave in FOTO_INFO:
            alt, volti = FOTO_INFO[chiave]
        else:
            alt, volti = ALT_GENERICO, None
            msg = f"[alt] manca alt per {chiave}: uso l'alt generico e volti=null"
            avvisi.append(msg)
            print(msg, file=sys.stderr)

        foto.append(dict(
            file=file_grande,
            filePiccola=file_piccola,
            width=gw,
            height=gh,
            widthPiccola=pw,
            heightPiccola=ph,
            sorgente=dict(file=nome, width=sw, height=sh),
            alt=alt,
            volti=volti,
        ))
        print(f"{rid} {n}  {nome}  {sw}x{sh} -> {gw}x{gh}" + (f" (+ {pw}x{ph})" if piccola else ""))

    return dict(
        id=rid,
        etichetta=rid,
        rotazione=rullino["rotazione"],
        cartellaSorgente=rullino["cartella"],
        foto=foto,
    )


def peso_cartella(base):
    totale = 0
    for n in os.listdir(base):
        p = os.path.join(base, n)
        if os.path.isfile(p) and n.endswith(".webp"):
            totale += os.path.getsize(p)
    return totale


def main():
    avvisi = []
    os.makedirs(OUT_ROOT, exist_ok=True)
    for rullino in RULLINI:
        manifest = costruisci(rullino, avvisi)
        base = os.path.join(OUT_ROOT, rullino["id"])
        with open(os.path.join(base, "manifest.json"), "w", encoding="utf-8", newline="\n") as fh:
            json.dump(manifest, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        piccole = sum(1 for f in manifest["foto"] if f["filePiccola"] != f["file"])
        print(f"\n{rullino['id']}: {len(manifest['foto'])} foto, {piccole} file -1024, {peso_cartella(base) / 1024 / 1024:.2f} MB di WebP, rotazione {rullino['rotazione']}")
    if avvisi:
        print(f"\n{len(avvisi)} foto senza alt:", file=sys.stderr)
        for a in avvisi:
            print("  " + a, file=sys.stderr)


if __name__ == "__main__":
    main()
