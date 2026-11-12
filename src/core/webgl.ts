/** Rilevamento WebGL e dispositivi deboli (PLAN §5: fallback automatico su vista lista). */

export function rilevaWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    if (!gl) return false
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()
    return true
  } catch {
    return false
  }
}

/** `deviceMemory` ≤ 2 GB: la scena 3D non parte, resta la vista lista. */
export function dispositivoDebole(): boolean {
  if (typeof navigator === 'undefined') return false
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return typeof mem === 'number' && mem <= 2
}
