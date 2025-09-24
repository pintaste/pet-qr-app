# Pet QR System - MVP 完整文档

## 📋 项目概述

Pet QR System 是一个基于二维码的宠物信息管理与展示系统，允许宠物主人创建受PIN保护的QR码，当扫描时能安全地显示宠物信息。

### 🎯 核心功能
- 宠物主人账户管理
- 宠物信息CRUD操作
- QR码生成与管理
- 品牌化QR码图片生成
- PIN保护的信息访问
- 多场景扫描处理

---

## 🏗 系统架构

### 技术栈
- **Backend**: FastAPI + SQLModel + PostgreSQL + Redis
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: Multi-tenant PostgreSQL
- **Authentication**: JWT (Access + Refresh tokens)
- **QR Generation**: qrcode + Pillow (PIL)

### 服务端口
- **Backend API**: http://localhost:8000
- **Frontend App**: http://localhost:3003
- **Database**: PostgreSQL (port 5432)
- **Redis**: Cache (port 6379)

---

## 📁 项目结构

```
pet-qr-system/
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── api/               # API路由
│   │   ├── core/              # 核心配置
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务逻辑
│   │   └── middleware/        # 中间件
│   ├── alembic/               # 数据库迁移
│   └── tests/                 # 后端测试
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── pages/             # 页面组件
│   │   ├── services/          # API服务
│   │   ├── stores/            # 状态管理
│   │   └── hooks/             # 自定义Hooks
├── shared/                    # 共享类型定义
└── docs/                      # 文档
```

---

## 🔄 业务流程

### 1. 用户注册/登录
```
用户 → 注册账户 → 邮箱验证 → 登录获取JWT → 访问系统
```

### 2. 宠物管理
```
登录用户 → 添加宠物信息 → 上传照片 → 设置紧急联系人 → 保存
```

### 3. QR码生成
```
选择宠物 → 生成QR码 → 设置PIN → 生成品牌化图片 → 打印/分享
```

### 4. QR码扫描流程
```
扫描QR码 → 检查状态 → 三种场景处理：
├── 未激活 → 引导注册激活
├── 已激活未分配 → 引导绑定宠物
└── 已激活已分配 → PIN验证 → 显示宠物信息
```

---

## 🔐 认证系统

### JWT Token 机制
- **Access Token**: 30分钟有效期，用于API访问
- **Refresh Token**: 30天有效期，用于刷新Access Token
- **存储方式**: localStorage (Access) + httpOnly cookie (Refresh)

### 权限控制
- **公开访问**: QR码扫描、宠物信息展示
- **认证访问**: 宠物管理、QR码生成
- **多租户隔离**: 数据按用户隔离存储

---

## 🗄 数据库设计

### 核心表结构

#### shared.users (共享用户表)
```sql
- id: 主键
- email: 邮箱 (唯一)
- password_hash: 密码哈希
- is_active: 是否激活
- created_at: 创建时间
```

#### demo.tenant_users (租户用户表)
```sql
- id: 主键
- shared_user_id: 关联shared.users.id
- display_name: 显示名称
- avatar_url: 头像URL
```

#### demo.pets (宠物表)
```sql
- id: 主键
- owner_id: 关联tenant_users.id
- name: 宠物名称
- breed: 品种
- age: 年龄
- sex: 性别
- size: 体型 (xs/s/m/l/xl)
- color: 颜色
- description: 描述
- is_lost: 是否走失
- emergency_contact: 紧急联系人 (JSON)
```

#### demo.qr_codes (QR码表)
```sql
- id: 主键
- code: QR码字符串 (唯一)
- pin: PIN码
- pet_id: 关联pets.id (可空)
- is_active: 是否激活
- created_at: 创建时间
- scan_count: 扫描次数
- last_scanned_at: 最后扫描时间
```

---

## 🔧 API 接口文档

