"""
TV a tubo catodico anni '80 con il mobiletto (modello `tv.glb`).

Misure: le costanti `TV` di `src/three/mondo.ts`, con la stessa origine del codice.
- Origine (0, 0, 0) = centro del corpo, cioè il punto dove `Tv.tsx` mette il gruppo della scocca
  `(0, MURO.pavimento + TV.mobileAlto + TV.corpo.h/2, 0)`; il mobiletto scende da lì fino al pavimento.
- Corpo 1,05 × 0,86 × 0,80 con margini arrotondati (raggio 0,07): frontale sul piano z = 0,40.
- Schermo: rettangolo 0,72 × 0,54 con centro in (x −0,12, y 0,02); la cornice è incassata attorno, il vetro
  è la stessa superficie del davanti convesso appena più avanti (piano visibile a z ≈ 0,450).
- Manopole in x 0,39, y 0,20 e 0,02, raggio 0,055; pulsante di accensione in (0,39, −0,27), raggio 0,05;
  spia rossa fra le manopole, in (0,39, −0,20), raggio 0,018. Antenna a baffo dalla sommità.
- Mobiletto come la scatola del codice: 1,25 × 1,1 × 0,45, da 0,2 dietro il davanti del corpo, cioè da z −0,65
  a z −0,20 (il davanti a 0,2 dietro il davanti), con il pavimento a −1,53 sotto l'origine.
- Il davanti è appena convesso (11 mm al centro): quello che il codice mette sullo schermo (neve, nero, iframe)
  sta sul piano z = 0,402 e il modello non ne nasconde niente.

Le posizioni nel file sono nel sistema del sito (x laterale, y in alto, z verso chi guarda), come `TV`; le funzioni
di `comune.py` (`scatola`, `cilindro`, `tornita`, `profilata`, `chiuso`) le girano in quelle di Blender.

Nodi (documentati in `tools/blender/README.md`):
- `Tv` (radice, origine al centro del corpo)
  - `TV_Mobiletto` materiale `Mobile`
  - `MobileBattiscopa` materiale `Battiscopa` (il piede del mobiletto)
  - `TV_Scocca`            materiale `Scocca` (la scatola a spigoli arrotondati, con la buca dello schermo)
  - `TV_Cornice`           materiale `Cornice` (il bordo incassato della buca)
  - `TV_Vetro`             materiale `Vetro` — la superficie dello schermo, dove il codice mette neve o nero
  - `TV_Griglia`           materiale `Griglia` (le fessure dell'altoparlante a sinistra dello schermo)
  - `TV_Manopola1`, `TV_Manopola2`  materiale `Metallo`
  - `Rosetta1`, `Rosetta2`, `Tacca1`, `Tacca2`  materiale `Metallo` / `Tacca`
  - `TV_Pulsante`          materiale `Pulsante` — oggetto a sé per il click
  - `TV_Spia`              materiale `Spia` (la spia rossa, emissiva)
  - `TV_AntennaSx`, `TV_AntennaDx`, `TV_AntennaBase`  materiale `Antenna` / `Scocca`

    blender.exe -b -P tools/blender/modelli/tv.py -- public/assets/models/tv.glb
"""

import math
import os
import sys

import bmesh
import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import comune as c  # noqa: E402
from comune import assegna_nomato  # noqa: E402

# Le posizioni qui sotto sono nel sistema del sito (x laterale, y in alto, z verso chi guarda), come `TV` e `Tv.tsx`;
# `sito()` le gira per Blender (`scatola`, `cilindro`, `chiuso`), le mesh scritte a mano e `cassa` si scrivono già in Blender.
# Dalla costante TV di mondo.ts.
W, H, D = 1.05, 0.86, 0.80
FACCIA = D / 2
SCHERMO = {"x": -0.12, "y": 0.02, "w": 0.72, "h": 0.54}
MANOPOLE = {"x": 0.39, "y": (0.2, 0.02), "r": 0.055}
PULSANTE = {"x": 0.39, "y": -0.27, "r": 0.05}
SPIA = {"x": 0.39, "y": -0.2, "r": 0.018}
MOBILE = {"largo": 1.25, "alto": 1.1, "fondo": 0.45, "centro": -0.2}
RACCORDO = 0.07
GUANCIA = 0.011


