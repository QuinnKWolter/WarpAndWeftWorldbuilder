import { cubicOut } from 'svelte/easing';

const duration = (milliseconds: number) =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 0
    : milliseconds;

// Animate the layout width on desktop; drawers slide over the canvas on phones.
export function panelMotion(node: HTMLElement, { side = -1 } = {}) {
  const width = parseFloat(getComputedStyle(node).width);
  const drawer = window.innerWidth < 1000;
  return {
    duration: duration(260),
    easing: cubicOut,
    css: (t: number) =>
      `overflow: clip; ${drawer ? '' : `width: ${width * t}px; min-width: 0;`} opacity: ${t}; transform: translateX(${side * (drawer ? width : 14) * (1 - t)}px);`
  };
}

export function modalMotion(node: HTMLElement) {
  const opacity = Number(getComputedStyle(node).opacity);
  return {
    duration: duration(180),
    easing: cubicOut,
    css: (t: number) =>
      `opacity: ${opacity * t}; transform: translateY(${8 * (1 - t)}px) scale(${0.985 + 0.015 * t});`
  };
}
