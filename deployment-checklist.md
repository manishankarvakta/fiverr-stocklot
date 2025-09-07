# STOCKLOT DEPLOYMENT TROUBLESHOOTING

## CRITICAL FIXES APPLIED:
✅ Production build updated with `https://stocklot.farm` (no www)
✅ CORS configured for both stocklot.farm and www.stocklot.farm
✅ Favicon and static assets included in build
✅ Backend environment updated to match domains

## DEPLOYMENT CHECKLIST:

### 1. SERVER CONFIGURATION ISSUES:
- Ensure your web server (nginx/apache) serves `/app/frontend/build/` directory
- Check if static files (js/css) are being served with correct MIME types
- Verify HTTPS certificates are working for stocklot.farm

### 2. COMMON DEPLOYMENT ERRORS:
- **Wrong document root**: Server should point to `/app/frontend/build/`
- **Missing index.html**: Ensure index.html is served for all routes (SPA routing)
- **Static file paths**: JS/CSS files should load from `/static/js/` and `/static/css/`

### 3. BACKEND CONNECTIVITY:
- Verify backend server is accessible at `https://stocklot.farm/api/health`
- Check if SSL certificates cover both backend and frontend
- Ensure firewall allows traffic on port 443 (HTTPS)

### 4. DEBUGGING COMMANDS:
```bash
# Test if backend is accessible:
curl https://stocklot.farm/api/health

# Test if static files load:
curl https://stocklot.farm/static/js/main.455f8d95.js

# Check server logs for errors
```

## CORRECT DEPLOYMENT STRUCTURE:
```
Web Server Root: /app/frontend/build/
├── index.html (main HTML file)
├── static/
│   ├── js/main.455f8d95.js (React app)
│   └── css/main.0687b011.css (styles)
├── favicon.png
└── cow-logo.png
```

## IF STILL BLANK:
1. Check browser console for JavaScript errors
2. Verify in Network tab that main.js file loads (should be ~365KB)
3. Ensure index.html is being served (not 404)
4. Check if HTTPS certificate is valid for stocklot.farm