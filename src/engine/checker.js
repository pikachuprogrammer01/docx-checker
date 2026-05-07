// src/engine/checker.js
import { paragraphRule } from '../rules/paragraph.js';
import { runRule } from '../rules/run.js';
import { imageRule } from '../rules/image.js';
import { logoRule } from '../rules/logo.js';
import { specialRule } from '../rules/special.js';

/**
 * 主检查函数：以标准配置逐条检查解析后的文档
 * @param {Object} parsedDoc - { sections, paragraphs, tocMap, hasTOC }
 * @param {Object} standard - 标准配置
 * @returns {Array} Error[]
 */
export function checkDocument(parsedDoc, standard) {
  const { paragraphs, sections, tocMap } = parsedDoc;
  const errors = [];

  const skipAllTexts = standard.frontMatterTexts || [];

  errors.push(...paragraphRule(paragraphs, standard, sections, tocMap, skipAllTexts));
  errors.push(...runRule(paragraphs, standard, skipAllTexts));
  errors.push(...imageRule(paragraphs, standard, skipAllTexts));
  errors.push(...logoRule(paragraphs, standard, skipAllTexts));
  errors.push(...specialRule(paragraphs, standard, skipAllTexts));

  return errors;
}
