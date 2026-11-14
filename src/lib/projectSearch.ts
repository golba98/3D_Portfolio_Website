import { projects } from '../data/projects';
import type { Project, ProjectCategory } from '../types/content';

export const projectCategories: readonly ProjectCategory[] = [
  'Developer tools',
  'Web apps',
  'Research',
  'Games',
  'Systems',
];

/** Match all words, so a query such as "Rust debugger" can span fields. */
export function searchProjects(query: string, category?: ProjectCategory): readonly Project[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter((project) => {
    if (category && project.category !== category) return false;
    const text = [
      project.title,
      project.role,
      project.category,
      project.summary,
      project.proof,
      ...project.highlights,
      ...project.technologies,
    ]
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
}
