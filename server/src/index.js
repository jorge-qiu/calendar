require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { syncDatabase } = require('./models');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 基本中间件
app.use(helmet()); // 安全HTTP头
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL编码解析
app.use(morgan('dev')); // 请求日志

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制请求数
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});
app.use('/api', limiter);

// 静态文件服务
app.use('/uploads', express.static(uploadDir));

// API文档
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '日历应用 API',
      version: '1.0.0',
      description: '日历应用的RESTful API文档'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: '开发服务器'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 路由
app.use('/api', routes);

// 错误处理中间件
app.use(errorHandler);

// 未找到路由处理
app.use((req, res) => {
  res.status(404).json({ message: '未找到请求的资源' });
});

// 初始化数据库并启动服务器
syncDatabase()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`服务器运行在端口 ${PORT}`);
      logger.info(`API文档可访问: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    logger.error('数据库初始化失败:', err.message);
    process.exit(1);
  });

// 处理未捕获的异常
process.on('uncaughtException', err => {
  logger.error('未捕获的异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', err => {
  logger.error('未处理的Promise拒绝:', err);
  process.exit(1);
});

module.exports = app; // 导出供测试使用 