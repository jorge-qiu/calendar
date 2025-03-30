const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * 生成JWT令牌
 * @param {number} id - 用户ID
 * @returns {string} JWT令牌
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * 创建并发送令牌
 * @param {Object} user - 用户对象
 * @param {number} statusCode - HTTP状态码
 * @param {Object} res - 响应对象
 */
const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user.id);

  // 转换为JSON并移除密码
  const userData = user.toJSON();
  delete userData.password;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData
    }
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 注册新用户
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: 用户注册成功
 *       400:
 *         description: 无效的注册数据
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return next(new AppError('请提供用户名、电子邮箱和密码', 400));
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return next(new AppError('用户名或电子邮箱已被使用', 409));
    }

    // 创建新用户
    const newUser = await User.create({
      username,
      email,
      password,
      role: 'user' // 默认角色
    });

    // 生成令牌并发送响应
    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *       401:
 *         description: 登录失败
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return next(new AppError('请提供电子邮箱和密码', 400));
    }

    // 查找用户
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return next(new AppError('电子邮箱或密码不正确', 401));
    }

    // 验证密码
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new AppError('电子邮箱或密码不正确', 401));
    }

    // 生成令牌并发送响应
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *       401:
 *         description: 未授权
 */
exports.getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
}; 