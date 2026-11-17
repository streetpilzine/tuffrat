# Modelli 3D con Blender

Modelli di scena del redesign costruiti da codice con Blender 5.2 headless ed esportati in GLB in `public/assets/models/`. Il sito li carica con `useModello` (`src/three/modelli/comune.ts`).

## Stato

| modello | script | in uso | note |
| --- | --- | --- | --- |
| `banco.glb` (239 kB) | `modelli/banco.py` | sì, `ModelloBanco` in `src/scenes/Banco.tsx` | piano di sei tavole con venatura (texture cotta, `sorgenti/legno-banco.jpg`), gambe e traverse in metallo fino al pavimento; origine al centro della superficie del piano |
| `pennarello.glb` (120 kB) | `modelli/attrezzi.py` | sì, `ModelloPennarello` in `src/scenes/Banco.tsx` | origine alla punta, asse +y fino a 0,33, raggio 0,02 |
| bomboletta | `modelli/attrezzi.py` | no | il modello esce con pezzi staccati (valvola e tappino fuori posto): nel sito la bomboletta è tornita in codice (`Bomboletta` in `Banco.tsx`). `tutto.py` scarta il suo GLB |
| bussolotto | `modelli/bussolotto.py` | no | tappo staccato dal corpo: nel sito resta la geometria in codice (`Bussolotto` in `src/three/Rullino.tsx`) |
| TV | `modelli/tv.py` | no | la scocca esce come una scatola senza i dettagli del frontale: nel sito la TV è in codice (`src/three/Tv.tsx`) |

Gli script dei tre modelli non riusciti restano come base da riprendere: vanno corretti guardando i render di controllo prima di esportarli e agganciarli.

## Rigenerare

Da PowerShell, dalla radice del repo:

```powershell
python tools/blender/tutto.py                      # banco e pennarello, ognuno in un processo Blender suo
python tools/blender/tutto.py --rigenera-texture   # rifà anche la texture del legno del banco
```

Un modello da solo, e il suo render di controllo (EEVEE, fondo chiaro, vista di tre quarti):

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b -P tools/blender/modelli/banco.py -- public/assets/models/banco.glb
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b -P tools/blender/render.py -- public/assets/models/banco.glb banco <cartella dei render>
```

## Convenzioni

Unità del mondo del sito (1 = 50 cm, `SCALA` in `src/three/mondo.ts`); geometria costruita in Blender con z in alto, girata in y verso l'alto dall'esportatore glTF; nessun modificatore lasciato acceso all'esportazione; niente Draco (il sito carica i GLB senza decoder); ogni GLB sotto 300 kB.

Note su Blender 5 scoperte lavorando (dettagli in `comune.py`): gli operatori dei primitivi lasciano valori che spostano le creazioni successive, quindi ogni primitivo si crea all'origine e si porta a posto applicandone le trasformazioni; la booleana `EXACT` è inaffidabile con questi primitivi, si usa `MANIFOLD`; i profili torniti sono costruiti a mano (`tornita`).

## Aggancio nel sito

Ogni modello sta in una `Suspense` sua, con le primitive come ripiego: lo `Stage` ha una sola `Suspense`, e un file che arriva tardi non deve far sparire tutto il mondo.

```tsx
<group position={[0, BANCO.y, BANCO.z]}>
  <Suspense fallback={<BancoSemplice />}>
    <ModelloBanco />
  </Suspense>
</group>
```
