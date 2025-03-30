const AppError = require('../utils/AppError');
const { upload, getImageUrl, deleteImage } = require('../utils/upload');
const { DateRecord } = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Multer 单个文件上传中间件
exports.uploadMiddleware = upload.single('image');

// Multer 多个文件上传中间件（最多10张图片）
exports.uploadMultipleMiddleware = upload.array('images', 10);

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: 上传单个图片
 *     tags: [图片]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: 图片上传成功
 *       400:
 *         description: 无效的请求
 */
exports.uploadImage = (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('请提供图片文件', 400));
    }

    // 构建图片URL（相对路径）
    const relativeUrl = `uploads/${req.file.path.split('uploads/')[1]}`;

    // 构建图片信息
    const imageData = {
      id: uuidv4(),
      url: relativeUrl,
      alt: req.file.originalname || '图片',
      order: 0
    };

    // 返回完整URL和相对URL
    res.status(201).json({
      status: 'success',
      data: {
        image: {
          ...imageData,
          fullUrl: getImageUrl(req, relativeUrl)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/images/upload-multiple:
 *   post:
 *     summary: 上传多个图片
 *     tags: [图片]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: 图片上传成功
 *       400:
 *         description: 无效的请求
 */
exports.uploadMultipleImages = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('请提供至少一个图片文件', 400));
    }

    // 处理所有上传的图片
    const images = req.files.map((file, index) => {
      // 构建图片URL（相对路径）
      const relativeUrl = `uploads/${file.path.split('uploads/')[1]}`;

      return {
        id: uuidv4(),
        url: relativeUrl,
        alt: file.originalname || `图片${index + 1}`,
        order: index,
        fullUrl: getImageUrl(req, relativeUrl)
      };
    });

    res.status(201).json({
      status: 'success',
      results: images.length,
      data: {
        images
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: 删除图片
 *     tags: [图片]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 图片ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: 记录日期(YYYY-MM-DD)
 *     responses:
 *       204:
 *         description: 图片删除成功
 *       404:
 *         description: 图片不存在
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return next(new AppError('请提供记录日期', 400));
    }

    // 查找记录
    const record = await DateRecord.findOne({
      where: {
        date,
        userId: req.user.id
      }
    });

    if (!record) {
      return next(new AppError(`未找到日期为 ${date} 的记录`, 404));
    }

    // 查找并删除图片
    const images = record.images || [];
    const imageIndex = images.findIndex(img => img.id === id);
    if (imageIndex === -1) {
      return next(new AppError(`未找到ID为 ${id} 的图片`, 404));
    }

    const imageToDelete = images[imageIndex];

    // 从文件系统中删除图片
    if (imageToDelete.url.startsWith('uploads/')) {
      await deleteImage(imageToDelete.url);
    }

    // 从记录中移除图片
    images.splice(imageIndex, 1);
    await record.update({ images });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/images/reorder:
 *   put:
 *     summary: 重新排序图片
 *     tags: [图片]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - images
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: number
 *     responses:
 *       200:
 *         description: 图片排序更新成功
 *       404:
 *         description: 记录不存在
 */
exports.reorderImages = async (req, res, next) => {
  try {
    const { date, images } = req.body;

    if (!date || !images || !Array.isArray(images)) {
      return next(new AppError('请提供有效的日期和图片排序数据', 400));
    }

    // 查找记录
    const record = await DateRecord.findOne({
      where: {
        date,
        userId: req.user.id
      }
    });

    if (!record) {
      return next(new AppError(`未找到日期为 ${date} 的记录`, 404));
    }

    // 获取当前图片列表
    const currentImages = record.images || [];

    // 更新图片顺序
    const updatedImages = currentImages.map(img => {
      const newOrder = images.find(i => i.id === img.id)?.order;
      return newOrder !== undefined ? { ...img, order: newOrder } : img;
    });

    // 按新顺序排序
    updatedImages.sort((a, b) => a.order - b.order);

    // 更新记录
    await record.update({ images: updatedImages });

    res.status(200).json({
      status: 'success',
      data: {
        images: updatedImages
      }
    });
  } catch (err) {
    next(err);
  }
}; 