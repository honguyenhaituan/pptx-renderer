import { SafeXmlNode } from '../../parser/XmlParser';
import { parseOoxmlBool } from '../../parser/booleans';
import { cssFontFamilyStack, resolveThemeFontStack } from '../fontResolver';
import { RenderContext } from '../RenderContext';
import { resolveColorToHex } from './style';
import { EXPLICIT_FONT_SIZE, type ChartTextStyle } from './types';

export function extractTitleText(title: SafeXmlNode): string | undefined {
  const tx = title.child('tx');
  if (!tx.exists()) return undefined;

  const rich = tx.child('rich');
  if (rich.exists()) {
    const paragraphs: string[] = [];
    for (const p of rich.children('p')) {
      const parts: string[] = [];
      for (const child of p.allChildren()) {
        if (child.localName === 'br') {
          parts.push('\n');
          continue;
        }
        if (child.localName !== 'r' && child.localName !== 'fld') {
          continue;
        }
        const t = child.child('t').text();
        if (t) parts.push(t);
      }
      const paragraph = parts.join('');
      if (paragraph) paragraphs.push(paragraph);
    }
    if (paragraphs.length > 0) return paragraphs.join('\n');
  }

  const strRef = tx.child('strRef');
  if (strRef.exists()) {
    const strCache = strRef.child('strCache');
    const pts = strCache.children('pt');
    if (pts.length > 0) return pts[0].child('v').text();
  }

  return undefined;
}

export function extractTxPrColor(parentNode: SafeXmlNode, ctx: RenderContext): string | undefined {
  const txPr = parentNode.child('txPr');
  if (!txPr.exists()) return undefined;
  for (const p of txPr.children('p')) {
    const pPr = p.child('pPr');
    if (!pPr.exists()) continue;
    const defRPr = pPr.child('defRPr');
    if (!defRPr.exists()) continue;
    const fill = defRPr.child('solidFill');
    if (fill.exists()) {
      return resolveColorToHex(fill, ctx);
    }
  }
  return undefined;
}

export function extractDefRPrStyle(
  defRPr: SafeXmlNode,
  ctx: RenderContext,
): ChartTextStyle | undefined {
  if (!defRPr.exists()) return undefined;

  const style: ChartTextStyle = {};
  const fill = defRPr.child('solidFill');
  if (fill.exists()) {
    const c = resolveColorToHex(fill, ctx);
    if (c) style.color = c;
  }
  const sz = defRPr.numAttr('sz');
  if (sz !== undefined && sz > 0) {
    style.fontSize = Math.round(sz / 100);
    style[EXPLICIT_FONT_SIZE] = true;
  }
  const b = defRPr.attr('b');
  if (b !== undefined) style.bold = parseOoxmlBool(b);
  const latinTypeface = defRPr.child('latin').attr('typeface');
  const eaTypeface = defRPr.child('ea').attr('typeface');
  const csTypeface = defRPr.child('cs').attr('typeface');
  const fontStack = resolveThemeFontStack([latinTypeface, eaTypeface, csTypeface], ctx, [
    defRPr.attr('lang'),
    defRPr.attr('altLang'),
  ]);
  if (fontStack.length > 0) {
    style.fontFamily = cssFontFamilyStack(fontStack);
  }

  return style.color ||
    style.fontSize !== undefined ||
    style.bold !== undefined ||
    style.fontFamily !== undefined
    ? style
    : undefined;
}

export function extractParagraphTextStyle(
  parentNode: SafeXmlNode,
  ctx: RenderContext,
): ChartTextStyle | undefined {
  for (const p of parentNode.children('p')) {
    const pPr = p.child('pPr');
    if (!pPr.exists()) continue;
    const defRPr = pPr.child('defRPr');
    const style = extractDefRPrStyle(defRPr, ctx);
    if (style) return style;
  }
  return undefined;
}

export function extractTxPrStyle(
  parentNode: SafeXmlNode,
  ctx: RenderContext,
): ChartTextStyle | undefined {
  const txPr = parentNode.child('txPr');
  if (!txPr.exists()) return undefined;
  return extractParagraphTextStyle(txPr, ctx);
}

export function extractTitleTextStyle(
  title: SafeXmlNode,
  ctx: RenderContext,
): ChartTextStyle | undefined {
  return (
    extractTxPrStyle(title, ctx) ?? extractParagraphTextStyle(title.child('tx').child('rich'), ctx)
  );
}

export function getChartThemeFontFamily(ctx: RenderContext): string | undefined {
  const fontStack = resolveThemeFontStack(['+mn-lt', '+mn-ea', '+mj-lt', '+mj-ea'], ctx);
  return fontStack.length > 0 ? cssFontFamilyStack(fontStack) : undefined;
}
