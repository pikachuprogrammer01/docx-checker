// src/parser/style-map.js
import { getAttr } from './utils.js';

export function buildStyleMap (styles) {
  const map = {
    docDefaults: { pPr: {}, rPr: {} },
    paragraphStyles: {},
    characterStyles: {},
  };

  if (!styles?.styles) return map;

  // docDefaults
  const defaults = styles.styles.docDefaults;
  if (defaults) {
    if (defaults.pPrDefault?.pPr) map.docDefaults.pPr = defaults.pPrDefault.pPr;
    if (defaults.rPrDefault?.rPr) map.docDefaults.rPr = defaults.rPrDefault.rPr;
  }

  // 遍历样式
  const styleNodes = [].concat(styles.styles.style || []);
  for (const node of styleNodes) {
    const id = getAttr(node, 'styleId');
    const type = getAttr(node, 'type');

    if (type === 'paragraph') {
      const nameNode = node.name;
      const nameAttr = nameNode ? nameNode['@_val'] : '';  // 这里声明 nameAttr

      map.paragraphStyles[id] = {
        pPr: node.pPr || {},
        rPr: node.rPr || {},
        outlineLevel: parseInt(getAttr(node.pPr?.outlineLvl, 'val') || '0', 10),
        name: nameAttr.toLowerCase(),  // 保存样式名称，便于后续判断 "toc"
      };
    } else if (type === 'character') {
      map.characterStyles[id] = {
        rPr: node.rPr || {},
      };
    }
  }

  return map;
}