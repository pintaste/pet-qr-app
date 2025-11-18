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
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
  - ⚠️ **Current Violation**: `PetDisplayPage.tsx` is 2,017 lines and must be refactored into smaller components
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
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.

### 📎 Style & Conventions
- **Backend**: Python with FastAPI framework
  - **Follow PEP8**, use type hints, and format with `black`
  - **Use `pydantic` for data validation**
  - **Use `SQLModel` for ORM** (combines SQLAlchemy + Pydantic)
  - Write **docstrings for every function** using the Google style
- **Frontend**: React 18 + TypeScript + Vite
  - **Use TypeScript** for type safety
  - **Use Tailwind CSS** for styling
  - **Use Google Maps API** for location features (via @vis.gl/react-google-maps)
- **Multi-Tenant Architecture**: Schema-based isolation in PostgreSQL
- Write **docstrings for every Python function** using the Google style:
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

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

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