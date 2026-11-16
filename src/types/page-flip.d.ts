/** Tipi minimi di `page-flip` (StPageFlip 2), che non pubblica dichiarazioni: solo ciò che usa `FlipBook`. */
declare module 'page-flip' {
  export interface PageFlipSettings {
    width: number
    height: number
    size?: 'fixed' | 'stretch'
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    showCover?: boolean
    mobileScrollSupport?: boolean
    showPageCorners?: boolean
    autoSize?: boolean
    maxShadowOpacity?: number
    swipeDistance?: number
    useMouseEvents?: boolean
    disableFlipByClick?: boolean
    startPage?: number
  }

  export class PageFlip {
    constructor(el: HTMLElement, settings: PageFlipSettings)
    loadFromImages(src: string[]): void
    on(evento: 'flip' | 'changeOrientation' | 'changeState' | 'init' | 'update', fn: (e: { data: unknown }) => void): PageFlip
    flipNext(angolo?: 'top' | 'bottom'): void
    flipPrev(angolo?: 'top' | 'bottom'): void
    getCurrentPageIndex(): number
    getPageCount(): number
    update(): void
    destroy(): void
  }
}
