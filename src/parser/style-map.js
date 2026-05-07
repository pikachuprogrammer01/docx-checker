// src/parser/style-map.js
import { getAttr, mergeStyles } from './utils.js';

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

  // 第一遍：收集所有样式，记录 basedOn
  const styleNodes = [].concat(styles.styles.style || []);
  for (const node of styleNodes) {
    const id = getAttr(node, 'styleId');
    const type = getAttr(node, 'type');

    if (type === 'paragraph') {
      const nameNode = node.name;
      const nameAttr = nameNode ? nameNode['@_val'] : '';

      map.paragraphStyles[id] = {
        pPr: node.pPr || {},
        rPr: node.rPr || {},
        outlineLevel: parseInt(getAttr(node.pPr?.outlineLvl, 'val') || '0', 10),
        name: nameAttr.toLowerCase(),
        _basedOn: getAttr(node.basedOn, 'val'),
      };
    } else if (type === 'character') {
      map.characterStyles[id] = {
        rPr: node.rPr || {},
        _basedOn: getAttr(node.basedOn, 'val'),
      };
    }
  }

  // 第二遍：解析 basedOn 继承链
  for (const id of Object.keys(map.paragraphStyles)) {
    resolveBasedOn(id, map.paragraphStyles);
  }
  for (const id of Object.keys(map.characterStyles)) {
    resolveBasedOn(id, map.characterStyles);
  }

  return map;
}

function resolveBasedOn (id, styles, visited = new Set()) {
  const style = styles[id];
  if (!style || style._resolved) return;
  if (visited.has(id)) return; // 防止循环引用
  visited.add(id);

  const parentId = style._basedOn;
  if (parentId) {
    resolveBasedOn(parentId, styles, visited);
    const parent = styles[parentId];
    if (parent) {
      style.pPr = mergeStyles(parent.pPr, style.pPr);
      style.rPr = mergeStyles(parent.rPr, style.rPr);
      // 子样式的 outlineLevel 优先，父的作为 fallback
      if (!style.outlineLevel && parent.outlineLevel) {
        style.outlineLevel = parent.outlineLevel;
      }
    }
  }

  style._resolved = true;
}