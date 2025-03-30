const express = require('express');
const recordController = require('../controllers/dateRecordController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 保护所有路由
router.use(protect);

// 获取记录统计
router.get('/stats', recordController.getStats);

// 日历记录路由
router.route('/')
  .get(recordController.getAllRecords)
  .post(recordController.createRecord);

// 特定日期记录路由
router.route('/:date')
  .get(recordController.getRecord)
  .put(recordController.updateRecord)
  .delete(recordController.deleteRecord);

module.exports = router; 