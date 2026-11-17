"""
Bomboletta spray e pennarello a punta larga (modelli `bomboletta.glb` e `pennarello.glb`).

Bomboletta: l'ingombro è quello delle primitive di `Attrezzi` in `src/scenes/Banco.tsx` (corpo raggio 0,065,
alto 0,38, spalla, valvola e tappino), posata in piedi sul piano.
- Origine = piede della bomboletta (y = 0 sul piano), asse verticale.
- Altezza totale 0,382 con il tappino, 0,45 senza (porta il tappino lo stesso, sopra la valvola).
- Nodi: `Bomboletta` (radice) › `Bom_Corpo` (materiale `CorpoBombo`, colore impostabile dal codice),
  `Bom_Fondo` e `Bom_Spalla` (`MetalloBombo`), `Bom_Valvola` (`Valvola`), `Bom_Tappino` (`Tappino`),
  `Bom_Anello` (`Anello`, il collarino con la linguetta che resta sulla valvola).

Pennarello: l'ingombro delle primitive (lungo 0,26, raggio 0,02), punta larga.
- Origine = punta (y = 0), asse lungo +y fino a 0,33 (corpo 0,26, punta e tappo).
- Nodi: `Pennarello` (radice) › `Pen_Corpo` (`CorpoPen`), `Pen_Punta` (`PuntaPen`), `Pen_Tappo` (`TappoPen`),
  `Pen_Anellino` (`AnellinoPen`).

    blender.exe -b -P tools/blender/modelli/attrezzi.py -- public/assets/models/bomboletta.glb public/assets/models/pennarello.glb
"""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import comune as c  # noqa: E402
from comune import assegna_nomato  # noqa: E402

RADICE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Dalle primitive di Banco.tsx (raggio corpo 0,065, alto 0,38).
R = 0.065
ALTO_CORPO = 0.38


def bomboletta(percorso):
    c.svuota()
    m_corpo = c.materiale("CorpoBombo", "#111111", ruvidita=0.35, metallo=0.3)
    m_metallo = c.materiale("MetalloBombo", "#c9c9c9", ruvidita=0.3, metallo=0.7)
    m_valvola = c.materiale("Valvola", "#f2f2f2", ruvidita=0.6)
    m_tappino = c.materiale("Tappino", "#141414", ruvidita=0.45)
    m_anello = c.materiale("Anello", "#8d8d8d", ruvidita=0.35, metallo=0.6)

    # Corpo: cilindro a 48 lati, con il piede che si incassa (anello di appoggio).
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=R, depth=ALTO_CORPO - 0.012, location=(0, 0, 0), rotation=(0, 0, 0))
    corpo = bpy.context.object
    c.chiuso(corpo, c.sito(0, (ALTO_CORPO - 0.012) / 2 + 0.004, 0))
    bpy.ops.object.select_all(action="DESELECT")
    assegna_nomato(corpo, "Bom_Corpo", m_corpo)

    # Fondo: il gradino del fondo della bomboletta, che appoggia sul piano.
    assegna_nomato(
        c.profilata(
            "Bom_Fondo",
            [(R - 0.006, 0.0, -1), (R, 0.004, 0), (R, 0.012, 0), (R - 0.0004, 0.012, -1), (R - 0.0004, 0.0, -1)],
            [m_metallo],
            passo_gradi=7.5,
            densita=0.003,
        ),
        "Bom_Fondo",
        m_metallo,
    )
    # Spalla: dal collo del corpo al colletto, con il raccordo tondo.
    assegna_nomato(
        c.profilata(
            "Bom_Spalla",
            [
                (R - 0.0005, ALTO_CORPO - 0.03, -1),
                (R - 0.0005, ALTO_CORPO - 0.012, 0),
                (R * 0.93, ALTO_CORPO - 0.004, 0),
                (R * 0.62, ALTO_CORPO + 0.012, 0),
                (R * 0.38, ALTO_CORPO + 0.022, 0),
                (R * 0.37, ALTO_CORPO + 0.03, -1),
                (0.0, ALTO_CORPO + 0.03, -1),
            ],
            [m_metallo],
            passo_gradi=7.5,
            densita=0.003,
        ),
        "Bom_Spalla",
        m_metallo,
    )
    # Valvola: il collo sopra la spalla, con la ghiera e il bocchino.
    assegna_nomato(
        c.profilata(
            "Bom_Valvola",
            [
                (0.0, ALTO_CORPO + 0.028, -1),
                (R * 0.3, ALTO_CORPO + 0.028, -1),
                (R * 0.3, ALTO_CORPO + 0.05, -1),
                (R * 0.22, ALTO_CORPO + 0.054, 0),
                (R * 0.2, ALTO_CORPO + 0.066, -1),
                (0.0, ALTO_CORPO + 0.066, -1),
            ],
            [m_valvola],
            passo_gradi=10,
            densita=0.003,
        ),
        "Bom_Valvola",
        m_valvola,
    )
    # Anello: il collarino metallico con la linguetta, attorno alla valvola. Si costruisce tutto all'origine e si porta
    # sul posto con `chiuso` (coordinate del sito): niente join fra primitivi in posti diversi.
    bpy.ops.mesh.primitive_torus_add(major_radius=R * 0.27, minor_radius=0.004, major_segments=24, minor_segments=8, location=(0, 0, 0), rotation=(0, 0, 0))
    anello = bpy.context.object
    c.chiuso(anello, c.sito(0, ALTO_CORPO + 0.044, 0))
    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0), rotation=(0, 0, 0))
    linguetta = bpy.context.object
    c.chiuso(linguetta, c.sito(R * 0.6, ALTO_CORPO + 0.044, 0), scala=(R * 1.15, R * 0.3, 0.006))
    bpy.ops.object.select_all(action="DESELECT")
    anello.select_set(True)
    linguetta.select_set(True)
    bpy.context.view_layer.objects.active = anello
    bpy.ops.object.join()
    assegna_nomato(anello, "Bom_Anello", m_anello)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    # Tappino: il coperchio di plastica che copre la valvola fin sopra il colletto ed è il punto più alto (0,382).
    assegna_nomato(
        c.profilata(
            "Bom_Tappino",
            [
                (0.0, ALTO_CORPO + 0.012, -1),
                (R * 0.45, ALTO_CORPO + 0.012, -1),
                (R * 0.45, ALTO_CORPO + 0.13, 0),
                (R * 0.36, ALTO_CORPO + 0.138, 0),
                (0.0, ALTO_CORPO + 0.142, -1),
            ],
            [m_tappino],
            passo_gradi=9,
            densita=0.003,
        ),
        "Bom_Tappino",
        m_tappino,
    )
    c.esporta(percorso)


