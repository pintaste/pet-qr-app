## 🏗️ Project Context

**Pet QR System** - B2B2C SaaS platform for pet information management via QR codes.

**Tech Stack:**
- **Backend**: FastAPI + SQLModel + PostgreSQL (multi-tenant with schema isolation)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Infrastructure**: Docker Compose (PostgreSQL + Redis)
- **Maps**: Google Maps API (via @vis.gl/react-google-maps)

**Key Files:**
- `PLANNING.md` - Architecture, tech stack, development phases
- `TASK.md` - Current tasks, completed work, development logs
- `README.md` - Complete project documentation and setup instructions

### 🔄 Project Awareness & Context
- **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Check `TASK.md`** before starting a new task. If the task isn't listed, add it with a brief description and today's date.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.
- **Development servers**: Frontend on port 3000 (Vite), Backend on port 8000 (FastAPI).

### 🧱 Code Structure & Modularity

**File Size Limits:**
- **Maximum file size**: 500 lines of code
- **Maximum function/method size**: 50 lines
- If a file approaches these limits, refactor by splitting into modules or helper files

**Component Structure:**
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

**Code Organization:**
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Environment variables**: Backend uses `pydantic-settings` BaseSettings (auto-loads from .env).

### 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a "Discovered During Work" section.

### 📎 Style & Conventions

#### Backend (Python/FastAPI)
- **Follow PEP8**, use type hints, and format with `black`
- **Use `pydantic` for data validation**
- **Use `SQLModel` for ORM** (combines SQLAlchemy + Pydantic)
- Write **docstrings for every function** using the Google style:
  ```python
  def example():
      """
      Brief summary.

      Args:
          param1 (type): Description.

      Returns:
          type: Description.
      """
  ```
- **Error Handling Pattern**:
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

#### Frontend (React/TypeScript)
- **Use TypeScript** for type safety
- **Use Tailwind CSS** for styling
- **Use Google Maps API** for location features (via @vis.gl/react-google-maps)

**TypeScript Rules:**
- **No `any` type** - Always use proper interfaces:
  ```typescript
  // BAD
  nearbyPlaces: any[]

  // GOOD
  interface Place {
    lat: number
    lng: number
    name: string
    address?: string
  }
  nearbyPlaces: Place[]
  ```
- **Explicit return types**:
  ```typescript
  // BAD
  const handleSubmit = async () => { ... }

  // GOOD
  const handleSubmit = async (): Promise<void> => { ... }
  ```

**State Management Rules:**
1. **Maximum useState per component**: 10
   - If more needed, use `useReducer` or extract to custom hook
2. **Related state should be grouped**:
   ```typescript
   // BAD
   const [isDragging, setIsDragging] = useState(false)
   const [startX, setStartX] = useState(0)

   // GOOD
   const [scrollState, setScrollState] = useState({
     isDragging: false,
     startX: 0
   })

   // BETTER - Custom hook
   const { scrollState, handlers } = useScrollDrag()
   ```
3. **Modal state management**:
   ```typescript
   const { modals, openModal, closeModal } = useModalManager({
     add: false,
     edit: false,
     delete: false,
   })
   ```

**Performance Optimization:**
```typescript
// For expensive calculations
const filteredQRCodes = useMemo(() => {
  return qrCodes.filter(qr => { /* filtering logic */ })
}, [qrCodes, searchQuery, statusFilter])

// For callback functions passed to children
const handleDownload = useCallback(async (qr: QRCodeData) => {
  // logic
}, [dependencies])
```

**Configuration Management:**
- Create `frontend/src/config/constants.ts` for shared values:
  ```typescript
  export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    TIMEOUT: 30000,
  }

  export const PAGINATION = {
    QR_CODES_PER_PAGE: 100,
    TENANTS_PER_PAGE: 100,
  }
  ```
- **No magic numbers**:
  ```typescript
  // BAD
  const codes = await service.getAllQRCodes({ limit: 1000000 })

  // GOOD
  import { LIMITS } from '@/config/constants'
  const codes = await service.getAllQRCodes({ limit: LIMITS.MAX_QR_CODES })
  ```

