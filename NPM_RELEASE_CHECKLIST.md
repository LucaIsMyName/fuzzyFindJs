# NPM Release Checklist

## ✅ Pre-Release Checklist

### Code Quality
- [x] All TypeScript files compile without errors
- [x] Build completes successfully (`npm run build`)
- [ ] All tests pass (`npm test`)
- [x] No console errors or warnings in demo
- [x] Code follows TypeScript best practices

### Documentation
- [x] README.md is complete and accurate
- [x] API documentation is comprehensive
- [x] Usage examples are provided
- [x] CHANGELOG.md is updated
- [x] LICENSE file exists (MIT)
- [x] All code comments are clear

### Package Configuration
- [x] package.json name is correct: `fuzzyfindjs`
- [x] package.json version is set: `1.0.0`
- [x] package.json description is accurate
- [x] package.json author is set: `Luca Mack`
- [x] package.json keywords are relevant
- [x] package.json repository URL is correct
- [x] package.json license is MIT
- [x] package.json main/module/types entries are correct
- [x] package.json exports are properly configured
- [x] package.json files array includes only necessary files

### Build Output
- [x] `dist/esm/` folder exists with ESM modules
- [x] `dist/cjs/` folder exists with CommonJS modules
- [x] `dist/types/` folder exists with TypeScript declarations
- [x] All entry points are present
- [x] Source maps are generated
- [x] Build is optimized for production

### Files to Publish
- [x] `dist/` - Built files
- [x] `README.md` - Documentation
- [x] `LICENSE` - MIT license
- [x] `package.json` - Package metadata
- [x] `.npmignore` - Excludes dev files

### Files to Exclude (via .npmignore)
- [x] `src/` - Source TypeScript files
- [x] `node_modules/` - Dependencies
- [x] `*.ts` files (except .d.ts)
- [x] Config files (tsconfig, vite, etc.)
- [x] Demo files (index.html, demo.js)
- [x] Test files
- [x] Development docs (DEMO.md, QUICK_START.md)

## 🚀 Publishing Steps

### 1. Final Build
```bash
# Clean previous builds
rm -rf dist

# Build fresh
npm run build

# Verify build
npm run verify
```

### 2. Test Package Locally
```bash
# Create tarball
npm pack

# This creates: fuzzyfindjs-1.0.0.tgz
# Test in another project:
# npm install /path/to/fuzzyfindjs-1.0.0.tgz
```

### 3. Dry Run
```bash
# See what will be published
npm publish --dry-run

# Check the output carefully!
```

### 4. Login to NPM
```bash
npm login
# Enter username, password, email, OTP
```

### 5. Publish
```bash
# For first release
npm publish

# If name is taken, use scoped package:
# npm publish --access public
```

### 6. Verify Publication
```bash
# Check package page
npm view fuzzyfindjs

# Try installing
npm install fuzzyfindjs

# Test import
node -e "const { createFuzzySearch } = require('fuzzyfindjs'); console.log('✅ Works!');"
```

## 📋 Post-Publishing

### GitHub
- [ ] Push code to GitHub
- [ ] Create release tag: `git tag v1.0.0`
- [ ] Push tags: `git push --tags`
- [ ] Create GitHub release with CHANGELOG

### NPM Package Page
- [ ] Verify package appears on npmjs.com
- [ ] Check README renders correctly
- [ ] Verify all files are included
- [ ] Test installation from NPM

### Documentation
- [ ] Update README with NPM badge
- [ ] Add installation instructions
- [ ] Link to NPM package page

### Promotion
- [ ] Share on Twitter/X
- [ ] Post on Reddit (r/javascript, r/typescript)
- [ ] Share on LinkedIn
- [ ] Update portfolio/website

## 🔧 Troubleshooting

### Build Fails
```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### Package Name Taken
Update package.json:
```json
{
  "name": "@lucamack/fuzzyfindjs"
}
```

Then publish with:
```bash
npm publish --access public
```

### Email Not Verified
- Check NPM account email
- Verify email address
- Try publishing again

### 403 Forbidden
- Make sure you're logged in: `npm whoami`
- Check package name availability
- Verify you have publish rights

## 📊 Package Stats

After publishing, monitor:
- Downloads: https://npm-stat.com/charts.html?package=fuzzyfindjs
- Bundle size: https://bundlephobia.com/package/fuzzyfindjs
- Dependencies: https://www.npmjs.com/package/fuzzyfindjs?activeTab=dependencies

## 🔄 Future Updates

### Patch (1.0.0 → 1.0.1)
```bash
# Fix bugs, update docs
npm version patch
npm publish
git push --tags
```

### Minor (1.0.0 → 1.1.0)
```bash
# Add features, maintain compatibility
npm version minor
npm publish
git push --tags
```

### Major (1.0.0 → 2.0.0)
```bash
# Breaking changes
npm version major
npm publish
git push --tags
```

## ✅ Ready to Publish?

Run this final check:
```bash
npm run build && npm run verify
```

If all checks pass, you're ready to publish! 🎉

```bash
npm publish
```

---

**Good luck with your first NPM package! 🚀**
