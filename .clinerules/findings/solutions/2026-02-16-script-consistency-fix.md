# Solution: Script Tag Consistency Fix

**Date:** 2026-02-16
**Related Issue:** 2026-02-16-trading-app-js-404.md
**Related Debug:** 2026-02-16-script-type-module-investigation.md

## Problem Summary

`trading-app.html` used `<script type="module">` which caused Vite to extract the JavaScript into a separate file. When served as an MCP resource, the browser couldn't find the external JS file, resulting in a 404 error.

## Solution Chosen

**Option 1: Use plain `<script>` tag** (matches other apps)

Changed `<script type="module">` to plain `<script>` for consistency with flights-app, hotels-app, and kanban-app.

## Why This Works

Vite does NOT extract inline scripts from plain `<script>` tags. The JavaScript stays embedded in the HTML file, so when the MCP server serves the HTML as a resource, all the code is self-contained.

## Changes Made

1. **`mcp-server/apps/trading-app.html`**
   - Changed: `<script type="module">` → `<script>`

2. **`mcp-server/apps/inline-js.js`**
   - Deleted (workaround file no longer needed)

3. **`mcp-server/server.ts`**
   - Removed the JS file handler endpoint

4. **`mcp-server/package.json`**
   - Simplified: `build:app` from `cd apps && npx vite build && node inline-js.js` to `cd apps && npx vite build`

## Build Results

Before fix:

- `trading-app.html`: 25.86 kB
- `trading-app.js`: 9.75 kB (separate file → 404 error)

After fix:

- `trading-app.html`: 45.86 kB (JS inlined, no external references)

## Future Consideration

As development progresses, we may want to:

- Move all JS to separate files
- Ensure the MCP server can serve static files properly
- Or use a bundler that inlines everything by default

For now, all MCP apps use consistent inline `<script>` tags to ensure they work when served as resources.
