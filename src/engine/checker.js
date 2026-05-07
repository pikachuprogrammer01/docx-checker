// src/engine/checker.js
import { paragraphRule } from '../rules/paragraph.js';
import { runRule } from '../rules/run.js';
import { imageRule, isImageCaption } from '../rules/image.js';
import { logoRule } from '../rules/logo.js';
import { specialRule } from '../rules/special.js';

export function checkDocument(parsedDoc, standard) {
  const { paragraphs, sections, tocMap } = parsedDoc;
  const errors = [];

  const skipAllTexts = standard.frontMatterTexts || [];

  const captionIndices = new Set();
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].isTOC) continue;
    if (paragraphs[i].containsImage) {
      const next = paragraphs[i + 1];
      if (next && isImageCaption(next.text)) {
        captionIndices.add(i + 1);
      }
    }
  }

  errors.push(...paragraphRule(paragraphs, standard, sections, tocMap, skipAllTexts, captionIndices));
  errors.push(...runRule(paragraphs, standard, skipAllTexts));
  errors.push(...imageRule(paragraphs, standard, skipAllTexts));
  errors.push(...logoRule(paragraphs, standard, skipAllTexts));
  errors.push(...specialRule(paragraphs, standard, skipAllTexts));

  return errors;
}
