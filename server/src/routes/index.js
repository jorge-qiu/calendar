const express = require('express');
const authRoutes = require('./authRoutes');
const recordRoutes = require('./recordRoutes');
const imageRoutes = require('./imageRoutes');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: 认证
 *     description: 用户认证相关接口
 *   - name: 日历记录
 *     description: 日历记录管理接口
 *   - name: 图片
 *     description: 图片上传和管理接口
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// 默认路由
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '日历应用 API 正在运行',
    docs: '/api-docs'
  });
});

// 注册各模块路由
router.use('/auth', authRoutes);
router.use('/records', recordRoutes);
router.use('/images', imageRoutes);

module.exports = router; 