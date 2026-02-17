# Debug: Script Type Module Investigation

**Date:** 2026-02-16
**Related Issue:** 2026-02-16-trading-app-js-404.md

## What is `<script type="module">`?

The `type="module"` attribute tells the browser to treat the script as an ECMAScript module (ES Module). This enables:

1. **ES6 Import/Export Syntax** - Use `import` and `export` statements
2. **Strict Mode by Default** - No need for `"use strict"`
3. **Top-level await** - Can use `await` at module level
4. **Defer by Default** - Scripts execute after DOM parsing
5. **Module Scope** - Variables are scoped to the module, not global

## Why was `type="module"` used in trading-app.html?

The trading app was originally written using ES module syntax patterns. The `type="module"` attribute was added to enable:

- Modern JavaScript module patterns
- Clean code organization with imports
- Better scoping of variables

## What Went Wrong

When Vite builds HTML files with `<script type="module">`, it:

1. **Extracts the module code** into a separate `.js` file
2. **Rewrites the script tag** to reference the extracted file:

   ```html
   <!-- Before build -->
   <script type="module">
     // JavaScript code here
   </script>

   <!-- After Vite build -->
   <script type="module" crossorigin src="/trading-app.js"></script>
   ```

## Why This Caused 404 Errors

The built HTML references `/trading-app.js` with an **absolute path**. When the MCP server serves this HTML as a resource in an iframe:

1. Browser parses HTML and sees `<script src="/trading-app.js">`
2. Browser requests `/trading-app.js` from the **iframe's origin** (Next.js server on port 3000)
3. The JS file doesn't exist on that server → **404 Error**

## Discovery Process

1. Searched for `trading-app` across the codebase
2. Found `mcp-server/apps/dist/trading-app.html` containing external JS reference
3. Compared with other apps - found they use plain `<script>` (not `type="module"`)
4. Vite only extracts `type="module"` scripts, not plain scripts

## Key Finding

**Plain `<script>` tags stay inline in HTML** while **`<script type="module">` gets extracted to separate files**. This is Vite's default behavior for ES modules.