def pennarello(percorso):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    m_corpo = c.materiale("CorpoPen", "#1c1c1c", ruvidita=0.45)
    m_punta = c.materiale("PuntaPen", "#444444", ruvidita=0.6)
    m_tappo = c.materiale("TappoPen", "#2e2e2e", ruvidita=0.32)
    m_anellino = c.materiale("AnellinoPen", "#c9c45a", ruvidita=0.4)
    r = 0.02
    # Corpo: fusto a 32 lati dall'impugnatura al fondo.
    assegna_nomato(
        c.profilata(
            "Pen_Corpo",
            [(r * 0.95, 0.05, -1), (r, 0.06, 0), (r * 1.02, 0.09, 0), (r, 0.265, 0), (r * 0.97, 0.272, 0), (0.0, 0.276, -1)],
            [m_corpo],
            passo_gradi=11.25,
            densita=0.004,
        ),
        "Pen_Corpo",
        m_corpo,
    )
    # Punta a scalpello (larga e piatta) dentro un cono: lo scalpello è una scatola ruotata fra le due ganasce del cono.
    assegna_nomato(
        c.profilata(
            "Pen_Punta",
            [(r * 0.96, 0.05, -1), (r, 0.05, 0), (r * 0.62, 0.012, 0), (r * 0.58, 0.0, -1), (0.0, 0.0, -1)],
            [m_punta],
            passo_gradi=11.25,
            densita=0.004,
        ),
        "Pen_Punta",
        m_punta,
    )
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0), rotation=(0, 0, 0))
    filo = bpy.context.object
    c.chiuso(filo, c.sito(0, 0.004, 0), scala=(r * 1.1, 0.012, 0.0025))
    assegna_nomato(filo, "Pen_Filo", m_corpo)
    # Tappo: copre 6 cm del fusto, con lo spigolo arrotondato e l'occhiello.
    assegna_nomato(
        c.profilata(
            "Pen_Tappo",
            [(r * 1.04, 0.246, -1), (r * 1.08, 0.25, 0), (r * 1.1, 0.26, 0), (r * 1.1, 0.32, 0), (r * 1.04, 0.328, 0), (r * 0.9, 0.33, 0), (0.0, 0.33, -1)],
            [m_tappo],
            passo_gradi=11.25,
            densita=0.004,
        ),
        "Pen_Tappo",
        m_tappo,
    )
    # L'occhiello sta in cima al tappo: un anello ruotato di 90° attorno a x sta nel piano del pennarello
    # (che nel modello corre lungo y di Blender), in verticale all'altezza del fondo del tappo.
    bpy.ops.mesh.primitive_torus_add(major_radius=0.009, minor_radius=0.0028, major_segments=16, minor_segments=8, location=(0, 0, 0), rotation=(math.pi / 2, 0, 0))
    anellino = bpy.context.object
    c.chiuso(anellino, (0, 0.338, 0), ruota=(math.pi / 2, 0, 0))
    assegna_nomato(anellino, "Pen_Anellino", m_anellino)
    c.esporta(percorso)


args = [a for a in c.argomenti() if not a.startswith("--")]
uscita_b = args[0] if args else os.path.join(RADICE, "public", "assets", "models", "bomboletta.glb")
uscita_p = args[1] if len(args) > 1 else os.path.join(RADICE, "public", "assets", "models", "pennarello.glb")
bomboletta(uscita_b)
pennarello(uscita_p)
