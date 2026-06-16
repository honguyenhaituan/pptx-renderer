import { describe, expect, it } from 'vitest';
import { extractBackgroundColors, extractChartFrameStyle } from '../../../../src/renderer/chart/frame';
import { parseXml } from '../../../../src/parser/XmlParser';
import { createMockRenderContext } from '../../helpers/mockContext';

describe('chart frame helpers', () => {
  it('extracts chart and plot area background colors', () => {
    const chart = parseXml(`
      <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></c:spPr>
        <c:chart>
          <c:plotArea><c:spPr><a:solidFill><a:srgbClr val="EEEEEE"/></a:solidFill></c:spPr></c:plotArea>
        </c:chart>
      </c:chartSpace>
    `);

    expect(extractBackgroundColors(chart, chart.child('chart'), createMockRenderContext())).toEqual({
      chartBg: '#FFFFFF',
      plotAreaBg: '#EEEEEE',
    });
  });

  it('extracts chart frame outline style', () => {
    const chart = parseXml(`
      <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:spPr><a:ln w="12700"><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></a:ln></c:spPr>
      </c:chartSpace>
    `);

    expect(extractChartFrameStyle(chart, createMockRenderContext())).toMatchObject({
      borderColor: '#FF0000',
      borderWidth: expect.any(Number),
      borderStyle: 'solid',
    });
  });
});
