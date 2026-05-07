import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { paragraphRule } from '../src/rules/paragraph.js';
import { runRule } from '../src/rules/run.js';
import { imageRule } from '../src/rules/image.js';
import { logoRule } from '../src/rules/logo.js';
import { specialRule } from '../src/rules/special.js';
import { parseDocx } from '../src/parser/docx-parser.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ========= 标准配置 =========
const standard = {
  headings: {
    1: { font: '宋体', fontSize: 28, bold: true, color: '000000' },
    2: { font: '宋体', fontSize: 24, bold: true, color: '000000' },
    3: { font: '宋体', fontSize: 24, bold: false, color: '000000' },
  },
  content: {
    font: '宋体',
    fontSize: 24,
    firstLineIndent: 480,
    lineSpacing: 360,
    color: '000000',
  },
  imageCaption: {
    font: '宋体',
    fontSize: 18,
    bold: true,
    numberFont: 'Times New Roman',
    numberSize: 18,
    centered: true,
    color: '000000',
  },
  specialSections: ['参考文献', '致谢'],
  skipIndentSections: ['参考文献'],
  logoTextPattern: 'LOGO',
  frontMatterTexts: ['长沙环境保护职业技术学院'],
  skipIndentTexts: ['关键词：'],
};

// ========= 辅助：构造 mock 段落 =========
function mockPara(overrides = {}) {
  return {
    text: '测试段落',
    computedStyle: {},
    runs: [],
    styleId: undefined,
    outlineLevel: 0,
    pageBreakBefore: false,
    containsImage: false,
    isTable: false,
    isTOC: false,
    tocLevel: 0,
    ...overrides,
  };
}

function mockRun(overrides = {}) {
  return {
    text: '测试文字',
    bold: false,
    italic: false,
    underline: false,
    font: undefined,
    fontSize: undefined,
    color: undefined,
    ...overrides,
  };
}

