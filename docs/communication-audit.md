# 📡 StockLot Communication Audit System

## Overview

The Communication Audit System ensures that frontend and backend APIs stay in sync by automatically detecting mismatches between what the frontend calls and what the backend implements.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Audit System   │    │   Backend       │
│   Scanner       │────│   Comparator     │────│   Introspector  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ comm-scan.      │    │ comm-report.md   │    │ endpoint        │
│ frontend.json   │    │ comm-report.json │    │ inventory       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### 1. Backend Endpoint Inventory (`/app/backend/services/endpoint_inventory.py`)

**Purpose**: Collects all FastAPI endpoints and SSE topics for introspection.

**Features**:
- Automatically discovers all FastAPI routes
- Tracks Server-Sent Events topics
- Provides development-only introspection endpoints
- Caches inventory for performance

**Key Endpoints**:
- `GET /api/__introspection/endpoints` - Returns all API endpoints
- `GET /api/__introspection/sse-topics` - Returns all SSE topics  
- `GET /api/__introspection/communication-summary` - Complete audit summary

### 2. Frontend Scanner (`/app/scripts/scan-frontend.js`)

**Purpose**: Scans React/TypeScript code for API calls and SSE subscriptions.

**Detection Patterns**:
```javascript
// API Calls
fetch('/api/orders')
axios.get('/api/listings')
api.post('/api/checkout/preview')
adminApi.get('/api/admin/stats')

// SSE Subscriptions
new EventSource('/api/admin/events/stream')
addEventListener('orders.updated')
```

**Output**: `comm-scan.frontend.json` with discovered APIs and components.

### 3. Communication Auditor (`/app/scripts/comm-check.js`)

**Purpose**: Compares backend inventory vs frontend usage and generates coverage reports.

**Analysis Types**:
- **Missing in Backend**: Frontend calls endpoints that don't exist
- **Unused in Frontend**: Backend endpoints with no frontend consumers
- **SSE Topic Mismatches**: Frontend listens to undeclared topics
- **Component Coverage**: Per-component API usage analysis

## Usage

### Local Development

```bash
# Scan frontend for API usage
npm run scan:frontend

# Run complete communication audit
npm run comm-check

# View results
cat comm-report.md
```

### CI/CD Integration

The system automatically runs on every PR and blocks merges if critical issues are found:

```yaml
# .github/workflows/comm-audit.yml
- name: Run communication audit
  run: npm run comm-check
```

## Report Interpretation

### ✅ Passing Audit
```
✅ Communication audit passed: No critical issues found.
```

### ❌ Failing Audit
```
❌ Communication audit failed: 15 critical issues found.
```

**Critical Issues** (cause CI failure):
- Frontend calls missing backend endpoints
- Frontend listens to undeclared SSE topics

**Non-Critical Issues** (warnings only):
- Backend endpoints with no frontend consumers
- Low component coverage percentages

## Example Report

```markdown
# 📡 StockLot Communication Coverage Report

## 📊 Summary
| Metric | Backend | Frontend | Status |
|--------|---------|----------|--------|
| API Endpoints | 356 | 54 | ❌ |
| SSE Topics | 29 | 2 | ❌ |
| Missing in Backend | - | 15 | ❌ |

## ❌ Missing Backend Implementations
- `/api/admin/blog`
- `/api/notifications/subscribe`
- `/api/fees/breakdown?:param`

## 🧩 Component Coverage
| Component | Coverage | APIs | Missing |
|-----------|----------|------|---------|
| AuthProvider | ✅ 100% | 3 | 0 |
| InlineCartPage | ❌ 69% | 13 | 4 |
```

## Configuration

### Adjusting Failure Thresholds

Edit `scripts/comm-check.js`:

```javascript
// Current: Fail on any missing backend implementation
if (report.summary.missing_in_backend > 0) {
  process.exit(1);
}

// Alternative: Allow up to 5 missing endpoints
if (report.summary.missing_in_backend > 5) {
  process.exit(1);
}
```

### Adding Custom Patterns

Edit `scripts/scan-frontend.js`:

```javascript
const API_PATTERNS = [
  // Add custom patterns
  /customApi\.(get|post)\(\s*[`"']([^`"']*)[`"']/g,
];
```

### SSE Topics Registry

Edit `backend/services/endpoint_inventory.py`:

```python
SSE_TOPICS = [
    "orders.updated",
    "admin.stats.updated",
    # Add new topics here
    "custom.topic.name"
]
```

## Troubleshooting

### "Introspection endpoint not accessible"

1. Ensure backend is running: `http://localhost:8001/api/__introspection/endpoints`
2. Check `ENVIRONMENT` variable is not set to `production`
3. Verify dev routes are properly mounted in `server.py`

### "Frontend scan found 0 files"

1. Check `SRC_DIRS` in `scripts/scan-frontend.js`
2. Ensure paths are relative to project root
3. Verify file patterns match your project structure

### High number of "unused" endpoints

This is normal for mature APIs. Consider:
1. Categorizing endpoints as "deprecated" vs "future-use"
2. Adding component mapping in `docs/comm-map.json`
3. Adjusting reporting thresholds

## Integration Examples

### React Component Pattern

```jsx
// Good: Discoverable by scanner
const CheckoutPreview = () => {
  const [preview, setPreview] = useState(null);
  
  const fetchPreview = async (orderData) => {
    const response = await api.post('/api/checkout/preview', orderData);
    setPreview(response.data);
  };
  
  return <div>...</div>;
};
```

### SSE Integration Pattern

```jsx
// Good: Discoverable by scanner
const AdminDashboard = () => {
  useEffect(() => {
    const eventSource = new EventSource('/api/admin/events/stream');
    
    eventSource.addEventListener('admin.stats.updated', (event) => {
      const data = JSON.parse(event.data);
      updateStats(data);
    });
    
    return () => eventSource.close();
  }, []);
  
  return <div>...</div>;
};
```

## Benefits

1. **Prevents Broken APIs**: Catches missing endpoints before deployment
2. **Improves Documentation**: Automated inventory of all communications
3. **Reduces Debugging**: Clear visibility into frontend-backend contracts
4. **Enables Refactoring**: Safe endpoint deprecation with usage tracking
5. **Supports Development**: Component-level API usage insights

## Future Enhancements

- **Payload Validation**: Compare request/response schemas
- **Performance Tracking**: Monitor endpoint usage patterns
- **Auto-Documentation**: Generate API docs from usage patterns
- **Contract Testing**: Automated integration tests from audit data
- **Security Analysis**: Detect unused authentication endpoints

## Support

For issues or questions about the communication audit system:

1. Check the [troubleshooting section](#troubleshooting)
2. Review audit reports in `comm-report.md`
3. Examine raw scan data in `comm-scan.frontend.json`
4. Test backend introspection: `curl http://localhost:8001/api/__introspection/endpoints`