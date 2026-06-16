import { describe, expect, it } from 'vitest';
import {
  extractChartLineStyle,
  extractSeriesLineNoFill,
  extractSeriesLineWidth,
  markerSizeToPx,
} from '../../../../src/renderer/chart/style';
import { parseXml } from '../../../../src/parser/XmlParser';
import { createMockRenderContext } from '../../helpers/mockContext';

describe('chart style helpers', () => {
  it('converts OOXML line width and marker size into renderer pixels', () => {
    const series = parseXml(`
      <c:ser xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:spPr><a:ln w="25400"/></c:spPr>
      </c:ser>
    `);

    expect(extractSeriesLineWidth(series)).toBe(2);
    expect(markerSizeToPx(9)).toBe(12);
  });

  it('detects line noFill and suppresses chart line style', () => {
    const series = parseXml(`
      <c:ser xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:spPr><a:ln><a:noFill/></a:ln></c:spPr>
      </c:ser>
    `);
    const line = series.child('spPr').child('ln');

    expect(extractSeriesLineNoFill(series)).toBe(true);
    expect(extractChartLineStyle(line, createMockRenderContext())).toBeUndefined();
  });
});
