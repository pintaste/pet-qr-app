# Pet QR System

基于二维码的宠物信息管理与展示系统 - B2B2C SaaS平台

## 项目概述

支持多宠物店/品牌定制的QR码宠物管理系统，提供：
- 🏪 多租户架构支持品牌定制
- 📱 Mobile-first响应式设计
- 🔒 PIN码双重验证安全机制
- 🌍 多语言支持（中英文等）
- 📊 基础数据分析Dashboard
- ☁️ AWS云原生架构

## 技术栈

### Backend
- **Framework**: FastAPI + Uvicorn
- **Database**: PostgreSQL + SQLModel
- **Authentication**: JWT + Refresh Token
- **Cloud**: AWS (RDS, S3, SES, CloudFront)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + CSS Variables
- **State**: Zustand + TanStack Query

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

## 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### 1. 克隆项目并设置环境

```bash
# 克隆项目
git clone <repository-url>
cd pet-qr-system

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件设置你的配置
```

### 2. 启动数据库服务

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up postgres redis -d

# 检查服务状态
docker-compose ps
```

### 3. 设置后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv_linux
source venv_linux/bin/activate  # Linux/Mac
# 或 venv_linux\\Scripts\\activate  # Windows

# 安装依赖 (will be created)
pip install -r requirements.txt

# 运行数据库迁移 (will be implemented)
# alembic upgrade head

# 启动开发服务器 (will be implemented)
# uvicorn app.main:app --reload
```

### 4. 设置前端

```bash
cd frontend

# 安装依赖 (will be created)
npm install

# 启动开发服务器 (will be implemented)
# npm run dev
```

### 5. 访问应用

- **前端**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **数据库**: localhost:5432 (postgres/postgres)

## 项目结构

```
pet-qr-system/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── core/           # 配置、安全、依赖
│   │   ├── models/         # SQLModel 数据模型
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── middleware/     # 租户路由、认证
│   │   └── utils/          # 工具函数
│   └── tests/              # 后端测试
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── stores/         # Zustand状态管理
│   │   ├── services/       # API调用
│   │   └── themes/         # 主题配置
│   └── public/
├── shared/                 # 共享类型和工具
│   ├── types/              # TypeScript类型
│   ├── validation/         # Zod验证模式
│   └── utils/              # 共享工具函数
├── docs/                   # 文档
└── docker-compose.yml      # 开发环境服务
```

## 开发指南

### 多租户架构

系统支持两个层级的租户：

- **Tier 1 (Enterprise)**: 独立RDS实例 + 自定义域名 + 深度定制
- **Tier 2 (Standard)**: 共享RDS + Schema隔离 + 基础定制

### 数据库Schema

- `shared` schema: 租户管理和全局用户
- `tenant_{name}` schema: 每个租户的业务数据

### 主题系统

支持动态主题切换，包括：
- 品牌颜色定制
- Logo替换
- 字体选择
- 日/夜模式

### API开发

所有API端点都支持多租户：
```python
# 租户中间件自动解析租户信息
@router.get("/pets")
async def get_pets(tenant: Tenant = Depends(get_current_tenant)):
    # 业务逻辑
```

## 部署

### 开发环境
```bash
docker-compose up -d
```

### 生产环境
参考 `docs/deployment/` 中的部署指南

## 贡献

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 许可证

本项目采用 [MIT License](LICENSE)

## 支持

如有问题，请：
1. 查看文档 `docs/`
2. 创建Issue
3. 联系开发团队

---

*开发中 - v1.0.0*

---


# Pet QR App - Complete Documentation

> Comprehensive guide covering setup, testing, and design guidelines

## 📑 Table of Contents

