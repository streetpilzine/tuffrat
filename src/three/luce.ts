import { useEffect, useMemo } from 'react'
import { ShaderMaterial, SRGBColorSpace, Vector3, type Texture } from 'three'

/** Posizione nel mondo della «luce del puntatore»: un solo uniform condiviso da tutte le tele. */
export const uLuce = { value: new Vector3(0, 2.2, 2.4) }

const VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vMondo;
void main() {
  vUv = uv;
  vec4 m = modelMatrix * vec4(position, 1.0);
  vMondo = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`

/**
 * Tela non illuminata dalla scena (i colori dell'opera restano quelli della foto) con due effetti legati al puntatore:
 * un alone morbido che schiarisce la zona vicina alla luce e un riflesso speculare che scivola sulla superficie.
 * Niente normal map in v1 (PLAN fase 2): la normale è quella del piano.
 */
const FRAG = /* glsl */ `
uniform sampler2D map;
uniform vec3 uLuce;
uniform float uRiflesso;
varying vec2 vUv;
varying vec3 vMondo;
void main() {
  vec3 colore = texture2D(map, vUv).rgb;
  vec3 versoLuce = uLuce - vMondo;
  float d = length(versoLuce);
  vec3 L = versoLuce / max(d, 0.0001);
  vec3 V = normalize(cameraPosition - vMondo);
  vec3 N = vec3(0.0, 0.0, 1.0);
  float alone = 0.9 + 0.16 * smoothstep(3.2, 0.4, d);
  float riflesso = pow(max(dot(N, normalize(L + V)), 0.0), 90.0) * uRiflesso;
  gl_FragColor = vec4(colore * alone + vec3(1.0, 0.98, 0.94) * riflesso, 1.0);
  #include <colorspace_fragment>
}`

/** Materiale della tela per una texture: da creare con `useMemo` e passare a `<primitive attach="material">`. */
export function creaMaterialeTela(map: Texture, riflesso = 0.2): ShaderMaterial {
  // Le foto delle opere sono in sRGB; l'anisotropia tiene leggibile la tela vista di sbieco durante lo scorrimento.
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  map.needsUpdate = true
  return new ShaderMaterial({
    uniforms: { map: { value: map }, uLuce, uRiflesso: { value: riflesso } },
    vertexShader: VERT,
    fragmentShader: FRAG,
  })
}

export function useMaterialeTela(map: Texture, riflesso?: number) {
  const mat = useMemo(() => creaMaterialeTela(map, riflesso), [map, riflesso])
  useEffect(() => () => mat.dispose(), [mat])
  return mat
}
