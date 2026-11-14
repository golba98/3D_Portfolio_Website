import { APPS } from '../apps/registry';
import { searchProjects } from './projectSearch';

export function searchPortfolio(query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return {
    apps: APPS.filter((app) => {
      const text = [app.title, app.description, ...app.keywords].join(' ').toLowerCase();
      return words.every((word) => text.includes(word));
    }),
    projects: words.length ? searchProjects(query) : [],
  };
}
