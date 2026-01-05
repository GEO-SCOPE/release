# GEO-SCOPE Release Server

独立的发布管理服务，用于管理 GEO-SCOPE 桌面应用的版本发布和自动更新。

## 文档

| 文档 | 说明 |
|------|------|
| [QUICKSTART.md](./QUICKSTART.md) | 5 分钟快速入门 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 完整部署指南 |
| [README.md](./README.md) | 本文档 - API 参考 |

## 功能特性

- **多语言支持** - 更新日志支持任意语言 (en, zh, ja, ko, fr, de, es, ...)
- **作者信息** - 发布版本可关联作者姓名、头像、链接
- **头像上传** - 支持上传作者头像图片
- **版本发布管理** - 创建、更新、删除版本
- **多平台构建管理** - macOS, Windows, Linux
- **更新日志条目** - 细粒度的变更记录 (feature, fix, breaking, ...)
- **Tauri Updater 兼容** - 标准更新检查 API
- **静态文件托管** - 发布包和头像下载
- **文件上传 API** - 支持 CI/CD 自动上传
- **API Key 认证** - 保护写操作
- **SQLite 数据库** - 使用 SQLAlchemy ORM
- **CLI 命令行工具** - 类似 git 的远程管理

## 快速开始

### 1. 安装依赖

```bash
cd Release
pip install -r requirements.txt
```

### 1.1 安装 CLI 工具 (可选)

```bash
cd Release
pip install -e .

# 验证安装
geo-release --help
```

### 2. 启动服务

```bash
# 开发模式
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 或直接运行
python main.py
```

### 3. 访问 API 文档

打开浏览器访问: http://localhost:8001/docs

## 目录结构

```
Release/
├── main.py              # 主入口
├── db.py                # 数据库连接
├── db_models.py         # SQLAlchemy 模型
├── db_config.py         # 数据库操作
├── models.py            # Pydantic 模型
├── auth.py              # API 认证
├── requirements.txt     # 依赖
├── routers/
│   ├── __init__.py
│   ├── releases.py      # 发布管理 API
│   ├── update.py        # 更新检查 API
│   └── uploads.py       # 文件上传 API
├── data/
│   └── releases.db      # SQLite 数据库
├── packages/            # 发布包托管目录
│   ├── darwin/
│   │   ├── aarch64/
│   │   └── x86_64/
│   ├── windows/
│   │   └── x86_64/
│   └── linux/
│       └── x86_64/
└── assets/              # 静态资源目录
    └── avatars/         # 头像存储
```

## API 端点

### 更新检查 (Tauri Updater)

```
GET /api/update/check?target={target}&arch={arch}&version={version}&locale={locale}
```

**参数:**
- `target`: 操作系统 (darwin/windows/linux)
- `arch`: 架构 (x86_64/aarch64)
- `version`: 当前版本号
- `locale`: 语言代码 (可选，默认 en)

**返回:**
- 200: 有更新，返回更新信息
- 204: 无更新

### 发布管理

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/releases` | 获取所有版本 |
| GET | `/api/releases/latest` | 获取最新版本 |
| GET | `/api/releases/{version}` | 获取指定版本 |
| POST | `/api/releases` | 创建新版本 |
| PATCH | `/api/releases/{version}` | 更新版本信息 |
| DELETE | `/api/releases/{version}` | 删除版本 |
| POST | `/api/releases/{version}/builds` | 添加平台构建 |
| DELETE | `/api/releases/{version}/builds/{target}/{arch}` | 删除平台构建 |
| POST | `/api/releases/{version}/changelogs` | 添加更新日志条目 |

### 文件上传

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/uploads/{target}/{arch}/{filename}` | 上传发布包 |
| DELETE | `/api/uploads/{target}/{arch}/{filename}` | 删除发布包 |
| GET | `/api/uploads/{target}/{arch}` | 列出发布包 |
| POST | `/api/uploads/avatar` | 上传头像 |
| DELETE | `/api/uploads/avatar/{filename}` | 删除头像 |
| GET | `/api/uploads/avatars` | 列出头像 |

### 静态文件

| 路径 | 说明 |
|------|------|
| `/packages/{target}/{arch}/{filename}` | 发布包下载 |
| `/assets/avatars/{filename}` | 头像访问 |

## 多语言内容格式

所有文本内容使用 JSON 格式支持多语言：

```json
{
  "en": "English content",
  "zh": "中文内容",
  "ja": "日本語コンテンツ",
  "ko": "한국어 콘텐츠",
  "fr": "Contenu français",
  "de": "Deutscher Inhalt",
  "es": "Contenido en español"
}
```

**语言回退机制:** 请求的语言 → 英语 (en) → 任意可用语言

