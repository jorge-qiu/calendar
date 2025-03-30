const logger = require('../utils/logger');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 日志记录错误
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  // 获取状态码，默认为500
  const statusCode = err.statusCode || 500;
  
  // 格式化错误响应
  const errorResponse = {
    error: {
      message: err.message || '服务器内部错误',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    }
  };

  // 非生产环境下添加错误堆栈
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
  }

  // 返回错误响应
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler; 