def y_davanti(x, y):
    """Profondità (z) del davanti convesso nel punto (x, y): 0,40 al bordo, 0,411 al centro."""
    gx = max(1 - (2 * x / W) ** 2, 0)
    gy = max(1 - (2 * y / H) ** 2, 0)
    return FACCIA + GUANCIA * (gx * gy) ** 0.5


def mobiletto():
    """Mobiletto in legno: casco smussato, top più largo e due ante con le maniglie a barra, sulla scatola del codice."""
    y0 = -H / 2 - MOBILE["alto"]
    z = MOBILE["centro"]
    pezzi = [
        c.scatola("MobileCasco", c.sito(MOBILE["largo"] - 0.06, MOBILE["alto"] - 0.12, MOBILE["fondo"] - 0.04), c.sito(0, y0 + 0.06 + (MOBILE["alto"] - 0.12) / 2, z), smusso=0.006),
        c.scatola("MobileTop", c.sito(MOBILE["largo"], 0.04, MOBILE["fondo"]), c.sito(0, y0 + MOBILE["alto"] - 0.02, z), smusso=0.008),
    ]
    for sx in (-1, 1):
        x = sx * MOBILE["largo"] / 4 * 0.98
        pezzi.append(c.scatola(f"MobileAnta{sx}", c.sito(MOBILE["largo"] / 2 - 0.05, MOBILE["alto"] - 0.24, 0.018), c.sito(x, y0 + 0.06 + (MOBILE["alto"] - 0.12) / 2, z + MOBILE["fondo"] / 2 - 0.03), smusso=0.003))
        pezzi.append(c.cilindro(f"MobileManiglia{sx}", 0.008, 0.12, c.sito(x - sx * 0.06, y0 + MOBILE["alto"] - 0.32, z + MOBILE["fondo"] / 2 - 0.015), vertici=12))
    assegna_nomato(c.unisci(pezzi, "TV_Mobiletto"), "TV_Mobiletto", m_mobile)


def battiscopa():
    """Il piede del mobiletto: una fascia nera appena dentro il bordo del pavimento."""
    y0 = -H / 2 - MOBILE["alto"]
    assegna_nomato(c.scatola("MobileBattiscopa", c.sito(MOBILE["largo"] - 0.12, 0.035, MOBILE["fondo"] - 0.1), c.sito(0, y0 + 0.0175, MOBILE["centro"]), smusso=0.004), "MobileBattiscopa", m_battiscopa)


def scocca():
    """Scocca a margini arrotondati (raggio 0,07); buca dello schermo e davanti convesso di 11 mm."""
    ob = c.cassa("TV_Scocca", -W / 2, W / 2, -H / 2, H / 2, smusso=0.004, raggio_corpo=RACCORDO, passo=0.006, asse="Z", profondita=(-D / 2, D / 2))
    # Buca dello schermo: leggermente più grande del rettangolo, fino a metà profondità (qui in Blender: z è l'alto).
    c.incidi(ob, c.scatola("buca", (SCHERMO["w"] + 0.05, SCHERMO["h"] + 0.05, 0.3), (SCHERMO["x"], SCHERMO["y"], FACCIA - 0.15), smusso=0.006))
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    for v in bm.verts:
        q = (v.co.y - (D / 2 - 0.02)) / 0.02
        if 0 < q <= 1:
            v.co.y += GUANCIA * max(1 - (2 * v.co.x / W) ** 2, 0) * max(1 - (2 * v.co.z / H) ** 2, 0) * q
    bm.to_mesh(ob.data)
    bm.free()
    assegna_nomato(ob, "TV_Scocca", m_scocca)


