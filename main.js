import { parseDocx } from './src/parser/docx-parser.js';
import { checkDocument } from './src/engine/checker.js';
import { formatReport } from './src/reporter/formatter.js';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log([
    '用法: node main.js <docx文件路径> [选项]',
    '',
    '选项:',
    '  --standard <path>  格式标准配置文件，默认 src/config/standard.json',
    '  --output  <path>   报告输出路径，默认 output/errors.txt',
    '  --help, -h         显示帮助',
  ].join('\n'));
  process.exit(args.length === 0 ? 1 : 0);
}

const inputPath = resolve(args[0]);
if (!existsSync(inputPath)) {
  console.error(`❌ 文件不存在: ${inputPath}`);
  process.exit(1);
}

const standardArgIdx = args.indexOf('--standard');
const standardPath = standardArgIdx !== -1
  ? resolve(args[standardArgIdx + 1])
  : join(__dirname, 'src', 'config', 'standard.json');

const outputArgIdx = args.indexOf('--output');
const outputPath = outputArgIdx !== -1
  ? resolve(args[outputArgIdx + 1])
  : join(__dirname, 'output', 'errors.txt');

const outputDir = dirname(outputPath);

const standard = JSON.parse(readFileSync(standardPath, 'utf-8'));
const inputBuffer = readFileSync(inputPath);
const parsed = await parseDocx(inputBuffer);

if (!parsed.hasTOC) {
  console.log(`⚠️ 检测文档：${basename(inputPath)}\n该文档未设置自动目录，跳过检测。`);
  process.exit(0);
}

const errors = checkDocument(parsed, standard);

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const report = formatReport(errors, parsed.paragraphs, basename(inputPath));
writeFileSync(outputPath, report, 'utf-8');

console.log(`✅ 检查完成，报告已保存至 ${outputPath}`);
console.log(`共发现 ${errors.length} 个问题。`);
