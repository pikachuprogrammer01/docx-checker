// src/rules/special.js
export function specialRule (paragraphs, config, skipAllTexts = []) {
  const errors = [];
  const specialTitles = config.specialSections || [];
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.isTOC) continue;
    if (skipAllTexts.includes(para.text.trim())) continue;

    const text = para.text.trim();
    if (specialTitles.includes(text)) {
      // 检查段前是否分页
      if (para.pageBreakBefore === false) {
        errors.push({
          type: 'error',
          message: `“${text}”之前应分页`,
          location: { paragraphIndex: i }
        });
      }
      // 检查居中
      if (para.computedStyle?.alignment !== 'center') {
        errors.push({
          type: 'error',
          message: `“${text}”应居中`,
          location: { paragraphIndex: i }
        });
      }
      // 如果该段落是标题，还可以检查是否一级标题格式（暂略）
    }
  }
  return errors;
}