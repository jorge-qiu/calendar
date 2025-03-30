# 日历应用后端服务部署指南

本文档提供了日历应用后端服务的详细部署指南，包括不同环境的部署方法、配置选项和最佳实践。

## 目录

- [部署前准备](#部署前准备)
- [本地开发环境部署](#本地开发环境部署)
- [使用PM2部署](#使用pm2部署)
- [Docker部署](#docker部署)
- [云服务部署](#云服务部署)
- [负载均衡和扩展](#负载均衡和扩展)
- [持续集成/持续部署](#持续集成持续部署)
- [监控和日志](#监控和日志)
- [备份和恢复](#备份和恢复)
- [故障排除](#故障排除)

## 部署前准备

### 系统要求

- Node.js v14.x 或更高版本
- MongoDB v4.x 或更高版本
- npm v6.x 或更高版本（或yarn）
- 至少1GB RAM（推荐2GB或更多）
- 至少10GB磁盘空间（用于应用、日志和上传文件）

### 环境变量配置

在部署前，确保准备好以下环境变量：

```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=30d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5000000
CORS_ORIGIN=https://your-frontend-domain.com
```

**重要提示**：
- 在生产环境中，使用强密码和安全的JWT密钥
- 确保MongoDB连接使用认证和TLS/SSL
- 限制CORS来源为您的前端应用域名

### 安全检查清单

- [ ] 使用HTTPS而非HTTP
- [ ] 设置适当的防火墙规则
- [ ] 配置安全的MongoDB连接（认证+加密）
- [ ] 使用强JWT密钥
- [ ] 限制CORS来源
- [ ] 设置适当的文件上传限制
- [ ] 确保日志不包含敏感信息

## 本地开发环境部署

### 步骤

1. 克隆代码库：
   ```bash
   git clone <repository-url>
   cd server
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 创建`.env`文件并配置环境变量（参见上面的环境变量列表）

4. 启动开发服务器：
   ```bash
   npm run dev
   ```

5. 验证服务是否正常运行：
   ```bash
   curl http://localhost:5000/api/health
   ```

## 使用PM2部署

[PM2](https://pm2.keymetrics.io/)是Node.js应用的生产进程管理器，提供负载均衡、自动重启和监控功能。

### 安装PM2

```bash
npm install -g pm2
```

### 基本部署

1. 克隆并设置项目：
   ```bash
   git clone <repository-url>
   cd server
   npm install --production
   ```

2. 创建`.env`文件并配置生产环境变量

3. 使用PM2启动应用：
   ```bash
   pm2 start src/index.js --name "calendar-app-backend"
   ```

4. 保存PM2配置以便在系统重启后自动启动：
   ```bash
   pm2 save
   pm2 startup
   ```

### 使用配置文件部署

1. 使用项目中的`ecosystem.config.js`文件：
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

2. 监控应用：
   ```bash
   pm2 monit
   ```

3. 查看日志：
   ```bash
   pm2 logs calendar-app-backend
   ```

### 零停机更新

当需要更新应用时，使用以下命令：

```bash
git pull
npm install --production
pm2 reload calendar-app-backend
```

## Docker部署

### 单容器部署

1. 构建Docker镜像：
   ```bash
   docker build -t calendar-app-backend .
   ```

2. 运行容器：
   ```bash
   docker run -d \
     --name calendar-backend \
     -p 5000:5000 \
     -e NODE_ENV=production \
     -e MONGODB_URI=mongodb://mongo:27017/calendar-app \
     -e JWT_SECRET=your_secure_jwt_secret \
     -e JWT_EXPIRES_IN=30d \
     -e UPLOAD_DIR=uploads \
     -e MAX_FILE_SIZE=5000000 \
     -e CORS_ORIGIN=https://your-frontend-domain.com \
     -v $(pwd)/uploads:/usr/src/app/uploads \
     -v $(pwd)/logs:/usr/src/app/logs \
     calendar-app-backend
   ```

### 使用Docker Compose

1. 确保`docker-compose.yml`文件已配置（项目根目录已提供）

2. 启动服务：
   ```bash
   docker-compose up -d
   ```

3. 查看日志：
   ```bash
   docker-compose logs -f
   ```

4. 停止服务：
   ```bash
   docker-compose down
   ```

### 更新Docker部署

```bash
git pull
docker-compose build
docker-compose down
docker-compose up -d
```

## 云服务部署

### AWS部署

#### 使用EC2

1. 启动EC2实例（推荐t3.small或更高配置）
2. 安装Node.js、MongoDB和Git
3. 克隆代码库并按照PM2部署步骤操作
4. 配置安全组以开放必要端口（通常为5000）

#### 使用ECS（Docker）

1. 创建ECR仓库并推送Docker镜像：
   ```bash
   aws ecr create-repository --repository-name calendar-app-backend
   aws ecr get-login-password | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com
   docker tag calendar-app-backend:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/calendar-app-backend:latest
   docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/calendar-app-backend:latest
   ```

2. 创建ECS集群、任务定义和服务

### 使用Heroku

1. 安装Heroku CLI并登录：
   ```bash
   npm install -g heroku
   heroku login
   ```

2. 创建Heroku应用：
   ```bash
   heroku create calendar-app-backend
   ```

3. 添加MongoDB插件：
   ```bash
   heroku addons:create mongolab
   ```

4. 设置环境变量：
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secure_jwt_secret
   heroku config:set JWT_EXPIRES_IN=30d
   heroku config:set MAX_FILE_SIZE=5000000
   heroku config:set CORS_ORIGIN=https://your-frontend-domain.com
   ```

5. 部署应用：
   ```bash
   git push heroku main
   ```

### 使用DigitalOcean

1. 创建Droplet（推荐Basic Droplet，2GB RAM）
2. 按照PM2或Docker部署步骤操作
3. 或使用DigitalOcean App Platform：
   - 连接GitHub仓库
   - 选择Node.js运行时
   - 配置环境变量
   - 部署应用

## 负载均衡和扩展

### 使用PM2集群模式

PM2可以在集群模式下运行Node.js应用，利用多核CPU：

```bash
pm2 start ecosystem.config.js --env production
```

`ecosystem.config.js`中已配置为使用集群模式：

```javascript
module.exports = {
  apps: [{
    name: "calendar-app-backend",
    script: "src/index.js",
    instances: "max",
    exec_mode: "cluster",
    // 其他配置...
  }]
};
```

### 使用Nginx作为负载均衡器

1. 安装Nginx：
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. 配置Nginx作为反向代理和负载均衡器：
   ```nginx
   upstream calendar_backend {
     server 127.0.0.1:5000;
     server 127.0.0.1:5001;
     server 127.0.0.1:5002;
     # 添加更多后端服务器...
   }

   server {
     listen 80;
     server_name api.your-domain.com;

     location / {
       proxy_pass http://calendar_backend;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

3. 启用HTTPS（推荐使用Let's Encrypt）：
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.your-domain.com
   ```

## 持续集成/持续部署

### 使用GitHub Actions

1. 在项目中创建`.github/workflows/deploy.yml`文件：

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14.x'
    - run: npm ci
    - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    # 部署到服务器
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/app
          git pull
          npm install --production
          pm2 reload calendar-app-backend
```

2. 在GitHub仓库设置中添加以下密钥：
   - `HOST`: 服务器IP或域名
   - `USERNAME`: SSH用户名
   - `SSH_KEY`: SSH私钥

### 使用GitLab CI/CD

创建`.gitlab-ci.yml`文件：

```yaml
stages:
  - test
  - deploy

test:
  stage: test
  image: node:14
  script:
    - npm ci
    - npm test

deploy:
  stage: deploy
  image: node:14
  script:
    - apt-get update -qq && apt-get install -y -qq sshpass
    - sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "cd /path/to/app && git pull && npm install --production && pm2 reload calendar-app-backend"
  only:
    - main
```

## 监控和日志

### 日志管理

应用使用Winston进行日志记录，日志文件位于`logs/`目录：

- `logs/app.log`: 常规应用日志
- `logs/error.log`: 错误日志

#### 使用日志轮转

为防止日志文件过大，可以使用`logrotate`：

```
/path/to/app/logs/*.log {
  daily
  missingok
  rotate 14
  compress
  delaycompress
  notifempty
  create 0640 node node
}
```

### 使用PM2监控

PM2提供基本的监控功能：

```bash
pm2 monit
```

### 使用Prometheus和Grafana

1. 安装Prometheus Node.js客户端：
   ```bash
   npm install prom-client
   ```

2. 在应用中集成Prometheus指标收集
3. 配置Prometheus服务器抓取指标
4. 使用Grafana创建监控仪表板

## 备份和恢复

### MongoDB备份

#### 使用mongodump

```bash
# 备份
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/path

# 恢复
mongorestore --uri="mongodb://username:password@host:port/database" /backup/path
```

#### 自动化备份脚本

创建备份脚本`backup.sh`：

```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
MONGO_URI="mongodb://username:password@host:port/database"

# 创建备份
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/mongo_$TIMESTAMP"

# 压缩备份
tar -zcvf "$BACKUP_DIR/mongo_$TIMESTAMP.tar.gz" "$BACKUP_DIR/mongo_$TIMESTAMP"

# 删除原始备份目录
rm -rf "$BACKUP_DIR/mongo_$TIMESTAMP"

# 保留最近30天的备份
find "$BACKUP_DIR" -name "mongo_*.tar.gz" -type f -mtime +30 -delete
```

设置定时任务：

```bash
# 每天凌晨2点运行备份
0 2 * * * /path/to/backup.sh
```

### 上传文件备份

定期备份`uploads/`目录：

```bash
tar -zcvf /backup/path/uploads_$(date +"%Y%m%d_%H%M%S").tar.gz /path/to/app/uploads
```

## 故障排除

### 常见问题

#### 应用无法启动

1. 检查日志文件：
   ```bash
   cat logs/error.log
   ```

2. 验证环境变量是否正确设置：
   ```bash
   grep -v '^#' .env
   ```

3. 确保MongoDB可访问：
   ```bash
   mongo $MONGODB_URI
   ```

#### 连接超时

1. 检查防火墙设置
2. 验证服务器资源使用情况：
   ```bash
   top
   free -m
   df -h
   ```

#### 文件上传失败

1. 检查`uploads/`目录权限：
   ```bash
   ls -la uploads/
   ```

2. 确保目录可写：
   ```bash
   chmod 755 uploads/
   chown -R node:node uploads/
   ```

3. 验证磁盘空间：
   ```bash
   df -h
   ```

### 调试技巧

1. 临时启用详细日志：
   ```bash
   NODE_ENV=development node src/index.js
   ```

2. 检查网络连接：
   ```bash
   netstat -tulpn | grep 5000
   ```

3. 监控实时日志：
   ```bash
   tail -f logs/app.log
   ```

4. 检查MongoDB连接：
   ```bash
   mongo $MONGODB_URI --eval "db.adminCommand('ping')"
   ```

---

如有任何部署问题，请参考上述故障排除部分或联系开发团队获取支持。 