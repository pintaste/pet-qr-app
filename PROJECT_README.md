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