def cornice():
    """Cornice incassata attorno alla buca: uno scivolo che dal bordo esterno scende al bordo dello schermo."""
    x0, x1 = SCHERMO["x"] - SCHERMO["w"] / 2, SCHERMO["x"] + SCHERMO["w"] / 2
    y0, y1 = SCHERMO["y"] - SCHERMO["h"] / 2, SCHERMO["y"] + SCHERMO["h"] / 2
    g = 0.025
    zi, zo = FACCIA - 0.014, FACCIA + 0.0005
    fasce = [
        ((x0 - g, y1 + g, zo), (x1 + g, y1 + g, zo), (x1, y1, zi), (x0, y1, zi)),
        ((x0 - g, y0 - g, zo), (x1 + g, y0 - g, zo), (x1, y0, zi), (x0, y0, zi)),
        ((x0 - g, y0 - g, zo), (x0 - g, y1 + g, zo), (x0, y1, zi), (x0, y0, zi)),
        ((x1 + g, y0 - g, zo), (x1 + g, y1 + g, zo), (x1, y1, zi), (x1, y0, zi)),
    ]
    vertici, facce = [], []
    for q in fasce:
        b = len(vertici)
        # Le mesh scritte a mano stanno in Blender (z in alto): i punti del sito si scambiano y e z.
        vertici.extend((x, z, yv) for (x, yv, z) in q)
        facce.append((b, b + 1, b + 2, b + 3))
    ob = c.mesh_a_oggetto("TV_Cornice", vertici, facce)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
    assegna_nomato(ob, "TV_Cornice", m_cornice)


def vetro():
    """Lo schermo: la superficie del davanti convesso, appena più avanti, così neve e nero si vedono di faccia."""
    nx, ny = 20, 15
    w, h = SCHERMO["w"], SCHERMO["h"]
    vertici, facce, uv = [], [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            u, v = i / nx, j / ny
            x = SCHERMO["x"] - w / 2 + u * w
            yv = SCHERMO["y"] - h / 2 + v * h
            vertici.append((x, y_davanti(x, yv) + 0.002, yv))
            uv.append((u, v))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            facce.append((a, a + 1, a + nx + 2, a + nx + 1))
    ob = c.mesh_a_oggetto("TV_Vetro", vertici, facce)
    liv = ob.data.uv_layers.new(name="UVMap")
    for pol in ob.data.polygons:
        for li in pol.loop_indices:
            liv.data[li].uv = uv[ob.data.loops[li].vertex_index]
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(60))
    assegna_nomato(ob, "TV_Vetro", m_vetro)


def griglia():
    """Fessure dell'altoparlante: una colonna di tagli orizzontali nella fascia a sinistra dello schermo."""
    x0 = -W / 2 + 0.04
    x1 = SCHERMO["x"] - SCHERMO["w"] / 2 - 0.03
    pezzi = []
    for k in range(7):
        yv = SCHERMO["y"] + 0.17 - k * 0.05
        pezzi.append(c.scatola(f"Fessura{k}", c.sito(x1 - x0, 0.018, 0.012), c.sito((x0 + x1) / 2, yv, y_davanti((x0 + x1) / 2, yv) + 0.002), smusso=0.003, segmenti_smusso=2))
    ob = c.unisci(pezzi, "TV_Griglia")
    assegna_nomato(ob, "TV_Griglia", m_griglia)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))


def manopole():
    """Due manopole tornite con la tacca chiara; dietro, una rosetta metallica."""
    for k, yv in enumerate(MANOPOLE["y"]):
        r = MANOPOLE["r"]
        z = y_davanti(MANOPOLE["x"], yv)
        manopola = c.profilata(
            f"TV_Manopola{k + 1}",
            [(r * 0.92, z, -1), (r, z + 0.012, 0), (r, z + 0.032, 0), (r * 0.97, z + 0.038, 0), (r * 0.84, z + 0.043, -1), (0.0, z + 0.042, -1)],
            [m_metallo],
            passo_gradi=12,
            densita=0.004,
            centro=(MANOPOLE["x"], yv),
        )
        assegna_nomato(manopola, f"TV_Manopola{k + 1}", m_metallo)
        rosetta = c.tornita("Rosetta", [(0.0, z, -1), (r * 1.12, z, -1), (r * 1.12, z + 0.004, 0), (r * 0.95, z + 0.006, -1), (r * 0.95, z, -1)], [m_metallo], passo_gradi=15, tappi=(z,), centro=(MANOPOLE["x"], yv))
        assegna_nomato(rosetta, f"Rosetta{k + 1}", m_metallo)
        assegna_nomato(c.scatola("Tacca", c.sito(0.007, 0.002, 0.026), c.sito(MANOPOLE["x"], yv, z + 0.0412), smusso=0.0, angolo_liscio=None), f"Tacca{k + 1}", m_tacca)


