"""
Modulo comune degli script Blender di `tools/blender/` (redesign TuffRat).

Si usa solo da dentro Blender, headless:

    blender.exe -b -P tools/blender/modelli/bussolotto.py -- <uscita.glb>

Offre: pulizia della scena, materiali PBR semplici, primitive con smusso vero (fare sulla geometria le operazioni in edit mode, non con modificatori lasciati accesi), profili torniti (curva bézier ruotata con Screw e poi convertita in mesh), unificazione per materiale, salvataggio GLB e i render di controllo con EEVEE.

Convenzioni comuni a tutti i modelli:
- unità del mondo del sito (1 = 50 cm), come in `src/three/mondo.ts`;
- geometria costruita in Z verso l'alto (convenzione Blender) e convertita in Y verso l'alto dall'esportatore glTF;
- nessun modificatore non applicato (tutto è mesh all'esportazione), niente armature né animazioni;
- i render di controllo si rilanciano con `tools/blender/render.py <glb> <modello> <cartella>` (importano il GLB, niente da ricostruire).
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

# ══ Scena ══


def argomenti():
    """Gli argomenti dopo `--` sulla riga di comando (percorso del GLB, cartella dei render)."""
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def svuota():
    """Scena vuota: si tolgono anche gli oggetti della scena di avvio e i dati orfani."""
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for blocco in (bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.cameras, bpy.data.lights, bpy.data.curves):
        for dato in list(blocco):
            if dato.users == 0:
                blocco.remove(dato)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0


def applica(ob, dove=False):
    """Applica rotazione e scala (e, con `dove`, anche la posizione): all'esportazione i trasformati restano nelle gerarchie giuste. Agisce solo sull'oggetto attivo della vista: prima va reso attivo, o la scala resta sull'oggetto."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=dove, rotation=True, scale=True)


# ══ Materiali ══


def materiale(nome, colore, ruvidita=0.5, metallo=0.0, emissione=None, forza_emissione=0.0, texture=None):
    """
    Materiale PBR semplice: base color sRGB (`colore`, come lo si scrive nel CSS), roughness, metalness.
    `texture`: percorso di un'immagine già sRGB da usare come base color (il legno del banco).
    `emissione`: colore del bagliore (per esempio la spia della TV).
    """
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    n = m.node_tree.nodes
    n.clear()
    uscita = n.new("ShaderNodeOutputMaterial")
    b = n.new("ShaderNodeBsdfPrincipled")
    uscita.location = (300, 0)
    m.node_tree.links.new(b.outputs["BSDF"], uscita.inputs["Surface"])
    rgba = srgb_a_lineare(colore) + (1.0,)
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = ruvidita
    b.inputs["Metallic"].default_value = metallo
    if emissione:
        b.inputs["Emission Color"].default_value = srgb_a_lineare(emissione) + (1.0,)
        b.inputs["Emission Strength"].default_value = forza_emissione
    if texture:
        img = bpy.data.images.load(texture)
        img.colorspace_settings.name = "sRGB"
        t = n.new("ShaderNodeTexImage")
        t.image = img
        t.location = (-300, 0)
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
    # In vista solida (anteprime) il materiale si vede del suo colore.
    m.diffuse_color = rgba
    return m


def srgb_a_lineare(colore):
    """'#rrggbb' sRGB → componenti lineari (Blender e glTF vogliono base color lineare; glTF lo ricava dal fattore)."""
    c = colore.lstrip("#")
    fuori = []
    for i in (0, 2, 4):
        v = int(c[i : i + 2], 16) / 255.0
        fuori.append(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4)
    return tuple(fuori)


def assegna(ob, *materiali_):
    """Sostituisce i materiali di un oggetto (con lo slot disponibile lo crea)."""
    ob.data.materials.clear()
    for m in materiali_:
        ob.data.materials.append(m)


# ══ Geometria ══


def _finisci(ob, smusso, angolo_liscio, segmenti_smusso=3):
    """Smusso e normali lisce: il bevel è un'operazione vera sulla geometria (allo STL/GLB diventa triangoli con smussi), lo smooth per angolo tiene vivi gli spigoli vivi."""
    if smusso > 0:
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.bevel(offset=smusso, segments=segmenti_smusso, profile=0.5, affect="EDGES", clamp_overlap=True)
        bpy.ops.object.mode_set(mode="OBJECT")
    if angolo_liscio is not None:
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angolo_liscio))
    return ob


