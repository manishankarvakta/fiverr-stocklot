#!/bin/bash

echo "🔍 STOCKLOT BACKEND STATUS CHECKER"
echo "=================================="
echo ""

# Check if backend process is running
echo "1. Checking backend process..."
if pgrep -f "uvicorn" > /dev/null; then
    echo "   ✅ Backend process is running"
else
    echo "   ❌ Backend process is NOT running"
    echo "   💡 Solution: sudo supervisorctl start backend"
fi
echo ""

# Check if backend responds on localhost
echo "2. Testing backend on localhost:8001..."
if curl -s -f http://localhost:8001/api/health > /dev/null; then
    echo "   ✅ Backend responds on localhost:8001"
    echo "   📊 Health response:"
    curl -s http://localhost:8001/api/health | jq .
else
    echo "   ❌ Backend does NOT respond on localhost:8001"
    echo "   💡 Check backend logs: tail -n 20 /var/log/supervisor/backend.*.log"
fi
echo ""

# Check backend environment
echo "3. Checking backend environment..."
if [ -f "/app/backend/.env" ]; then
    echo "   ✅ Backend .env file exists"
    echo "   📋 Key configurations:"
    grep -E "(FRONTEND_URL|MONGO_URL|MAILGUN_DOMAIN)" /app/backend/.env
else
    echo "   ❌ Backend .env file missing"
fi
echo ""

# Check if MongoDB is running
echo "4. Checking MongoDB..."
if pgrep mongod > /dev/null; then
    echo "   ✅ MongoDB is running"
else
    echo "   ❌ MongoDB is NOT running"
    echo "   💡 Solution: sudo supervisorctl start mongodb"
fi
echo ""

# Check CORS configuration
echo "5. Checking CORS configuration..."
if grep -q "stocklot.farm" /app/backend/server.py; then
    echo "   ✅ CORS configured for stocklot.farm"
    echo "   📋 Allowed origins:"
    grep -A 5 "allow_origins" /app/backend/server.py
else
    echo "   ❌ CORS not configured for stocklot.farm"
fi
echo ""

# Check production build
echo "6. Checking production build..."
if [ -f "/app/frontend/build/index.html" ]; then
    echo "   ✅ Production build exists"
    echo "   📊 Build size: $(du -sh /app/frontend/build | cut -f1)"
    echo "   📋 Backend URL in build:"
    grep -o "https://[^\"]*stocklot.farm[^\"]*" /app/frontend/build/static/js/*.js | head -3
else
    echo "   ❌ Production build does NOT exist"
    echo "   💡 Solution: cd /app/frontend && yarn build"
fi
echo ""

echo "🎯 DEPLOYMENT CHECKLIST:"
echo "========================"
echo "1. ✅ Copy /app/frontend/build/ contents to your web server"
echo "2. ✅ Ensure web server serves /api/* requests to your backend server"
echo "3. ✅ Verify SSL certificate covers stocklot.farm domain"
echo "4. ✅ Test debug page: https://stocklot.farm/debug.html"
echo "5. ✅ Check browser console on blank page for specific errors"
echo ""
echo "📞 SUPPORT:"
echo "If backend tests pass but live site is still blank:"
echo "- Check web server configuration (nginx/apache)"
echo "- Verify SSL certificates"
echo "- Check firewall rules for HTTPS traffic"
echo "- Ensure API routes are proxied correctly"