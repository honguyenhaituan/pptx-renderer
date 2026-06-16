import { describe, expect, it } from 'vitest';
import { parseOoxmlBoolElement, parseOoxmlBoolValue } from '../../../../src/renderer/chart/ooxml';
import { parseXml } from '../../../../src/parser/XmlParser';

describe('chart OOXML helpers', () => {
  it('treats present boolean elements as true unless val is false-like', () => {
    expect(parseOoxmlBoolElement(parseXml('<showVal/>'))).toBe(true);
    expect(parseOoxmlBoolElement(parseXml('<showVal val="0"/>'))).toBe(false);
    expect(parseOoxmlBoolElement(parseXml('<showVal val="false"/>'))).toBe(false);
  });

  it('uses the supplied default for missing boolean values', () => {
    expect(parseOoxmlBoolValue(undefined, true)).toBe(true);
    expect(parseOoxmlBoolValue(undefined, false)).toBe(false);
  });
});
