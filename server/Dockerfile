FROM node:16-alpine

# 创建应用目录
WORKDIR /usr/src/app

# 安装应用依赖
COPY package*.json ./
RUN npm install --production

# 拷贝应用代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 应用使用的端口
EXPOSE 5000

# 启动应用
CMD ["node", "src/index.js"] 