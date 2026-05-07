// src/rules/run.js
export function runRule (paragraphs, config, skipAllTexts = []) {
  const errors = [];
  const contentColor = config.content.color; // "000000"
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.isTOC) continue;
    if (skipAllTexts.includes(para.text.trim())) continue;
    for (let j = 0; j < para.runs.length; j++) {
      const run = para.runs[j];
      // 如果 run 明确有颜色且不为黑色，报错
      if (run.color && run.color !== contentColor && run.color !== 'auto') {
        errors.push({
          type: 'error',
          message: `文字颜色应为黑色(000000)，实际为${run.color}`,
          location: { paragraphIndex: i, runIndex: j, text: run.text }
        });
      }
    }
  }
  return errors;
}