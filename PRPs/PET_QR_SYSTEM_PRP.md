name: "Pet QR System - Production-Ready B2B2C SaaS Platform"
description: |

## Purpose
Complete Product Requirements Prompt for implementing a multi-tenant Pet QR information management system with mobile-first design, QR code generation, PIN verification, and brand customization capabilities.

## Core Principles
1. **Mobile-First Design**: 420px optimal container width with responsive scaling
2. **Multi-Tenant Architecture**: Schema-based isolation with Tier 1/Tier 2 deployment options
3. **Security-First**: QR + PIN dual verification system with data isolation
4. **Progressive Enhancement**: Start with MVP, validate, then enhance
5. **Demo-Driven Development**: Use examples/demo/ as UX/UI reference
6. **International Ready**: Multi-language support (EN/ZH/ES/FR) from day one

---

## Goal
Build a production-ready B2B2C SaaS platform that enables pet stores and brands to create customized QR code-based pet information systems. Each tenant gets their own branded experience while sharing core infrastructure.

## Why
- **Business Value**: Enable pet stores to provide modern, professional pet identification services
- **Market Opportunity**: Replace traditional pet tags with interactive, updateable QR systems
- **Scalability**: Multi-tenant architecture supports rapid business growth
- **User Experience**: Mobile-optimized scanning experience with professional UI/UX
- **Competitive Advantage**: Full customization and white-label capabilities

## What
A complete platform consisting of:
1. **Mobile-first Web App**: QR scanning, PIN verification, pet profiles
2. **Backend API**: Multi-tenant FastAPI with PostgreSQL
3. **Admin Dashboard**: Tenant management, QR generation, analytics
4. **Customization Engine**: Dynamic themes, fonts, branding per tenant

### Success Criteria
- [ ] Support 5+ concurrent tenants with independent branding
- [ ] Mobile page load times under 2 seconds
- [ ] QR code + PIN verification flow under 10 seconds
- [ ] 99.9% uptime for QR scanning functionality
- [ ] Complete multi-language support (EN/ZH/ES/FR)
- [ ] Database supports 10,000+ pets per tenant

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /Users/pin/Desktop/Context-Engineering-Intro/INITIAL.md
  why: Complete project specifications and business requirements
  critical: B2B2C model, multi-tenant architecture, mobile-first design

- file: /Users/pin/Desktop/Context-Engineering-Intro/PLANNING.md
  why: Technical architecture, database design, development phases
  critical: Schema-based multi-tenancy, AWS deployment strategy

- file: /Users/pin/Desktop/Context-Engineering-Intro/PROJECT_PROGRESS.md
  why: Current implementation status and completed foundation
  critical: What's already built vs what needs implementation

- file: /Users/pin/Desktop/Context-Engineering-Intro/examples/demo/index.html
  why: Complete UI/UX reference implementation
  critical: Mobile-first design patterns, PIN flow, pet display layout

- doc: https://fastapi.tiangolo.com/
  section: Dependency injection, async endpoints, middleware
  critical: Multi-tenant middleware patterns for domain routing

- doc: https://sqlmodel.tiangolo.com/
  section: Relationships, migrations, async operations
  critical: Multi-schema operations and tenant isolation

- doc: https://tailwindcss.com/docs/responsive-design
  section: Mobile-first utilities, container queries
  critical: 420px container optimization from demo

- doc: https://vitejs.dev/guide/
  section: PWA configuration, build optimization
  critical: Mobile performance and offline capabilities
```

### Current Codebase Tree
```bash
/Users/pin/Desktop/Context-Engineering-Intro
├── backend/
│   ├── app/
│   │   ├── core/           # Settings, DB config, exceptions ✅
│   │   ├── models/         # SQLModel entities ✅
│   │   ├── api/routes/     # Endpoint stubs ✅
│   │   ├── middleware/     # Tenant routing ✅
│   │   ├── services/       # Business logic (empty)
│   │   └── utils/          # Helpers (empty)
│   ├── migrations/         # Alembic (not setup)
│   └── requirements.txt    # Dependencies ✅
├── frontend/
│   ├── src/
│   │   ├── hooks/          # Theme, language hooks ✅
│   │   ├── components/     # Reusable UI (empty)
│   │   ├── pages/          # Route components (empty)
│   │   └── stores/         # Zustand stores (empty)
│   ├── package.json        # React 18 + Vite ✅
│   └── tailwind.config.js  # Mobile-first config ✅
├── shared/
│   ├── src/types/          # Complete TypeScript types ✅
│   ├── src/validation/     # Zod schemas ✅
│   └── src/utils/          # Shared utilities ✅
├── examples/demo/          # UI/UX reference ✅
└── docker-compose.yml      # PostgreSQL + Redis ✅
```

### Desired Codebase Tree with Implementation
```bash
# COMPLETED FILES (✅)
backend/app/core/           # Database, config, exceptions
backend/app/models/         # All SQLModel entities
backend/app/middleware/     # Tenant routing middleware
frontend/src/hooks/         # Theme and language management
shared/src/                 # Types, validation, utilities

