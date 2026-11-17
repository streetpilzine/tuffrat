"""
Bussolotto del rullino 35 mm (modello `bussolotto.glb`).

Ingombro: quello che oggi ha il cilindro di `src/three/Rullino.tsx` (raggio 0,062, alto 0,2), non le
misure vere (il rullino è già gonfiato 2,5× nel sito). Origine al centro del corpo, asse lungo Y.
- Corpo (materiale `Bussolotto`, colore impostabile dal codice) da −0,1 a +0,1, raggio 0,062.
- Tappi (`Tappo`) da ±0,1 a ±0,111, ghiera 4,5 mm più larga del corpo con le scanalature del pollice.
- Rocchetto (`Rocchetto`) dal foro del tappo alto fino a +0,134; perno (`Perno`) fino a +0,15.
- L'etichetta di scotch (`y = ALTEZZA/2 + 0,01`, `z = RAGGIO + 0,002`) e la linguetta di pellicola (dalla
  bocchetta `(RAGGIO·0,8, ALTEZZA/2, RAGGIO·0,82)`) restano in codice: qui c'è solo il bussolotto.

Nodi (documentati in `tools/blender/README.md`):
- `Bussolotto` (radice, al centro del corpo)
  - `Corpo`   materiale `Bussolotto` — il colore lo imposta il codice (i rullini hanno colori diversi)
  - `TappoAlto`, `TappoBasso`   materiale `Tappo`
  - `Rocchetto` materiale `Rocchetto`
  - `Perno`     materiale `Perno`

    blender.exe -b -P tools/blender/modelli/bussolotto.py -- public/assets/models/bussolotto.glb
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import comune as c  # noqa: E402
from comune import assegna_nomato  # noqa: E402

R = 0.062
ALTO = 0.2
Y0, Y1 = -ALTO / 2, ALTO / 2

c.svuota()

m_corpo = c.materiale("Bussolotto", "#d9a520", ruvidita=0.42, metallo=0.15)
m_tappo = c.materiale("Tappo", "#1b1b1b", ruvidita=0.38, metallo=0.55)
m_rocchetto = c.materiale("Rocchetto", "#111111", ruvidita=0.5, metallo=0.1)
m_perno = c.materiale("Perno", "#0d0d0d", ruvidita=0.55, metallo=0.2)


def corpo():
    """Parete del corpo: un giro a 48 lati, con gli spigoli coperti dai tappi."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=R, depth=ALTO, location=(0, 0, 0), rotation=(0, 0, 0))
    ob = bpy.context.object
    c.chiuso(ob, (0, 0, 0))
    bpy.ops.object.select_all(action="DESELECT")
    assegna_nomato(ob, "Corpo", m_corpo)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))


def tappo(nome, t):
    """Tappo: ghiera più larga del corpo (4,5 mm) con il bordo che si arrotonda in alto, disco alto 1,1 cm."""
    s = 1 if t > 0 else -1
    h = t + s * 0.0015
    flangia = R + 0.0045
    profilo = [
        (0.03, h, -1),
        (flangia - 0.0006, h, -1),
        (flangia, h + s * 0.0012, 0),
        (flangia, h + s * 0.0085, 0),
        (flangia - 0.001, h + s * 0.0102, 0),
        (R + 0.0012, h + s * 0.0112, 0),
        (R - 0.0005, h + s * 0.0105, -1),
        (R - 0.0005, h - s * 0.004, -1),
    ]
    ob = c.profilata(nome, profilo, [m_tappo], passo_gradi=11.25, densita=0.003)
    if s < 0:
        # Tappo di sotto: la stessa forma girata in altezza. La profila raddrizza da sé il verso del profilo, quindi
        # qui si specchia una volta sola; con una sola specchiatura le normali sono da rimettere verso l'esterno.
        for v in ob.data.vertices:
            v.co.y = -v.co.y
        ob.data.flip_normals()
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(32))
    assegna_nomato(ob, nome, m_tappo)
    bpy.ops.object.select_all(action="DESELECT")


def rocchetto():
    """Rocchetto di plastica dal foro del tappo alto, con il collare e l'albero che sporge."""
    assegna_nomato(
        c.profilata(
            "Rocchetto",
            [
                (0.0, Y1 + 0.009, -1),
                (0.024, Y1 + 0.009, -1),
                (0.024, Y1 + 0.019, 0),
                (0.0225, Y1 + 0.0205, 0),
                (0.0205, Y1 + 0.0205, -1),
                (0.0205, Y1 + 0.033, -1),
                (0.0165, Y1 + 0.0345, 0),
                (0.0165, Y1 + 0.0405, -1),
                (0.0, Y1 + 0.0405, -1),
            ],
            [m_rocchetto],
            passo_gradi=12,
            densita=0.003,
        ),
        "Rocchetto",
        m_rocchetto,
    )
    bpy.ops.object.select_all(action="DESELECT")


def perno():
    """Perno: un albero sottile con la testa arrotondata e le scanalature come leggera ondulazione radiale."""
    ob = c.profilata(
        "Perno",
        [(0.0, Y1 + 0.040, -1), (0.0092, Y1 + 0.040, -1), (0.0092, Y1 + 0.0495, 0), (0.0078, Y1 + 0.054, 0), (0.0, Y1 + 0.056, -1)],
        [m_perno],
        passo_gradi=20,
        densita=0.003,
    )
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.subdivide(number_cuts=1)
    bpy.ops.object.mode_set(mode="OBJECT")
    m = ob.modifiers.new("Scanalature", "DISPLACE")
    tex = bpy.data.textures.new("Scanalature", "STUCCI")
    tex.noise_scale = 0.002
    m.texture = tex
    m.strength = 0.0007
    bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    assegna_nomato(ob, "Perno", m_perno)
    bpy.ops.object.select_all(action="DESELECT")


corpo()
tappo("TappoAlto", Y1)
tappo("TappoBasso", Y0)
rocchetto()
perno()

args = c.argomenti()
uscita = args[0] if args else os.path.join(os.getcwd(), "public", "assets", "models", "bussolotto.glb")
c.esporta(uscita)
