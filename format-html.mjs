import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import prettier from 'prettier';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration for Prettier
const config = {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  htmlWhitespaceSensitivity: 'css',
  jsxSingleQuote: false,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  vueIndentScriptAndStyle: false,
};

// Function to format a single file
async function formatFile(filePath) {
  try {
    const originalContent = await fs.readFile(filePath, 'utf8');
    const formattedContent = await prettier.format(originalContent, {
      ...config,
      parser: 'html',
    });

    if (formattedContent !== originalContent) {
      await fs.writeFile(filePath, formattedContent, 'utf8');
      console.log(`Formatted: ${filePath}`);
      return true;
    }
    console.log(`Already formatted: ${filePath}`);
    return false;
  } catch (error) {
    console.error(`Error formatting ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all HTML files in a directory
async function findHtmlFiles(dir, fileList = []) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = await fs.stat(filePath);
      
      // Skip node_modules, dist, and .git directories
      if (['node_modules', 'dist', '.git'].includes(file)) {
        continue;
      }
      
      if (stat.isDirectory()) {
        await findHtmlFiles(filePath, fileList);
      } else if (file.endsWith('.html')) {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    return fileList;
  }
}

// Main function
async function main() {
  try {
    const rootDir = process.cwd();
    console.log('Finding HTML files in:', rootDir);
    
    const htmlFiles = await findHtmlFiles(rootDir);
    
    if (htmlFiles.length === 0) {
      console.log('No HTML files found.');
      return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to format.`);
    
    let formattedCount = 0;
    for (const file of htmlFiles) {
      console.log(`Processing: ${file}`);
      const wasFormatted = await formatFile(file);
      if (wasFormatted) formattedCount++;
    }
    
    console.log(`✅ Formatting complete! Formatted ${formattedCount} of ${htmlFiles.length} files.`);
  } catch (error) {
    console.error('❌ Error during formatting:', error);
    process.exit(1);
  }
}

// Run the main function
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
