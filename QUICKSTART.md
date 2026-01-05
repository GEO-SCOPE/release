# GEO-SCOPE Release 快速入门

5 分钟快速上手版本发布管理。

## 1. 启动服务器

```bash
cd Release

# 安装依赖
pip install -r requirements.txt

# 设置 API Key
export RELEASE_API_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
echo "Your API Key: $RELEASE_API_KEY"

# 启动服务
uvicorn main:app --port 8001
```

## 2. 安装 CLI 工具

```bash
pip install -e .

# 配置远程服务器
geo-release config --server http://localhost:8001 --key $RELEASE_API_KEY
```

## 3. 发布新版本

```bash
# 创建版本 (支持多语言)
geo-release push 0.2.0 \
  --notes '{"en": "- New: Auto update", "zh": "- 新功能: 自动更新"}' \
  --author '{"name": "Silan"}'

# 上传构建文件
geo-release upload ./GEO-SCOPE.dmg \
  --target darwin \
  --arch aarch64 \
  --version 0.2.0

# 查看结果
geo-release list
geo-release log --lang zh
```

## 4. 上传头像 (可选)

```bash
# 上传头像图片
geo-release avatar upload ./silan.png

# 返回 URL 用于作者信息
# URL: http://localhost:8001/assets/avatars/abc123.png
```

## 5. 测试更新

```bash
# 测试更新检查端点
curl "http://localhost:8001/api/update/check?target=darwin&arch=aarch64&version=0.1.0"
```

## 下一步

- 阅读 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解生产部署
- 配置 GitHub Actions 自动构建
- 生成 Tauri 签名密钥

## 命令速查

| 命令 | 说明 |
|------|------|
| `geo-release config --show` | 查看配置 |
| `geo-release push <version>` | 推送版本 |
| `geo-release upload <file>` | 上传构建 |
| `geo-release avatar upload <file>` | 上传头像 |
| `geo-release list` | 列出版本 |
| `geo-release log` | 查看日志 |
| `geo-release log --lang zh` | 中文日志 |
| `geo-release update <version>` | 更新版本 |
| `geo-release changelog <version>` | 添加日志条目 |
| `geo-release delete <version>` | 删除版本 |

## 多语言格式

```bash
# JSON 格式 (推荐)
--notes '{"en": "English", "zh": "中文", "ja": "日本語"}'

# 简单字符串 (使用默认语言)
--notes "Simple text" --default-lang en

# 从文件读取
--notes-file notes.json
```

## 作者信息格式

```bash
--author '{"name": "Silan", "avatar": "https://...", "url": "https://github.com/Qingbolan"}'
```
