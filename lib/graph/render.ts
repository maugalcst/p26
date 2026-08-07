/**
 * Helpers de render puros (sin fs, sin servidor) — seguros para client components.
 */
import type { NodeCategory, RenderCategory } from './types';

/** proyección del grafo al render (layout jerárquico usa categorías en inglés). */
export function toRenderCategory(c: NodeCategory): RenderCategory {
  switch (c) {
    case 'experiencia':
      return 'experience';
    case 'proyecto':
      return 'project';
    case 'skill':
      return 'skill';
    case 'educacion':
      return 'education';
  }
}

export const categoryLabel: Record<RenderCategory, string> = {
  experience: 'experiencia',
  project: 'proyecto',
  skill: 'skill',
  education: 'educación',
};