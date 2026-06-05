import { describe, expect, it } from 'vitest';
import { buildTextIndex, searchPresentation, searchText } from '../../../src/search/TextSearch';
import type { PresentationData } from '../../../src/model/Presentation';
import type { ShapeNodeData, TextBody } from '../../../src/model/nodes/ShapeNode';
import type { TableNodeData } from '../../../src/model/nodes/TableNode';
import { SafeXmlNode } from '../../../src/parser/XmlParser';

const emptySource = new SafeXmlNode(null);

const textBody = (...paragraphs: string[]): TextBody => ({
  paragraphs: paragraphs.map((text) => ({
    level: 0,
    runs: [{ text }],
  })),
});

const shape = (id: string, text: string, slideOffset = 0): ShapeNodeData => ({
  id,
  name: id,
  nodeType: 'shape',
  position: { x: 10 + slideOffset, y: 20 },
  size: { w: 240, h: 80 },
  rotation: 0,
  flipH: false,
  flipV: false,
  adjustments: new Map(),
  textBody: textBody(text),
  source: emptySource,
});

const table = (id: string, cells: string[][]): TableNodeData => ({
  id,
  name: id,
  nodeType: 'table',
  position: { x: 40, y: 120 },
  size: { w: 400, h: 160 },
  rotation: 0,
  flipH: false,
  flipV: false,
  columns: [200, 200],
  rows: cells.map((row) => ({
    height: 40,
    cells: row.map((cellText) => ({
      gridSpan: 1,
      rowSpan: 1,
      hMerge: false,
      vMerge: false,
      textBody: textBody(cellText),
    })),
  })),
  source: emptySource,
});

const presentation = (): PresentationData => ({
  width: 960,
  height: 540,
  slides: [
    {
      index: 0,
      nodes: [
        shape('title', 'GPU 算力 overview'),
        table('capacity-table', [
          ['Region', '算力池 A'],
          ['East', 'GPU capacity'],
        ]),
      ],
      layoutIndex: '',
      rels: new Map(),
      showMasterSp: true,
      slidePath: 'ppt/slides/slide1.xml',
    },
    {
      index: 1,
      nodes: [shape('detail', 'cpu capacity and gpu quota', 20)],
      layoutIndex: '',
      rels: new Map(),
      showMasterSp: true,
      slidePath: 'ppt/slides/slide2.xml',
    },
  ],
  layouts: new Map(),
  masters: new Map(),
  themes: new Map(),
  slideToLayout: new Map(),
  layoutToMaster: new Map(),
  masterToTheme: new Map(),
  media: new Map(),
  charts: new Map(),
  isWps: false,
});

describe('buildTextIndex', () => {
  it('extracts searchable text entries from shapes and table cells', () => {
    const index = buildTextIndex(presentation());

    expect(index.map((entry) => entry.text)).toEqual([
      'GPU 算力 overview',
      'Region',
      '算力池 A',
      'East',
      'GPU capacity',
      'cpu capacity and gpu quota',
    ]);
    expect(index[0]).toMatchObject({
      slideIndex: 0,
      nodeId: 'title',
      nodePath: 'slides/0/nodes/title',
      nodeType: 'shape',
      textKind: 'shape',
      bounds: { x: 10, y: 20, w: 240, h: 80 },
    });
    expect(index[2]).toMatchObject({
      nodeId: 'capacity-table',
      textKind: 'table-cell',
      rowIndex: 0,
      cellIndex: 1,
    });
  });
});

describe('searchText', () => {
  it('returns case-insensitive matches with slide and node locations', () => {
    const results = searchText(buildTextIndex(presentation()), 'GPU');

    expect(results).toHaveLength(3);
    expect(results.map((result) => [result.slideIndex, result.nodeId])).toEqual([
      [0, 'title'],
      [0, 'capacity-table'],
      [1, 'detail'],
    ]);
    expect(results[0]).toMatchObject({
      matchStart: 0,
      matchEnd: 3,
      snippet: 'GPU 算力 overview',
    });
  });

  it('supports case-sensitive string searches when matchCase is enabled', () => {
    const results = searchText(buildTextIndex(presentation()), 'GPU', { matchCase: true });

    expect(results.map((result) => result.text)).toEqual(['GPU 算力 overview', 'GPU capacity']);
  });

  it('respects RegExp flags instead of applying matchCase options', () => {
    const index = buildTextIndex(presentation());

    expect(searchText(index, /GPU/, { matchCase: false }).map((result) => result.text)).toEqual([
      'GPU 算力 overview',
      'GPU capacity',
    ]);
    expect(searchText(index, /GPU/i, { matchCase: true })).toHaveLength(3);
  });

  it('supports CJK text search without word-boundary assumptions', () => {
    const results = searchPresentation(presentation(), '算力');

    expect(results.map((result) => result.text)).toEqual(['GPU 算力 overview', '算力池 A']);
  });

  it('supports whole-word searches for ASCII terms', () => {
    const results = searchPresentation(presentation(), 'cap', { wholeWord: true });

    expect(results).toEqual([]);
    expect(searchPresentation(presentation(), 'capacity', { wholeWord: true })).toHaveLength(2);
  });
});
