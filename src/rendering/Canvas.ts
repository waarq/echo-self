/** Owns the canvas element and keeps its backing resolution in sync with
 * viewport size + devicePixelRatio so rendering stays crisp on mobile and
 * desktop alike. */
export class GameCanvas {
  readonly element: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;

  constructor(container: HTMLElement) {
    this.element = document.createElement('canvas');
    this.element.style.display = 'block';
    this.element.style.width = '100%';
    this.element.style.height = '100%';
    container.appendChild(this.element);

    const ctx = this.element.getContext('2d');
    if (!ctx) throw new Error('2D canvas context not supported');
    this.ctx = ctx;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.element.width = Math.round(this.width * dpr);
    this.element.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
