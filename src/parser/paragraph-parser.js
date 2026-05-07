// src/parser/paragraph-parser.js
import { extractParagraphProps, extractRunProps, mergeStyles } from './utils.js';

function cleanTitleText (text) {
  // 去掉前导数字、点、空格等，仅保留核心标题
  return text.replace(/^[\d\.\s\u00A0]+/, '').trim();
}

export function parseParagraphs (doc, styleMap) {
  const body = doc.document?.body;
  if (!body) return { paragraphs: [], tocMap: null, hasTOC: false };

  const paragraphs = [];
  const tocEntries = [];
  const blockNodes = getBlockElements(body);

  for (const block of blockNodes) {
    if (block.type === 'paragraph') {
      const para = parseSingleParagraph(block.node, styleMap, false);
      paragraphs.push(para);

      if (para.isTOC) {
        const rawText = para.text.trim();
        tocEntries.push({
          originalText: rawText,           // 保留完整编号，如 "1.1 网站开发的目的与意义"
          cleanedText: cleanTitleText(rawText),  // 供匹配用，如 "网站开发的目的与意义"
          level: para.tocLevel,
        });
      }
    } else if (block.type === 'table') {
      const tableParas = parseTableParagraphs(block.node, styleMap);
      paragraphs.push(...tableParas);
    }
  }

  // 分节符后的段落视为有分页
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i - 1].hasSectPr) {
      paragraphs[i].pageBreakBefore = true;
    }
  }

  const tocMap = tocEntries.length > 0
    ? new Map(tocEntries.map(e => [e.cleanedText, e.level]))
    : null;

  return {
    paragraphs,
    tocMap,
    tocEntries,
    hasTOC: tocEntries.length > 0
  };
}

// 递归提取，但避免进入表格内部
function extractBlocksFromNode (node, blocks) {
  if (!node || typeof node !== 'object') return;
  const keys = Object.keys(node);
  for (const key of keys) {
    if (key.startsWith('@_') || key === '#text') continue;
    const items = [].concat(node[key] || []);
    for (const item of items) {
      if (key === 'p') {
        blocks.push({ type: 'paragraph', node: item });
      } else if (key === 'tbl') {
        blocks.push({ type: 'table', node: item });
        // 不递归表格内部，交给 parseTableParagraphs 处理
      } else if (key === 'sdt' || key === 'customXml') {
        extractBlocksFromNode(item, blocks);  // 继续深入容器
      } else if (typeof item === 'object' && key !== 'tr' && key !== 'tc') {
        // 其他未知容器也递归，但跳过表格的行/单元格，避免重复
        extractBlocksFromNode(item, blocks);
      }
    }
  }
}

function getBlockElements (body) {
  const blocks = [];
  extractBlocksFromNode(body, blocks);
  return blocks;
}

function parseSingleParagraph (pNode, styleMap, isTable) {
  const pPr = pNode.pPr || {};
  const styleId = pPr.pStyle?.['@_val'];

  const paraStyle = styleMap.paragraphStyles[styleId] || {};
  const paraCustomProps = extractParagraphProps(pPr);
  const mergedParaStyle = mergeStyles(
    extractParagraphProps(styleMap.docDefaults.pPr),
    extractParagraphProps(paraStyle.pPr),
    paraCustomProps
  );

  const styleName = paraStyle.name?.toLowerCase() || '';
  const isTOC = styleName.startsWith('toc') || styleName.includes('目录');
  let tocLevel = 0;
  if (isTOC) {
    const match = styleName.match(/\d+/);
    tocLevel = match ? parseInt(match[0], 10) : 0;
  }

  let outlineLevel = parseInt(pPr.outlineLvl?.['@_val'], 10) || 0;
  if (outlineLevel === 0) outlineLevel = paraStyle.outlineLevel || 0;

  const pageBreakBefore = !!(pPr.pageBreakBefore !== undefined || mergedParaStyle.pageBreakBefore);
  const hasSectPr = !!(pPr.sectPr !== undefined || mergedParaStyle.hasSectPr);

  const baseRunStyle = mergeStyles(
    extractRunProps(styleMap.docDefaults.rPr),
    extractRunProps(paraStyle.rPr)
  );

  let containsImage = false;
  const runs = [];
  const runNodes = [].concat(pNode.r || []);
  let wholeText = '';

  for (const rNode of runNodes) {
    // 检查图片
    if (rNode.drawing || rNode.pict) {
      containsImage = true;
      continue;  // 图片 run 通常无文本
    }

    // 提取文本（不跳过任何 run，除非是纯分隔符）
    const text = extractText(rNode);
    if (text === '') continue;  // 没有文本的 run 直接跳过

    wholeText += text;

    // 提取样式（只处理有文本的 run）
    const rPr = rNode.rPr || {};
    const runStyleId = rPr.rStyle?.['@_val'];
    const charStyle = extractRunProps(styleMap.characterStyles[runStyleId]?.rPr);

    const runStyle = mergeStyles(
      baseRunStyle,
      charStyle,
      extractRunProps(rPr)
    );

    runs.push({
      text,
      bold: runStyle.bold || false,
      italic: runStyle.italic || false,
      underline: runStyle.underline || false,
      font: runStyle.font,
      fontAscii: runStyle.fontAscii,
      fontSize: runStyle.fontSize || runStyle.fontSizeCs,
      color: runStyle.color,
    });
  }

  // 段落级加粗：合并样式中的运行属性可能设置加粗
  const paraBold = !!(mergedParaStyle.bold || baseRunStyle.bold); // baseRunStyle 也包含了 rPr 合并

  const representativeRun = runs.find(r => r.font || r.fontSize) || {};
  const computedStyle = {
    font: representativeRun.font || mergedParaStyle.font,
    fontAscii: representativeRun.fontAscii || mergedParaStyle.fontAscii,
    fontSize: representativeRun.fontSize || mergedParaStyle.fontSize || mergedParaStyle.fontSizeCs,
    lineSpacing: mergedParaStyle.lineSpacing,
    lineRule: mergedParaStyle.lineRule,
    alignment: mergedParaStyle.alignment,
    indent: mergedParaStyle.indent,
    bold: paraBold,
  };

  return {
    text: wholeText.trim(),
    computedStyle,
    runs,
    styleId,
    outlineLevel,
    pageBreakBefore,
    containsImage,
    isTable,
    isTOC,
    tocLevel,
    hasSectPr,
  };
}

function parseTableParagraphs (tblNode, styleMap) {
  const paragraphs = [];
  const rows = [].concat(tblNode.tr || []);
  for (const row of rows) {
    const cells = [].concat(row.tc || []);
    for (const cell of cells) {
      const paras = [].concat(cell.p || []);
      for (const pNode of paras) {
        const para = parseSingleParagraph(pNode, styleMap, true);
        paragraphs.push(para);
      }
    }
  }
  return paragraphs;
}

function extractText (rNode) {
  const tNodes = [].concat(rNode.t || []);
  return tNodes.map(t => (typeof t === 'string' ? t : t['#text'] || '')).join('');
}