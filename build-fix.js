/**
 * Post-build processing script to create a consolidated CSS file
 * and handle CSS imports for better compatibility with various bundlers
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('🔧 Running build-fix script for CSS processing...');

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const srcDir = path.resolve(__dirname, 'src/styles');
const distDir = path.resolve(__dirname, 'dist');
const combinedCssPath = path.join(distDir, 'styles.css');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  console.log('❌ Dist directory not found. Run build first.');
  process.exit(1);
}

// 1. Create a consolidated CSS file from all source CSS files
try {
  // Read all CSS files from src/styles
  const cssFiles = fs.readdirSync(srcDir).filter(file => file.endsWith('.css'));
  
  // Combine CSS content
  let combinedCss = '';
  cssFiles.forEach(file => {
    const filePath = path.join(srcDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    combinedCss += `/* ${file} */\n${content}\n\n`;
  });

  // Write consolidated CSS file
  fs.writeFileSync(combinedCssPath, combinedCss);
  console.log(`✅ Created consolidated CSS file: ${combinedCssPath}`);
} catch (error) {
  console.error('❌ Error creating consolidated CSS:', error);
}

// 2. Create CSS module files for import
try {
  // Create CJS module
  const cjsContent = `"use strict";\nrequire("./styles.css");\n`;
  fs.writeFileSync(path.join(distDir, 'styles.cjs'), cjsContent);

  // Create ESM module
  const esmContent = `import "./styles.css";\n`;
  fs.writeFileSync(path.join(distDir, 'styles.mjs'), esmContent);

  console.log('✅ Created CSS module files');
} catch (error) {
  console.error('❌ Error creating CSS module files:', error);
}

// 3. Create client entry points with CSS auto-injection
try {
  const cssInjectionCode = createCssInjectionCode(combinedCssPath);
  
  // Create client.mjs with CSS injection
  const clientMJSContent = `${cssInjectionCode}\nexport * from './index.mjs';\n`;
  fs.writeFileSync(path.join(distDir, 'client.mjs'), clientMJSContent);
  
  // Create client.cjs with CSS injection
  const clientCJSContent = `${cssInjectionCode}\nmodule.exports = require('./index.cjs');\n`;
  fs.writeFileSync(path.join(distDir, 'client.cjs'), clientCJSContent);
  
  console.log('✅ Created client entry points with CSS auto-injection');
} catch (error) {
  console.error('❌ Error creating client entry points:', error);
}

// 4. Create a CSS-free entry point
try {
  // Read the original index files
  const indexMjs = fs.readFileSync(path.join(distDir, 'index.mjs'), 'utf8');
  const indexCjs = fs.readFileSync(path.join(distDir, 'index.cjs'), 'utf8');

  // Update CSS injection code in main index files
  const updatedMjs = replaceInjectionPlaceholder(indexMjs, combinedCssPath);
  const updatedCjs = replaceInjectionPlaceholder(indexCjs, combinedCssPath);

  // Write the updated files back
  fs.writeFileSync(path.join(distDir, 'index.mjs'), updatedMjs);
  fs.writeFileSync(path.join(distDir, 'index.cjs'), updatedCjs);

  console.log('✅ Updated CSS injection in main entry files');
} catch (error) {
  console.error('❌ Error updating main entry files:', error);
}

// 5. Handle Next.js entry points
try {
  // Ensure the nextjs directory exists in dist
  const nextjsDistDir = path.join(distDir, 'nextjs');
  if (!fs.existsSync(nextjsDistDir)) {
    fs.mkdirSync(nextjsDistDir, { recursive: true });
  }
  
  // Create Next.js client entry points
  const cssInjectionCode = createCssInjectionCode(combinedCssPath, true);
  
  // Create client.mjs with CSS injection
  const nextjsClientMJS = `"use client";\n\n${cssInjectionCode}\nexport * from '../index.mjs';\n`;
  fs.writeFileSync(path.join(nextjsDistDir, 'client.mjs'), nextjsClientMJS);
  
  // Create client.cjs with CSS injection
  const nextjsClientCJS = `"use client";\n\n${cssInjectionCode}\nmodule.exports = require('../index.cjs');\n`;
  fs.writeFileSync(path.join(nextjsDistDir, 'client.cjs'), nextjsClientCJS);
  
  // Create type definitions
  fs.writeFileSync(path.join(nextjsDistDir, 'client.d.ts'), `export * from '../index';\n`);
  
  console.log('✅ Created Next.js specific entry points');
} catch (error) {
  console.error('❌ Error creating Next.js entry points:', error);
}

console.log('✅ Post-build CSS processing completed');

// Helper function to create CSS injection code
function createCssInjectionCode(cssPath, isNextJS = false) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  return `
// CSS auto-injection for React Power Table
(function() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('react-power-table-styles')) return;
  
  try {
    const style = document.createElement('style');
    style.id = 'react-power-table-styles';
    style.setAttribute('data-power-table-version', '1.0.0');
    style.textContent = ${JSON.stringify(cssContent)};
    
    // Insert at the beginning of head for proper CSS precedence
    if (document.head) {
      if (document.head.firstChild) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        document.head.appendChild(style);
      }
    }
  } catch (e) {
    console.warn('[react-power-table] Could not auto-inject CSS:', e);
  }
})();
`;
}

// Helper function to replace CSS placeholder in compiled files
function replaceInjectionPlaceholder(content, cssPath) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const placeholder = '/* CSS will be injected during build */';
  const cssStringified = JSON.stringify(cssContent);
  
  if (content.includes(`"${placeholder}"`)) {
    return content.replace(`"${placeholder}"`, cssStringified);
  } else if (content.includes(`'${placeholder}'`)) {
    return content.replace(`'${placeholder}'`, cssStringified);
  } else if (content.includes(placeholder)) {
    return content.replace(placeholder, cssContent);
  }
  
  return content;
}