# Pet QR System - CI/CD 指南

## 概述

本项目使用 **GitHub Actions** 实现 CI/CD 流水线：

- **CI (持续集成)**: 代码检查 + 测试
- **Build (构建)**: Docker 镜像构建 + 推送到 GHCR

---

## CI/CD 方案级别参考

> **当前已实现: B 方案（标准版）**

### ⭐ A. 基础版 — 只做 CI（代码质量保障）

```
Push代码 → 自动运行 → 测试通过/失败通知
```

**包含内容:**

| 检查项 | Backend | Frontend |
|--------|---------|----------|
| 代码格式 | `ruff check` | `eslint` |
| 类型检查 | `mypy` | `tsc --noEmit` |
| 单元测试 | `pytest` | `jest`（如果有） |
| 构建验证 | - | `npm run build` |

**触发条件:** PR提交、Push到main分支

**适合场景:** 个人项目、早期开发阶段

---

### ⭐⭐ B. 标准版 — CI + Docker镜像构建 ✅ 当前方案

```
Push代码 → CI检查 → 构建Docker镜像 → 推送到Registry
```

**在A的基础上增加:**
- 构建 Backend Docker 镜像
- 构建 Frontend Docker 镜像
- 推送到 Docker Hub 或 GitHub Container Registry (ghcr.io)
- 镜像版本打标签（git commit hash / tag）

**适合场景:** 需要版本化镜像、手动部署到服务器

---

### ⭐⭐⭐ C. 完整版 — CI + Build + 自动部署

```
Push代码 → CI检查 → 构建镜像 → 推送Registry → SSH部署到VPS
```

**在B的基础上增加:**
- 自动SSH连接到VPS
- 拉取最新镜像
- 重启服务（docker-compose up -d）
- 健康检查
- 部署失败回滚
- Slack/邮件通知

**分支策略:**

| 分支 | 触发 | 部署目标 |
|------|------|----------|
| `main` | Push | Production |
| `develop` | Push | Staging |
| `feature/*` | PR | 只跑CI，不部署 |

**适合场景:** 团队协作、需要自动化部署

**升级到C方案需要添加的文件:**
```yaml
# .github/workflows/deploy.yml
- 添加 SSH 密钥到 GitHub Secrets
- 添加 VPS 主机地址到 Secrets
- 添加部署后健康检查
- 添加 Slack/Discord 通知（可选）
```

---

### ⭐⭐⭐⭐ D. 企业版 — 多环境 + 审批流程

```
Push → CI → Build → Staging自动部署 → 手动审批 → Production部署
```

**额外功能:**
- Staging/Production 双环境
- 生产环境需手动审批 (GitHub Environment Protection Rules)
- 数据库迁移自动执行 (Alembic)
- 蓝绿部署/滚动更新
- 监控告警集成 (Prometheus/Grafana)
- 自动扩缩容 (如果使用K8s/ECS)

**适合场景:** 企业级应用、多团队协作、合规要求

**升级到D方案需要:**
- 配置 GitHub Environments (staging, production)
- 添加 Environment Protection Rules
- 配置数据库迁移步骤
- 集成监控系统

---

## 方案对比总结

| 功能 | A 基础版 | B 标准版 ✅ | C 完整版 | D 企业版 |
|------|:--------:|:----------:|:--------:|:--------:|
| 代码 Lint | ✅ | ✅ | ✅ | ✅ |
| 类型检查 | ✅ | ✅ | ✅ | ✅ |
| 单元测试 | ✅ | ✅ | ✅ | ✅ |
| 构建Docker镜像 | ❌ | ✅ | ✅ | ✅ |
| 推送到Registry | ❌ | ✅ | ✅ | ✅ |
| 自动部署 | ❌ | ❌ | ✅ | ✅ |
| 多环境 | ❌ | ❌ | ❌ | ✅ |
| 审批流程 | ❌ | ❌ | ❌ | ✅ |
| 回滚能力 | ❌ | 手动 | 自动 | 自动 |

---

## 工作流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Push/PR   │────▶│    CI       │────▶│   Build     │────▶│   Deploy    │
│             │     │  (自动)     │     │  (自动)     │     │  (手动)     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                    │ • Lint       │   │ • Build      │   │ • Pull镜像   │
                    │ • Type Check │   │ • Push GHCR  │   │ • 重启服务   │
                    │ • Unit Tests │   │ • Tag版本    │   │ • 健康检查   │
                    └──────────────┘   └──────────────┘   └──────────────┘