# Le posizioni in questo modulo sono nel sistema di Blender (x laterale, y verso il davanti, z in alto). Chi vuole
# scrivere in quello di `mondo.ts` (y in alto, z verso chi guarda) usa `sito(x, y, z)` e `misura_sito(x, y, z)`
# prima di passarli alle funzioni: un solo giro di coordinate, esplicito in un punto solo.
def sito(x, y, z):
    """Da coordinate del sito (x laterale, y in alto, z verso il davanti) a coordinate Blender (z in alto)."""
    return (x, z, y)


misura_sito = sito


def scatola(nome, misura, centro=(0, 0, 0), smusso=0.0, angolo_liscio=30, segmenti_smusso=3):
    """Scatola con smusso vero sugli spigoli. `misura` = (x, y, z) e `centro` sono coordinate Blender."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0), rotation=(0, 0, 0))
    ob = bpy.context.object
    ob.name = nome
    ob.data.name = nome
    ob.scale = misura
    # Prima la scala (e la posizione) sull'oggetto all'origine, poi lo si porta dove deve stare: da lo stesso risultato
    # ma non tocca le opzioni di creazione (`align`) che sposterebbero i primitivi creati dopo.
    # La scala si applica sulla forma e la posizione si scrive sulla mesh (non sull'oggetto): l'oggetto resta
    # all'origine con i trasformati a zero, così gli operatori che seguono (booleane, smussi) partono puliti.
    applica(ob, dove=False)
    vettore = Vector(centro)
    for v in ob.data.vertices:
        v.co += vettore
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    return _finisci(ob, smusso, angolo_liscio, segmenti_smusso)


def cilindro(nome, raggio, altezza, centro=(0, 0, 0), vertici=32, smusso=0.0, asse="Z", angolo_liscio=35, segmenti_smusso=2):
    """Cilindro con l'asse scelto ('Z', 'Y' o 'X') e smusso sugli spigoli dei tappi."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertici, radius=raggio, depth=altezza, location=centro, rotation=(0, 0, 0))
    ob = bpy.context.object
    ob.name = nome
    ob.data.name = nome
    if asse == "Y":
        ob.rotation_euler = (math.pi / 2, 0, 0)
    elif asse == "X":
        ob.rotation_euler = (0, math.pi / 2, 0)
    applica(ob)
    return _finisci(ob, smusso, angolo_liscio, segmenti_smusso)


def cono(nome, raggio1, raggio2, altezza, centro=(0, 0, 0), vertici=32, smusso=0.0, angolo_liscio=35):
    """Tronco di cono con l'asse Z (raggio1 in basso, raggio2 in alto)."""
    bpy.ops.mesh.primitive_cone_add(vertices=vertici, radius1=raggio1, radius2=raggio2, depth=altezza, location=centro, rotation=(0, 0, 0))
    ob = bpy.context.object
    ob.name = nome
    ob.data.name = nome
    return _finisci(ob, smusso, angolo_liscio)


