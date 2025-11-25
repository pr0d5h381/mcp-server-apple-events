/**
 * notesFormatter.test.ts
 * Tests for natural language note formatting utilities
 */

import {
  addLink,
  clearCritical,
  formatNotes,
  mergeNotes,
  type NoteComponents,
  parseNotes,
  removeLink,
  setCritical,
} from './notesFormatter.js';

describe('formatNotes', () => {
  it('should format all components as paragraphs', () => {
    const components: NoteComponents = {
      content: 'Check security issues',
      critical: 'Blocking release',
      links: ['ABC123', 'DEF456'],
    };

    const result = formatNotes(components);
    expect(result).toBe(
      'Check security issues\n\nCritical:\nBlocking release\n\nRelated:\nABC123, DEF456',
    );
  });

  it('should format content only', () => {
    expect(formatNotes({ content: 'Simple note' })).toBe('Simple note');
  });

  it('should format critical only', () => {
    expect(formatNotes({ critical: 'Urgent task' })).toBe(
      'Critical:\nUrgent task',
    );
  });

  it('should format links only', () => {
    expect(formatNotes({ links: ['ID1', 'ID2'] })).toBe('Related:\nID1, ID2');
  });

  it('should return empty string for empty components', () => {
    expect(formatNotes({})).toBe('');
  });

  it('should format content with critical', () => {
    const components: NoteComponents = {
      content: 'Review the PR',
      critical: 'Deadline today',
    };

    expect(formatNotes(components)).toBe(
      'Review the PR\n\nCritical:\nDeadline today',
    );
  });

  it('should format content with links', () => {
    const components: NoteComponents = {
      content: 'Main task',
      links: ['REF1'],
    };

    expect(formatNotes(components)).toBe('Main task\n\nRelated:\nREF1');
  });
});

describe('parseNotes', () => {
  it('should parse all components', () => {
    const notes =
      'Main content here\n\nCritical:\nBlocking issue\n\nRelated:\nABC, DEF';
    const result = parseNotes(notes);

    expect(result.content).toBe('Main content here');
    expect(result.critical).toBe('Blocking issue');
    expect(result.links).toEqual(['ABC', 'DEF']);
  });

  it('should parse content only', () => {
    const notes = 'Just a simple note';
    const result = parseNotes(notes);

    expect(result.content).toBe('Just a simple note');
    expect(result.critical).toBeUndefined();
    expect(result.links).toBeUndefined();
  });

  it('should parse multiline content', () => {
    const notes = 'Line 1\nLine 2\nLine 3';
    const result = parseNotes(notes);

    expect(result.content).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should return empty object for undefined', () => {
    expect(parseNotes(undefined)).toEqual({});
  });

  it('should return empty object for empty string', () => {
    expect(parseNotes('')).toEqual({});
  });

  it('should handle whitespace in links', () => {
    const notes = 'Related:\nABC , DEF , GHI';
    const result = parseNotes(notes);

    expect(result.links).toEqual(['ABC', 'DEF', 'GHI']);
  });

  it('should parse critical without content', () => {
    const notes = 'Critical:\nImportant deadline';
    const result = parseNotes(notes);

    expect(result.content).toBeUndefined();
    expect(result.critical).toBe('Important deadline');
  });

  it('should handle content after critical', () => {
    const notes = 'Critical:\nUrgent\n\nSome content after';
    const result = parseNotes(notes);

    expect(result.critical).toBe('Urgent');
    expect(result.content).toBe('Some content after');
  });
});