## 使用流程

### 1. 上传头像 (可选)

```bash
# 使用 CLI
geo-release avatar upload ./silan.png

# 或使用 API
curl -X POST "http://localhost:8001/api/uploads/avatar" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@./silan.png"

# 返回:
{
  "success": true,
  "url": "/assets/avatars/abc123.png",
  "filename": "abc123.png"
}
```

### 2. 创建新版本

```bash
curl -X POST http://localhost:8001/api/releases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "version": "0.2.0",
    "notes": {
      "en": "- New: Auto update feature",
      "zh": "- 新功能: 自动更新",
      "ja": "- 新機能: 自動アップデート"
    },
    "detail": {
      "en": "## What'\''s New\n\n### Auto Update\nDetailed description...",
      "zh": "## 更新内容\n\n### 自动更新\n详细说明..."
    },
    "author": {
      "name": "Silan",
      "avatar": "https://releases.geo-scope.ai/assets/avatars/abc123.png",
      "url": "https://github.com/Qingbolan"
    }
  }'
```

### 3. 上传发布包

```bash
# 使用 CLI
geo-release upload ./GEO-SCOPE_0.2.0_aarch64.dmg \
  --target darwin --arch aarch64 --version 0.2.0

# 或使用 API
curl -X POST "http://localhost:8001/api/uploads/darwin/aarch64/GEO-SCOPE_0.2.0_aarch64.dmg" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@./GEO-SCOPE_0.2.0_aarch64.dmg"
```

### 4. 添加构建信息

```bash
curl -X POST http://localhost:8001/api/releases/0.2.0/builds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "target": "darwin",
    "arch": "aarch64",
    "url": "https://releases.geo-scope.ai/packages/darwin/aarch64/GEO-SCOPE_0.2.0_aarch64.dmg",
    "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
    "size": 52428800,
    "sha256": "abc123..."
  }'
```

### 5. 添加更新日志条目 (可选)

```bash
curl -X POST http://localhost:8001/api/releases/0.2.0/changelogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "type": "feature",
    "text": {
      "en": "Added auto-update feature",
      "zh": "新增自动更新功能"
    },
    "pr_url": "https://github.com/org/repo/pull/123"
  }'
```

### 6. 配置 Tauri

在 `Frontend/src-tauri/tauri.conf.json` 中配置:

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://releases.geo-scope.ai/api/update/check?target={{target}}&arch={{arch}}&version={{current_version}}"
      ],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

## CLI 命令行工具

`geo-release` 是一个类似 git 的命令行工具，用于远程管理版本发布。

### 安装

```bash
cd Release
pip install -e .
```

### 配置远程服务器

```bash
geo-release config --server https://releases.geo-scope.ai --key YOUR_API_KEY
geo-release config --show
```

### 推送新版本

```bash
# 使用 JSON 格式多语言内容
geo-release push 0.2.0 \
  --notes '{"en": "- New: Auto update", "zh": "- 新功能: 自动更新", "ja": "- 新機能: 自動アップデート"}' \
  --author '{"name": "Silan", "avatar": "https://releases.geo-scope.ai/assets/avatars/abc123.png"}'

# 或使用简单字符串 (默认英语)
geo-release push 0.2.0 --notes "- New: Auto update" --default-lang en

# 从文件读取
geo-release push 0.2.0 --notes-file notes.json --detail-file detail.json

# 推送预发布版本
geo-release push 0.3.0-beta.1 --prerelease --notes '{"en": "Beta release"}'
```

### 头像管理

```bash
# 上传头像
geo-release avatar upload ./silan.png

# 列出头像
geo-release avatar list

# 删除头像
geo-release avatar delete --filename abc123.png --force
```

### 上传构建文件

```bash
geo-release upload ./GEO-SCOPE_0.2.0.dmg \
  --target darwin \
  --arch aarch64 \
  --version 0.2.0 \
  --signature-file ./GEO-SCOPE_0.2.0.dmg.sig
```

### 添加更新日志条目

```bash
geo-release changelog 0.2.0 \
  --type feature \
  --text '{"en": "Added auto-update", "zh": "新增自动更新"}' \
  --pr https://github.com/org/repo/pull/123
```

### 查看版本

```bash
# 列出所有版本
geo-release list

# 查看更新日志
geo-release log
geo-release log 0.2.0 --lang zh --detail
```

### 更新版本信息

```bash
# 更新日志 (合并到现有内容)
geo-release update 0.2.0 --notes '{"ja": "日本語の説明"}'

# 更新作者
geo-release update 0.2.0 --author '{"name": "New Author"}'

# 停用版本
geo-release update 0.1.0 --active false
```

### 删除版本

```bash
geo-release delete 0.1.0 --force
```

