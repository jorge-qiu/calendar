const User = require('./User');
const DateRecord = require('./DateRecord');
const sequelize = require('../config/database');

// 设置模型关联
User.hasMany(DateRecord, {
    foreignKey: 'userId',
    as: 'dateRecords'
});

DateRecord.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// 同步数据库
async function syncDatabase() {
    try {
        await sequelize.sync();
        console.log('数据库同步成功');
    } catch (error) {
        console.error('数据库同步失败:', error);
        throw error;
    }
}

module.exports = {
    User,
    DateRecord,
    sequelize,
    syncDatabase
}; 