def sfera(nome, raggio, centro=(0, 0, 0), segmenti=32, anelli=16, scala=(1, 1, 1), smusso=0.0):
    """Sfera (o ellissoide con `scala`), liscia."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segmenti, ring_count=anelli, radius=raggio, location=centro, rotation=(0, 0, 0))
    ob = bpy.context.object
    ob.scale = scala
    ob = bpy.context.object
    ob.name = nome
    applica(ob)
    return _finisci(ob, smusso, 60)


def cassa(nome, x0, x1, z0, z1, smusso, raggio_corpo=0.04, passo=0.01, fondo=1.0, asse="Y", profondita=(None, None)):
    """
    Scocca a spigoli arrotondati: lo spessore `y0..y1` (o la profondità `profondita` con `asse="Z"`)
    intersecato con i quattro cilindri (raggio `raggio_corpo`) costruiti sugli spigoli lunghi del contorno,
    come si fa con un solido nella modellazione vera. Resta uno smusso piccolo sugli altri spigoli.
    In Blender z è verticale: `asse="Z"` passa la scocca alzata (frontale e dietro sui piani di profondità).
    """
    y0, y1 = profondita if profondita != (None, None) else (-fondo / 2, fondo / 2)
    # Scatola con i lati distanti dal muro più di metà altezza: niente scala (la booleana EXACT non regge una scala sull'operatore).
    a = scatola(nome, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), smusso=0.0005, angolo_liscio=None)
    r = raggio_corpo
    for (x, y) in ((x0 + r, y0), (x1 - r, y0), (x0 + r, y1), (x1 - r, y1)):
        if asse == "Z":
            # Spigolo orizzontale (x fisso, y = profondità, z variabile): cilindro con l'asse lungo x.
            bpy.ops.mesh.primitive_cylinder_add(vertices=max(12, int(r / passo) + 4), radius=r, depth=(z1 - z0) + 0.2, location=(0, 0, 0), rotation=(0, math.pi / 2, 0))
        else:
            # Spigolo verticale (x e z fissi, y = spessore): cilindro alzato lungo z.
            bpy.ops.mesh.primitive_cylinder_add(vertices=max(12, int(r / passo) + 4), radius=r, depth=(y1 - y0) + 0.2, location=(0, 0, 0))
        cil = bpy.context.object
        # A posto con la posizione scritta sull'oggetto, senza applicarla: l'operatore booleano include la matrice.
        cil.location = (x, y, (z0 + z1) / 2) if asse == "Z" else (x, (y0 + y1) / 2, y)
        mod = a.modifiers.new("Raccordo", "BOOLEAN")
        mod.operation = "INTERSECT"
        mod.object = cil
        mod.solver = "MANIFOLD"
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cil, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = a
    a.select_set(True)
    # Smusso piccolo sul resto degli spigoli, con la geometria della booleana già fusa.
    # Geometria della booleana fusa (niente vertici doppi): poi si smussano gli spigoli rimasti.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=1e-6)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.select_mode(type="EDGE")
    bm = bmesh.from_edit_mesh(a.data)
    for e in bm.edges:
        v0, v1 = e.verts
        orizzontale_contorno = abs(v0.co.z - v1.co.z) < 1e-5 and abs(abs(v0.co.z) - (z1 - z0) / 2 + smusso * 0) < 0.001 and False
        if orizzontale_contorno:
            continue
        # Fuori dal raggio del contorno: basta che un vertice non stia nei quattro angoli raccordati.
        in_x = min(v0.co.x, v1.co.x) < (x1 - x0) / 2 - r and max(v0.co.x, v1.co.x) > -(x1 - x0) / 2 + r
        in_z = min(v0.co.z, v1.co.z) < (z1 - z0) / 2 - r and max(v0.co.z, v1.co.z) > -(z1 - z0) / 2 + r
        if in_x and in_z and abs(v0.co.y - v1.co.y) > 1e-5:
            # Spigolo lungo la profondità nella parte dritta del contorno: è già arrotondato dal cilindro.
            continue
        e.select = True
    bmesh.update_edit_mesh(a.data)
    bpy.ops.mesh.bevel(offset=smusso, segments=2, profile=0.5, affect="EDGES", clamp_overlap=True)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    a.data.name = nome
    return a


def unisci(lista, nome):
    """Unisce più mesh in una sola (stesso materiale), con l'origine a (0,0,0)."""
    bpy.ops.object.select_all(action="DESELECT")
    for ob in lista:
        # Il nome di ogni parte resta univoco prima dell'unione (dopo sono tutte la stessa mesh).
        ob.name = ob.name.split(".")[0] if ob.name != lista[0].name else ob.name
        ob.select_set(True)
    bpy.context.view_layer.objects.active = lista[0]
    if len(lista) > 1:
        bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = nome
    ob.data.name = nome
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    return ob


def chiuso(ob, dove=(0, 0, 0), scala=(1, 1, 1), ruota=(0, 0, 0)):
    """
    «Chiude» un primitivo appena creato: scala (`scala`), rotazione (`ruota`, Blender) e posizione (`dove`, Blender)
    finiscono nella geometria e l'oggetto torna a (0,0,0). Un primitivo lasciato in un punto diverso
    dall'origine, con la posizione applicata, lascia valori spuri nelle opzioni (`align`) che spostano i primitivi
    creati dopo. Prima la scala (con la rotazione), poi la rotazione da sola, poi la posizione: l'ordine di Blender.
    """
    ob.rotation_euler = ruota
    ob.location = (0, 0, 0)
    ob.scale = scala
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    ob.location = dove
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    return ob


