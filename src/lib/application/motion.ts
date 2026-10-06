import { cubicOut } from 'svelte/easing';

export function motionDuration(milliseconds: number) {
  if (typeof window === 'undefined') return milliseconds;
  const preference = document.documentElement.dataset.motion ?? 'system';
  return preference === 'reduced' ||
    (preference === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ? 0
    : milliseconds;
}

// Animate the layout width on desktop; drawers slide over the canvas on phones.
export function panelMotion(node: HTMLElement, { side = -1 } = {}) {
  const width = parseFloat(getComputedStyle(node).width);
  const drawer = window.innerWidth < 1000;
  return {
    duration: motionDuration(420),
    easing: cubicOut,
    css: (t: number) =>
      `overflow: clip; ${drawer ? '' : `width: ${width * t}px; min-width: 0;`} opacity: ${t}; transform: translateX(${side * (drawer ? width : 24) * (1 - t)}px);`
  };
}

export function modalMotion(node: HTMLElement) {
  const opacity = Number(getComputedStyle(node).opacity);
  return {
    duration: motionDuration(260),
    easing: cubicOut,
    css: (t: number) =>
      `opacity: ${opacity * t}; transform: translateY(${18 * (1 - t)}px) scale(${0.97 + 0.03 * t});`
  };
}
