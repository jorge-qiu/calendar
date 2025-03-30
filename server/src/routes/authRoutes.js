const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 注册路由
router.post('/register', authController.register);

// 登录路由
router.post('/login', authController.login);

// 获取当前用户信息（需要认证）
router.get('/me', protect, authController.getMe);

module.exports = router; 