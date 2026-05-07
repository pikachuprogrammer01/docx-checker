// src/parser/utils.js

/**
 * 提取段落属性节点中的核心属性
 */
export function extractParagraphProps (pPrNode) {
  if (!pPrNode) return {};
  const props = {};

  if (pPrNode.jc) props.alignment = pPrNode.jc['@_val'];

  if (pPrNode.spacing) {
    props.lineSpacing = pPrNode.spacing['@_line'];
    props.lineRule = pPrNode.spacing['@_lineRule'];
  }

  if (pPrNode.ind) {
    props.indent = {
      left: pPrNode.ind['@_left'],
      right: pPrNode.ind['@_right'],
      firstLine: pPrNode.ind['@_firstLine'],
    };
  }

  // 分页
  if (pPrNode.pageBreakBefore !== undefined) props.pageBreakBefore = true;
  // 分节符（在 Word 中同样引起分页）
  if (pPrNode.sectPr !== undefined) props.hasSectPr = true;

  return props;
}

/**
 * 提取运行属性节点中的字体、字号等
 */
export function extractRunProps (rPrNode) {
  if (!rPrNode) return {};
  const props = {};

  if (rPrNode.rFonts) {
    const rFonts = rPrNode.rFonts;
    props.font = rFonts['@_eastAsia'] || rFonts['@_ascii'];
    props.fontAscii = rFonts['@_ascii'] || rFonts['@_hAnsi'] || rFonts['@_eastAsia'];
    props.fontEastAsia = rFonts['@_eastAsia'] || rFonts['@_ascii'];
  }
  if (rPrNode.sz) props.fontSize = rPrNode.sz['@_val'];
  if (rPrNode.szCs) props.fontSizeCs = rPrNode.szCs['@_val'];

  const hasB = rPrNode.b !== undefined;
  if (hasB) {
    props.bold = rPrNode.b['@_val'] !== '0' && rPrNode.b['@_val'] !== 'false';
  }
  const hasI = rPrNode.i !== undefined;
  if (hasI) {
    props.italic = rPrNode.i['@_val'] !== '0' && rPrNode.i['@_val'] !== 'false';
  }
  const hasU = rPrNode.u !== undefined;
  if (hasU) {
    props.underline = rPrNode.u['@_val'] !== 'none';
  }
  if (rPrNode.color) props.color = rPrNode.color['@_val'];

  return props;
}

/**
 * 样式合并：后面的覆盖前面的，对象类型浅合并
 */
export function mergeStyles (...styles) {
  return styles.reduce((acc, style) => {
    if (!style) return acc;
    Object.entries(style).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object' && !Array.isArray(value)) {
        acc[key] = { ...acc[key], ...value };
      } else {
        acc[key] = value;
      }
    });
    return acc;
  }, {});
}

/** 简单取属性值 */
export function getAttr (node, attr) {
  return node?.['@_' + attr];
}