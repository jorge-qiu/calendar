/**
 * 自定义应用错误类
 * 用于创建具有状态码和错误代码的错误
 */
class AppError extends Error {
  /**
   * 创建一个应用错误
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {string} code - 错误代码
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this.getCodeFromStatus(statusCode);
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * 根据HTTP状态码生成错误代码
   * @param {number} statusCode - HTTP状态码
   * @returns {string} 错误代码
   */
  getCodeFromStatus(statusCode) {
    const codeMap = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR'
    };
    
    return codeMap[statusCode] || 'UNKNOWN_ERROR';
  }
}

module.exports = AppError; 