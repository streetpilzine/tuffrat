"""
Banco da lavoro con le gambe a cavalletto (modello `banco.glb`).

Misure: le costanti `BANCO` di `src/three/mondo.ts` e `src/scenes/Banco.tsx`.
- Origine (0, 0, 0) = centro della superficie del piano, dove il codice mette `[0, BANCO.y, BANCO.z]`.
  In coordinate del modello: l'asse verticale è y (in Blender è z, l'esportatore la porta in y), x lungo il
  muro da −2,3 a 2,3, z (profondità, verso la camera) da −0,75 a 0,75.
- Piano spesso 0,08, sotto fino a y = −0,08. Gambe agli angoli della griglia del codice (x = ±2,15,
  z = ±0,63), dalla faccia inferiore del piano al pavimento (y = −0,94): con l'origine a `BANCO.y` il piede
  tocca il pavimento del sito.
- Tavole in legno chiaro con venatura procedurale cotta a 1024 px (JPEG dentro il GLB), spessori appena
  diversi, giunti scuri fra le tavole, bordi smussati con qualche tacca; gambe a profilo a I con zoccolo,
  traversa bassa, traverso alto e traversa fra le gambe vicine.

Nodi (documentati in `tools/blender/README.md`):
- `Banco` (radice)
  - `Banco_Piano`    materiale `Legno` (le sei tavole, texture `Legno` dentro il GLB)
  - `Banco_Giunti`   materiale `Giunti` (le linee scure fra le tavole)
  - `Banco_Traversa` materiale `Gamba` (le traverse fra le gambe vicine)
  - `Banco_Gamba1` … `Banco_Gamba4` materiale `Gamba` (gamba sinistra-lontana, destra-lontana, sinistra-vicina, destra-vicina)

    blender.exe -b -P tools/blender/modelli/banco.py -- public/assets/models/banco.glb
"""

import math
import os
import random
import sys

import bmesh
import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import comune as c  # noqa: E402
from comune import assegna_nomato  # noqa: E402

RADICE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
LARGO, PROFONDO, SPESSORE = 4.6, 1.5, 0.08
BANCO_Y, PAVIMENTO = -0.56, -1.5
FONDO_GAMBE = PAVIMENTO - BANCO_Y  # −0,94 in locale
N_TAVOLE = 6
SEED = 1987

random.seed(SEED)


def texture_legno(percorso):
    """Venatura procedurale cotta in un'immagine 1024 × 1024: corteccia chiara, fibra fitta, due nodi, toni diversi per tavola."""
    lato = 1024
    img = bpy.data.images.new("Legno", lato, lato, alpha=False)
    px = []
    toni = (0.0, 0.025, -0.015, 0.04, -0.005, 0.02)
    for j in range(lato):
        v = j / lato
        tavola = int(v * N_TAVOLE)
        tono = toni[tavola % len(toni)]
        for i in range(lato):
            u = i / lato
            onda = math.sin((v * 46 + 2.2 * math.sin(u * 9.1) + 1.1 * math.sin(v * 23 + u * 3.7)) * math.pi)
            fibra = math.sin((v * 210 + 5 * math.sin(u * 21)) * math.pi)
            nodo = math.exp(-(((u - 0.72) / 0.012) ** 2 + ((v - 0.31) / 0.05) ** 2)) + 0.6 * math.exp(-(((u - 0.18) / 0.009) ** 2 + ((v - 0.77) / 0.04) ** 2))
            t = 0.5 + 0.22 * onda + 0.06 * fibra - 0.25 * nodo
            px.extend((min(1.0, 0.55 + 0.18 * t + tono), min(1.0, 0.43 + 0.16 * t + tono * 0.9), min(1.0, 0.29 + 0.12 * t + tono * 0.7), 1.0))
    img.pixels = px
    img.filepath_raw = percorso
    img.file_format = "JPEG"
    img.save()


percorso_texture = os.path.join(RADICE, "tools", "blender", "sorgenti", "legno-banco.jpg")
if not os.path.exists(percorso_texture) or "--rigenera-texture" in sys.argv:
    os.makedirs(os.path.dirname(percorso_texture), exist_ok=True)
    texture_legno(percorso_texture)


