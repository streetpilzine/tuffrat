"""
Render di controllo di un GLB già esportato, senza ricostruire il modello:

    blender.exe -b -P tools/blender/render.py -- public/assets/models/tv.glb tv <cartella>

Importa il GLB (con i materiali e le texture dentro, come li vedrà three.js), monta il fondo chiaro e le
due luci direzionali di `comune.py` e salva le viste in `<cartella>/<modello>-<angolo>.png` (0 = frontale,
angoli negativi da destra, "alto" = dall'alto). Le viste sono quelle registrate in `VISTE`.
"""

import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comune as c  # noqa: E402

# Viste di controllo per modello: (target, distanza, altezza camera, angoli, lente, misura del riquadro ortografico).
VISTE = {
    "bussolotto": ((0, 0, 0.04), 0.6, 0.35, (35, -25, 0), 60, None),
    "tv": ((0, 0.2, 0), 2.4, 1.0, (32, -18, 0, "alto"), 50, 2.4),
    "banco": ((0, -0.2, -0.2), 6.5, -1.6, (35, 0, "alto"), 50, 4.6),
    "bomboletta": ((0, 0.23, 0), 1.25, 0.8, (35, -20, 0), 50, None),
    "pennarello": ((0.06, 0.22, 0), 1.0, 0.5, (35, 0), 55, None),
}

args = c.argomenti()
glb, modello, cartella = args[0], args[1], args[2]
c.svuota()
bpy.ops.import_scene.gltf(filepath=os.path.abspath(glb))
target, distanza, altezza, angoli, lente, ortografica = VISTE[modello]
c.viste(None, os.path.abspath(cartella), modello, target, distanza, altezza, angoli=angoli, lente=lente, ortografica=ortografica)