### 认证相关
```http
POST /api/v1/auth/register     # 用户注册
POST /api/v1/auth/login        # 用户登录
POST /api/v1/auth/refresh      # 刷新令牌
POST /api/v1/auth/logout       # 用户登出
GET  /api/v1/auth/me           # 获取当前用户信息
```

### 宠物管理
```http
GET    /api/v1/pets            # 获取用户宠物列表
POST   /api/v1/pets            # 创建新宠物
GET    /api/v1/pets/{id}       # 获取宠物详情
PUT    /api/v1/pets/{id}       # 更新宠物信息
DELETE /api/v1/pets/{id}       # 删除宠物
```

### QR码管理
```http
GET    /api/v1/qr-codes        # 获取QR码列表
POST   /api/v1/qr-codes        # 生成新QR码
GET    /api/v1/qr-codes/{code} # 获取QR码信息 (公开)
PUT    /api/v1/qr-codes/{code} # 更新QR码
DELETE /api/v1/qr-codes/{code} # 删除QR码
POST   /api/v1/qr-codes/verify # PIN验证
POST   /api/v1/qr-codes/{code}/scan # 记录扫描
GET    /api/v1/qr-codes/{code}/image # 获取QR码图片
```

### 公开访问
```http
GET /scan?qr={code}            # QR码扫描landing页面
GET /pet/{id}/public           # 公开宠物信息页面
```

---

## 🎨 前端页面结构

### 主要页面
- **LandingPage**: 首页介绍
- **AuthPage**: 登录/注册
- **DashboardPage**: 用户仪表板
- **PetDisplayPage**: 宠物信息展示
- **PINVerificationPage**: PIN验证
- **ProfilePage**: 用户设置

### 核心组件
- **Header**: 导航头部
- **Layout**: 页面布局
- **PetCard**: 宠物卡片
- **QRCodeDisplay**: QR码显示

### 状态管理
- **authStore**: 认证状态
- **themeStore**: 主题切换
- **languageStore**: 多语言

---

## 📱 响应式设计

### 断点设置
- **Mobile**: < 768px (主要目标)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### 容器尺寸
- **Mobile**: max-width 420px
- **Content**: 基于Tailwind CSS响应式类

---

## 🔒 安全特性

### 数据保护
- **密码加密**: bcrypt哈希存储
- **JWT签名**: HS256算法
- **PIN保护**: 4位数字PIN码
- **CORS配置**: 开发环境允许所有源

### 输入验证
- **Pydantic模型**: 后端数据验证
- **Zod schemas**: 前端表单验证
- **SQL注入防护**: SQLModel ORM保护

---

## 🚀 部署说明

### 开发环境启动
```bash
# 启动数据库
docker-compose up -d postgres redis

# 启动后端
cd backend
./venv_linux/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 启动前端
cd frontend
npm run dev
```

### 生产环境配置
- **环境变量**: 配置.env文件
- **数据库**: PostgreSQL生产实例
- **文件存储**: 考虑AWS S3或类似服务
- **域名**: 配置生产域名和SSL

---

## 📊 性能考虑

### 优化措施
- **图片压缩**: QR码图片PNG优化
- **缓存策略**: Redis缓存频繁查询
- **懒加载**: 前端组件按需加载
- **数据库索引**: 关键字段建立索引

### 监控指标
- **响应时间**: API接口性能
- **扫描频率**: QR码使用统计
- **用户活跃度**: 登录和使用数据

---

## 🔮 未来扩展

### 计划功能
- **地理位置**: GPS定位和地图集成
- **推送通知**: 扫描和走失提醒
- **社交功能**: 宠物社区和分享
- **支付集成**: 高级功能订阅

### 技术改进
- **微服务架构**: 服务拆分
- **GraphQL**: API优化
- **移动应用**: React Native开发
- **AI功能**: 宠物识别和推荐

---

*文档版本: 1.0 | 更新时间: 2025-09-23*