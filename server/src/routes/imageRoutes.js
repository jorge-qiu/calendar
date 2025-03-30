const express = require('express');
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 保护所有路由
router.use(protect);

// 单个图片上传路由
router.post('/upload', imageController.uploadMiddleware, imageController.uploadImage);

// 多个图片上传路由
router.post('/upload-multiple', imageController.uploadMultipleMiddleware, imageController.uploadMultipleImages);

// 图片重新排序路由
router.put('/reorder', imageController.reorderImages);

// 图片删除路由
router.delete('/:id', imageController.deleteImage);

module.exports = router; 