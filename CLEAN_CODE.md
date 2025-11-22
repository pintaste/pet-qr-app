# Clean Code Guidelines for Pet QR App

This document defines the Clean Code standards that all AI assistants and developers must follow when working on this project.

## File Size Limits

- **Maximum file size**: 500 lines of code
- **Maximum function/method size**: 50 lines
- **If a file approaches these limits**: Refactor by splitting into modules or helper files

## Current Violations to Fix

| File | Current Lines | Target | Priority |
|------|--------------|--------|----------|
| `SuperAdminDashboard.tsx` | 2,990 | <500 | CRITICAL |
| `PetDisplayPage.tsx` | 1,971 | <500 | CRITICAL |

## Code Organization

### Component Structure
```
frontend/src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── modals/           # All modal components
│   ├── dashboard/        # Dashboard-specific components
│   ├── super-admin/      # Super Admin feature components
│   ├── tenant/           # Tenant Admin feature components
│   └── forms/            # Form components
├── pages/
├── services/
├── hooks/
├── stores/
├── utils/
├── config/
└── types/
```

### State Management Rules

1. **Maximum useState per component**: 10
   - If more needed, use `useReducer` or extract to custom hook

2. **Related state should be grouped**:
   ```typescript
   // BAD
   const [isDragging, setIsDragging] = useState(false)
   const [startX, setStartX] = useState(0)
   const [scrollLeft, setScrollLeft] = useState(0)

   // GOOD
   const [scrollState, setScrollState] = useState({
     isDragging: false,
     startX: 0,
     scrollLeft: 0
   })

   // BETTER - Custom hook
   const { scrollState, handlers } = useScrollDrag()
   ```

3. **Modal state management**:
   ```typescript
   // Extract to hook
   const { modals, openModal, closeModal } = useModalManager({
     add: false,
     edit: false,
     delete: false,
   })
   ```

## TypeScript Rules

### No `any` Type
```typescript
// BAD
nearbyPlaces: any[]
basic_medical_info: any

// GOOD
interface Place {
  lat: number
  lng: number
  name: string
  address?: string
}
nearbyPlaces: Place[]

interface MedicalInfo {
  microchip_id?: string
  medical_conditions?: string
  medications?: string
}
basic_medical_info: MedicalInfo
```

### Explicit Return Types
```typescript
// BAD
const handleSubmit = async () => { ... }

// GOOD
const handleSubmit = async (): Promise<void> => { ... }
```

## Configuration Management

### No Hardcoded Values
Create `frontend/src/config/constants.ts`:
```typescript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
}

export const PAGINATION = {
  QR_CODES_PER_PAGE: 100,
  TENANTS_PER_PAGE: 100,
  USERS_PER_PAGE: 100,
  ACTIVITIES_PER_PAGE: 20,
}

export const EXTERNAL_URLS = {
  STORE: import.meta.env.VITE_STORE_URL || 'https://example.com/store',
}
```

### No Magic Numbers
```typescript
// BAD
const codes = await service.getAllQRCodes({ limit: 1000000 })

// GOOD
import { LIMITS } from '@/config/constants'
const codes = await service.getAllQRCodes({ limit: LIMITS.MAX_QR_CODES })
```

## Performance Optimization

### Use Memoization
```typescript
// For expensive calculations
const filteredQRCodes = useMemo(() => {
  return qrCodes.filter(qr => {
    // filtering logic
  })
}, [qrCodes, searchQuery, statusFilter])

// For callback functions passed to children
const handleDownload = useCallback(async (qr: QRCodeData) => {
  // logic
}, [dependencies])
```

## Error Handling

### Frontend Pattern
```typescript
// utils/errorHandling.ts
export const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unknown error occurred'
}

// Usage
try {
  await service.doSomething()
} catch (error) {
  setError(handleError(error))
  logger.error('Context', error)
}
```

### Backend Pattern
```python
# BAD - Bare except
except Exception:
    pass

# GOOD - Specific exceptions
except ValueError as e:
    raise HTTPException(status_code=400, detail="Invalid input")
except DatabaseError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(status_code=500, detail="Database error")
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal server error")
```

## Logging

### Use Logger Utility
```typescript
// utils/logger.ts
export const logger = {
  log: (msg: string, data?: any) => {
    if (import.meta.env.DEV) console.log(`[LOG] ${msg}`, data)
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error)
    // Send to error tracking in production
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[WARN] ${msg}`, data)
  },
}

// BAD
console.log('Fetching data...')

// GOOD
logger.log('Fetching pet data', { petId })
```

## Code Duplication

### Extract Shared Logic
```typescript
// BAD - 120+ lines duplicated between handleDownloadQR and handleBulkDownload

// GOOD - Extract to utility
// utils/qrCodeRenderer.ts
export const renderQRCodeToCanvas = async (
  qrUrl: string,
  qrCode: QRCodeData,
  style: 'scanner' | 'rounded'
): Promise<string> => {
  // Shared rendering logic
}
```

## React Best Practices

### Error Boundaries
Every route should have error boundary:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Routes>
    <Route path="/dashboard/*" element={<DashboardPage />} />
  </Routes>
</ErrorBoundary>
```

### Separation of Concerns
```typescript
// BAD - API call in component
const response = await fetch(`${API_URL}/pets/${petId}`)

// GOOD - API call in service
// services/petService.ts
export const petService = {
  getPetInfo: async (petId: number): Promise<PetInfo> => {
    return apiClient.get(`/pets/${petId}`)
  },
}

// In component
const petInfo = await petService.getPetInfo(petId)
```

## Documentation

### JSDoc for Public Functions
```typescript
/**
 * Renders a QR code to canvas with styling.
 *
 * @param qrUrl - The URL to encode
 * @param qrCode - QR code data with PIN and code
 * @param style - Visual style: 'scanner' or 'rounded'
 * @returns Data URL of the rendered image
 *
 * @example
 * const dataUrl = await renderQRCodeToCanvas(url, data, 'scanner')
 */
export const renderQRCodeToCanvas = async (
  qrUrl: string,
  qrCode: QRCodeData,
  style: 'scanner' | 'rounded' = 'scanner'
): Promise<string> => { ... }
```

## TODO Management

- All TODOs must be tracked in TASK.md
- Each TODO should have:
  - Description
  - Priority (Critical/High/Medium/Low)
  - Target date
  - Owner

## Refactoring Checklist

Before submitting code, verify:

- [ ] No file exceeds 500 lines
- [ ] No function exceeds 50 lines
- [ ] No `any` types used
- [ ] No hardcoded URLs or magic numbers
- [ ] Proper error handling with specific exceptions
- [ ] Performance hooks (useMemo/useCallback) where needed
- [ ] Logger used instead of console.log
- [ ] JSDoc for public functions
- [ ] No duplicate code blocks >10 lines

## Current Refactoring Tasks

1. **SuperAdminDashboard.tsx** (2,990 lines)
   - Extract QRFactory component
   - Extract OverviewTab component
   - Extract TenantsTab component
   - Extract UsersTab component
   - Create useActivityFeed hook
   - Create useQRFactory hook

2. **PetDisplayPage.tsx** (1,971 lines)
   - Extract PetGallery component
   - Extract PetDetailsSection component
   - Create useLocationHandler hook
   - Move mock data to config

3. **Backend Exception Handling**
   - Replace all bare `except Exception:` blocks
   - Add specific exception types
   - Add proper logging

4. **Type Safety**
   - Replace all `any` types with proper interfaces
   - Add explicit return types to functions
