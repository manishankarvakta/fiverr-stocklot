## StockLot Backend Developer Guide

### Overview
- **Stack**: FastAPI, Motor/MongoDB, Pydantic v2, Uvicorn, optional Celery & Redis
- **Entry point**: `backend/server.py` exposes `app = FastAPI(...)`
- **API Docs**: Swagger UI at `http://127.0.0.1:8000/docs`

### Quick Start
1. Create `.env` from `backend/config.example` and set required values:
   - `MONGO_URL`, `DB_NAME`, `JWT_SECRET_KEY`, `ENVIRONMENT`, `DEBUG`
   - Optional: `OPENAI_API_KEY`, Paystack keys, Mailgun, Mapbox, etc.
2. Use the provided virtual environment and install deps if needed:
   - `backend/venv` already exists in this repo context.
3. Run the server (hot reload):
```bash
/Users/manishankarvakta/Desktop/StockLot/backend/venv/bin/python -m uvicorn server:app \
  --host 0.0.0.0 --port 8000 --reload \
  --app-dir /Users/manishankarvakta/Desktop/StockLot/backend
```

### Configuration
- Environment variables are loaded at startup:
  - `backend/server.py` uses `python-dotenv` to load `backend/.env`.
- Required keys:
  - `MONGO_URL`, `DB_NAME`, `JWT_SECRET_KEY`, `ENVIRONMENT`, `DEBUG`
- Recommended non-production defaults:
  - `ENVIRONMENT=development`, `DEBUG=true`

### Database
- MongoDB connection (Motor):
  - Created in `server.py` using `AsyncIOMotorClient(os.environ['MONGO_URL'])`
  - DB: `db = client[os.environ['DB_NAME']]`
- Models & Schemas:
  - Primary domain models and request/response schemas live in `backend/models.py` and related service modules.
- Migrations:
  - SQL files under `backend/migrations/` are auxiliary; most persistence is Mongo collections.

### Authentication
- Bearer token auth via `fastapi.security.HTTPBearer`.
- Shared dependency to avoid circular imports: `backend/dependencies.py`.
  - `get_current_user` is set by the server at runtime.
- Role checks use `UserRole` (e.g., ADMIN) from `backend/auth_models.py`.

### App Structure
- `backend/server.py` wires all services and includes routers.
- Feature services under `backend/services/`: email, preferences, referrals, buy requests, KYC, wishlist, pricing alerts, AI search/matching, SSE, analytics, moderation, etc.
- Notable services used at startup (availability may depend on env keys):
  - `NotificationService`, `NotificationWorker`, `EmailService`
  - AI/ML: `AIEnhancedService`, `AdvancedSearchService`, `MLMatchingService`, `MLEngineService`, `OpenAIListingService`
  - Payments/Logistics: `PaystackService`, `AIShippingOptimizer`, `AIMobilePaymentService`
  - Realtime/SSE: `RealTimeMessagingService`, `sse_service`

### Routers and Endpoints
- Notification APIs are organized in modular routers under `backend/routes/` and are included in `server.py` under `/api`:
  - Admin Notification Router (prefix `/api/admin`, tag `admin-notifications`):
    - GET `/api/admin/settings/notifications`
    - PUT `/api/admin/settings/notifications`
    - GET `/api/admin/templates`
    - PUT `/api/admin/templates/{template_key}`
    - POST `/api/admin/templates/{template_key}/preview`
    - GET `/api/admin/outbox`
    - POST `/api/admin/outbox/run-once`
    - POST `/api/admin/outbox/{notification_id}/retry`
    - Requires `UserRole.ADMIN`.
  - User Notification Router (prefix `/api`, tag `user-notifications`):
    - GET `/api/me/notifications`
    - PUT `/api/me/notifications`
    - POST `/api/unsubscribe` (public token-based)
    - GET `/api/preferences/species`
    - GET `/api/preferences/provinces`

#### Development Introspection (non-production only)
- Included under `/api/__introspection` when `ENVIRONMENT` is not `production`.
  - GET `/api/__introspection/endpoints` — inventory of FastAPI routes
  - GET `/api/__introspection/sse-topics` — registered SSE topics
  - GET `/api/__introspection/communication-summary` — grouped overview
  - POST `/api/__introspection/refresh-inventory` — rescan routes

### CORS
- CORS middleware is configured in `server.py` with allowed origins updated as needed for your environments.

### Background Processing
- Primary background operations use the in-app `NotificationWorker` (enqueue and run endpoints exposed under admin routes).
- Celery & Redis are available in `requirements.txt` for larger workloads; integration hooks can be added as needed.

### Development Workflow
- Add a route:
  - Create a router module in `backend/routes/` and include it in `server.py` with an `/api/...` prefix.
- Add a service:
  - Implement in `backend/services/`, initialize once in `server.py`. Guard external integrations by env checks.
- Database usage:
  - Use the shared `db` (Motor) instance; keep handlers async, return Pydantic models/dicts.
- Authentication in routes:
  - Use `Depends(get_current_user)` from `backend/dependencies.py` and check roles when needed.

### Testing & Quality
- Tests:
```bash
/Users/manishankarvakta/Desktop/StockLot/backend/venv/bin/pytest -q /Users/manishankarvakta/Desktop/StockLot/backend
```
- Lint & format:
```bash
/Users/manishankarvakta/Desktop/StockLot/backend/venv/bin/flake8 /Users/manishankarvakta/Desktop/StockLot/backend
/Users/manishankarvakta/Desktop/StockLot/backend/venv/bin/black --check /Users/manishankarvakta/Desktop/StockLot/backend
/Users/manishankarvakta/Desktop/StockLot/backend/venv/bin/isort --check-only /Users/manishankarvakta/Desktop/StockLot/backend
```

### Troubleshooting
- Startup 500 errors: ensure `.env` exists and `MONGO_URL`, `DB_NAME`, `JWT_SECRET_KEY` are set.
- Mongo connection failures: check local MongoDB/URI; verify network access.
- 403 on dev introspection: set `ENVIRONMENT!=production`.
- Admin-only endpoints: the token must belong to a user with `ADMIN` role.
- Hot reload not working: pass `--reload` and correct `--app-dir` as shown above.

### Useful Paths
- Entry app: `/Users/manishankarvakta/Desktop/StockLot/backend/server.py`
- Routes: `/Users/manishankarvakta/Desktop/StockLot/backend/routes/`
- Services: `/Users/manishankarvakta/Desktop/StockLot/backend/services/`
- Models: `/Users/manishankarvakta/Desktop/StockLot/backend/models.py` (plus `models/*` modules)
- Dev tools: `/Users/manishankarvakta/Desktop/StockLot/backend/services/endpoint_inventory.py`

---
If you need deeper API-by-API details, see `API_DOCUMENTATION.md` and Swagger at `/docs`.