# TO IMPLEMENT (🔨)
backend/app/services/
├── auth_service.py         # JWT authentication, password hashing
├── tenant_service.py       # Tenant management, schema switching
├── qr_service.py          # QR generation, PIN verification
├── pet_service.py         # Pet CRUD with tenant isolation
└── email_service.py       # AWS SES notifications

backend/app/utils/
├── qr_generator.py        # QR code creation with PIN
├── image_handler.py       # Photo upload, compression
└── validators.py          # Input validation helpers

backend/migrations/        # Alembic migration files

frontend/src/components/
├── auth/                  # Login, register forms
├── qr/                    # PIN entry, verification
├── pet/                   # Pet display, profile
├── common/                # Layout, theme, navigation
└── admin/                 # Dashboard, management

frontend/src/pages/
├── LanguageSelectionPage.tsx    # Multi-language entry
├── PinVerificationPage.tsx      # 4-digit PIN input
├── PetDisplayPage.tsx           # Pet information view
├── AuthPages.tsx                # Login/register
└── DashboardPage.tsx            # Admin interface

frontend/src/stores/
├── authStore.ts           # Authentication state
├── tenantStore.ts         # Current tenant context
├── petStore.ts            # Pet data management
└── uiStore.ts             # Theme, language, modals
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: FastAPI Multi-tenant Middleware
# Must set tenant context before database operations
async def tenant_middleware(request: Request, call_next):
    tenant = await get_tenant_from_domain(request.url.hostname)
    request.state.tenant = tenant
    # GOTCHA: Must set schema BEFORE any SQLModel operations
    request.state.db_schema = tenant.schema_name

# CRITICAL: SQLModel Schema Switching
# Cannot use default session - must inject schema per query
async def get_tenant_session(schema: str):
    # GOTCHA: PostgreSQL requires explicit schema in table references
    engine = create_engine(f"postgresql://user:pass@host/db?options=-csearch_path={schema}")

# CRITICAL: Tailwind CSS Variables for Dynamic Theming
# Must use CSS custom properties, not Tailwind JIT for runtime themes
:root {
  --color-primary: 99 102 241;  # Default indigo
  --tenant-primary: var(--tenant-primary, var(--color-primary));
}

# CRITICAL: React Router + Multi-tenant Routing
# Domain-based routing requires basename configuration
const router = createBrowserRouter(routes, {
  basename: tenant.path_prefix || "/"
});

# CRITICAL: PIN Verification Security
# Must hash PINs, never store plaintext
pin_hash = bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt())
# GOTCHA: QR codes must be pre-generated for factory printing

# CRITICAL: Image Upload to AWS S3
# Must resize images for mobile performance
from PIL import Image
def optimize_pet_image(image_data):
    img = Image.open(image_data)
    # CRITICAL: Mobile screens need multiple sizes
    sizes = [(400, 300), (800, 600)]  # thumbnail, full

# CRITICAL: Multi-language from Demo
# Language detection: URL param > localStorage > browser default
const getInitialLanguage = () => {
  const urlLang = new URLSearchParams(location.search).get('lang')
  if (urlLang) return urlLang
  return localStorage.getItem('language') || navigator.language.split('-')[0]
}
```

## Implementation Blueprint

### Data Models and Structure

Core database schema with multi-tenant isolation:
```python
# Shared schema (global)
class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "shared"}

    id: int = Field(primary_key=True)
    name: str = Field(max_length=100)
    subdomain: str = Field(unique=True, max_length=50)
    custom_domain: Optional[str] = Field(default=None)
    tier: str = Field(default="standard")  # standard, enterprise
    schema_name: str = Field(unique=True)
    theme_config: dict = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Tenant-specific schema
