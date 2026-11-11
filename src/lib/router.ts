import { useSyncExternalStore } from 'react';

// Minimal hash router: "#/" is the dashboard, "#/article/<id>" is an article page.
// Hash routing keeps the app working on static hosts such as GitHub Pages.

export type Route = { page: 'dashboard' } | { page: 'article'; id: string };

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function parse(hash: string): Route {
  const match = hash.match(/^#\/article\/([\w-]+)$/);
  return match ? { page: 'article', id: match[1] } : { page: 'dashboard' };
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}

export const articleHref = (id: string) => `#/article/${id}`;
export const dashboardHref = '#/';