**Error Handling Pattern:**
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

**Logging:**
```typescript
// utils/logger.ts
export const logger = {
  log: (msg: string, data?: unknown) => {
    if (import.meta.env.DEV) console.log(`[LOG] ${msg}`, data)
  },
  error: (msg: string, error?: unknown) => {
    console.error(`[ERROR] ${msg}`, error)
  },
}

// BAD
console.log('Fetching data...')

// GOOD
logger.log('Fetching pet data', { petId })
```

**Code Duplication:**
- Extract shared logic to utilities when duplicated >10 lines
  ```typescript
  // BAD - 120+ lines duplicated between handlers

  // GOOD - Extract to utility
  // utils/qrCodeRenderer.ts
  export const renderQRCodeToCanvas = async (
    qrUrl: string,
    qrCode: QRCodeData,
    style: 'scanner' | 'rounded'
  ): Promise<string> => { /* Shared rendering logic */ }
  ```

**React Best Practices:**
- **Error Boundaries** for every route:
  ```typescript
  <ErrorBoundary fallback={<ErrorFallback />}>
    <Routes>
      <Route path="/dashboard/*" element={<DashboardPage />} />
    </Routes>
  </ErrorBoundary>
  ```
- **Separation of Concerns**:
  ```typescript
  // BAD - API call in component
  const response = await fetch(`${API_URL}/pets/${petId}`)

  // GOOD - API call in service
  const petInfo = await petService.getPetInfo(petId)
  ```

**JSDoc for Public Functions:**
```typescript
/**
 * Renders a QR code to canvas with styling.
 *
 * @param qrUrl - The URL to encode
 * @param qrCode - QR code data with PIN and code
 * @param style - Visual style: 'scanner' or 'rounded'
 * @returns Data URL of the rendered image
 */
export const renderQRCodeToCanvas = async (
  qrUrl: string,
  qrCode: QRCodeData,
  style: 'scanner' | 'rounded' = 'scanner'
): Promise<string> => { ... }
```

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

### ✅ Pre-Commit Checklist

Before submitting code, verify:

- [ ] No file exceeds 500 lines
- [ ] No function exceeds 50 lines
- [ ] No `any` types used (TypeScript)
- [ ] No hardcoded URLs or magic numbers
- [ ] Proper error handling with specific exceptions
- [ ] Performance hooks (useMemo/useCallback) where needed
- [ ] Logger used instead of console.log
- [ ] JSDoc for public functions
- [ ] No duplicate code blocks >10 lines

### 🎯 Claude Code Eight Honors and Eight Shames

**Eight Shames (八耻):**
1. **Shame in guessing APIs** – Honor in careful research and documentation lookup
2. **Shame in vague execution** – Honor in seeking confirmation before major changes
3. **Shame in assuming business logic** – Honor in human verification of requirements
4. **Shame in creating interfaces** – Honor in reusing existing APIs and patterns
5. **Shame in skipping validation** – Honor in proactive testing and error checking
6. **Shame in breaking architecture** – Honor in following project specifications
7. **Shame in pretending to understand** – Honor in honest acknowledgment of uncertainty
8. **Shame in blind modification** – Honor in careful refactoring with understanding

**Eight Honors (八荣):**
1. **Honor in understanding before acting** – Read context, analyze structure, then execute
2. **Honor in incremental progress** – Small, tested changes over large, risky rewrites
3. **Honor in clear communication** – Explicit explanations of what, why, and how
4. **Honor in respecting existing patterns** – Follow established conventions and styles
5. **Honor in thorough testing** – Write tests first, verify behavior, then ship
6. **Honor in documentation** – Keep README, PLANNING.md, and TASK.md updated
7. **Honor in asking questions** – Clarify ambiguity before making assumptions
8. **Honor in code quality** – Maintainable, readable, well-structured code over quick hacks