def piano():
    """
    Le sei tavole già in piedi (in Blender la quarta: x largo, y profondità, z spessore), con lo spessore
    che scende sotto il piano in quota 0. Ogni tavola ha spessore appena diverso e bordi smussati con qualche tacca.
    """
    tavole = []
    larga = PROFONDO / N_TAVOLE
    for k in range(N_TAVOLE):
        prof = -PROFONDO / 2 + larga * (k + 0.5)
        alt = SPESSORE - (0.0015 if k in (1, 4) else 0) - (0.003 if k == 3 else 0)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0), rotation=(0, 0, 0))
        t = bpy.context.object
        t.name = f"Tavola{k + 1}"
        t.scale = (LARGO - 0.004, larga - 0.003, alt)
        c.applica(t, dove=True)
        bm = bmesh.new()
        bm.from_mesh(t.data)
        for v in bm.verts:
            if v.co.z > alt / 2 - 0.002 and (abs(abs(v.co.x) - (LARGO - 0.004) / 2) < 0.002 or abs(abs(v.co.y - prof) - (larga - 0.003) / 2) < 0.002):
                v.co.z -= random.uniform(0, 0.006)
        bm.to_mesh(t.data)
        bm.free()
        for v in t.data.vertices:
            v.co.y += prof
            v.co.z -= alt / 2
        bpy.ops.object.select_all(action="DESELECT")
        bpy.context.view_layer.objects.active = t
        t.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.bevel(offset=0.0035, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
        tavole.append(t)
    ob = c.unisci(tavole, "Banco_Piano")
    tex = bpy.data.images.load(percorso_texture)
    tex.colorspace_settings.name = "sRGB"
    m = c.materiale("Legno", "#b9a07c", ruvidita=0.72)
    nodi = m.node_tree.nodes
    bsdf = next(n for n in nodi if n.type == "BSDF_PRINCIPLED")
    t = nodi.new("ShaderNodeTexImage")
    t.image = tex
    m.node_tree.links.new(t.outputs["Color"], bsdf.inputs["Base Color"])
    liv = ob.data.uv_layers.active.data
    for pol in ob.data.polygons:
        for li in pol.loop_indices:
            co = ob.data.vertices[ob.data.loops[li].vertex_index].co
            liv[li].uv = ((co.x + LARGO / 2) / LARGO, (co.y + PROFONDO / 2) / PROFONDO)
    return assegna_nomato(ob, "Banco_Piano", m)


def giunti():
    """Le linee scure fra le tavole, appena sotto la superficie."""
    larga = PROFONDO / N_TAVOLE
    pezzi = []
    for k in range(1, N_TAVOLE):
        pezzi.append(c.scatola(f"Giunto{k}", (LARGO - 0.01, 0.006, 0.02), (0, -PROFONDO / 2 + larga * k, -0.009), smusso=0.001, angolo_liscio=None))
    return assegna_nomato(c.unisci(pezzi, "Banco_Giunti"), "Banco_Giunti", m_giunti)


def gamba(nome, sx, sz):
    """Gamba a cavalletto: montante in legno a sezione rettangolare, zoccolo a terra, traversa bassa, traverso di testa."""
    x = sx * (LARGO / 2 - 0.18)
    z = sz * (PROFONDO / 2 - 0.2)
    pezzi = []
    # Montante: dallo zoccolo al fondo del piano, con il piede che si allarga appena.
    pezzi.append(c.scatola("Montante", (0.08, 0.08, -SPESSORE - (FONDO_GAMBE + 0.02)), (x, z, (FONDO_GAMBE + 0.02 - SPESSORE) / 2), smusso=0.006))
    pezzi.append(c.scatola("Piede", (0.095, 0.095, 0.03), (x, z, FONDO_GAMBE + 0.015), smusso=0.005))
    # Traversa fra le gambe vicine (anche quella lontana: le due traverse si incontrano), a un quarto dal basso.
    pezzi.append(c.scatola("TraversaBassa", (0.045, abs(z) * 2 - 0.04, 0.045), (x, 0, FONDO_GAMBE + 0.24), smusso=0.004))
    return assegna_nomato(c.unisci(pezzi, nome), nome, m_gamba)


def traverse():
    """I traversi di testa sotto il piano, che legano le gambe vicine e quelle lontane."""
    pezzi = []
    for sz in (-1, 1):
        z = sz * (PROFONDO / 2 - 0.2)
        pezzi.append(c.scatola("TraversaTesta", (LARGO - 0.4, 0.06, 0.055), (0, z, -SPESSORE - 0.04), smusso=0.005))
    return assegna_nomato(c.unisci(pezzi, "Banco_Traversa"), "Banco_Traversa", m_gamba)

def costruisci():
    global m_gamba, m_giunti
    m_gamba = c.materiale("Gamba", "#3a3733", ruvidita=0.62, metallo=0.15)
    m_giunti = c.materiale("Giunti", "#4a3a2a", ruvidita=0.85)
    piano()
    giunti()
    for i, (sx, sz) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        gamba(f"Banco_Gamba{i + 1}", sx, sz)
    traverse()


c.svuota()
costruisci()

args = [a for a in c.argomenti() if not a.startswith("--")]
uscita = args[0] if args else os.path.join(RADICE, "public", "assets", "models", "banco.glb")
c.esporta(uscita)
