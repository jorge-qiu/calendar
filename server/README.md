# 日历应用后端服务

这是一个为日历应用提供的RESTful API后端服务，支持用户认证、日历记录管理和图片上传功能。

## 服务概述

该后端服务提供以下核心功能：

- **用户认证**：注册、登录和JWT认证
- **日历记录管理**：创建、读取、更新和删除日历记录
- **图片上传**：支持单图和多图上传、删除和重新排序
- **API文档**：使用Swagger提供自动生成的API文档
- **错误处理**：统一的错误响应格式
- **日志记录**：结构化日志记录
- **Docker支持**：容器化部署支持

## 技术栈

- **Node.js**：JavaScript运行时
- **Express**：Web应用框架
- **MongoDB**：NoSQL数据库
- **Mongoose**：MongoDB对象建模工具
- **JWT**：用于用户认证
- **Multer**：处理文件上传
- **Swagger**：API文档生成
- **Winston**：日志记录
- **Docker**：容器化

## 安装和运行

### 前提条件

- Node.js (v14+)
- MongoDB (v4+)
- npm 或 yarn

### 本地开发

1. 克隆仓库：

```bash
git clone <repository-url>
cd server
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

创建`.env`文件并设置以下变量：

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/calendar-app
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=30d
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5000000
CORS_ORIGIN=http://localhost:3000
```

4. 启动服务：

```bash
npm run dev
```

服务将在`http://localhost:5000`上运行，API根路径为`http://localhost:5000/api`。

### 使用Docker

1. 构建Docker镜像：

```bash
docker build -t calendar-app-backend .
```

2. 运行容器：

```bash
docker run -p 5000:5000 --env-file .env calendar-app-backend
```

或者使用Docker Compose：

```bash
docker-compose up
```

## API文档

启动服务后，可以通过访问`http://localhost:5000/api-docs`查看API文档。

### 主要API端点

#### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

#### 日历记录

- `GET /api/records` - 获取所有记录
- `POST /api/records` - 创建新记录
- `GET /api/records/:date` - 获取特定日期的记录
- `PUT /api/records/:date` - 更新记录
- `DELETE /api/records/:date` - 删除记录
- `GET /api/records/stats` - 获取记录统计

#### 图片上传

- `POST /api/images/upload` - 上传单个图片
- `POST /api/images/upload-multiple` - 上传多个图片
- `DELETE /api/images/:id` - 删除图片
- `PUT /api/images/reorder` - 重新排序图片

## 目录结构

```
server/
├── src/                  # 源代码
│   ├── controllers/      # 控制器
│   ├── middleware/       # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── utils/            # 工具函数
│   ├── app.js            # Express应用配置
│   └── index.js          # 应用入口点
├── uploads/              # 上传文件存储
├── logs/                 # 日志文件
├── .env                  # 环境变量
├── .env.example          # 环境变量示例
├── Dockerfile            # Docker配置
├── docker-compose.yml    # Docker Compose配置
└── package.json          # 项目依赖
```

## 部署

### 使用PM2

1. 安装PM2：

```bash
npm install -g pm2
```

2. 启动应用：

```bash
pm2 start ecosystem.config.js
```

### 使用Docker

参考上面的Docker说明或查看[部署文档](DEPLOYMENT.md)获取更多详细信息。

## 前端集成

查看[前端集成指南](FRONTEND_INTEGRATION.md)了解如何将此后端服务与前端应用集成。

## 测试

运行测试：

```bash
npm test
```

查看[测试文档](TESTING.md)获取更多关于测试策略和方法的信息。

## 项目总结与设计决策

查看[项目总结文档](SUMMARY.md)了解项目的设计决策、实现挑战和未来改进建议。

## 贡献

欢迎贡献！请随时提交问题或拉取请求。

## 许可证

本项目采用MIT许可证。 