# Issue: 404 Error for /trading-app.js

**Date:** 2026-02-16
**Status:** RESOLVED
**Severity:** Medium - Broken app functionality

## Symptom

When running the MCP apps demo, the trading-app.html was requesting `/trading-app.js` which returned a 404 error:

```
GET /trading-app.js 404 in 121ms
```

## Affected Files

- `mcp-server/apps/trading-app.html`
- `mcp-server/apps/dist/trading-app.html` (built version)

## Impact

The Investment Simulator app would not load its JavaScript functionality when served as an MCP resource.