## 数据存储

使用 SQLite 数据库存储版本信息，文件位于 `data/releases.db`。

### 数据模型

**Release (版本)**
```python
{
  "id": "abc123",
  "version": "0.2.0",
  "pub_date": "2025-01-04T12:00:00Z",
  "notes": {"en": "...", "zh": "..."},      # 简短更新日志
  "detail": {"en": "...", "zh": "..."},     # 详细更新日志 (Markdown)
  "author": {                                # 作者信息
    "name": "Silan",
    "avatar": "https://...",
    "email": "...",
    "url": "https://github.com/Qingbolan"
  },
  "is_active": true,
  "is_critical": false,
  "is_prerelease": false,
  "min_version": null,
  "builds": [...],
  "changelogs": [...]
}
```

**Build (构建)**
```python
{
  "id": "xyz789",
  "target": "darwin",
  "arch": "aarch64",
  "url": "/packages/darwin/aarch64/GEO-SCOPE_0.2.0.dmg",
  "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
  "size": 52428800,
  "sha256": "abc123..."
}
```

**ChangelogEntry (更新日志条目)**
```python
{
  "id": "entry123",
  "type": "feature",  # feature, improve, fix, breaking, security, deprecated
  "text": {"en": "Added feature X", "zh": "新增功能 X"},
  "issue_url": "https://github.com/...",
  "pr_url": "https://github.com/...",
  "commit_hash": "abc123"
}
```

## API 认证

写操作需要 API Key 认证:

```bash
# Bearer Token
curl -H "Authorization: Bearer YOUR_API_KEY" ...

# X-API-Key Header
curl -H "X-API-Key: YOUR_API_KEY" ...
```

### 配置 API Key

```bash
export RELEASE_API_KEY="your-secure-api-key"
uvicorn main:app --host 0.0.0.0 --port 8001
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `RELEASE_API_KEY` | (自动生成) | API 认证密钥 |
| `DATABASE_URL` | `sqlite:///data/releases.db` | 数据库连接 |

## 生产部署

### 使用 Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### 使用 systemd

```ini
[Unit]
Description=GEO-SCOPE Release Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/geo-scope-release
Environment="RELEASE_API_KEY=your-api-key"
ExecStart=/opt/geo-scope-release/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

### Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name releases.geo-scope.ai;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## GitHub Actions 集成

### 配置 Secrets

| Secret | 说明 |
|--------|------|
| `RELEASE_SERVER_URL` | Release 服务器地址 |
| `RELEASE_API_KEY` | API 认证密钥 |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri 签名私钥 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码 (可选) |

### 生成 Tauri 签名密钥

```bash
npx tauri signer generate -w ~/.tauri/GEO-SCOPE.key
```

## 🚀 部署流程

### 方式 1: 推送到 product 分支 (自动发布)

```bash
# 确保在 product 分支
git checkout product

# 推送代码
git push origin product
```

触发后自动执行:
1. 计算版本号 (当前: 0.18.0)
2. 获取本次 push 的 commits
3. 调用 AI 生成中英文 changelog
4. 并行构建 4 个平台
5. 上传到 Release 服务器
6. 注册构建元数据

### 方式 2: 创建 Tag (正式版本 + GitHub Release)

```bash
# 创建并推送 tag
git tag v1.0.0
git push origin v1.0.0

# 预发布版本
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

### 方式 3: 手动触发

1. GitHub → Actions → Release
2. Run workflow
3. 填写:
   - version: 版本号 (留空自动计算)
   - notes_zh: 中文更新日志
   - notes_en: 英文更新日志
   - is_critical: 是否关键更新
   - is_prerelease: 是否预发布

---

## 📦 构建产物

| 平台    | 架构   | 文件格式   | 输出                             |
|---------|--------|------------|----------------------------------|
| Linux   | x64    | .AppImage  | GEO-SCOPE_0.18.0_x86_64.AppImage |

---

## ✅ 部署前 Checklist

- [ ] 1. 生成 Tauri 签名密钥对
- [ ] 2. 配置 GitHub Secrets:
  - TAURI_SIGNING_PRIVATE_KEY
  - TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  - RELEASE_API_KEY
- [ ] 3. 更新 tauri.conf.json 的 pubkey
- [ ] 4. 确认 Release 服务器运行正常
  ```bash
  curl https://releases.geo-scope.ai/api/update/changelog
  ```
- [ ] 5. 推送代码触发构建

---

## 🔍 验证更新功能

构建完成后，在旧版本客户端:
1. 设置 → 关于 → 点击"立即检查"
2. 应显示新版本可用
3. 点击"下载并安装" → 显示进度条
4. 下载完成后点击"立即重启"
