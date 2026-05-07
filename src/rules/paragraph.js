// src/rules/paragraph.js

function cleanTitleText (text) {
  // 去掉前导数字、点、空格等，仅保留核心标题
  return text.replace(/^[\d\.\s\u00A0]+/, '').trim();
}

export function paragraphRule (paragraphs, config, sections, tocMap, skipAllTexts = [], captionIndices = new Set()) {
  const errors = [];
  const {
    headings,
    content,
    specialSections = [],
    skipIndentSections = [],
    skipIndentTexts = [],
    frontMatterTexts = [],
    headingTexts = {},
  } = config;

  // 辅助函数：确定段落的标题级别（以目录为准）
  const getHeadingLevel = (para) => {
    const cleaned = cleanTitleText(para.text);
    if (tocMap && tocMap.has(cleaned)) {
      return tocMap.get(cleaned);
    }
    const trimmed = para.text.trim();
    if (headingTexts[trimmed]) {
      return headingTexts[trimmed];
    }
    const collapsed = trimmed.replace(/\s+/g, '');
    if (headingTexts[collapsed]) {
      return headingTexts[collapsed];
    }
    if (para.styleId === '1') return 1;
    if (para.styleId === '2') return 2;
    if (para.styleId === '3') return 3;
    return 0;
  };

  let skipIndent = false;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.isTOC) continue;
    if (!para.text || para.text.trim() === '') continue;

    const text = para.text.trim();
    if (skipAllTexts.includes(text)) continue;

    const level = getHeadingLevel(para);
    const style = para.computedStyle || {};

    if (level === 1) {
      skipIndent = skipIndentSections.includes(text);
    }

    // ====== 标题格式检查 ======
    if (level >= 1 && level <= 3) {
      const std = headings[level];
      if (!std) continue;

      // 字体
      if (style.font && style.font !== std.font) {
        errors.push({
          type: 'error',
          message: `${level}级标题字体应为"${std.font}"，实际为"${style.font}"`,
          location: { paragraphIndex: i, field: 'computedStyle.font' }
        });
      }
      // 字号 (fontSize 字段值是半点数)
      if (style.fontSize != null && style.fontSize != std.fontSize) {
        errors.push({
          type: 'error',
          message: `${level}级标题字号应为${std.fontSize / 2}pt(${std.fontSize}半点)，实际为${style.fontSize / 2}pt(${style.fontSize}半点)`,
          location: { paragraphIndex: i, field: 'computedStyle.fontSize' }
        });
      }
      // 加粗
      const actualBold = style.bold || para.runs.some(r => r.bold);
      if (std.bold && !actualBold) {
        errors.push({
          type: 'error',
          message: `${level}级标题应为加粗`,
          location: { paragraphIndex: i, field: 'runs.bold' }
        });
      } else if (!std.bold && actualBold) {
        errors.push({
          type: 'error',
          message: `${level}级标题不应加粗`,
          location: { paragraphIndex: i, field: 'runs.bold' }
        });
      }
      continue; // 标题检查完跳出，不再检查正文格式
    }

    // ====== 正文内容检查（仅对非标题、非表格段落） ======
    // 跳过表格段落（若 isTable 为 true）
    if (para.isTable) continue;
    // 跳过图题段落，由 imageRule 单独检查
    if (captionIndices.has(i)) continue;

    // 全文字体颜色会在 runRule 中统一检查，这里不再重复

    // 检查字体（正文小四宋体）
    if (style.font && style.font !== content.font) {
      errors.push({
        type: 'error',
        message: `正文字体应为"${content.font}"，实际为"${style.font}"`,
        location: { paragraphIndex: i, field: 'computedStyle.font' }
      });
    }
    // 字号
    if (style.fontSize != null && style.fontSize != content.fontSize) {
      errors.push({
        type: 'error',
        message: `正文字号应为${content.fontSize / 2}pt，实际为${style.fontSize / 2}pt`,
        location: { paragraphIndex: i, field: 'computedStyle.fontSize' }
      });
    }
    // 行距（全文1.5倍，表格除外）
    if (style.lineSpacing != content.lineSpacing) {
      errors.push({
        type: 'error',
        message: style.lineSpacing != null
          ? `行距应为1.5倍行距(${content.lineSpacing}twips)，实际为${style.lineSpacing}twips`
          : `行距应为1.5倍行距(${content.lineSpacing}twips)，实际未设置`,
        location: { paragraphIndex: i, field: 'computedStyle.lineSpacing' }
      });
    }
    // 首行缩进：仅在非豁免区域检查，有特殊左缩进的段落（如列表段落）也跳过
    if (!skipIndent && !skipIndentTexts.some(t => text.startsWith(t))) {
      const indent = style.indent || {};
      if (indent.firstLine != null && indent.firstLine != content.firstLineIndent && !(indent.left && indent.left !== '0')) {
        errors.push({
          type: 'error',
          message: `正文首行缩进应为${content.firstLineIndent}twips，实际为${indent.firstLine}twips`,
          location: { paragraphIndex: i, field: 'computedStyle.indent.firstLine' }
        });
      }
    }
  }

  return errors;
}