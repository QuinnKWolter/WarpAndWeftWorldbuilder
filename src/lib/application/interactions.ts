/** Scroll a pane at its edges while a native item drag is active. */
export function dragScroll(node: HTMLElement) {
  let frame = 0;
  let speed = 0;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    speed = 0;
  }
  function scroll() {
    node.scrollTop += speed;
    if (speed) frame = requestAnimationFrame(scroll);
    else frame = 0;
  }
  function over(event: DragEvent) {
    if (!Array.from(event.dataTransfer?.types ?? []).some((type) => type.startsWith('storygraph/')))
      return;
    const bounds = node.getBoundingClientRect();
    const edge = 48;
    speed =
      event.clientY < bounds.top + edge
        ? -Math.min(12, (bounds.top + edge - event.clientY) / 4)
        : event.clientY > bounds.bottom - edge
          ? Math.min(12, (event.clientY - bounds.bottom + edge) / 4)
          : 0;
    if (speed && !frame) frame = requestAnimationFrame(scroll);
  }
  function leave(event: DragEvent) {
    if (!(event.relatedTarget instanceof Node) || !node.contains(event.relatedTarget)) stop();
  }
  // Capture receives events even when nested drop targets stop propagation.
  node.addEventListener('dragover', over, true);
  node.addEventListener('dragleave', leave);
  document.addEventListener('drop', stop, true);
  document.addEventListener('dragend', stop, true);
  return {
    destroy() {
      stop();
      node.removeEventListener('dragover', over, true);
      node.removeEventListener('dragleave', leave);
      document.removeEventListener('drop', stop, true);
      document.removeEventListener('dragend', stop, true);
    }
  };
}

/** A details menu closes after choosing an action, clicking away or pressing Escape. */
export function dismissMenu(node: HTMLDetailsElement, options: { closeOnAction?: boolean } = {}) {
  function outside(event: PointerEvent) {
    if (event.target instanceof Node && !node.contains(event.target)) node.open = false;
  }
  function choose(event: MouseEvent) {
    if (
      options.closeOnAction !== false &&
      event.target instanceof Element &&
      event.target.closest('button,a')
    )
      node.open = false;
  }
  function escape(event: KeyboardEvent) {
    if (event.key === 'Escape' && node.open) {
      node.open = false;
      node.querySelector('summary')?.focus();
      event.stopPropagation();
    }
  }
  document.addEventListener('pointerdown', outside);
  node.addEventListener('click', choose);
  node.addEventListener('keydown', escape);
  return {
    destroy() {
      document.removeEventListener('pointerdown', outside);
      node.removeEventListener('click', choose);
      node.removeEventListener('keydown', escape);
    }
  };
}

/** Keep fullscreen keyboard focus inside the active surface, then restore it. */
export function focusScope(node: HTMLElement, active: boolean) {
  let previous: HTMLElement | null = null;
  let enabled = false;
  const focusables = () =>
    Array.from(
      node.querySelectorAll<HTMLElement>(
        'button:not(:disabled),a[href],input:not(:disabled),textarea,select,summary,[tabindex="0"],[contenteditable="true"]'
      )
    ).filter((e) => e.getClientRects().length && !e.closest('[inert],dialog:not([open])'));
  function update(next: boolean) {
    if (next && !enabled) {
      previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      enabled = true;
      requestAnimationFrame(() => {
        if (enabled)
          (node.querySelector<HTMLElement>('[aria-label^="Exit "]') ?? focusables()[0])?.focus();
      });
    } else if (!next && enabled) {
      enabled = false;
      requestAnimationFrame(() => {
        if (previous?.isConnected && !previous.closest('[inert]')) previous.focus();
      });
    }
  }
  function keydown(event: KeyboardEvent) {
    if (
      !enabled ||
      event.key !== 'Tab' ||
      (event.target instanceof Element && event.target.closest('dialog[open]'))
    )
      return;
    const items = focusables();
    const first = items[0],
      last = items.at(-1);
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  node.addEventListener('keydown', keydown);
  update(active);
  return {
    update,
    destroy() {
      node.removeEventListener('keydown', keydown);
      if (enabled && previous?.isConnected) previous.focus();
    }
  };
}
