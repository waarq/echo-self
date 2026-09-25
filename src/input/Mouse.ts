/** Desktop mouse: left click triggers attack (PRD §2 — mouse is otherwise
 * only for optional aiming, kept minimal here). */
export class Mouse {
  private justClicked = false;

  private onPointerDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    this.justClicked = true;
  };

  attach(target: HTMLElement): void {
    target.addEventListener('pointerdown', this.onPointerDown);
  }

  detach(target: HTMLElement): void {
    target.removeEventListener('pointerdown', this.onPointerDown);
  }

  consumeClick(): boolean {
    if (this.justClicked) {
      this.justClicked = false;
      return true;
    }
    return false;
  }
}