def prosegui(ob, dove=(0, 0, 0)):
    """
    Porta la mesh appena costruita (che nasce con i vertici sparpagliati e l'origine a 0) sulla posizione `dove`,
    dentro la sua geometria. Dopo una join, la posizione della rete è in `matrix_world`: si sposta l'oggetto del suo
    vettore, poi si applica tutto (posizione compresa) così i vertici tornano nel sistema dei genitori.
    """
    spostamento = -ob.matrix_world.translation + Vector(dove)
    ob.location += spostamento
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    # Gli oggetti selezionati di prima tornano a restare fuori: nessuna caduta accidentale nelle join successive.
    bpy.ops.object.select_all(action="DESELECT")
    return ob


def assegna_nomato(ob, nome, *materiali_):
    """Nome stabile di oggetto e mesh (il nome che il modello espone a three.js) e materiale."""
    ob.name = nome
    ob.data.name = nome
    assegna(ob, *materiali_)
    return ob


def specchia_x(ob):
    """Gemello specchiato sull'asse X (antenne, manopole, gambe): smussi e normali restano giusti."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.duplicate()
    doppio = bpy.context.object
    doppio.scale = (-1, 1, 1)
    applica(doppio, dove=True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    return doppio


def tornita(nome, punti, materiali_, passo_gradi=4, tappi=(None, None), centro=(0, 0)):
    """
    Profilo ruotato di 360° attorno a Y: una mesh unica con passo di `passo_gradi` gradi per giro.
    `tappi` = quote (y0, y1) da chiudere con un disco a ventaglio. I punti sull'asse (r = 0) chiudono il
    profilo da soli; i tappi servono quando il profilo si appoggia al bordo del corpo e non all'asse.
    `centro` = (x, z) in Blender dell'asse del giro quando il pezzo non sta sull'asse verticale (manopole, pulsanti).
    La mesh nasce lì con l'origine dell'oggetto a zero: per spostarla dopo si usa `prosegui`.
    """
    import bmesh

    ox, oz = centro
    # Profilo ripulito: passi consecutivi (stesso raggio o stessa quota, entro 5 µm) non portano facce utili, solo degeneri.
    puliti = [punti[0]]
    for p in punti[1:]:
        q = puliti[-1]
        if abs(p[0] - q[0]) > 5e-6 or abs(p[1] - q[1]) > 5e-6:
            puliti.append(p)
    punti = puliti
    passi = max(8, round(360 / passo_gradi))
    bm = bmesh.new()
    # I punti sull'asse di uno stesso livello sono lo stesso vertice: senza, la ruota lascia cuciture a ventaglio.
    vertici = {}
    anello = []
    for (r, y, _) in punti:
        if r < 1e-6:
            chiave = ("asse", round(y, 5))
            if chiave not in vertici:
                vertici[chiave] = bm.verts.new((ox, y, oz))
            anello.append(vertici[chiave])
        else:
            anello.append(bm.verts.new((ox + r, y, oz)))
    bm.verts.ensure_lookup_table()
    anello_primo = anello
    for i in range(passi):
        a1 = 2 * math.pi * (i + 1) / passi
        if (i + 1) % passi == 0:
            succ = anello_primo
        else:
            succ = [v if r < 1e-6 else bm.verts.new((ox + r * math.cos(a1), y, oz + r * math.sin(a1))) for v, (r, y, _) in zip(anello, punti)]
        for k in range(len(punti) - 1):
            # I vertici senza ripetizioni, nell'ordine del giro: due punti sull'asse (o un tratto tutto sull'asse) diventano un triangolo o niente.
            giro = []
            for v in (anello[k], succ[k], succ[k + 1], anello[k + 1]):
                if v not in giro:
                    giro.append(v)
            if len(giro) >= 3:
                bm.faces.new(giro)
        anello = succ
    for y in (y0 for y0 in tappi if y0 is not None):
        centro_tappo = bm.verts.new((ox, y, oz))
        raggi = [math.hypot(v.co.x - ox, v.co.z - oz) for v in bm.verts if math.hypot(v.co.x - ox, v.co.z - oz) > 1e-5]
        if not raggi:
            bm.verts.remove(centro_tappo)
            continue
        r_min = min(raggi)
        cerchio = [v for v in bm.verts if v is not centro_tappo and abs(math.hypot(v.co.x - ox, v.co.z - oz) - r_min) < 1e-5]
        cerchio.sort(key=lambda v: math.atan2(v.co.z - oz, v.co.x - ox))
        for i, v in enumerate(cerchio):
            bm.faces.new((centro_tappo, v, cerchio[(i + 1) % len(cerchio)]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    assegna(ob, *materiali_)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(32))
    return ob


def profilata(nome, punti, materiali_, passo_gradi=4, tappi=(None, None), densita=0.0015, centro=(0, 0)):
    """
    Profilo con curve bézier (raccordi lisci fra i punti: si interpolano le tangenti come fa l'editor),
    poi ruotato con `tornita`. `transizione` per punto: -1 spigolo vivo (telo VECTOR, l'ellisse degenera in
    un tratto dritto), 0 liscio con l'ordinatricce.
    `punti` = (r, y, transizione) in un piano (r ≥ 0, y), solo tratti significativi, campionati a ~1,5 mm.
    """
    import mathutils

    if punti[-1][1] < punti[0][1]:
        punti = list(reversed(punti))
    pts = [mathutils.Vector((r, y)) for (r, y, _) in punti]
    n = len(pts)
    lunghezze = [(pts[i + 1] - pts[i]).length for i in range(n - 1)]
    tangenti = []
    for i in range(n):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == n - 1:
            t = pts[-1] - pts[-2]
        elif punti[i][2] < 0:
            t = None
        else:
            t = (pts[i + 1] - pts[i - 1]).normalized()
        tangenti.append(t)
    campioni = []
    # Dopo ogni punto il raggio non può scendere sotto il minimo del punto stesso (un raccordo che scavalca il bordo).
    sotto = min(p[0] for p in punti if p[0] > 1e-6)
    for i in range(n - 1):
        a, b = pts[i], pts[i + 1]
        ta = tangenti[i] if tangenti[i] is not None else (b - a)
        tb = tangenti[i + 1] if tangenti[i + 1] is not None else (b - a)
        # Maniglie di Catmull-Rom (la solita stima con le tangenti centrali); un'estremità VECTOR tiene la maniglia sull'angolo.
        ca = a + ta * (lunghezze[i] / (3 * max(ta.length, 1e-9))) if punti[i][2] >= 0 else a
        cb = b - tb * (lunghezze[i] / (3 * max(tb.length, 1e-9))) if punti[i + 1][2] >= 0 else b
        passi = max(1, int(lunghezze[i] / densita))
        for k in range(1 if i > 0 else 0, passi):
            s = k / passi
            u = 1 - s
            q = a * (u * u * u) + ca * (3 * u * u * s) + cb * (3 * u * s * s) + b * (s * s * s)
            campioni.append((max(q.x, sotto), q.y, 0))
    # Il punto finale si aggiunge solo se l'ultimo campione non ci è già finito sopra (un vertice doppio fa facce degenerate).
    fine = (0.0 if pts[-1].x < 1e-4 else pts[-1].x, pts[-1].y, 0)
    if abs(fine[1] - campioni[-1][1]) > 1e-6 or abs(fine[0] - campioni[-1][0]) > 1e-6:
        campioni.append(fine)
    # I punti sull'asse restano sull'asse; gli altri non scendono sotto il minimo del profilo.
    campioni = [(0.0 if r < 1e-4 else r, y, k) for (r, y, k) in campioni]
    return tornita(nome, campioni, materiali_, passo_gradi, tappi, centro)


def incidi(ob, coltello):
    """Mesh che taglia un oggetto in due (booleana DIFFERENZA applicata): serve dove due materiali si incontrano senza smusso."""
    mod = ob.modifiers.new("Taglio", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = coltello
    mod.solver = "MANIFOLD"
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(coltello, do_unlink=True)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(32))
    return ob


def trasforma(ob, sposta=(0, 0, 0), ruota=(0, 0, 0)):
    """Spostamento e rotazione (radianti, XYZ) in Blender, applicati alla geometria."""
    ob.rotation_euler = ruota
    ob.location = sposta
    applica(ob, dove=True)


def mesh_a_oggetto(nome, vertici, facce):
    """Mesh da liste esplicite (per pannelli o piani con UV precise)."""
    me = bpy.data.meshes.new(nome)
    me.from_pydata(vertici, [], facce)
    me.update()
    ob = bpy.data.objects.new(nome, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def triangoli(ob):
    """Conteggio dei triangoli che finiranno nel GLB (i quad vanno sdoppiati)."""
    me = ob.data
    return sum(len(p.vertices) - 2 for p in me.polygons)


# ══ Esportazione ══


def nuova_scena(funzione, *args):
    """Scena vuota nuova (con i dati vecchi cancellati) in cui costruire un altro modello: i nomi non si duplicano."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    svuota()
    return funzione(*args)


def esporta(percorso):
    """GLB, Y verso l'alto (lo fa l'esportatore), senza Draco, senza luci né camere, con i nomi di oggetti e materiali intatti."""
    os.makedirs(os.path.dirname(percorso) or ".", exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=percorso,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        use_selection=False,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=False,
        export_animations=False,
        export_skins=False,
        export_morph=False,
        export_extras=False,
        export_image_format="AUTO",
        export_image_quality=85,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
    )
    peso = os.path.getsize(percorso)
    totale = 0
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            totale += triangoli(ob)
    print(f"[blender] {os.path.basename(percorso)}: {peso / 1024:.1f} kB, {totale} triangoli")
    return peso, totale


# ══ Render di controllo ══


def _luci_e_fondo(target, raggio, luce=1.0):
    """
    Due luci direzionali (direttrice decisa dall'utente) e un mondo chiaro: un «studio» uniforme e leggero,
    calcolato solo per i raggi che arrivano davvero sulla camera, così i render sono veloci anche in software.
    La linea del sole si vede come un'ombra netta e radente: è il controllo di spigoli e raccordi.
    """
    sc = bpy.context.scene
    for nome, direzione, energia in (("_chiave", (-0.45, 0.55, -1.0), 3.2), ("_riempimento", (0.8, 0.3, -0.35), 1.1)):
        d = bpy.data.lights.new(nome, "SUN")
        d.energy = energia * luce
        d.angle = math.radians(6)
        o = bpy.data.objects.new(nome, d)
        o.location = (target[0], target[1], target[2] + 4)
        o.rotation_euler = Vector(direzione).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(o)
    mondo = bpy.data.worlds.new("_mondo")
    mondo.use_nodes = True
    bg = mondo.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.93, 0.92, 0.9, 1)
        bg.inputs[1].default_value = 1.1
    sc.world = mondo
    try:
        sc.eevee.ray_tracing_options.resolution_scale = "2"
    except (AttributeError, TypeError):
        pass