// ========= paragraphRule =========
describe('paragraphRule', () => {
  it('1级标题字体不符合标准时报错', () => {
    const para = mockPara({
      text: '概述',
      styleId: '1',
      computedStyle: { font: '黑体', fontSize: 28 },
      runs: [{ text: '概述', bold: true, font: '黑体', fontSize: '28' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const fontErr = errors.find(e => e.message.includes('字体'));
    assert.ok(fontErr);
    assert.equal(fontErr.type, 'error');
    assert.equal(fontErr.location.paragraphIndex, 0);
  });

  it('1级标题字号不符合标准时报错', () => {
    const para = mockPara({
      text: '概述',
      styleId: '1',
      computedStyle: { font: '宋体', fontSize: 24 },
      runs: [{ text: '概述', bold: true, font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const sizeErr = errors.find(e => e.message.includes('字号'));
    assert.ok(sizeErr);
  });

  it('1级标题缺少加粗时报错', () => {
    const para = mockPara({
      text: '概述',
      styleId: '1',
      computedStyle: { font: '宋体', fontSize: 28, bold: false },
      runs: [{ text: '概述', bold: false, font: '宋体', fontSize: '28' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const boldErr = errors.find(e => e.message.includes('加粗'));
    assert.ok(boldErr);
  });

  it('2级标题不加粗时报错', () => {
    const para = mockPara({
      text: '需求分析',
      styleId: '2',
      computedStyle: { font: '宋体', fontSize: 24, bold: false },
      runs: [{ text: '需求分析', bold: false, font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const boldErr = errors.find(e => e.message.includes('加粗'));
    assert.ok(boldErr);
  });

  it('3级标题不应加粗，加粗时报错', () => {
    const para = mockPara({
      text: '三级标题',
      styleId: '3',
      computedStyle: { font: '宋体', fontSize: 24, bold: false },
      runs: [{ text: '三级标题', bold: true, font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const boldErr = errors.find(e => e.message.includes('不应加粗'));
    assert.ok(boldErr);
  });

  it('正文字体错误时报错', () => {
    const para = mockPara({
      text: '正文内容测试',
      computedStyle: { font: '黑体', fontSize: 24 },
      runs: [{ text: '正文内容测试', font: '黑体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const fontErr = errors.find(e => e.message.includes('正文字体'));
    assert.ok(fontErr);
  });

  it('正文字号错误时报错', () => {
    const para = mockPara({
      text: '正文内容测试',
      computedStyle: { font: '宋体', fontSize: 20 },
      runs: [{ text: '正文内容测试', font: '宋体', fontSize: '20' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const sizeErr = errors.find(e => e.message.includes('正文字号'));
    assert.ok(sizeErr);
  });

  it('正文行距错误时报错', () => {
    const para = mockPara({
      text: '正文内容测试',
      computedStyle: { font: '宋体', fontSize: 24, lineSpacing: 288 },
      runs: [{ text: '正文内容测试', font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const lineErr = errors.find(e => e.message.includes('行距'));
    assert.ok(lineErr);
  });

  it('首行缩进错误时报错', () => {
    const para = mockPara({
      text: '正文内容测试',
      computedStyle: {
        font: '宋体', fontSize: 24, lineSpacing: 360,
        indent: { firstLine: 240 },
      },
      runs: [{ text: '正文内容测试', font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const indentErr = errors.find(e => e.message.includes('首行缩进'));
    assert.ok(indentErr);
  });

  it('关键词段落豁免首行缩进检查', () => {
    const para = mockPara({
      text: '关键词：Vue；Element Plus；',
      computedStyle: {
        font: '宋体', fontSize: 24, lineSpacing: 360,
        indent: { firstLine: 0 },
      },
      runs: [{ text: '关键词：Vue；Element Plus；', font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    const indentErr = errors.find(e => e.message.includes('首行缩进'));
    assert.equal(indentErr, undefined);
  });

  it('封面文本完全跳过', () => {
    const para = mockPara({
      text: '长沙环境保护职业技术学院',
      computedStyle: { font: '微软雅黑', fontSize: 40 },
      runs: [{ text: '长沙环境保护职业技术学院', font: '微软雅黑', fontSize: '40' }],
    });
    const errors = paragraphRule([para], standard, [], null, standard.frontMatterTexts);
    assert.equal(errors.length, 0);
  });

  it('格式完全正确的正文不报错', () => {
    const para = mockPara({
      text: '这是一段格式完全正确的正文。',
      computedStyle: {
        font: '宋体', fontSize: 24, lineSpacing: 360,
        indent: { firstLine: 480 },
      },
      runs: [{ text: '这是一段格式完全正确的正文。', font: '宋体', fontSize: '24' }],
    });
    const errors = paragraphRule([para], standard, [], null, []);
    assert.equal(errors.length, 0);
  });
});

// ========= runRule =========
describe('runRule', () => {
  it('非黑色文字报错', () => {
    const para = mockPara({
      text: '彩色文字',
      runs: [mockRun({ text: '彩色文字', color: 'FF0000' })],
    });
    const errors = runRule([para], standard, []);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].message.includes('FF0000'));
  });

  it('黑色文字不报错', () => {
    const para = mockPara({
      text: '黑色文字',
      runs: [mockRun({ text: '黑色文字', color: '000000' })],
    });
    const errors = runRule([para], standard, []);
    assert.equal(errors.length, 0);
  });

  it('auto 颜色不报错', () => {
    const para = mockPara({
      text: '自动颜色',
      runs: [mockRun({ text: '自动颜色', color: 'auto' })],
    });
    const errors = runRule([para], standard, []);
    assert.equal(errors.length, 0);
  });

  it('无颜色属性不报错', () => {
    const para = mockPara({
      text: '无颜色',
      runs: [mockRun({ text: '无颜色' })],  // no color field
    });
    const errors = runRule([para], standard, []);
    assert.equal(errors.length, 0);
  });
});

// ========= imageRule =========
describe('imageRule', () => {
  it('图片段落未居中时报错', () => {
    const para = mockPara({
      text: '[图片]',
      containsImage: true,
      computedStyle: { alignment: 'left' },
    });
    const errors = imageRule([para], standard, []);
    const imgErr = errors.find(e => e.message.includes('居中'));
    assert.ok(imgErr);
  });

  it('图题未居中时报错', () => {
    const imgPara = mockPara({
      text: '[图片]',
      containsImage: true,
      computedStyle: { alignment: 'center' },
    });
    const captionPara = mockPara({
      text: '图1 网站首页',
      computedStyle: { alignment: 'left' },
      runs: [
        mockRun({ text: '图', font: '宋体', fontSize: '18', bold: true }),
        mockRun({ text: '1', font: 'Times New Roman', fontSize: '18', bold: true }),
        mockRun({ text: ' 网站首页', font: '宋体', fontSize: '18', bold: true }),
      ],
    });
    const errors = imageRule([imgPara, captionPara], standard, []);
    const capErr = errors.find(e => e.message.includes('图题应居中'));
    assert.ok(capErr);
  });

  it('图题数字部分字体错误时报错', () => {
    const imgPara = mockPara({
      text: '[图片]',
      containsImage: true,
      computedStyle: { alignment: 'center' },
    });
    const captionPara = mockPara({
      text: '图1 网站首页',
      computedStyle: { alignment: 'center' },
      runs: [
        mockRun({ text: '图', font: '宋体', fontSize: '18', bold: true }),
        mockRun({ text: '1', font: '黑体', fontSize: '18', bold: true }), // 应报错：数字部分字体无效
        mockRun({ text: ' 网站首页', font: '宋体', fontSize: '18', bold: true }),
      ],
    });
    const errors = imageRule([imgPara, captionPara], standard, []);
    assert.ok(errors.some(e => e.message.includes('数字')));
  });

  it('正确的图题不报错', () => {
    const imgPara = mockPara({
      text: '[图片]',
      containsImage: true,
      computedStyle: { alignment: 'center' },
    });
    const captionPara = mockPara({
      text: '图1 网站首页',
      computedStyle: { alignment: 'center' },
      runs: [
        mockRun({ text: '图', font: '宋体', fontSize: '18', bold: true }),
        mockRun({ text: '1', font: 'Times New Roman', fontSize: '18', bold: true }),
        mockRun({ text: ' 网站首页', font: '宋体', fontSize: '18', bold: true }),
      ],
    });
    const errors = imageRule([imgPara, captionPara], standard, []);
    assert.equal(errors.length, 0);
  });
});

// ========= logoRule =========
describe('logoRule', () => {
  it('小写 logo 报错', () => {
    const para = mockPara({ text: '网站 logo 设计说明' });
    const errors = logoRule([para], standard, []);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].message.includes('logo'));
  });

  it('正确大写的 LOGO 不报错', () => {
    const para = mockPara({ text: '网站 LOGO 设计说明' });
    const errors = logoRule([para], standard, []);
    assert.equal(errors.length, 0);
  });

  it('没有 LOGO 文字的段落不报错', () => {
    const para = mockPara({ text: '网站标志设计说明' });
    const errors = logoRule([para], standard, []);
    assert.equal(errors.length, 0);
  });
});

// ========= specialRule =========
describe('specialRule', () => {
  it('"参考文献"之前未分页时报错', () => {
    const para = mockPara({
      text: '参考文献',
      pageBreakBefore: false,
    });
    const errors = specialRule([para], standard, []);
    const pbErr = errors.find(e => e.message.includes('分页'));
    assert.ok(pbErr);
  });

  it('"参考文献"未居中时报错', () => {
    const para = mockPara({
      text: '参考文献',
      pageBreakBefore: false,
      computedStyle: { alignment: 'left' },
    });
    const errors = specialRule([para], standard, []);
    const centerErr = errors.find(e => e.message.includes('居中'));
    assert.ok(centerErr);
  });

  it('"参考文献"分页且居中时不报错', () => {
    const para = mockPara({
      text: '参考文献',
      pageBreakBefore: true,
      computedStyle: { alignment: 'center' },
    });
    const errors = specialRule([para], standard, []);
    assert.equal(errors.length, 0);
  });
});

// ========= 集成：真实 fixture 验证 =========
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '../', 'fixtures', '计算机应用技术_应用23304_吴澍_毕业设计成果报告6.docx');

let fixtureParsed;
describe('真实 fixture 集成检查', () => {

  before(async () => {
    const buffer = readFileSync(fixturePath);
    fixtureParsed = await parseDocx(buffer);
  });

  it('checkDocument 不抛异常且返回数组', async () => {
    const { checkDocument } = await import('../src/engine/checker.js');
    const errors = checkDocument(fixtureParsed, standard);
    assert.ok(Array.isArray(errors));
    // 已知该 fixture 有格式问题
    assert.ok(errors.length > 0);
  });

  it('至少检测到字号和加粗两类问题', async () => {
    const { checkDocument } = await import('../src/engine/checker.js');
    const errors = checkDocument(fixtureParsed, standard);
    const messages = errors.map(e => e.message);
    assert.ok(messages.some(m => m.includes('字号')));
    assert.ok(messages.some(m => m.includes('加粗')));
  });
});
