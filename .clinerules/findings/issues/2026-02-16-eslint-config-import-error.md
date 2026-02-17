# Issue: ESLint Config Import Error

**Date:** 2026-02-16
**Status:** RESOLVED
**Severity:** Medium - Build failure

## Symptom

Build failed with ESLint configuration error:

```
ESLint: Cannot find module 'C:\...\node_modules\eslint-config-next\core-web-vitals'
imported from C:\...\eslint.config.mjs
Did you mean to import "eslint-config-next/core-web-vitals.js"?
```

## Root Cause

The ESLint flat config format requires explicit `.js` extensions for subpath imports from packages. The import statement was missing the file extension.

## Affected Files

- `eslint.config.mjs`

## Impact

Build and lint commands would fail. Development server still worked but production builds were blocked.

## Resolution

Added `.js` extension to the import statements:

**Before:**

```javascript
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
```

**After:**

```javascript
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";
```

## Key Learning

When using ESLint flat config with subpath imports, always include the `.js` extension explicitly. This is a common issue with ESM modules in Node.js.