1. [Quick Setup Guide](#quick-setup-guide)
   - Environment Setup
   - Quick Start
   - Troubleshooting

2. [Testing Guide](#pet-qr-system---testing-guide)
   - Quick Test (5 Minutes)
   - Detailed Test Checklist
   - Performance Benchmarks

3. [Design Language & Guidelines](#petid-system---design-language--style-guidelines)
   - Core Design Principles
   - Color Palette
   - Component Patterns

---

# Quick Setup Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

## 1. Environment Setup

### Clone and Configure
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Configure Google Maps API

1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Maps JavaScript API**
3. Add key to `frontend/.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

**Security (Production)**:
- Restrict key to your domain
- Enable only Maps JavaScript API

**Pricing**: $200 free credit/month (sufficient for most projects)

## 2. Quick Start

### Option A: Use Restart Script (Recommended)
```bash
# Full restart (Docker + Dev servers)
./restart.sh full

# Dev servers only (faster)
./restart.sh dev
```

### Option B: Manual Start
```bash
# Terminal 1: Start Docker services
docker-compose up -d postgres redis

# Terminal 2: Start backend
cd backend
source ../venv_linux/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend
cd frontend
npm run dev
```

## 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 4. Database Setup

```bash
# Run migrations
cd backend
../venv_linux/bin/alembic upgrade head

# Create demo data (optional)
../venv_linux/bin/python scripts/demo/create_demo_user.py
```

## 5. Troubleshooting

### Frontend not starting?
```bash
cd frontend
npm install
rm -rf node_modules/.vite
npm run dev
```

### Backend not starting?
```bash
cd backend
pip install -r requirements.txt
# Check if venv_linux exists
```

### Database issues?
```bash
docker-compose down
docker-compose up -d postgres redis
# Wait 10 seconds for PostgreSQL to initialize
```

### Map not showing?
- Verify API key in `frontend/.env`
- Check browser console for errors
- Ensure Maps JavaScript API is enabled in Google Cloud

## 6. Development Logs

```bash
# View logs
tail -f logs/frontend.log
tail -f logs/backend.log

# Stop services
kill $(cat logs/frontend.pid)
kill $(cat logs/backend.pid)
```

## Next Steps

- See `PLANNING.md` for architecture details
- See `TASK.md` for current development status
- See `TESTING.md` for testing guide
- See `DESIGN_LANGUAGE.md` for UI/UX guidelines


---


# Pet QR System - Testing Guide

## 🚀 Quick Test (5 Minutes)

### Environment Check
- [ ] Backend running: http://localhost:8000 ✅
- [ ] Frontend running: http://localhost:3000 ✅
- [ ] Database connection OK ✅

### Core Feature Quick Test

#### 1. Authentication (2 minutes)
```bash
# Test credentials
Email: test@example.com
Password: TestPassword123!
```
- [ ] User registration successful
- [ ] Login and get token
- [ ] Page redirects correctly

#### 2. Pet Management (1 minute)
```bash
# Test data
Pet name: Max
Breed: Golden Retriever
PIN: 1234
```
- [ ] Add pet successfully
- [ ] Pet information displays correctly

#### 3. QR Code Generation (1 minute)
- [ ] Generate QR code successfully
- [ ] QR code image displays
- [ ] PIN protection works

#### 4. Scanning Test (1 minute)
- [ ] Visit: http://localhost:8000/scan?qr={generated_code}
- [ ] PIN verification page displays
- [ ] Correct PIN shows pet information

---

## 🎯 Testing Objectives

Discover MVP version issues including bugs, use case problems, and business logic defects. Cover all core features and edge cases.

---

## 🔧 Test Environment Setup

### Prerequisites
- Backend: http://localhost:8000 (running)
- Frontend: http://localhost:3000 (running)
- Database: PostgreSQL (running)
- Browser: Chrome/Safari (with DevTools)

### Testing Tools
- **Browser DevTools**: Monitor network requests and console errors
- **Mobile QR Scanner**: Test QR code scanning
- **Different Devices**: Phone, tablet, desktop (responsive testing)

---

## 📋 Detailed Test Checklist

### ✅ Evaluation Criteria for Each Test
- **Functionality**: Works as expected
- **User Experience**: Intuitive operation
- **Error Handling**: Reasonable exception handling
- **Performance**: Acceptable response time

### 1. Authentication & User Management

#### 1.1 User Registration
**Test Steps**:
1. Navigate to registration page
2. Enter valid email and password
3. Submit registration form

**Expected**:
- Registration successful
- Auto-login or redirect to login
- Welcome message displayed

**Error Cases**:
- [ ] Invalid email format
- [ ] Weak password
- [ ] Duplicate email
- [ ] Network error handling

#### 1.2 User Login
**Test Steps**:
1. Enter valid credentials
2. Click login

**Expected**:
- Login successful
- JWT token stored
- Redirect to dashboard

**Error Cases**:
- [ ] Incorrect credentials
- [ ] Inactive account
- [ ] Empty fields

#### 1.3 Token Management
**Test Steps**:
1. Login and wait 30 minutes
2. Perform an action

**Expected**:
- Token auto-refreshes
- No session interruption

---

### 2. Pet Management

#### 2.1 Add Pet
**Test Data**:
```json
{
  "name": "Max",
  "species": "Dog",
  "breed": "Golden Retriever",
  "age": 3,
  "gender": "Male",
  "description": "Friendly and energetic",
  "owner_contact": {
    "phone": "+1234567890",
    "email": "owner@example.com"
  }
}
```

**Expected**:
- Pet added successfully
- Appears in pet list
- All fields saved correctly

**Error Cases**:
- [ ] Empty required fields
- [ ] Invalid age (negative)
- [ ] Long text handling
- [ ] Special characters/emoji

#### 2.2 Edit Pet
**Test Steps**:
1. Select existing pet
2. Update information
3. Save changes

**Expected**:
- Changes saved
- UI updates immediately

#### 2.3 Delete Pet
**Test Steps**:
1. Delete pet
2. Confirm deletion

**Expected**:
- Confirmation dialog appears
- Pet removed from list
- Associated QR codes handled

---

### 3. QR Code Management

#### 3.1 Generate QR Code
**Test Steps**:
1. Select a pet
2. Generate QR code
3. Set PIN (e.g., 1234)

**Expected**:
- QR code generated
- Image downloadable
- PIN saved

**Test Cases**:
- [ ] Generate for multiple pets
- [ ] Regenerate existing QR
- [ ] Download QR image
- [ ] QR image quality

#### 3.2 QR Code Image
**Checks**:
- [ ] Pet name displayed
- [ ] QR code scannable
- [ ] Branding elements present
- [ ] High resolution
- [ ] Chinese font renders correctly (if applicable)

---

### 4. QR Scanning & Verification

#### 4.1 QR Code Scan Landing
**Test Steps**:
1. Scan QR code or visit URL
2. Land on verification page

**Expected**:
- Clean landing page
- PIN input field visible
- Mobile-optimized layout

#### 4.2 PIN Verification
**Test Cases**:
- [ ] **Correct PIN**: Show pet information
- [ ] **Incorrect PIN**: Show error, retry allowed
- [ ] **3 Failed Attempts**: Lock for X minutes
- [ ] **No PIN Set**: Direct access (if applicable)

**Security**:
- [ ] Rate limiting works
- [ ] Brute force protection
- [ ] No sensitive data in URL

#### 4.3 Pet Information Display
**Checks**:
- [ ] All pet data displays
- [ ] Photos load correctly
- [ ] Contact info formatted
- [ ] Responsive design
- [ ] Medical info (if any) displays

---

### 5. Mobile Responsiveness

#### 5.1 Test Devices
- **iPhone SE** (375px) - Minimum size
- **iPhone 12/13** (390px)
- **iPad** (768px)
- **Android Phone** (various)

#### 5.2 Responsive Checks
- [ ] QR scan page mobile-friendly
- [ ] PIN input works with mobile keyboard
- [ ] Pet info page readable on mobile
- [ ] Buttons touch-friendly (minimum 44px)
- [ ] Images scale properly
- [ ] No horizontal scrolling

---

### 6. Error Handling

#### 6.1 Network Errors
- [ ] Backend offline
- [ ] Slow network
- [ ] Timeout scenarios
- [ ] Appropriate error messages

#### 6.2 Data Validation
- [ ] Client-side validation
- [ ] Server-side validation
- [ ] Clear error messages
- [ ] Field highlighting

---

## 🔍 Common Issues Pre-Check

### Backend Issues
```bash
# Check backend logs
tail -f logs/backend.log

# Check database connection
curl http://localhost:8000/health

# Check API response
curl http://localhost:8000/api/v1/auth/me
```

### Frontend Issues
```javascript
// Browser console checks
console.log('Check for errors')

// Network requests
// DevTools → Network → Check API calls

// Local storage
localStorage.getItem('token')
```

### Database Issues
```sql
-- Check data
SELECT * FROM shared.users LIMIT 5;
SELECT * FROM tenant_demo.pets LIMIT 5;
SELECT * FROM tenant_demo.qr_codes LIMIT 5;
```

---

## ⚡ Performance Benchmarks

### Response Time Expectations
- Page initial load: < 3 seconds
- Login response: < 2 seconds
- QR generation: < 2 seconds
- Image loading: < 1 second

### Resource Usage
- Initial page size: < 2MB
- Memory usage: Normal range
- CPU usage: No abnormal spikes

---

## 🐛 Known Issues to Verify

### Areas Requiring Special Attention
1. **Multi-tenant schema switching** - Verify tenant_demo schema works
2. **Token refresh mechanism** - Verify auto-refresh after 30 minutes
3. **QR image font rendering** - macOS/Linux font paths
4. **Google Maps integration** - API key and marker rendering

### Common Edge Cases
1. **Empty state** - New user with no pets
2. **Long text** - Very long pet names or descriptions
3. **Special characters** - Emoji and Chinese character handling
4. **Network issues** - Offline error messages

---

## 📋 Test Completion Standards

### Minimum Viable ⭐
- [ ] Users can register/login
- [ ] Can add pet information
- [ ] Can generate QR codes and images
- [ ] QR scan shows pet information
- [ ] Basic error messages work

### Good Experience ⭐⭐
- [ ] Smooth mobile experience
- [ ] User-friendly error handling
- [ ] Response times within expectations
- [ ] Beautiful and intuitive interface

### Production Ready ⭐⭐⭐
- [ ] Security validation passed
- [ ] All edge cases handled
- [ ] Performance optimized
- [ ] Multi-browser compatible

---

## 🚨 Issue Reporting Template

### When Finding Bugs
```
Issue: [Brief description]
Reproduce: [Steps to reproduce]
Expected: [What should happen]
Actual: [What actually happens]
Environment: [Browser/Device]
Priority: High/Medium/Low
```

### When Suggesting Improvements
```
Feature: [Related feature module]
Current: [Current experience]
Suggestion: [Improvement suggestion]
Reason: [Why improvement is needed]
```

---

## 🎯 Recommended Test Scenarios

### Scenario A: Complete User Flow (First Test)
1. **Register new account** → **Login** → **Add pet** → **Generate QR** → **Scan and verify**

### Scenario B: Error Handling Validation
1. **Incorrect PIN** → **Network disconnect** → **Invalid QR access**

### Scenario C: Mobile Experience
1. **Mobile browser access** → **Scan QR** → **Responsive layout check**

---

**Usage Tip**: Start with the 5-minute quick test to ensure basic functionality, then perform deeper testing as needed. Focus on the most frequently used core workflows!


---


# PetID System - Design Language & Style Guidelines

## Overview
This document outlines the current design language and visual style guidelines for the PetID System, specifically focusing on the Pet Display Page. These guidelines ensure consistency across the application and provide reference for future development.

## Core Design Principles

### 1. **Minimalist & Clean**
- Clean layouts with proper white space
- Subtle visual elements that don't compete for attention
- Focus on content readability and user experience

### 2. **Responsive & Mobile-First**
- Optimized for mobile viewing (max-width: 420px default)
- Adaptive layouts that scale appropriately
- Touch-friendly interaction elements

### 3. **Accessibility & Readability**
- High contrast text (gray-900 to gray-700 dark:white to gray-200)
- Proper font sizing and line heights
- Dark mode support throughout

## Color Palette

### Light Mode
- **Primary Background**: `bg-white`
- **Secondary Background**: `bg-gray-50/50` to `bg-gray-100/50`
- **Text Primary**: `text-gray-900` to `text-gray-700`
- **Text Secondary**: `text-gray-600` to `text-gray-400`
- **Borders**: `border-gray-200/50` to `border-gray-200/60`
- **Dividers**: `bg-gray-100`

### Dark Mode
- **Primary Background**: `dark:bg-gray-900` to `dark:bg-gray-800`
- **Secondary Background**: `dark:bg-gray-700/30` to `dark:bg-gray-800/90`
- **Text Primary**: `dark:text-white` to `dark:text-gray-200`
- **Text Secondary**: `dark:text-gray-400` to `dark:text-gray-500`
- **Borders**: `dark:border-gray-700/50` to `dark:border-gray-600/50`
- **Dividers**: `dark:bg-gray-700/50`

### Accent Colors
- **Primary**: Indigo gradient (`from-indigo-500 to-purple-500`)
- **Interactive**: `text-indigo-600 dark:text-indigo-400`
- **Hover States**: `hover:bg-indigo-50 dark:hover:bg-indigo-900/20`

## Typography

### Font Hierarchy
- **Pet Name**: `text-[1.75rem] font-bold` with gradient background
- **Breed Info**: `text-base font-medium`
- **Description**: `text-base leading-relaxed`
- **Button Labels**: `text-sm font-semibold`
- **Helper Text**: `text-xs`

### Text Alignment
- **Consistent Left Alignment**: All text elements within the same container share identical left margins
- **Container Padding**: `p-6` (24px) for main content areas
- **Vertical Spacing**: `my-5` (20px) for section separators

## Layout Structure

### Container System
```
Layout Component (max-w-[420px])
├── Header (optional)
├── Main Content
│   ├── Pet Details Container (p-6, gradient background)
│   │   ├── Pet Header (flex, justify-between)
│   │   ├── Divider (my-5, subtle line)
│   │   └── Description (direct child, perfect alignment)
│   ├── Gallery Section
│   └── Action Buttons Grid
└── Footer (optional)
```

### Spacing Guidelines
- **Section Margins**: `mt-6` (24px) between major sections
- **Element Spacing**: `mb-2` to `mb-4` for related elements
- **Divider Spacing**: `my-5` (20px) above and below
- **Button Grid**: `gap-4` (16px) between action buttons

## Visual Elements

### Gradients
- **Text Gradients**: `bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent`
- **Background Gradients**: `bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/80`
- **Button Gradients**: `bg-gradient-to-r from-[color1] to-[color2]`

### Borders & Shadows
- **Subtle Borders**: `border border-gray-200/50 dark:border-gray-700/50`
- **Rounded Corners**: `rounded-2xl` for containers, `rounded-xl` for smaller elements
- **Hover Shadows**: `hover:shadow-lg` with color-matched shadow variants

### Interactive States
- **Hover Scale**: `hover:scale-[1.03]` for buttons
- **Transition**: `transition-all duration-300` for smooth animations
- **Button States**: Color shifts and shadow changes on hover

## Component Patterns

### Dividers
```css
/* Subtle divider line */
.divider {
  height: 1px; /* h-px */
  margin: 20px 0; /* my-5 */
  background: gray-100 (light) / gray-700/50 (dark);
}
```

### Action Buttons
- **Grid Layout**: `grid-cols-3` for consistent distribution
- **Height**: `h-[120px]` for adequate touch targets
- **Padding**: `p-3` internal spacing
- **Icon Container**: `p-3` with gradient backgrounds
- **Hover Effects**: Scale, shadow, and color transitions

### Gallery Controls
- **Auto-hide**: Mouse enter/leave based visibility
- **Positioning**: Fixed positioning with backdrop blur
- **Icons**: Lucide React icons with consistent sizing
- **Backgrounds**: Semi-transparent with blur effects

### Modal Design System

#### Responsive Modal Approach
- **Desktop/Tablet**: Centered modal with backdrop (`md:items-center`)
- **Mobile**: Bottom drawer slide-up animation (`items-end`)
- **Container**: `max-w-[420px]` mobile, `md:max-w-2xl` desktop
- **Rounded Corners**: `rounded-t-2xl md:rounded-3xl`

#### Contact Owner Modal
- **Bottom Drawer Pattern**: Slides from bottom on all devices initially
- **Content Sections**: Profile, Communication options, Additional info
- **Linear Design**: Clean sections with minimal decoration
- **Touch-Friendly**: Large buttons with clear actions

#### Location Share Modal
- **Full-Screen Map View**: Mobile-optimized map interface
- **Map Integration**: Leaflet/React-Leaflet with custom markers
- **Linear Layout**: Map top, location list bottom
- **No Emoji Design**: Clean text-only location entries
- **Privacy-First**: User selects public meeting places, not home address

#### API Integration Pattern
- **Real-Time Data**: OpenStreetMap Overpass API for nearby places
- **Place Types**: Schools, malls, cafes, parks, transit stations
- **Distance Sorting**: Haversine formula implementation
- **Fallback Handling**: Graceful degradation for API failures
- **Loading States**: Visual feedback during data fetch

#### Location Selection UX
- **Test Mode**: Burnaby, BC coordinates for development
- **Place Categories**: Public venues only (no residential)
- **Selection Feedback**: Visual confirmation of selected location
- **Send Options**: SMS and Email integration
- **Safety Messaging**: Prominent safety reminders

## Technical Implementation

### CSS Framework
- **Tailwind CSS**: Primary styling framework
- **Custom Properties**: CSS variables for theme consistency
- **Responsive Design**: Breakpoint-based adaptations

### State Management
- **Theme**: Zustand-based theme store
- **UI States**: Local component state for interactions
- **Animations**: CSS transitions with JavaScript triggers
- **Location Data**: useState for selected locations and nearby places
- **Modal States**: Individual boolean states for each modal type

### File Structure
- **Components**: Modular React components
- **Layout**: Consistent wrapper components
- **Hooks**: Custom hooks for theme and state management
- **Pages**: PetDisplayPage.tsx as main implementation

### Dependencies
- **Map**: Leaflet, React-Leaflet for map functionality
- **Icons**: Lucide React for consistent iconography
- **HTTP**: Fetch API for OpenStreetMap integration
- **Routing**: React Router for navigation

## Content Guidelines

### Text Content
- **Concise**: Clear, brief descriptions
- **Consistent**: Uniform tone and terminology
- **Accessible**: Simple language, proper contrast

### Visual Hierarchy
1. Pet name (largest, gradient)
2. Breed and age info (medium, secondary color)
3. Description (body text, standard size)
4. Action labels (small, bold)

## Future Considerations

### Scalability
- **Component Library**: Extract reusable components
- **Design Tokens**: Centralize design decisions
- **Accessibility**: WCAG compliance improvements

### Performance
- **Lazy Loading**: Image optimization
- **Bundle Size**: Component tree shaking
- **Animations**: Hardware acceleration

## Recent Implementations (2025-09-26)

### Modal System Evolution
- **Unified Approach**: Standardized responsive modal pattern across all modals
- **Mobile-First**: Bottom drawer pattern for mobile, centered for desktop/tablet
- **Privacy Enhancement**: Location sharing redesigned for safety and privacy
- **API Integration**: Real-time nearby places from OpenStreetMap Overpass API

### Location Sharing Feature
- **Security Focus**: Prevents home address exposure
- **Public Venues Only**: Schools, malls, cafes, parks, transit hubs
- **Distance-Based Sorting**: Closest venues first (Haversine formula)
- **Test Location**: Burnaby, BC (8888 University Dr W) for development
- **Dual Communication**: SMS and Email sending options

### Technical Achievements
- **Map Integration**: Full Leaflet implementation with custom markers
- **API Resilience**: Fallback handling for service interruptions
- **Performance**: Efficient state management and rendering
- **Responsive Design**: Seamless mobile-to-desktop scaling

---

*Last Updated: 2025-09-26*
*Version: 2.0*

This design language serves as the foundation for maintaining visual consistency and user experience quality throughout the PetID System. The recent modal system enhancements and location sharing features demonstrate the evolution toward a more privacy-conscious, user-friendly, and technically robust platform.