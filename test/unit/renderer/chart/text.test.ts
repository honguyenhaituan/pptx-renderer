import { describe, expect, it } from 'vitest';
import { extractTitleText, extractTxPrStyle } from '../../../../src/renderer/chart/text';
import { parseXml } from '../../../../src/parser/XmlParser';
import { createMockRenderContext } from '../../helpers/mockContext';

describe('chart text helpers', () => {
  it('extracts rich title text across runs, fields, breaks, and paragraphs', () => {
    const title = parseXml(`
      <c:title xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:tx>
          <c:rich>
            <a:p>
              <a:r><a:t>Revenue</a:t></a:r>
              <a:br/>
              <a:fld><a:t>FY26</a:t></a:fld>
            </a:p>
            <a:p><a:r><a:t>Plan</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
    `);

    expect(extractTitleText(title)).toBe('Revenue\nFY26\nPlan');
  });

  it('extracts color, explicit font size, bold flag, and font family from txPr', () => {
    const node = parseXml(`
      <c:legend xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"
        xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:txPr>
          <a:p>
            <a:pPr>
              <a:defRPr sz="1400" b="1">
                <a:solidFill><a:srgbClr val="336699"/></a:solidFill>
                <a:latin typeface="Arial"/>
              </a:defRPr>
            </a:pPr>
          </a:p>
        </c:txPr>
      </c:legend>
    `);

    expect(extractTxPrStyle(node, createMockRenderContext())).toMatchObject({
      color: '#336699',
      fontSize: 14,
      bold: true,
      fontFamily: expect.stringContaining('Arial'),
    });
  });
});
