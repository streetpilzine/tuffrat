"""
Rigenera tutti i modelli, ognuno da solo in un processo Blender (scene e nomi non si mescolano):

    python tools/blender/tutto.py
    python tools/blender/tutto.py --rigenera-texture   (rifà anche la texture del legno del banco)

Ogni modello si può anche costruire da solo:
    blender.exe -b -P tools/blender/modelli/tv.py -- public/assets/models/tv.glb
I render di controllo:
    blender.exe -b -P tools/blender/render.py -- public/assets/models/tv.glb tv <cartella>
"""

import os
import shutil
import subprocess
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
USCITA = os.path.join(RADICE, "public", "assets", "models")
BLENDER = os.environ.get("BLENDER") or r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
if not os.path.exists(BLENDER):
    BLENDER = shutil.which("blender") or BLENDER

# Ogni modello: script e uscite, nell'ordine.
# Solo i modelli che il sito usa: banco e pennarello. `attrezzi.py` costruisce anche la bomboletta, che non è riuscita
# (pezzi staccati) e nel sito è tornita in codice: il suo GLB si scarta. Bussolotto e TV (`bussolotto.py`, `tv.py`)
# restano come base da riprendere, ma non si esportano.
LAVORI = (
    ("banco", ["banco.glb"]),
    ("attrezzi", ["bomboletta.glb", "pennarello.glb"]),
)
SCARTI = ("bomboletta.glb",)

extra = [a for a in sys.argv[1:] if a.startswith("--")]
falliti = 0
for modello, uscite in LAVORI:
    script = os.path.join(QUI, "modelli", f"{modello}.py")
    comando = [BLENDER, "-b", "-P", script, "--", *[os.path.join(USCITA, u) for u in uscite], *extra]
    esito = subprocess.run(comando, capture_output=True, text=True, encoding="utf-8", errors="replace")
    for riga in esito.stdout.splitlines():
        if riga.startswith("[blender]") or "Error" in riga:
            print(riga)
    if esito.returncode != 0 or "Error" in esito.stdout:
        falliti += 1
        print(f"[blender] ERRORE in {modello}:\n{esito.stdout[-2500:]}\n{esito.stderr[-2500:]}")

for scarto in SCARTI:
    percorso = os.path.join(USCITA, scarto)
    if os.path.exists(percorso):
        os.remove(percorso)

sys.exit(1 if falliti else 0)
