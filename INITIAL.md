## FEATURE:

- 基于二维码的宠物信息管理与展示系统 (B2B2C模式)
- 通过二维码 + Web App，实现宠物信息绑定、展示、扫码提醒和信息共享
- 支持多宠物店/品牌定制版本，白标解决方案
- 预生成二维码 + PIN码确保安全性，工厂批量印刷流程
- 包含用户注册登录、宠物信息管理、品牌管理、后台管理等功能
- 支持多语言（中文/英文）和隐私控制
- 初期目标：1万用户，架构支持后期扩展

## EXAMPLES:

In the `examples/demo/` folder, there is a complete mobile-first web app demo showcasing:

**Core User Flows:**
- Multi-language selection page (English, Chinese, Spanish, French)
- PIN code verification with 4-digit input interface
- Pet information display with image gallery and detailed profile
- Contact owner functionality (location sharing, phone call, store link)
- Comprehensive profile page with bento grid layout

**Key UX/UI Features:**
- Mobile-first responsive design (420px container)
- Dark/light theme switching with CSS variables
- Smooth animations and transitions
- Professional typography (Inter font family)
- Modern card-based layouts and modals
- Bootstrap Icons integration

**Technical Implementation:**
- Vanilla JavaScript with modular event handling
- CSS Grid and Flexbox for responsive layouts
- Local storage for theme/language preferences
- Geolocation API integration for location sharing
- Form validation and error handling

## DOCUMENTATION:

**Backend API:**
- FastAPI documentation: https://fastapi.tiangolo.com/
- SQLModel + PostgreSQL: https://sqlmodel.tiangolo.com/
- Pydantic documentation: https://docs.pydantic.dev/
- QR Code generation (qrcode library): https://pypi.org/project/qrcode/
- Email services: AWS SES documentation
- AWS SDK for Python (Boto3): https://boto3.amazonaws.com/v1/documentation/api/latest/index.html

**Mobile-First Web App:**
- React + Vite: https://vitejs.dev/guide/
- Tailwind CSS (mobile-first): https://tailwindcss.com/docs/responsive-design
- PWA capabilities: https://web.dev/progressive-web-apps/

**Future Cross-Platform Mobile:**
- React Native: https://reactnative.dev/ (一套代码支持Android/iOS)
- Expo: https://expo.dev/ (简化React Native开发和部署)

## OTHER CONSIDERATIONS:

**Business Model & Architecture:**
- B2B2C模式：支持多宠物店/品牌定制版本
- 预生成QR码 + PIN码工厂印刷流程
- 分层SaaS架构：Tier 1(企业级独立部署) + Tier 2(标准共享基础设施)
- 严格数据隔离：Schema级别隔离，大客户可升级独立RDS
- 初期1万用户规模，架构支持横向扩展
- AWS云基础设施，面向国际用户

**Deployment Architecture:**
- **Tier 1 (Enterprise)**: 独立数据库Schema/RDS + 自定义域名 + 深度UI定制
- **Tier 2 (Standard)**: 共享RDS独立Schema + 子域名 + 基础UI定制
- 统一代码库支持动态主题和租户路由
- 数据导出功能：默认禁用，超级管理员可控制开启/关闭

**User Experience Requirements (Based on Demo):**
- Professional mobile-first design with 420px optimal width
- Multi-language support with seamless switching (EN/ZH/ES/FR)
- 4-digit PIN verification for security and ease of use
- Rich pet profile with image gallery and detailed information cards
- Location sharing with geolocation API integration
- Direct contact methods (phone calls, store links)
- Accessibility-friendly design with proper contrast and typography

**Mobile-First & Cross-Platform Strategy:**
- Web App使用React + Tailwind CSS实现mobile-first响应式设计
- 后期移动端使用React Native + Expo，可复用大部分业务逻辑和组件
- PWA功能，让Web App具备接近原生的体验
- 扫描未激活QR码引导注册流程

**Technical Requirements:**
- PostgreSQL数据库 + AWS RDS
- AWS S3文件存储（宠物照片）+ CloudFront CDN
- AWS SES邮件通知（暂不实现短信，预留接口）
- JWT token authentication with refresh token support
- QR codes + PIN码双重验证系统
- 多租户数据隔离 (schema-based recommended)
- RESTful API设计，支持移动端高效数据交换
- Image optimization and compression for mobile performance
- Geolocation services integration
- Rate limiting for QR code scanning to prevent abuse

**UI/UX Technical Specifications:**
- React + TypeScript for type safety
- Tailwind CSS with modular theme system for easy customization
- Responsive breakpoints: mobile-first (420px), tablet (768px), desktop (1024px)
- Day/night mode switching with CSS variables and theme context
- Smooth animations using Framer Motion or CSS transitions

**Typography & Icons (Flexible Options):**
- **Fonts**: Inter (current), SF Pro (Apple-style), Geist (modern), or custom brand fonts
- **Icons**: Lucide React (lightweight), Heroicons (Tailwind native), or Phosphor Icons (extensive)
- **Theme System**: CSS-in-JS support for dynamic brand colors and complete theme switching
- **Design Tokens**: Centralized color palette, spacing, and typography scales

**Form & Interaction Patterns:**
- Form validation with error handling patterns from demo
- Loading states and micro-interactions
- Touch-friendly interface design (44px minimum touch targets)

**Dashboard & Analytics (Basic Tier):**
- QR码购买/激活数量统计
- 总扫描次数和时间趋势
- 基础数据导出功能
- 客户支持工单系统（内置表单 → 邮件通知）

**QR Code Management:**
- 批量QR码生成工具（自定义数量）
- PIN码关联和状态追踪
- 工厂印刷数据导出
- 激活状态实时监控

**Development Setup:**
- AWS服务配置（RDS, S3, SES, CloudFront）
- Docker支持，便于开发和部署
- 多环境配置（开发/测试/生产）
- 动态主题系统和租户管理
- 数据库迁移和种子数据
- 严格的数据访问控制和审计日志
- 邮件通知系统故障处理机制
- QR码扫描频率限制防滥用
- 基于角色的权限控制系统
- Multi-language support should be implemented from the start, not retrofitted
- Consider mobile-responsive design since QR codes are typically scanned on mobile devices
