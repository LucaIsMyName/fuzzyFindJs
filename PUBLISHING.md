# Publishing to NPM

## Prerequisites

1. **NPM Account**: Create one at [npmjs.com](https://www.npmjs.com/signup)
2. **NPM CLI**: Should be installed with Node.js
3. **Git Repository**: Push code to GitHub first

## Pre-Publishing Checklist

- [x] Build configuration fixed (tsconfig.build.json)
- [x] Package.json updated with correct metadata
- [x] LICENSE file created (MIT)
- [x] README.md complete with examples
- [x] CHANGELOG.md created
- [x] .npmignore configured
- [ ] All tests passing
- [ ] Build successful
- [ ] Version number set correctly

## Step-by-Step Publishing Guide

### 1. Login to NPM

```bash
npm login
```

Enter your NPM credentials when prompted.

### 2. Verify Package Name Availability

```bash
npm search fuzzyfindjs
```

If the name is taken, update `package.json` with a different name (e.g., `@lucamack/fuzzyfindjs`).

### 3. Run Tests

```bash
npm test
```

Make sure all tests pass before publishing.

### 4. Build the Package

```bash
npm run build
```

This will:
- Generate TypeScript declarations in `dist/types/`
- Build ESM bundle in `dist/esm/`
- Build CommonJS bundle in `dist/cjs/`

### 5. Test the Build Locally

```bash
# Pack the package (creates a .tgz file)
npm pack

# Install it locally in a test project
cd /path/to/test-project
npm install /path/to/fuzzyfindjs/fuzzyfindjs-1.0.0.tgz

# Test the import
node -e "const { createFuzzySearch } = require('fuzzyfindjs'); console.log('Works!');"
```

### 6. Verify Package Contents

```bash
# See what will be published
npm publish --dry-run
```

Check that only these files are included:
- `dist/` folder
- `README.md`
- `LICENSE`
- `package.json`

### 7. Publish to NPM

For first release:

```bash
npm publish
```

For scoped package (if name is taken):

```bash
# Update package.json name to "@lucamack/fuzzyfindjs"
npm publish --access public
```

### 8. Verify Publication

```bash
# Check on NPM
npm view fuzzyfindjs

# Install from NPM
npm install fuzzyfindjs
```

Visit: https://www.npmjs.com/package/fuzzyfindjs

## Publishing Updates

### Patch Release (Bug fixes: 1.0.0 → 1.0.1)

```bash
npm version patch
npm publish
git push --tags
```

### Minor Release (New features: 1.0.0 → 1.1.0)

```bash
npm version minor
npm publish
git push --tags
```

### Major Release (Breaking changes: 1.0.0 → 2.0.0)

```bash
npm version major
npm publish
git push --tags
```

## Post-Publishing

1. **Create GitHub Release**
   - Go to: https://github.com/LucaIsMyName/fuzzyfindjs/releases
   - Click "Create a new release"
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - Initial Release`
   - Description: Copy from CHANGELOG.md

2. **Update Documentation**
   - Add NPM badge to README
   - Update installation instructions
   - Add link to NPM package

3. **Announce**
   - Share on social media
   - Post on relevant forums/communities
   - Update your portfolio

## Troubleshooting

### "Package name already exists"

Use a scoped package:
```json
{
  "name": "@lucamack/fuzzyfindjs"
}
```

### "You must verify your email"

Check your NPM account email and verify it.

### "Build fails"

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### "Tests fail"

```bash
# Run tests with verbose output
npm test -- --reporter=verbose
```

## NPM Scripts Reference

```bash
npm run dev          # Start demo dashboard
npm run build        # Build all (types + esm + cjs)
npm run build:types  # Build TypeScript declarations
npm run build:esm    # Build ESM bundle
npm run build:cjs    # Build CommonJS bundle
npm test             # Run tests
npm test:coverage    # Run tests with coverage
npm run preview      # Preview production build
```

## Package Size

Current package size (estimated):
- Unpacked: ~200 KB
- Packed: ~50 KB

Check actual size:
```bash
npm pack --dry-run
```

## Security

Before publishing, check for vulnerabilities:

```bash
npm audit
npm audit fix
```

## Best Practices

1. **Always test before publishing**
2. **Use semantic versioning**
3. **Update CHANGELOG.md for each release**
4. **Tag releases in Git**
5. **Keep README.md up to date**
6. **Respond to issues promptly**
7. **Deprecate old versions properly**

## Unpublishing (Emergency Only)

⚠️ Only use within 72 hours of publishing:

```bash
npm unpublish fuzzyfindjs@1.0.0
```

After 72 hours, you can only deprecate:

```bash
npm deprecate fuzzyfindjs@1.0.0 "This version has critical bugs"
```

## Support

- NPM Documentation: https://docs.npmjs.com/
- NPM Support: https://www.npmjs.com/support
- Package Issues: https://github.com/LucaIsMyName/fuzzyfindjs/issues