```

## 触发条件

| 工作流 | 触发条件 | 文件 |
|--------|----------|------|
| CI | PR / Push 到 main/develop | `.github/workflows/ci.yml` |
| Build | Push 到 main / 创建 tag | `.github/workflows/build.yml` |

---

## 部署前检查清单 (TODO)

> 部署到生产环境前，请逐项确认以下配置

### 1. GitHub 仓库配置

- [ ] **修改镜像名称**: 将 `your-username` 替换为实际 GitHub 用户名
  - [ ] `docker-compose.prod.yml` 中的注释
  - [ ] `.env.production.example` 中的 `BACKEND_IMAGE` 和 `FRONTEND_IMAGE`
  - [ ] `docs/CI-CD.md` 中的示例命令

- [ ] **GitHub Repository Settings**:
  - [ ] 确认仓库是 Public 或已配置 Packages 权限
  - [ ] Settings → Actions → General → Workflow permissions → Read and write permissions

### 2. VPS 服务器准备

- [ ] **安装 Docker**:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

- [ ] **安装 Docker Compose**:
  ```bash
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```

- [ ] **创建部署目录**:
  ```bash
  sudo mkdir -p /opt/pet-qr-app
  sudo chown $USER:$USER /opt/pet-qr-app
  ```

- [ ] **配置防火墙**:
  - [ ] 开放 80 端口 (HTTP)
  - [ ] 开放 443 端口 (HTTPS，如果使用)
  - [ ] 关闭 5432 端口外部访问 (PostgreSQL)
  - [ ] 关闭 6379 端口外部访问 (Redis)

### 3. GitHub Personal Access Token

- [ ] **创建 PAT** (用于拉取 GHCR 镜像):
  - 访问: https://github.com/settings/tokens
  - 点击 "Generate new token (classic)"
  - 勾选权限: `read:packages`
  - 保存 Token

- [ ] **在 VPS 上配置**:
  ```bash
  # 添加到 ~/.bashrc 或 ~/.zshrc
  export GITHUB_USERNAME="your-username"
  export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
  ```

### 4. 生产环境变量

- [ ] **复制并编辑 .env.production**:
  ```bash
  cp .env.production.example .env.production
  nano .env.production
  ```

- [ ] **必填项检查**:
  - [ ] `POSTGRES_PASSWORD` - 设置强密码 (16+ 字符)
  - [ ] `SECRET_KEY` - 生成随机密钥 (32+ 字符)
    ```bash
    openssl rand -hex 32
    ```
  - [ ] `ALLOWED_ORIGINS` - 设置允许的域名
  - [ ] `BACKEND_IMAGE` - 修改为实际镜像地址
  - [ ] `FRONTEND_IMAGE` - 修改为实际镜像地址

- [ ] **可选项配置**:
  - [ ] `REDIS_PASSWORD` - Redis 密码
  - [ ] `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API Key

### 5. 域名和 SSL（可选但推荐）

- [ ] **配置域名 DNS**:
  - [ ] A 记录指向 VPS IP
  - [ ] 等待 DNS 生效 (可能需要几分钟到几小时)

- [ ] **配置 SSL 证书** (推荐使用 Certbot):
  ```bash
  # 安装 Certbot
  sudo apt install certbot python3-certbot-nginx

  # 获取证书
  sudo certbot --nginx -d yourdomain.com
  ```

- [ ] **更新 nginx.conf** 添加 HTTPS 配置

### 6. 数据库初始化

- [ ] **确认 init-db.sql 存在**:
  ```bash
  ls /opt/pet-qr-app/init-db.sql
  ```

- [ ] **首次启动后检查数据库**:
  ```bash
  docker exec pet-qr-postgres psql -U postgres -d pet_qr_system -c "\dt"
  ```

### 7. 首次部署执行

- [ ] **登录 GHCR**:
  ```bash
  echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
  ```

- [ ] **拉取镜像**:
  ```bash
  docker-compose -f docker-compose.prod.yml --env-file .env.production pull
  ```

- [ ] **启动服务**:
  ```bash
  docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
  ```

- [ ] **检查服务状态**:
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```

### 8. 健康检查

- [ ] **Frontend 健康检查**:
  ```bash
  curl -s http://localhost/health
  # 期望输出: OK
  ```

- [ ] **Backend 健康检查**:
  ```bash
  curl -s http://localhost/api/health
  # 期望输出: {"status":"healthy",...}
  ```

- [ ] **数据库连接检查**:
  ```bash
  docker exec pet-qr-backend python -c "from app.core.database import engine; print('DB OK')"
  ```

### 9. 监控和日志（推荐）

- [ ] **配置日志轮转**:
  ```bash
  # /etc/docker/daemon.json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    }
  }
  ```

- [ ] **设置定时健康检查** (cron):
  ```bash
  # crontab -e
  */5 * * * * curl -sf http://localhost/health || echo "Frontend down" | mail -s "Alert" admin@example.com
  ```

### 10. 备份策略（推荐）

- [ ] **配置数据库备份脚本**:
  ```bash
  # /opt/pet-qr-app/backup.sh
  docker exec pet-qr-postgres pg_dump -U postgres pet_qr_system > backup_$(date +%Y%m%d).sql
  ```

- [ ] **设置定时备份** (cron):
  ```bash
  # crontab -e
  0 2 * * * /opt/pet-qr-app/backup.sh
  ```

---

## GitHub Actions 配置

### 1. CI 工作流 (`ci.yml`)

**Backend 检查:**
- `ruff check` - 代码风格检查
- `ruff format --check` - 格式检查
- `pytest` - 单元测试 (带 PostgreSQL/Redis 服务)
- 测试覆盖率上传到 Codecov

**Frontend 检查:**
- `npm run lint` - ESLint 检查
- `npx tsc --noEmit` - TypeScript 类型检查
- `npm run build` - 构建验证

### 2. Build 工作流 (`build.yml`)

**构建 Backend 镜像:**
```bash
ghcr.io/<username>/pet-qr-app/backend:main
ghcr.io/<username>/pet-qr-app/backend:v1.0.0
ghcr.io/<username>/pet-qr-app/backend:sha-abc1234
```

**构建 Frontend 镜像:**
```bash
ghcr.io/<username>/pet-qr-app/frontend:main
ghcr.io/<username>/pet-qr-app/frontend:v1.0.0
ghcr.io/<username>/pet-qr-app/frontend:sha-abc1234
```

---

## 本地测试

### 运行 CI 检查 (本地)

```bash
# Backend
cd backend
ruff check .
ruff format --check .
pytest tests/ -v

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

