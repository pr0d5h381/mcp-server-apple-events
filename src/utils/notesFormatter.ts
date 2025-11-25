/**
 * notesFormatter.ts
 * Natural language formatting utilities for reminder notes
 */

/**
 * Note structure components
 */
export interface NoteComponents {
  /** Main note content */
  content?: string;
  /** Critical/blocking information */
  critical?: string;
  /** Related reminder IDs */
  links?: string[];
}

/**
 * Format notes as natural text paragraphs:
 *
 * Main content here.
 *
 * Critical:
 * reason here
 *
 * Related:
 * ID1, ID2
 */
export function formatNotes(components: NoteComponents): string {
  const parts: string[] = [];

  if (components.content) {
    parts.push(components.content);
  }

  if (components.critical) {
    parts.push(`Critical:\n${components.critical}`);
  }

  if (components.links?.length) {
    parts.push(`Related:\n${components.links.join(', ')}`);
  }

  return parts.join('\n\n').trim();
}

/**
 * Parse natural notes format
 */
export function parseNotes(notes?: string): NoteComponents {
  if (!notes) return {};

  const components: NoteComponents = {};
  const lines = notes.split('\n');
  const contentLines: string[] = [];

  let currentSection: 'content' | 'critical' | 'related' = 'content';

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'Critical:') {
      currentSection = 'critical';
      continue;
    }

    if (trimmed === 'Related:') {
      currentSection = 'related';
      continue;
    }

    if (!trimmed) continue;

    switch (currentSection) {
      case 'critical':
        components.critical = trimmed;
        currentSection = 'content'; // Reset after capturing
        break;
      case 'related':
        components.links = trimmed
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);
        currentSection = 'content'; // Reset after capturing
        break;
      default:
        contentLines.push(trimmed);
    }
  }

  if (contentLines.length > 0) {
    components.content = contentLines.join('\n');
  }

  return components;
}

/**
 * Merge notes: updates override existing values, links are combined
 */
export function mergeNotes(
  existing: NoteComponents,
  updates: Partial<NoteComponents>,
): NoteComponents {
  const merged: NoteComponents = {};

  // Content: append if both exist
  if (updates.content && existing.content) {
    merged.content = `${existing.content}\n\n${updates.content}`;
  } else {
    merged.content = updates.content ?? existing.content;
  }

  // Critical: new overrides old
  merged.critical = updates.critical ?? existing.critical;

  // Links: combine and deduplicate
  const allLinks = [...(existing.links ?? []), ...(updates.links ?? [])];
  if (allLinks.length > 0) {
    merged.links = [...new Set(allLinks)];
  }

  return merged;
}

/**
 * Add a link to existing notes
 */
export function addLink(notes: string | undefined, linkId: string): string {
  const components = parseNotes(notes);
  components.links = [...new Set([...(components.links ?? []), linkId])];
  return formatNotes(components);
}

/**
 * Set critical info on existing notes
 */
export function setCritical(
  notes: string | undefined,
  critical: string,
): string {
  const components = parseNotes(notes);
  components.critical = critical;
  return formatNotes(components);
}

/**
 * Remove critical info from notes
 */
export function clearCritical(notes: string | undefined): string {
  const components = parseNotes(notes);
  delete components.critical;
  return formatNotes(components);
}

/**
 * Remove a link from notes
 */
export function removeLink(notes: string | undefined, linkId: string): string {
  const components = parseNotes(notes);
  components.links = components.links?.filter((id) => id !== linkId);
  if (components.links?.length === 0) {
    delete components.links;
  }
  return formatNotes(components);
}

// Legacy exports for backwards compatibility
export {
  formatNotes as formatStandardizedNotes,
  parseNotes as parseNoteComponents,
  mergeNotes as mergeNoteComponents,
};