def direziona(ob, target):
    """Fa guardare l'oggetto verso `target` (si guarda il -Z locale)."""
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def render(percorso, pos, target, lente=50, risoluzione=(640, 640), ortografica=None):
    """Una vista: camera in `pos` che guarda `target`, EEVEE, immagine in `percorso` (PNG). Con `ortografica` = larghezza del riquadro, la camera è ortografica (misure leggibili, senza prospettiva)."""
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = risoluzione
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    try:
        sc.eevee.taa_render_samples = 24
    except AttributeError:
        pass
    cam = bpy.data.cameras.new("_camera")
    cam.lens = lente
    if ortografica:
        cam.type = "ORTHO"
        cam.ortho_scale = ortografica
    ob = bpy.data.objects.new("_camera", cam)
    ob.location = pos
    sc.collection.objects.link(ob)
    direziona(ob, target)
    sc.camera = ob
    sc.render.filepath = percorso
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(ob, do_unlink=True)
    print(f"[blender] render {percorso}")


def viste(ob, cartella, nome, target, distanza, altezza, angoli=(35, 0), lente=50, risoluzione=(640, 640), ortografica=None, luce=1.0):
    """
    Render di controllo: viste a `angoli` gradi attorno all'asse verticale (0 = frontale, negativo = da destra),
    camera a `distanza` dal target e a `altezza`. Fondo chiaro e luci montati una volta sola.
    `angoli` può contenere "alto" per una vista dall'alto (dall'alto-frontale).
    """
    os.makedirs(cartella, exist_ok=True)
    _luci_e_fondo(target, max(distanza * 0.5, 0.2), luce)
    for a in angoli:
        if a == "alto":
            pos = (target[0] + distanza * 0.25, target[1] - distanza * 0.6, target[2] + distanza * 0.85)
            render(os.path.join(cartella, f"{nome}-alto.png"), pos, target, lente, risoluzione, ortografica)
            continue
        rad = math.radians(a)
        pos = (target[0] + distanza * math.sin(rad), target[1] - distanza * math.cos(rad), altezza)
        render(os.path.join(cartella, f"{nome}-{int(a):03d}.png"), pos, target, lente, risoluzione, ortografica)