describe('mergeNotes', () => {
  it('should override critical with update', () => {
    const existing: NoteComponents = { critical: 'Old' };
    const updates: Partial<NoteComponents> = { critical: 'New' };

    const result = mergeNotes(existing, updates);
    expect(result.critical).toBe('New');
  });

  it('should keep existing critical if no update', () => {
    const existing: NoteComponents = { critical: 'Existing' };
    const updates: Partial<NoteComponents> = { content: 'New content' };

    const result = mergeNotes(existing, updates);
    expect(result.critical).toBe('Existing');
  });

  it('should append content with double newline', () => {
    const existing: NoteComponents = { content: 'First part' };
    const updates: Partial<NoteComponents> = { content: 'Second part' };

    const result = mergeNotes(existing, updates);
    expect(result.content).toBe('First part\n\nSecond part');
  });

  it('should deduplicate links', () => {
    const existing: NoteComponents = { links: ['A', 'B'] };
    const updates: Partial<NoteComponents> = { links: ['B', 'C'] };

    const result = mergeNotes(existing, updates);
    expect(result.links).toEqual(['A', 'B', 'C']);
  });

  it('should handle empty existing', () => {
    const updates: Partial<NoteComponents> = {
      content: 'Content',
      critical: 'Critical',
      links: ['A'],
    };

    const result = mergeNotes({}, updates);
    expect(result).toEqual(updates);
  });
});

describe('addLink', () => {
  it('should add link to empty notes', () => {
    const result = addLink(undefined, 'ABC123');
    expect(result).toBe('Related:\nABC123');
  });

  it('should add link to existing notes', () => {
    const result = addLink('Some content', 'ABC123');
    expect(result).toBe('Some content\n\nRelated:\nABC123');
  });

  it('should add link to notes with existing links', () => {
    const result = addLink('Related:\nDEF456', 'ABC123');
    expect(result).toBe('Related:\nDEF456, ABC123');
  });

  it('should not duplicate existing link', () => {
    const result = addLink('Related:\nABC123', 'ABC123');
    expect(result).toBe('Related:\nABC123');
  });
});

describe('setCritical', () => {
  it('should set critical on empty notes', () => {
    const result = setCritical(undefined, 'Urgent');
    expect(result).toBe('Critical:\nUrgent');
  });

  it('should set critical on existing notes', () => {
    const result = setCritical('Some content', 'Urgent');
    expect(result).toBe('Some content\n\nCritical:\nUrgent');
  });

  it('should override existing critical', () => {
    const result = setCritical('Critical:\nOld\n\nContent', 'New');
    expect(result).toBe('Content\n\nCritical:\nNew');
  });
});

describe('clearCritical', () => {
  it('should remove critical from notes', () => {
    const result = clearCritical('Content\n\nCritical:\nRemove this');
    expect(result).toBe('Content');
  });

  it('should handle notes without critical', () => {
    const result = clearCritical('Just content');
    expect(result).toBe('Just content');
  });

  it('should handle undefined notes', () => {
    const result = clearCritical(undefined);
    expect(result).toBe('');
  });
});

describe('removeLink', () => {
  it('should remove specific link', () => {
    const result = removeLink('Related:\nABC, DEF, GHI', 'DEF');
    expect(result).toBe('Related:\nABC, GHI');
  });

  it('should remove Related section when last link removed', () => {
    const result = removeLink('Content\n\nRelated:\nABC', 'ABC');
    expect(result).toBe('Content');
  });

  it('should handle non-existent link', () => {
    const result = removeLink('Related:\nABC', 'XYZ');
    expect(result).toBe('Related:\nABC');
  });
});

describe('roundtrip', () => {
  it('should preserve data through format -> parse cycle', () => {
    const original: NoteComponents = {
      content: 'Task details here',
      critical: 'Must complete today',
      links: ['ID1', 'ID2'],
    };

    const formatted = formatNotes(original);
    const parsed = parseNotes(formatted);

    expect(parsed).toEqual(original);
  });

  it('should handle multiline content', () => {
    const original: NoteComponents = {
      content: 'First line.\nSecond line.',
      links: ['REF1'],
    };

    const formatted = formatNotes(original);
    const parsed = parseNotes(formatted);

    expect(parsed.content).toBe(original.content);
    expect(parsed.links).toEqual(original.links);
  });
});
