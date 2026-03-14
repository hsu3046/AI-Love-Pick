import { createElement, icons } from 'lucide';

/**
 * Convert kebab-case icon name to PascalCase for Lucide lookup.
 * e.g. 'book-open' → 'BookOpen'
 */
export function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Inject a Lucide SVG icon into a container element by its DOM id.
 */
export function injectIcon(root: HTMLElement, id: string, iconName: string): void {
  const container = root.querySelector(`#${id}`);
  if (!container) return;
  const pascalName = toPascalCase(iconName);
  const iconNode = icons[pascalName as keyof typeof icons];
  if (iconNode) {
    const svg = createElement(iconNode);
    container.appendChild(svg);
  }
}
