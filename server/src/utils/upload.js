const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AppError = require('./AppError');

// 定义允许的文件类型
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 5 * 1024 * 1024; // 5MB

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 创建日期子目录
const createDateFolder = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateFolder = path.join(uploadDir, `${year}${month}`);
  
  if (!fs.existsSync(dateFolder)) {
    fs.mkdirSync(dateFolder, { recursive: true });
  }
  
  return dateFolder;
};

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dateFolder = createDateFolder();
    cb(null, dateFolder);
  },
  filename: (req, file, cb) => {
    // 使用UUID生成唯一文件名
    const uniqueSuffix = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExt}`);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`不支持的文件类型: ${file.mimetype}`, 400), false);
  }
};

// 创建multer实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// 删除图片
const deleteImage = async (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  return new Promise((resolve, reject) => {
    fs.unlink(fullPath, (err) => {
      if (err) {
        // 如果文件不存在则忽略错误
        if (err.code === 'ENOENT') {
          return resolve(true);
        }
        return reject(err);
      }
      resolve(true);
    });
  });
};

// 获取图片URL（相对路径转绝对URL）
const getImageUrl = (req, relativePath) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${relativePath}`;
};

module.exports = {
  upload,
  deleteImage,
  getImageUrl
}; 