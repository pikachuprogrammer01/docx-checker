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
  if (pPrNode.pageBreakBefore) props.pageBreakBefore = true;

  return props;
}

/**
 * 提取运行属性节点中的字体、字号等
 */
export function extractRunProps (rPrNode) {
  if (!rPrNode) return {};
  const props = {};

  if (rPrNode.rFonts) {
    props.font = rPrNode.rFonts['@_eastAsia'] || rPrNode.rFonts['@_ascii'];
  }
  if (rPrNode.sz) props.fontSize = rPrNode.sz['@_val'];
  if (rPrNode.szCs) props.fontSizeCs = rPrNode.szCs['@_val'];

  props.bold = rPrNode.b && rPrNode.b['@_val'] !== '0' && rPrNode.b['@_val'] !== 'false';
  props.italic = rPrNode.i && rPrNode.i['@_val'] !== '0' && rPrNode.i['@_val'] !== 'false';
  props.underline = rPrNode.u && rPrNode.u['@_val'] !== 'none';
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