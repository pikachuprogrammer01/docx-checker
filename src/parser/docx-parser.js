// src/parser/docx-parser.js
import { readXML } from './xml-reader.js';
import { buildStyleMap } from './style-map.js';
import { extractSections } from './section-parser.js';
import { parseParagraphs } from './paragraph-parser.js';

export async function parseDocx (buffer) {
  // 1. 读取并解析 XML
  const { doc, styles } = await readXML(buffer);

  // 2. 构建样式映射表
  const styleMap = buildStyleMap(styles);

  // 3. 提取节属性（页面设置）
  const sections = extractSections(doc);

  // 4. 解析段落并完成样式继承
  const { paragraphs, tocMap, tocEntries, hasTOC } = parseParagraphs(doc, styleMap);

  return {
    sections,
    paragraphs,
    tocMap,
    tocEntries,
    hasTOC,
  };
}