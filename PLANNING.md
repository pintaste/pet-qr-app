# Pet QR System - Development Planning

## Project Overview

**基于二维码的宠物信息管理与展示系统**
B2B2C SaaS平台，支持多宠物店/品牌定制，提供QR码生成、宠物信息管理、扫码展示等功能。

## Architecture Design

### Deployment Strategy
```
分层SaaS架构
├── Tier 1 (Enterprise): 独立RDS + 自定义域名 + 深度定制
├── Tier 2 (Standard): 共享RDS + Schema隔离 + 基础定制
└── Core Platform: 统一代码库 + 动态主题系统
```

### Technology Stack

**Backend**
- **Framework**: FastAPI + Uvicorn
- **Database**: PostgreSQL + SQLModel
- **Authentication**: JWT + Refresh Token
- **Cloud**: AWS (RDS, S3, SES, CloudFront)
- **Deployment**: Docker + AWS ECS

**Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + CSS Variables
- **State**: Zustand + TanStack Query
- **Icons**: Lucide React (flexible)
- **Fonts**: Inter (flexible)

**Shared/Utils**
- **QR Generation**: qrcode library
- **Image Processing**: Pillow (backend) + sharp (if needed)
- **Email**: AWS SES
- **Validation**: Zod (shared schemas)

## Database Design

### Multi-Tenant Strategy
- **Schema-based isolation**: Each brand gets dedicated schema
- **Tenant routing**: Middleware determines tenant from domain/subdomain
- **Data export control**: Super admin toggleable per tenant

### Core Tables Structure
```sql
-- Shared tables (public schema)
tenants (id, name, subdomain, custom_domain, tier, settings)
users (id, email, tenant_id, role, created_at)

-- Tenant-specific schema per brand
{tenant_schema}.pets (id, name, breed, age, photos, owner_id)
{tenant_schema}.qr_codes (id, code, pin, pet_id, status, created_at)
{tenant_schema}.scan_events (id, qr_code_id, location, ip, timestamp)
```

## Development Phases

### Phase 1: MVP Foundation (Weeks 1-3)
**Goal**: Basic functional system with core features

**Backend Tasks:**
- [ ] FastAPI project setup with Docker
- [ ] PostgreSQL + SQLModel base models
- [ ] JWT authentication system
- [ ] Basic tenant middleware
- [ ] User registration/login endpoints
- [ ] QR code generation endpoint
- [ ] Pet CRUD operations

**Frontend Tasks:**
- [ ] React + Vite + TypeScript setup
- [ ] Tailwind CSS configuration
- [ ] Basic routing (React Router)
- [ ] Authentication pages (login/register)
- [ ] PIN verification page (based on demo)
- [ ] Pet display page (mobile-first)
- [ ] Basic theme system (day/night mode)

**Database:**
- [ ] Core schema design
- [ ] Migration system setup
- [ ] Seed data for testing

### Phase 2: Multi-Tenant & Customization (Weeks 4-5)
**Goal**: Support multiple brands with basic customization

**Backend Tasks:**
- [ ] Tenant routing and schema switching
- [ ] Brand settings management
- [ ] QR batch generation system
- [ ] Basic dashboard APIs
- [ ] Email notification system (AWS SES)

**Frontend Tasks:**
- [ ] Dynamic theme loading
- [ ] Brand customization interface
- [ ] QR code management dashboard
- [ ] Basic analytics dashboard
- [ ] Responsive design polish

### Phase 3: Advanced Features (Weeks 6-8)
**Goal**: Production-ready platform with full feature set

**Backend Tasks:**
- [ ] Advanced dashboard analytics
- [ ] Data export functionality
- [ ] Rate limiting and security
- [ ] Admin panel APIs
- [ ] Support ticket system
- [ ] Audit logging

**Frontend Tasks:**
- [ ] Admin panel interface
- [ ] Advanced dashboard charts
- [ ] Support ticket interface
- [ ] Mobile app preparation (shared components)
- [ ] Performance optimization

### Phase 4: Production & Polish (Weeks 9-10)
**Goal**: Deploy and optimize for production

**DevOps & Production:**
- [ ] AWS infrastructure setup
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Backup strategies
- [ ] SSL and security hardening
- [ ] Performance testing

## File Structure

```
pet-qr-system/
├── backend/
│   ├── app/
│   │   ├── core/           # Settings, security, dependencies
│   │   ├── models/         # SQLModel models
│   │   ├── api/            # FastAPI routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Tenant routing, auth
│   │   └── utils/          # Helpers, QR generation
│   ├── tests/
│   ├── migrations/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom hooks
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript types
│   │   └── themes/         # Theme configurations
│   ├── public/
│   └── package.json
├── shared/
│   ├── types/              # Shared TypeScript types
│   ├── validation/         # Zod schemas
│   └── utils/              # Shared utilities
└── docs/
    ├── api/                # API documentation
    └── deployment/         # Deployment guides
```

## Key Implementation Details

### Theme System
```typescript
// Dynamic theme loading based on tenant
interface Theme {
  primary: string;
  secondary: string;
  logo: string;
  fonts: FontConfig;
}

// CSS variables for runtime theme switching
```

### Tenant Routing
```python
# Middleware determines tenant from request
async def tenant_middleware(request: Request):
    tenant = get_tenant_from_domain(request.url.hostname)
    request.state.tenant = tenant
    request.state.db_schema = tenant.schema_name
```

### Security Considerations
- Schema-level data isolation
- Rate limiting on QR scanning
- JWT with refresh token rotation
- Input validation with Pydantic/Zod
- Audit logging for sensitive operations

## Success Metrics

**MVP Success:**
- ✅ User can register and create pet profiles
- ✅ QR codes generate with PIN verification
- ✅ Mobile-optimized scanning experience
- ✅ Basic dashboard shows key metrics

**Production Success:**
- ✅ Support 5+ concurrent tenants
- ✅ <2s page load times on mobile
- ✅ 99.9% uptime for QR scanning
- ✅ Successful multi-brand customization

## Risk Mitigation

**Technical Risks:**
- **Multi-tenant complexity**: Start with simple schema isolation
- **Mobile performance**: Progressive Web App features
- **AWS costs**: Monitor usage, implement caching

**Business Risks:**
- **Scope creep**: Stick to defined MVP features
- **User adoption**: Focus on mobile UX quality
- **Competition**: Emphasize customization capabilities

## Next Steps

1. **Setup development environment** (Docker, PostgreSQL, Node.js)
2. **Initialize backend project** with FastAPI structure
3. **Initialize frontend project** with React + Vite
4. **Create shared types package** for consistency
5. **Begin Phase 1 development** following task list above

---

*Last updated: 2025-09-22*
*Next review: Start of each development phase*