// src/rules/logo.js
export function logoRule (paragraphs, config, skipAllTexts = []) {
  const errors = [];
  const pattern = config.logoTextPattern || 'LOGO';
  const nonTOCParagraphs = paragraphs.filter(p => !p.isTOC);
  for (let i = 0; i < nonTOCParagraphs.length; i++) {
    const para = nonTOCParagraphs[i];
    if (skipAllTexts.includes(para.text.trim())) continue;

    const fullText = para.text;
    // 找出所有出现 pattern 的位置（不区分大小写）
    const regex = new RegExp(pattern, 'gi');
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      if (match[0] !== pattern.toUpperCase()) {
        errors.push({
          type: 'error',
          message: `"${match[0]}" 应全部大写为"${pattern.toUpperCase()}"`,
          location: { paragraphIndex: i, offset: match.index }
        });
      }
    }
  }
  return errors;
}