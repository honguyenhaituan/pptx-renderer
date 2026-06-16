import { describe, expect, it } from 'vitest';
import { parseExplosion, parseSeries } from '../../../../src/renderer/chart/series';
import { parseXml } from '../../../../src/parser/XmlParser';
import { createMockRenderContext } from '../../helpers/mockContext';

describe('chart series helpers', () => {
  it('parses ordered series data, markers, smooth flag, and noFill lines', () => {
    const chartType = parseXml(`
      <c:lineChart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:ser>
          <c:order val="2"/>
          <c:tx><c:v>Line A</c:v></c:tx>
          <c:cat><c:strRef><c:strCache><c:ptCount val="1"/>
            <c:pt idx="0"><c:v>Q1</c:v></c:pt>
          </c:strCache></c:strRef></c:cat>
          <c:val><c:numRef><c:numCache><c:ptCount val="1"/>
            <c:pt idx="0"><c:v>42</c:v></c:pt>
          </c:numCache></c:numRef></c:val>
          <c:marker><c:symbol val="diamond"/><c:size val="6"/></c:marker>
          <c:smooth val="1"/>
          <c:spPr><a:ln><a:noFill/></a:ln></c:spPr>
        </c:ser>
      </c:lineChart>
    `);

    expect(parseSeries(chartType, createMockRenderContext())[0]).toMatchObject({
      name: 'Line A',
      order: 2,
      categories: ['Q1'],
      values: [42],
      markerSymbol: 'diamond',
      markerSize: 8,
      smooth: true,
      lineNoFill: true,
    });
  });

  it('parses series and point-level pie explosion values', () => {
    const series = parseXml(`
      <c:ser xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
        <c:explosion val="8"/>
        <c:dPt><c:idx val="1"/><c:explosion val="20"/></c:dPt>
      </c:ser>
    `);

    expect(parseExplosion(series, 3)).toEqual([8, 20, 8]);
  });
});
