import { parseDocx } from '../src/parser/docx-parser.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '../', 'fixtures', '计算机应用技术_应用23304_吴澍_毕业设计成果报告6.docx');

let result;
function load() {
  if (!result) {
    throw new Error('fixture not loaded — run the suite, not this file directly');
  }
  return result;
}

describe('parseDocx 输出结构', () => {

  before(async () => {
    const buffer = readFileSync(filePath);
    result = await parseDocx(buffer);
  });
  it('返回对象包含 sections / paragraphs / tocMap / tocEntries / hasTOC', () => {
    const r = load();
    assert.ok(Array.isArray(r.sections));
    assert.ok(Array.isArray(r.paragraphs));
    assert.ok(r.paragraphs.length > 0);
    assert.equal(typeof r.hasTOC, 'boolean');
  });

  it('sections 包含页边距和页面大小', () => {
    const sect = load().sections[0];
    assert.ok(sect);
    assert.ok(sect.margins);
    assert.ok(sect.pageSize);
    assert.equal(sect.pageSize.orient, 'portrait');
  });

  it('paragraphs 每个元素包含 text / computedStyle / runs', () => {
    for (const p of load().paragraphs) {
      assert.equal(typeof p.text, 'string');
      assert.equal(typeof p.computedStyle, 'object');
      assert.ok(Array.isArray(p.runs));
    }
  });

  it('能正确解析封面和摘要段落的文本', () => {
    const texts = load().paragraphs.map(p => p.text);
    assert.ok(texts.includes('长沙环境保护职业技术学院'));
    assert.ok(texts.includes('毕业设计成果报告'));
    assert.ok(texts.some(t => t.startsWith('摘要')));
  });

  it('正文段落有字体和字号', () => {
    const bodyPara = load().paragraphs.find(p =>
      p.text.startsWith('随着互联网技术的快速发展')
    );
    assert.ok(bodyPara);
    assert.equal(bodyPara.computedStyle.font, '宋体');
    assert.equal(bodyPara.computedStyle.fontSize, '24');
  });

  it('正文段落有首行缩进', () => {
    const bodyPara = load().paragraphs.find(p =>
      p.text.startsWith('随着互联网技术的快速发展')
    );
    assert.ok(bodyPara);
    assert.equal(bodyPara.computedStyle.indent.firstLine, '480');
  });

  it('runs 包含 text / bold / italic / font / fontSize / color', () => {
    const para = load().paragraphs.find(p => p.runs.length > 0 && p.text === '摘要');
    assert.ok(para);
    const run = para.runs[0];
    assert.equal(run.text, '摘要');
    assert.equal(typeof run.bold, 'boolean');
    assert.equal(typeof run.italic, 'boolean');
    assert.equal(run.font, '宋体');
  });

  it('hasTOC 为 true 且 tocEntries 非空', () => {
    assert.equal(load().hasTOC, true);
    assert.ok(load().tocEntries.length > 0);
    assert.equal(load().tocEntries[0].level, 1);
  });

  it('tocMap 为 Map 类型且 tocEntries 每个元素含 originalText / cleanedText / level', () => {
    const { tocMap, tocEntries } = load();
    assert.ok(tocMap instanceof Map);
    assert.ok(tocEntries.length > 0);
    for (const e of tocEntries) {
      assert.equal(typeof e.originalText, 'string');
      assert.equal(typeof e.cleanedText, 'string');
      assert.ok(e.level >= 1 && e.level <= 3);
    }
  });

  it('目录段落 isTOC 标记正确', () => {
    const tocParas = load().paragraphs.filter(p => p.isTOC);
    assert.ok(tocParas.length > 0);
    for (const tp of tocParas) {
      assert.ok(tp.tocLevel >= 1 && tp.tocLevel <= 3);
    }
  });
});