### 构建 Docker 镜像 (本地)

```bash
# Backend
docker build -t pet-qr-backend ./backend

# Frontend
docker build -t pet-qr-frontend ./frontend \
  --build-arg VITE_API_URL=http://localhost:8000
```

---

## VPS 部署

### 前置要求

1. VPS 安装 Docker 和 Docker Compose
2. 配置 GitHub Token 用于拉取 GHCR 镜像

### 首次部署

```bash
# 1. 创建部署目录
sudo mkdir -p /opt/pet-qr-app
cd /opt/pet-qr-app

# 2. 复制配置文件
scp docker-compose.prod.yml user@your-vps:/opt/pet-qr-app/
scp .env.production.example user@your-vps:/opt/pet-qr-app/.env.production
scp init-db.sql user@your-vps:/opt/pet-qr-app/

# 3. 编辑环境变量
nano .env.production

# 4. 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 5. 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 更新部署

```bash
# 方式1: 使用部署脚本
./scripts/deploy.sh main

# 方式2: 手动更新
docker-compose -f docker-compose.prod.yml --env-file .env.production pull
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 查看日志

```bash
# 所有服务
docker-compose -f docker-compose.prod.yml logs -f

# 单个服务
docker logs pet-qr-backend -f
docker logs pet-qr-frontend -f
```

---

## 环境变量

### GitHub Secrets (在仓库 Settings > Secrets 设置)

| Secret | 说明 | 必需 |
|--------|------|------|
| `GITHUB_TOKEN` | 自动提供，用于推送到 GHCR | 自动 |

### GitHub Variables (在仓库 Settings > Variables 设置)

| Variable | 说明 | 默认值 |
|----------|------|--------|
| `VITE_API_URL` | 前端 API 地址 | `http://localhost:8000` |

### 生产环境变量 (`.env.production`)

| 变量 | 说明 | 必需 |
|------|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 | ✅ |
| `SECRET_KEY` | JWT 密钥 (32+ 字符) | ✅ |
| `REDIS_PASSWORD` | Redis 密码 | 可选 |
| `ALLOWED_ORIGINS` | CORS 允许的域名 | ✅ |

---

## 版本发布

### 创建新版本

```bash
# 1. 更新版本号 (如果有)
# 2. 创建 tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 3. GitHub Actions 自动构建并打标签
#    - ghcr.io/.../backend:v1.0.0
#    - ghcr.io/.../frontend:v1.0.0
```

### 回滚到指定版本

```bash
# 修改 .env.production 中的镜像 tag
BACKEND_IMAGE=ghcr.io/your-username/pet-qr-app/backend:v1.0.0
FRONTEND_IMAGE=ghcr.io/your-username/pet-qr-app/frontend:v1.0.0

# 重新部署
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 常见问题

### CI 失败

1. **Lint 错误**: 运行 `ruff format .` 自动修复
2. **Type 错误**: 检查 TypeScript 类型定义
3. **测试失败**: 本地运行 `pytest -v` 调试

### 镜像拉取失败

```bash
# 检查登录状态
docker login ghcr.io

# 手动拉取测试
docker pull ghcr.io/<username>/pet-qr-app/backend:main
```

### 容器启动失败

```bash
# 查看日志
docker logs pet-qr-backend

# 检查数据库连接
docker exec pet-qr-backend curl -s http://localhost:8000/health
```

---

## 扩展到 AWS

以后迁移到 AWS 时，只需修改：

1. **镜像仓库**: GHCR → AWS ECR
2. **部署方式**: docker-compose → ECS Task Definition
3. **数据库**: 本地 PostgreSQL → AWS RDS

CI 工作流基本保持不变。

### AWS 迁移检查清单 (Future TODO)

- [ ] 创建 AWS 账户并配置 IAM
- [ ] 创建 ECR 仓库
- [ ] 修改 build.yml 推送到 ECR
- [ ] 创建 RDS PostgreSQL 实例
- [ ] 创建 ElastiCache Redis 实例
- [ ] 配置 ECS Cluster 和 Task Definition
- [ ] 配置 ALB (Application Load Balancer)
- [ ] 配置 Route 53 域名
- [ ] 配置 ACM SSL 证书
- [ ] 配置 CloudWatch 监控和告警

---

*文档版本: 1.0*
*最后更新: 2025-12-04*
*当前方案: B (标准版)*
