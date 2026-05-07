// src/parser/xml-reader.js
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,   // 去掉 w: 等前缀，简化后续操作
});

export async function readXML (buffer) {
  const zip = await JSZip.loadAsync(buffer);

  const documentXml = await zip.file('word/document.xml').async('string');
  const stylesXml = await zip.file('word/styles.xml')?.async('string') || '';

  const doc = parser.parse(documentXml);
  const styles = stylesXml ? parser.parse(stylesXml) : null;

  return { doc, styles };
}