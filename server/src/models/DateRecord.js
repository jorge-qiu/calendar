const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         id:
 *           type: string
 *           description: 图片ID
 *         url:
 *           type: string
 *           description: 图片URL
 *         alt:
 *           type: string
 *           description: 图片替代文本
 *         order:
 *           type: number
 *           description: 图片排序
 *
 *     DateRecord:
 *       type: object
 *       required:
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: 记录ID
 *         date:
 *           type: string
 *           format: date
 *           description: 日期(YYYY-MM-DD)
 *         title:
 *           type: string
 *           description: 标题
 *         description:
 *           type: string
 *           description: 详细描述
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Image'
 *           description: 相关图片
 *         marked:
 *           type: boolean
 *           description: 是否标记
 *         markType:
 *           type: string
 *           enum: [event, important, holiday, birthday]
 *           description: 标记类型
 *         userId:
 *           type: integer
 *           description: 用户ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */

class DateRecord extends Model { }

DateRecord.init({
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  title: {
    type: DataTypes.STRING
  },
  description: {
    type: DataTypes.TEXT
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  marked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  markType: {
    type: DataTypes.ENUM('event', 'important', 'holiday', 'birthday'),
    defaultValue: 'event'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'DateRecord',
  indexes: [
    {
      unique: true,
      fields: ['date', 'userId']
    }
  ]
});

module.exports = DateRecord; 