def pulsante():
    """Pulsante di accensione con la calotta bombata, centro in (0,39, −0,27); spia rossa fra le manopole."""
    r, z = PULSANTE["r"], y_davanti(PULSANTE["x"], PULSANTE["y"])
    ob = c.profilata(
        "TV_Pulsante",
        [(r * 0.9, z - 0.004, -1), (r, z + 0.008, 0), (r, z + 0.030, 0), (r * 0.92, z + 0.036, 0), (r * 0.7, z + 0.040, 0), (0.0, z + 0.041, -1)],
        [m_pulsante],
        passo_gradi=15,
        densita=0.004,
        centro=(PULSANTE["x"], PULSANTE["y"]),
    )
    assegna_nomato(ob, "TV_Pulsante", m_pulsante)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=SPIA["r"], location=(0, 0, 0), rotation=(0, 0, 0))
    spia = bpy.context.object
    c.chiuso(spia, c.sito(SPIA["x"], SPIA["y"], y_davanti(SPIA["x"], SPIA["y"]) + 0.002), scala=(1, 0.5, 1))
    bpy.ops.object.select_all(action="DESELECT")
    assegna_nomato(spia, "TV_Spia", m_spia)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(60))


def antenna():
    """Antenna a baffo: una base tonda sulla sommità e due steli che si aprono a V."""
    z0 = H / 2 - 0.01
    c.tornita("TV_AntennaBase", [(0.0, z0, -1), (0.05, z0, -1), (0.05, z0 + 0.012, 0), (0.04, z0 + 0.02, 0), (0.0, z0 + 0.026, -1)], [m_scocca], passo_gradi=15, tappi=(z0,))
    for sx in (-1, 1):
        nome = f"TV_Antenna{'Dx' if sx > 0 else 'Sx'}"
        # Stelo: cilindro inclinato di 32° verso il suo lato (ruota e posizione applicate con `chiuso`).
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.0042, depth=0.5, location=(0, 0, 0), rotation=(0, 0, 0))
        stelo = bpy.context.object
        c.chiuso(stelo, (sx * 0.13, -0.03, z0 + 0.2), ruota=(0, -sx * math.radians(32), 0))
        # Punta tonda: una sfera schiacciata sul piano dello stelo.
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.008, location=(0, 0, 0), rotation=(0, 0, 0))
        punta = bpy.context.object
        c.chiuso(punta, (sx * 0.26, -0.03, z0 + 0.41), scala=(1, 0.6, 1))
        bpy.ops.object.select_all(action="DESELECT")
        stelo.select_set(True)
        punta.select_set(True)
        bpy.context.view_layer.objects.active = stelo
        bpy.ops.object.join()
        assegna_nomato(bpy.context.object, nome, m_antenna)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))


c.svuota()
m_mobile = c.materiale("Mobile", "#6b5a47", ruvidita=0.82)
m_scocca = c.materiale("Scocca", "#2b2a28", ruvidita=0.58)
m_cornice = c.materiale("Cornice", "#3a3835", ruvidita=0.45, metallo=0.1)
m_vetro = c.materiale("Vetro", "#141414", ruvidita=0.75)
m_griglia = c.materiale("Griglia", "#141413", ruvidita=0.7)
m_metallo = c.materiale("Metallo", "#c9c4b8", ruvidita=0.38, metallo=0.35)
m_pulsante = c.materiale("Pulsante", "#9e998d", ruvidita=0.45, metallo=0.25)
m_spia = c.materiale("Spia", "#5a1f1a", ruvidita=0.35, emissione="#ff4a2a", forza_emissione=2.2)
m_antenna = c.materiale("Antenna", "#9a9a9a", ruvidita=0.3, metallo=0.8)
m_tacca = c.materiale("Tacca", "#efece4", ruvidita=0.5)
m_battiscopa = c.materiale("Battiscopa", "#1f1d1b", ruvidita=0.7)

mobiletto()
battiscopa()
scocca()
cornice()
vetro()
griglia()
manopole()
pulsante()
antenna()

args = c.argomenti()
uscita = args[0] if args else os.path.join(os.getcwd(), "public", "assets", "models", "tv.glb")
c.esporta(uscita)
