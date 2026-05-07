// src/reporter/formatter.js

/**
 * 将错误对象中的 location 转为可读中文描述
 */
export function formatLocation(loc, paragraphs) {
  if (!loc) return '';

  const parts = [];

  if (loc.paragraphIndex !== undefined) {
    const para = paragraphs[loc.paragraphIndex];
    const paraNum = loc.paragraphIndex + 1;
    let preview = '';
    if (para && para.text) {
      const cleaned = para.text.replace(/\s/g, ' ').trim();
      preview = cleaned.length > 20 ? cleaned.substring(0, 20) + '…' : cleaned;
    }
    parts.push(`第${paraNum}段("${preview || '空段落'}")`);
  }

  const fieldMap = {
    'computedStyle.font': '字体',
    'computedStyle.fontSize': '字号',
    'computedStyle.lineSpacing': '行距',
    'computedStyle.alignment': '对齐方式',
    'computedStyle.indent.firstLine': '首行缩进',
    'computedStyle.indent': '缩进',
    'runs.bold': '加粗',
  };
  if (loc.field) {
    parts.push(`属性：${fieldMap[loc.field] || loc.field}`);
  }

  if (loc.runIndex !== undefined) {
    parts.push(`第${loc.runIndex + 1}个文字片段`);
  }

  if (loc.offset !== undefined) {
    parts.push(`第${loc.offset}个字符附近`);
  }

  if (loc.text) {
    parts.push(`相关文字："${loc.text}"`);
  }

  return parts.join('，');
}

/**
 * 将错误列表格式化为完整报告文本
 */
export function formatReport(errors, paragraphs, fileName) {
  const lines = [];
  lines.push(`检测时间：${new Date().toLocaleString('zh-CN')}`);
  lines.push(`检测文件：${fileName}`);
  lines.push(`共发现 ${errors.length} 个格式问题`);
  lines.push('');

  if (errors.length > 0) {
    errors.forEach((e, idx) => {
      lines.push(`${idx + 1}. [${e.type.toUpperCase()}] ${e.message}`);
      const friendlyLocation = formatLocation(e.location, paragraphs);
      if (friendlyLocation) {
        lines.push(`   📍 ${friendlyLocation}`);
      }
      lines.push('');
    });
  } else {
    lines.push('✅ 未发现格式问题，文档格式符合标准。');
  }

  return lines.join('\n');
}
