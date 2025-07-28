# Production Testing Guide

## Quick Testing Methods

### 1. Direct Production Test (Recommended)
```bash
./test-prod.sh
```
This script:
- Cleans previous builds
- Builds the app
- Tests the production build directly with Electron
- No installation required

### 2. Debug Production Build
```bash
./debug-prod.sh
```
This script:
- Checks all critical dependencies
- Verifies build output
- Identifies common issues
- Tests the production build

### 3. Manual Testing
```bash
# Clean and build
rm -rf dist release
pnpm run build

# Test production build
NODE_ENV=production npx electron .
```

## Common Issues and Solutions

### Missing Dependencies
If you get errors like "Cannot find module 'whatwg-url'":
1. Check if the dependency is in `package.json`
2. Run `pnpm install` to install missing dependencies
3. Ensure `extraResources` is configured in the build section

### Build Configuration Issues
Make sure your `package.json` build section includes:
```json
{
  "build": {
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "assets/**/*",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "node_modules",
        "to": "node_modules"
      }
    ]
  }
}
```

### Testing Workflow

1. **Development Testing** (Fast iteration):
   ```bash
   pnpm run dev
   ```

2. **Production Testing** (Before release):
   ```bash
   ./test-prod.sh
   ```

3. **Debug Issues** (When problems occur):
   ```bash
   ./debug-prod.sh
   ```

4. **Full Release Build** (For distribution):
   ```bash
   pnpm run dist:mac
   ```

## Environment Variables

For production testing, you can set:
- `NODE_ENV=production` - Forces production mode
- `DEBUG=electron-builder` - Shows detailed build info

## Troubleshooting

### If the app crashes on startup:
1. Check the console output for error messages
2. Verify all dependencies are installed
3. Ensure the build output is complete
4. Test with `./debug-prod.sh` to identify issues

### If modules are missing:
1. Add missing dependencies to `package.json`
2. Run `pnpm install`
3. Rebuild the app

### If the app works in dev but not in production:
1. Check for environment-specific code paths
2. Verify file paths are correct for production
3. Ensure all assets are included in the build

## Best Practices

1. **Always test production builds** before creating releases
2. **Use the test scripts** instead of full install/uninstall cycles
3. **Keep dependencies up to date** to avoid compatibility issues
4. **Monitor the console output** for any errors during testing
5. **Test on the target platform** (macOS ARM64 in your case)

## Scripts Summary

- `./test-prod.sh` - Quick production testing
- `./debug-prod.sh` - Comprehensive debugging
- `pnpm run dev` - Development mode
- `pnpm run dist:mac` - Create distributable
- `pnpm run clean` - Clean build artifacts
- `pnpm run clean:all` - Full clean and reinstall 