class Pet(SQLModel, table=True):
    __tablename__ = "pets"
    # NOTE: Schema set dynamically via middleware

    id: int = Field(primary_key=True)
    name: str = Field(max_length=100)
    breed: str = Field(max_length=100)
    age_months: int
    photos: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    medical_info: dict = Field(default_factory=dict, sa_column=Column(JSON))
    owner_id: int = Field(foreign_key="tenant_users.id")
    qr_code_id: Optional[int] = Field(foreign_key="qr_codes.id")

class QRCode(SQLModel, table=True):
    __tablename__ = "qr_codes"

    id: int = Field(primary_key=True)
    code: str = Field(unique=True, max_length=50)  # UUID
    pin_hash: str = Field(max_length=100)  # bcrypt hash
    status: str = Field(default="inactive")  # inactive, active, expired
    pet_id: Optional[int] = Field(foreign_key="pets.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None
```

### List of Tasks in Implementation Order

```yaml
Phase 1: Authentication & Core Infrastructure (Week 1)

Task 1: Setup Alembic Database Migrations
MODIFY backend/app/core/database.py:
  - ADD alembic configuration
  - CREATE migration environment
  - SETUP multi-schema migration support

CREATE backend/migrations/env.py:
  - CONFIGURE Alembic for multi-tenant schemas
  - ADD schema creation logic
  - SETUP migration execution per tenant

Task 2: Implement JWT Authentication Service
CREATE backend/app/services/auth_service.py:
  - PATTERN: Follow FastAPI-Users patterns
  - FUNCTIONS: login, register, refresh_token, verify_token
  - SECURITY: bcrypt password hashing, JWT with expiration

MODIFY backend/app/api/routes/auth.py:
  - ADD endpoints: /login, /register, /refresh, /verify
  - PATTERN: Use dependency injection for current_user
  - VALIDATION: Use shared Zod schemas

Task 3: Implement Multi-Tenant Service
CREATE backend/app/services/tenant_service.py:
  - FUNCTION: get_tenant_by_domain(domain: str)
  - FUNCTION: create_tenant_schema(schema_name: str)
  - PATTERN: Cache tenant lookups with Redis

MODIFY backend/app/middleware/tenant.py:
  - ENHANCE: Add schema switching logic
  - ADD: Request state management
  - PATTERN: Use FastAPI dependency injection

Phase 2: QR Code & Pet Management (Week 2)

Task 4: QR Code Generation Service
CREATE backend/app/services/qr_service.py:
  - FUNCTION: generate_qr_batch(count: int, tenant_id: int)
  - FUNCTION: verify_pin(qr_code: str, pin: str)
  - PATTERN: Use qrcode library with error correction
  - SECURITY: PIN hashing with bcrypt

CREATE backend/app/utils/qr_generator.py:
  - FUNCTION: create_qr_image(code: str, tenant_branding: dict)
  - PATTERN: PIL image generation with logo overlay
  - OUTPUT: Base64 encoded image + downloadable PNG

Task 5: Pet Information Management
CREATE backend/app/services/pet_service.py:
  - FUNCTIONS: create_pet, get_pet, update_pet, delete_pet
  - PATTERN: Tenant-aware database queries
  - VALIDATION: Use shared Pydantic models

CREATE backend/app/utils/image_handler.py:
  - FUNCTION: upload_to_s3(image_data, tenant_id, pet_id)
  - FUNCTION: resize_image(image, sizes=[(400,300), (800,600)])
  - PATTERN: AWS S3 integration with tenant-specific folders

Phase 3: Frontend Core Pages (Week 2-3)

Task 6: Language Selection Page
CREATE frontend/src/pages/LanguageSelectionPage.tsx:
  - MIRROR: examples/demo/index.html language selection
  - PATTERN: Use useLanguage hook for state management
  - DESIGN: 420px container with responsive grid layout

Task 7: PIN Verification Page
CREATE frontend/src/pages/PinVerificationPage.tsx:
  - MIRROR: examples/demo PIN entry interface
  - COMPONENT: 4-digit input with auto-advance
  - VALIDATION: Real-time PIN verification API calls
  - ERROR: User-friendly error states and retry logic

Task 8: Pet Display Page
CREATE frontend/src/pages/PetDisplayPage.tsx:
  - MIRROR: examples/demo pet information layout
  - COMPONENTS: Image gallery, info cards, contact buttons
  - RESPONSIVE: Mobile-first with bento grid layout
  - FEATURES: Location sharing, phone calls, store links

Task 9: Authentication Pages
CREATE frontend/src/pages/AuthPages.tsx:
  - COMPONENTS: Login form, registration form
  - VALIDATION: Real-time form validation with error display
  - PATTERN: Use authStore for state management
  - DESIGN: Consistent with demo styling

Phase 4: Component Library (Week 3)

Task 10: Core UI Components
CREATE frontend/src/components/common/:
  - Layout.tsx: Header, navigation, theme switching
  - Button.tsx: Consistent button styling and states
  - Input.tsx: Form inputs with validation display
  - Modal.tsx: Overlay modals for forms and images
  - LoadingSpinner.tsx: Loading states for async operations

Task 11: QR Specific Components
CREATE frontend/src/components/qr/:
  - PinInput.tsx: 4-digit PIN entry component
  - QRDisplay.tsx: QR code image with download option
  - VerificationStatus.tsx: Success/error state display

Task 12: Pet Components
CREATE frontend/src/components/pet/:
  - PetProfile.tsx: Complete pet information display
  - ImageGallery.tsx: Swipeable photo gallery
  - ContactOwner.tsx: Location sharing and contact buttons
  - PetForm.tsx: Pet information creation/editing

Phase 5: State Management & API Integration (Week 3-4)

Task 13: Zustand Stores
CREATE frontend/src/stores/:
  - authStore.ts: Authentication state and API calls
  - tenantStore.ts: Current tenant context and branding
  - petStore.ts: Pet data caching and CRUD operations
  - uiStore.ts: Theme, language, modal states

Task 14: API Service Layer
CREATE frontend/src/services/:
  - api.ts: Base API client with tenant headers
  - authService.ts: Authentication API calls
  - petService.ts: Pet CRUD operations
  - qrService.ts: QR verification and generation

Phase 6: Advanced Features & Polish (Week 4)

Task 15: Admin Dashboard
CREATE frontend/src/pages/DashboardPage.tsx:
  - FEATURES: QR generation, pet management, analytics
  - CHARTS: Scan events, activation rates, usage stats
  - CONTROLS: Tenant settings, theme customization

Task 16: PWA Features
MODIFY frontend/vite.config.ts:
  - ADD: Service worker configuration
  - FEATURES: Offline pet viewing, background sync
  - MANIFEST: App icons, splash screens

Task 17: Performance Optimization
IMPLEMENT:
  - Image lazy loading and compression
  - API response caching with TanStack Query
  - Bundle splitting and code splitting
  - Mobile performance testing and optimization
```

### Integration Points
```yaml
DATABASE:
  - migrations: "Create shared.tenants and per-tenant schemas"
  - indexes: "CREATE INDEX idx_qr_lookup ON qr_codes(code, status)"
  - constraints: "UNIQUE constraint on (tenant_id, subdomain)"

CONFIG:
  - add to: backend/app/core/config.py
  - vars: AWS_S3_BUCKET, JWT_SECRET_KEY, DATABASE_URL
  - pattern: "Settings(BaseSettings) with env validation"

ROUTES:
  - add to: backend/app/main.py
  - pattern: "app.include_router(auth_router, prefix='/api/auth')"
  - middleware: "TenantMiddleware before route processing"

AWS_SERVICES:
  - S3: Pet photo storage with tenant-specific folders
  - SES: Email notifications for account creation
  - RDS: PostgreSQL with multi-schema support
  - CloudFront: CDN for pet images and static assets
```

## Validation Loop

### Level 1: Development Environment
```bash
# Start services and verify connectivity
docker-compose up postgres redis -d
curl http://localhost:5432  # Should connect to PostgreSQL
redis-cli ping             # Should return PONG

# Backend dependencies and type checking
cd backend
python -m venv venv_linux
source venv_linux/bin/activate
pip install -r requirements.txt
mypy app/                  # No type errors
ruff check app/ --fix      # Auto-fix style issues

# Frontend dependencies and build
cd frontend
npm install
npm run build              # Successful build
npm run type-check         # No TypeScript errors
```

### Level 2: API Integration Tests
```python
# CREATE backend/tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_tenant_routing():
    """Multi-tenant routing works correctly"""
    # Test subdomain routing
    response = client.get("/", headers={"Host": "demo.petqr.com"})
    assert response.headers.get("X-Tenant") == "demo"

def test_qr_pin_verification():
    """QR code + PIN verification flow"""
    # Create QR code
    qr_response = client.post("/api/qr/generate", json={"count": 1})
    qr_code = qr_response.json()["codes"][0]

    # Verify with correct PIN
    verify_response = client.post(
        "/api/qr/verify",
        json={"code": qr_code["code"], "pin": qr_code["pin"]}
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "verified"

def test_pet_crud_tenant_isolation():
    """Pet operations respect tenant boundaries"""
    # Create pets in different tenants
    pet1 = client.post("/api/pets",
                      json={"name": "Buddy", "breed": "Golden"},
                      headers={"Host": "tenant1.petqr.com"})

    pet2 = client.post("/api/pets",
                      json={"name": "Max", "breed": "Labrador"},
                      headers={"Host": "tenant2.petqr.com"})

    # Verify tenant1 cannot see tenant2's pets
    pets_response = client.get("/api/pets",
                              headers={"Host": "tenant1.petqr.com"})
    pet_names = [p["name"] for p in pets_response.json()]
    assert "Buddy" in pet_names
    assert "Max" not in pet_names
```

```bash
# Run integration tests
cd backend
pytest tests/test_integration.py -v
# Expected: All tests pass, no database leakage between tenants
```

### Level 3: Frontend E2E Testing
```bash
# Start full development environment
docker-compose up -d
cd backend && uvicorn app.main:app --reload &
cd frontend && npm run dev &

# Test complete user flows
npx playwright test
# Or manual testing:

# 1. Language Selection Flow
curl http://localhost:5173/?lang=zh
# Expected: Chinese interface loads correctly

# 2. PIN Verification Flow
curl -X POST http://localhost:8000/api/qr/verify \
  -H "Content-Type: application/json" \
  -d '{"code": "test-qr-123", "pin": "1234"}'
# Expected: {"status": "verified", "pet_id": 123}

# 3. Pet Display Flow
curl http://localhost:8000/api/pets/123 \
  -H "Host: demo.petqr.com"
# Expected: Complete pet information with photos
```

### Level 4: Mobile Performance Testing
```bash
# Lighthouse mobile audit
npm install -g lighthouse
lighthouse http://localhost:5173 --preset=mobile --view

# Expected scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >90
# SEO: >90

# Mobile-specific testing
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)" \
     http://localhost:5173
# Expected: Mobile-optimized layout, 420px container
```

## Final Validation Checklist
- [ ] All backend tests pass: `pytest backend/tests/ -v`
- [ ] No linting errors: `ruff check backend/app/`
- [ ] No type errors: `mypy backend/app/`
- [ ] Frontend builds without errors: `npm run build`
- [ ] TypeScript compilation clean: `npm run type-check`
- [ ] Mobile Lighthouse scores >90 across all metrics
- [ ] Multi-tenant isolation verified in database
- [ ] QR + PIN verification flow under 10 seconds
- [ ] All 4 languages display correctly
- [ ] Theme switching works across light/dark modes
- [ ] Pet image upload and display functional
- [ ] Demo UI patterns accurately reproduced

---

## Success Metrics

### MVP Success (Week 4):
- [ ] Users can scan QR codes and verify PINs on mobile
- [ ] Pet information displays with photo gallery
- [ ] Multi-language support works seamlessly
- [ ] 2+ tenant brands can operate independently
- [ ] Admin can generate QR codes in batches
- [ ] Database supports 1000+ pets per tenant

### Production Success (Week 8):
- [ ] 5+ concurrent tenants with custom branding
- [ ] Mobile page loads under 2 seconds
- [ ] 99.9% uptime for QR scanning
- [ ] 10,000+ pets supported per tenant
- [ ] Complete AWS deployment pipeline
- [ ] Customer support ticket system functional

## Anti-Patterns to Avoid
- ❌ Don't skip mobile-first design - QR codes are primarily mobile scanned
- ❌ Don't implement tenant isolation as an afterthought - build it from day one
- ❌ Don't ignore the demo UI patterns - they're proven UX
- ❌ Don't use synchronous code for database operations
- ❌ Don't store PINs in plaintext - always hash
- ❌ Don't hardcode tenant-specific values - use dynamic configuration
- ❌ Don't skip performance testing - mobile users will abandon slow apps
- ❌ Don't implement auth without refresh tokens - session management is critical