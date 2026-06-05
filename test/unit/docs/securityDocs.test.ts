import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function readDoc(path: string): string {
  return readFileSync(resolve(root, path), 'utf-8');
}

describe('security documentation examples', () => {
  it('does not show untrusted parseZip examples without recommended limits', () => {
    const readme = readDoc('README.md');

    expect(readme).not.toContain('parseZip(arrayBuffer);');
  });

  it('defines imports for examples that use recommended ZIP limits', () => {
    const performanceGuide = readDoc('docs/PERFORMANCE.md');

    expect(performanceGuide).toContain(
      "import { PptxViewer, RECOMMENDED_ZIP_LIMITS } from '@aiden0z/pptx-renderer';",
    );
  });

  it('documents decoded-entry ZIP limit fallback behavior', () => {
    const readme = readDoc('README.md');
    const securityGuide = readDoc('docs/SECURITY.md');

    expect(readme).toContain('actual decoded entry size');
    expect(securityGuide).toContain('actual decoded entry size');
  });

  it('documents render request supersession semantics', () => {
    const readme = readDoc('README.md');
    const architectureGuide = readDoc('docs/ARCHITECTURE.md');

    expect(readme).toContain('newer render request supersedes older queued or batched work');
    expect(architectureGuide).toContain(
      'newer render request supersedes older queued or batched work',
    );
  });

  it('documents text search and scaled thumbnail preview API boundaries', () => {
    const readme = readDoc('README.md');
    const architectureGuide = readDoc('docs/ARCHITECTURE.md');
    const performanceGuide = readDoc('docs/PERFORMANCE.md');
    const testingGuide = readDoc('docs/TESTING.md');
    const docsIndex = readDoc('docs/README.md');

    expect(readme).toContain('#### Text Search');
    expect(readme).toContain('TextSearchResult');
    expect(readme).toContain('nodePath');
    expect(readme).toContain('bounds');
    expect(readme).toContain('#### Scaled Slide Previews');
    expect(readme).toContain('renderThumbnailToContainer');
    expect(readme).toContain('bitmap thumbnail generator');
    expect(readme).toContain('highlightSearchResult');
    expect(readme).toContain('SearchHighlightOptions');
    expect(readme).toContain('clearSearchHighlights');
    expect(readme).toContain('default highlight style');
    expect(readme).toContain('custom colors');
    expect(readme).toContain('node-level highlight overlays');
    expect(readme).toContain('character-level text highlighting');
    expect(readme).toContain('String queries are case-insensitive by default');
    expect(readme).toContain('matchCase: true');
    expect(readme).toContain('RegExp queries keep their own flags');

    expect(architectureGuide).toContain('Search, Highlights, and Scaled Previews');
    expect(architectureGuide).toContain('src/search/TextSearch.ts');
    expect(architectureGuide).toContain('highlightSearchResult');
    expect(architectureGuide).toContain('renderThumbnailToContainer');
    expect(architectureGuide).toContain('character-level text highlighting');
    expect(architectureGuide).toContain('RegExp queries keep caller-provided flags');

    expect(performanceGuide).toContain('Search and Preview UI');
    expect(performanceGuide).toContain('renderThumbnailToContainer');
    expect(performanceGuide).toContain('not a bitmap thumbnail generator');
    expect(performanceGuide).toContain('IntersectionObserver');

    expect(testingGuide).toContain('model search');
    expect(testingGuide).toContain('lazy thumbnail navigation');

    expect(docsIndex).toContain('search/highlight');
    expect(docsIndex).toContain('scaled preview');
  });
});
