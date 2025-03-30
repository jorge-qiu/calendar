const { DateRecord } = require('../models');
const AppError = require('../utils/AppError');
const { getImageUrl, deleteImage } = require('../utils/upload');
const logger = require('../utils/logger');
const { Op, fn, col } = require('sequelize');

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: 获取用户的所有日历记录
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期(YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期(YYYY-MM-DD)
 *       - in: query
 *         name: marked
 *         schema:
 *           type: boolean
 *         description: 是否只返回标记的记录
 *     responses:
 *       200:
 *         description: 成功获取记录
 */
exports.getAllRecords = async (req, res, next) => {
  try {
    const { startDate, endDate, marked } = req.query;

    // 构建查询条件
    const where = { userId: req.user.id };

    // 日期范围过滤
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    // 标记过滤
    if (marked === 'true') where.marked = true;

    // 查询记录
    const records = await DateRecord.findAll({
      where,
      order: [['date', 'DESC']]
    });

    // 将记录格式化为前端期望的格式
    const formattedRecords = {};
    records.forEach(record => {
      formattedRecords[record.date] = record.toJSON();
    });

    res.status(200).json({
      status: 'success',
      results: records.length,
      data: {
        records: formattedRecords
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/records/{date}:
 *   get:
 *     summary: 获取特定日期的记录
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 记录日期(YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: 成功获取记录
 *       404:
 *         description: 记录不存在
 */
exports.getRecord = async (req, res, next) => {
  try {
    const { date } = req.params;

    // 查找特定日期的记录
    const record = await DateRecord.findOne({
      where: {
        date,
        userId: req.user.id
      }
    });

    if (!record) {
      return next(new AppError(`未找到日期为 ${date} 的记录`, 404));
    }

    // 添加图片完整URL
    const recordData = record.toJSON();
    if (recordData.images && recordData.images.length > 0) {
      recordData.images = recordData.images.map(image => ({
        ...image,
        url: image.url.startsWith('http') ? image.url : getImageUrl(req, image.url)
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        record: recordData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: 创建新的日期记录
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DateRecord'
 *     responses:
 *       201:
 *         description: 记录创建成功
 *       400:
 *         description: 无效的请求数据
 */
exports.createRecord = async (req, res, next) => {
  try {
    const { date, title, description, images, marked, markType } = req.body;

    // 验证必填字段
    if (!date) {
      return next(new AppError('日期是必填字段', 400));
    }

    // 检查日期格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return next(new AppError('日期格式无效，应为YYYY-MM-DD', 400));
    }

    // 检查是否已存在该日期的记录
    const existingRecord = await DateRecord.findOne({
      where: {
        date,
        userId: req.user.id
      }
    });

    if (existingRecord) {
      return next(new AppError(`已存在日期为 ${date} 的记录`, 409));
    }

    // 创建新记录
    const newRecord = await DateRecord.create({
      date,
      title,
      description,
      images: images || [],
      marked: marked || false,
      markType: markType || 'event',
      userId: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        record: newRecord
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/records/{date}:
 *   put:
 *     summary: 更新特定日期的记录
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 记录日期(YYYY-MM-DD)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DateRecord'
 *     responses:
 *       200:
 *         description: 记录更新成功
 *       404:
 *         description: 记录不存在
 */
exports.updateRecord = async (req, res, next) => {
  try {
    const { date } = req.params;
    const updateData = req.body;

    // 查找并更新记录
    const record = await DateRecord.findOne({
      where: {
        date,
        userId: req.user.id
      }
    });

    if (!record) {
      return next(new AppError(`未找到日期为 ${date} 的记录`, 404));
    }

    // 更新记录
    await record.update(updateData);

    res.status(200).json({
      status: 'success',
      data: {
        record
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/records/{date}:
 *   delete:
 *     summary: 删除特定日期的记录
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: 记录日期(YYYY-MM-DD)
 *     responses:
 *       204:
 *         description: 记录删除成功
 *       404:
 *         description: 记录不存在
 */
exports.deleteRecord = async (req, res, next) => {
  try {
    const { date } = req.params;

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

    // 删除相关图片
    const images = record.images || [];
    for (const image of images) {
      if (!image.url.startsWith('http')) {
        await deleteImage(image.url);
      }
    }

    // 删除记录
    await record.destroy();

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
 * /api/records/stats:
 *   get:
 *     summary: 获取记录统计信息
 *     tags: [日历记录]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 */
exports.getStats = async (req, res, next) => {
  try {
    const stats = await DateRecord.findAll({
      where: { userId: req.user.id },
      attributes: [
        [fn('COUNT', col('*')), 'totalRecords'],
        [fn('COUNT', fn('CASE', { when: { marked: true }, then: 1 })), 'markedRecords'],
        [fn('COUNT', fn('CASE', { when: { markType: 'event' }, then: 1 })), 'events'],
        [fn('COUNT', fn('CASE', { when: { markType: 'important' }, then: 1 })), 'important'],
        [fn('COUNT', fn('CASE', { when: { markType: 'holiday' }, then: 1 })), 'holidays'],
        [fn('COUNT', fn('CASE', { when: { markType: 'birthday' }, then: 1 })), 'birthdays']
      ],
      raw: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats: stats[0]
      }
    });
  } catch (err) {
    next(err);
  }
}; 