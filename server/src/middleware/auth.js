const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { User } = require('../models');

/**
 * 保护路由中间件 - 验证用户是否已登录
 */
exports.protect = async (req, res, next) => {
  try {
    // 1) 从请求头中获取token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('未提供访问令牌，请先登录', 401));
    }

    // 2) 验证token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return next(new AppError('无效的访问令牌', 401));
      }
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('访问令牌已过期，请重新登录', 401));
      }
      return next(new AppError('认证失败', 401));
    }

    // 3) 验证用户是否仍然存在
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('拥有此令牌的用户不存在', 401));
    }

    // 4) 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 授权中间件 - 限制对特定角色的访问
 * @param {...string} roles - 允许访问的角色
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('请先登录', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('您没有权限执行此操作', 403));
    }

    next();
  };
}; 