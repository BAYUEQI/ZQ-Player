import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要排除的目录
const EXCLUDE_DIRS = ['Setting'];

// 需要添加过渡动画的文件后缀
const FILE_EXTENSION = '.vue';

// 视图目录路径
const VIEWS_DIR = path.join(__dirname, '../src/views');

// 导入语句
const IMPORT_STATEMENT = "import PageTransition from \"@/components/Global/PageTransition.vue\";\n";

// 递归处理目录
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (!EXCLUDE_DIRS.includes(file)) {
        processDirectory(fullPath);
      }
    } else if (file.endsWith(FILE_EXTENSION)) {
      processFile(fullPath);
    }
  });
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 如果文件已经包含PageTransition组件，则跳过
  if (content.includes('PageTransition')) {
    return;
  }

  // 添加导入语句
  const scriptSetupMatch = content.match(/<script setup>([\s\S]*?)<\/script>/m);
  if (scriptSetupMatch) {
    const scriptContent = scriptSetupMatch[1];
    const firstImport = scriptContent.match(/^\s*import/m);
    if (firstImport) {
      content = content.replace(
        scriptSetupMatch[0],
        `<script setup>${scriptContent.slice(0, firstImport.index)}${IMPORT_STATEMENT}${scriptContent.slice(firstImport.index)}</script>`
      );
    }
  }

  // 添加PageTransition组件包装
  content = content.replace(
    /(<template>\s*<div[^>]*>)/,
    '$1\n  <PageTransition>'
  );

  content = content.replace(
    /(<\/div>\s*<\/template>)/,
    '  </PageTransition>\n$1'
  );

  // 写入修改后的内容
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${filePath}`);
}

// 开始处理
processDirectory(VIEWS_DIR);
console.log('Page transition animation has been added to all view components.');