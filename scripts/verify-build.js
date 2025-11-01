#!/usr/bin/env node

/**
 * Verify build output before publishing to NPM
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';

const checks = [];
let failed = false;

function check(name, condition, errorMsg) {
  if (condition) {
    console.log(`✅ ${name}`);
    checks.push({ name, passed: true });
  } else {
    console.error(`❌ ${name}: ${errorMsg}`);
    checks.push({ name, passed: false, error: errorMsg });
    failed = true;
  }
}

function fileExists(path) {
  return existsSync(path);
}

function folderExists(path) {
  return existsSync(path) && statSync(path).isDirectory();
}

console.log('🔍 Verifying build output...\n');

// Check dist folders
check('ESM build exists', folderExists('dist/esm'), 'dist/esm folder not found');
check('CJS build exists', folderExists('dist/cjs'), 'dist/cjs folder not found');
check('Types build exists', folderExists('dist/types'), 'dist/types folder not found');

// Check main entry points
check('ESM index exists', fileExists('dist/esm/index.js'), 'dist/esm/index.js not found');
check('CJS index exists', fileExists('dist/cjs/index.cjs'), 'dist/cjs/index.cjs not found');
check('Types index exists', fileExists('dist/types/index.d.ts'), 'dist/types/index.d.ts not found');

// Check core files
check('Core types exist', fileExists('dist/types/core/types.d.ts'), 'Core type definitions missing');
check('Core config exists', fileExists('dist/types/core/config.d.ts'), 'Core config definitions missing');
check('Core index exists', fileExists('dist/types/core/index.d.ts'), 'Core index definitions missing');

// Check language processors
const languages = ['german', 'english', 'french', 'spanish'];
languages.forEach(lang => {
  const capitalLang = lang.charAt(0).toUpperCase() + lang.slice(1);
  check(
    `${capitalLang} processor types exist`,
    fileExists(`dist/types/languages/${lang}/${capitalLang}Processor.d.ts`),
    `${capitalLang} processor types missing`
  );
});

// Check algorithms
check('Levenshtein types exist', fileExists('dist/types/algorithms/levenshtein.d.ts'), 'Algorithm types missing');

// Check package files
check('README.md exists', fileExists('README.md'), 'README.md not found');
check('LICENSE exists', fileExists('LICENSE'), 'LICENSE not found');
check('package.json exists', fileExists('package.json'), 'package.json not found');

// Check package.json content
try {
  const pkg = JSON.parse(await import('fs').then(fs => fs.promises.readFile('package.json', 'utf-8')));
  
  check('Package name is set', !!pkg.name, 'Package name is missing');
  check('Package version is set', !!pkg.version, 'Package version is missing');
  check('Package description is set', !!pkg.description, 'Package description is missing');
  check('Package author is set', !!pkg.author && pkg.author !== 'Your Name', 'Package author needs to be updated');
  check('Package license is set', pkg.license === 'MIT', 'Package license should be MIT');
  check('Package repository is set', !!pkg.repository?.url, 'Package repository URL is missing');
  check('Package main entry is set', pkg.main === './dist/cjs/index.js', 'Package main entry incorrect');
  check('Package module entry is set', pkg.module === './dist/esm/index.js', 'Package module entry incorrect');
  check('Package types entry is set', pkg.types === './dist/types/index.d.ts', 'Package types entry incorrect');
  check('Package exports are configured', !!pkg.exports?.['.'], 'Package exports not configured');
  check('Package files are specified', Array.isArray(pkg.files) && pkg.files.includes('dist'), 'Package files not specified');
  
} catch (error) {
  check('Package.json is valid JSON', false, error.message);
}

console.log('\n' + '='.repeat(50));
console.log(`Total checks: ${checks.length}`);
console.log(`Passed: ${checks.filter(c => c.passed).length}`);
console.log(`Failed: ${checks.filter(c => !c.passed).length}`);
console.log('='.repeat(50) + '\n');

if (failed) {
  console.error('❌ Build verification failed! Please fix the issues above.');
  process.exit(1);
} else {
  console.log('✅ Build verification passed! Ready to publish.');
  console.log('\nNext steps:');
  console.log('1. npm login');
  console.log('2. npm publish --dry-run (to preview)');
  console.log('3. npm publish');
  process.exit(0);
}
