// src/rules/image.js
export function imageRule (paragraphs, config, skipAllTexts = []) {
  const errors = [];
  const { imageCaption } = config;
  const nonTOCParagraphs = paragraphs.filter(p => !p.isTOC);

  for (let i = 0; i < nonTOCParagraphs.length; i++) {
    const para = nonTOCParagraphs[i];
    if (skipAllTexts.includes(para.text.trim())) continue;
    if (para.isTOC) continue;
    // 如果该段落包含图片 — 图片段落可能无文本，需在空文本判断前检查
    if (para.containsImage) {
      // 检查图片对齐（段落居中判断：computedStyle.alignment 应为 'center'）
      const align = para.computedStyle?.alignment;
      if (align !== 'center') {
        errors.push({
          type: 'error',
          message: '图片所在的段落应居中',
          location: { paragraphIndex: i }
        });
      }
      // 检查下一段是否图题
      const nextPara = nonTOCParagraphs[i + 1];
      if (nextPara && isImageCaption(nextPara.text)) {
        const capStyle = nextPara.computedStyle || {};
        // 整体对齐
        if (capStyle.alignment !== 'center') {
          errors.push({ type: 'error', message: '图题应居中', location: { paragraphIndex: i + 1 } });
        }

        // 遍历 runs 检查字体和加粗
        for (let rIdx = 0; rIdx < nextPara.runs.length; rIdx++) {
          const run = nextPara.runs[rIdx];
          if (!run.text || run.text.trim() === '') continue;

          // 判断是纯数字/小数点/空格 还是汉字
          const isNumberRun = /^[\d\.\s]+$/.test(run.text);
          if (isNumberRun) {
            if (run.font !== imageCaption.numberFont || run.fontSize != imageCaption.numberSize) {
              errors.push({
                type: 'error',
                message: `图题数字部分应为 Times New Roman ${imageCaption.numberSize / 2}pt 加粗`,
                location: { paragraphIndex: i + 1, runIndex: rIdx, text: run.text }
              });
            }
            if (!run.bold) {
              errors.push({
                type: 'error', message: '图题数字部分应加粗',
                location: { paragraphIndex: i + 1, runIndex: rIdx, text: run.text }
              });
            }
          } else {
            // 汉字部分
            if (run.font !== imageCaption.font || run.fontSize != imageCaption.fontSize) {
              errors.push({
                type: 'error',
                message: `图题文字应为宋体小五号加粗`,
                location: { paragraphIndex: i + 1, runIndex: rIdx, text: run.text }
              });
            }
            if (!run.bold) {
              errors.push({
                type: 'error', message: '图题文字应加粗',
                location: { paragraphIndex: i + 1, runIndex: rIdx, text: run.text }
              });
            }
          }
        }
      }
    }
    if (!para.text || para.text.trim() === '') continue; // 非图片的空段落跳过
  }
  return errors;
}

function isImageCaption (text) {
  return /^图\d+(\.\d+)?\s/.test(text);
}