import { useSyncExternalStore } from 'react';

// SVG presentation attributes can't read CSS variables reliably, so charts get
// concrete hex values for the active colour scheme.
const LIGHT = {
  series: '#2a78d6',
  seriesMuted: '#b7d3f6',
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  surface: '#fcfcfb',
};

const DARK: typeof LIGHT = {
  series: '#3987e5',
  seriesMuted: '#184f95',
  grid: '#2c2c2a',
  axis: '#383835',
  muted: '#898781',
  surface: '#1a1a19',
};

const query = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useChartColors() {
  const dark = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
  return dark ? DARK : LIGHT;
}
