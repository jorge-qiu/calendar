# 日历应用后端 API 测试文档

本文档提供了日历应用后端 API 的测试策略和方法，包括单元测试、集成测试、端到端测试和性能测试的详细指南。

## 目录

- [测试环境配置](#测试环境配置)
- [单元测试](#单元测试)
- [集成测试](#集成测试)
- [端到端测试](#端到端测试)
- [性能测试](#性能测试)
- [测试自动化](#测试自动化)
- [测试覆盖率](#测试覆盖率)
- [故障排除](#故障排除)

## 测试环境配置

### 所需依赖

项目已经在 `package.json` 中包含了测试必需的依赖项：

```bash
npm install --save-dev jest supertest
```

如果需要更多测试工具，可以安装以下依赖：

```bash
npm install --save-dev mongodb-memory-server mock-req-res sinon
```

### 测试配置文件

在项目根目录创建 `jest.config.js` 文件：

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000
};
```

### 测试数据库配置

使用 MongoDB 内存数据库进行测试，以避免影响生产或开发数据库：

1. 创建测试辅助文件 `tests/db-handler.js`：

```javascript
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// 连接到内存中的测试数据库
module.exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

// 断开连接并清理
module.exports.closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

// 清除所有集合
module.exports.clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
```

## 单元测试

单元测试用于测试代码中最小的单元（通常是函数或方法）。

### 模型测试示例

创建 `src/models/__tests__/User.test.js` 文件：

```javascript
const mongoose = require('mongoose');
const dbHandler = require('../../../tests/db-handler');
const User = require('../User');

// 测试前连接数据库
beforeAll(async () => await dbHandler.connect());
// 每次测试后清理数据
afterEach(async () => await dbHandler.clearDatabase());
// 测试完成后关闭数据库连接
afterAll(async () => await dbHandler.closeDatabase());

describe('User Model Test', () => {
  it('should create & save user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    const savedUser = await user.save();
    
    // 验证保存成功
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(userData.username);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.password).not.toBe(userData.password); // 密码应被哈希
  });
  
  it('should fail to save user without required fields', async () => {
    const userWithoutRequiredField = new User({ username: 'test' });
    let err;
    
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });
  
  it('should validate passwords correctly', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const user = new User(userData);
    await user.save();
    
    // 测试密码匹配
    const isMatch = await user.comparePassword('password123');
    expect(isMatch).toBe(true);
    
    // 测试密码不匹配
    const isMatchWrong = await user.comparePassword('wrongpassword');
    expect(isMatchWrong).toBe(false);
  });
});
```

### 工具函数测试示例

创建 `src/utils/__tests__/AppError.test.js` 文件：

```javascript
const AppError = require('../AppError');

describe('AppError Class Test', () => {
  it('should create error with correct properties', () => {
    const message = '测试错误';
    const statusCode = 404;
    const error = new AppError(message, statusCode);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });
  
  it('should default to 500 status code if not provided', () => {
    const error = new AppError('测试错误');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
  });
  
  it('should use custom error code if provided', () => {
    const error = new AppError('测试错误', 400, 'CUSTOM_ERROR');
    expect(error.code).toBe('CUSTOM_ERROR');
  });
});
```

## 集成测试

集成测试用于测试系统的多个部分如何一起工作。

### 控制器测试示例

创建 `src/controllers/__tests__/authController.test.js` 文件：

```javascript
const request = require('supertest');
const express = require('express');
const authController = require('../authController');
const User = require('../../models/User');
const dbHandler = require('../../../tests/db-handler');

// 创建简单的Express应用用于测试
const app = express();
app.use(express.json());
app.post('/register', authController.register);
app.post('/login', authController.login);

// 测试前连接数据库
beforeAll(async () => await dbHandler.connect());
// 每次测试后清理数据
afterEach(async () => await dbHandler.clearDatabase());
// 测试完成后关闭数据库连接
afterAll(async () => await dbHandler.closeDatabase());

describe('Auth Controller Test', () => {
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.password).toBeUndefined(); // 不应返回密码
    });
    
    it('should return error when required fields are missing', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser'
        });
      
      expect(res.statusCode).toBe(400);
    });
    
    it('should return error when user already exists', async () => {
      // 先创建用户
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // 尝试创建相同用户
      const res = await request(app)
        .post('/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(409);
    });
  });
  
  describe('POST /login', () => {
    it('should login user and return token', async () => {
      // 先创建用户
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // 登录
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.username).toBe('testuser');
    });
    
    it('should return error with incorrect credentials', async () => {
      // 先创建用户
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      
      // 使用错误密码登录
      const res = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });
});
```

### 路由测试示例

创建 `src/routes/__tests__/recordRoutes.test.js` 文件：

```javascript
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const DateRecord = require('../../models/DateRecord');
const jwt = require('jsonwebtoken');
const dbHandler = require('../../../tests/db-handler');

// 测试前连接数据库
beforeAll(async () => await dbHandler.connect());
// 每次测试后清理数据
afterEach(async () => await dbHandler.clearDatabase());
// 测试完成后关闭数据库连接
afterAll(async () => await dbHandler.closeDatabase());

describe('Record Routes Test', () => {
  let token;
  let user;
  
  // 每个测试前创建测试用户和认证令牌
  beforeEach(async () => {
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret', {
      expiresIn: '1h'
    });
  });
  
  describe('POST /api/records', () => {
    it('should create a new record', async () => {
      const recordData = {
        date: '2023-08-01',
        title: '测试记录',
        description: '这是一个测试记录'
      };
      
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${token}`)
        .send(recordData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.record.date).toBe(recordData.date);
      expect(res.body.data.record.title).toBe(recordData.title);
    });
    
    it('should return error when date is missing', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '测试记录'
        });
      
      expect(res.statusCode).toBe(400);
    });
  });
  
  describe('GET /api/records', () => {
    it('should get all records for user', async () => {
      // 创建测试记录
      await DateRecord.create([
        { date: '2023-08-01', title: '记录1', user: user._id },
        { date: '2023-08-02', title: '记录2', user: user._id }
      ]);
      
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(Object.keys(res.body.data.records)).toHaveLength(2);
    });
    
    it('should filter records by date range', async () => {
      // 创建测试记录
      await DateRecord.create([
        { date: '2023-08-01', title: '记录1', user: user._id },
        { date: '2023-08-15', title: '记录2', user: user._id },
        { date: '2023-09-01', title: '记录3', user: user._id }
      ]);
      
      const res = await request(app)
        .get('/api/records')
        .query({ startDate: '2023-08-10', endDate: '2023-08-31' })
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(Object.keys(res.body.data.records)).toHaveLength(1);
      expect(res.body.data.records['2023-08-15']).toBeDefined();
    });
  });
  
  describe('GET /api/records/:date', () => {
    it('should get a specific record by date', async () => {
      // 创建测试记录
      await DateRecord.create({
        date: '2023-08-01',
        title: '测试记录',
        description: '这是一个测试记录',
        user: user._id
      });
      
      const res = await request(app)
        .get('/api/records/2023-08-01')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.data.record.title).toBe('测试记录');
    });
    
    it('should return 404 for nonexistent record', async () => {
      const res = await request(app)
        .get('/api/records/2023-08-01')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(404);
    });
  });
});
```

## 端到端测试

端到端测试用于测试整个应用流程，从用户交互到数据持久化。

### 用户认证流程测试

创建 `tests/e2e/auth.test.js` 文件：

```javascript
const request = require('supertest');
const app = require('../../src/app');
const dbHandler = require('../db-handler');

// 测试前连接数据库
beforeAll(async () => await dbHandler.connect());
// 每次测试后清理数据
afterEach(async () => await dbHandler.clearDatabase());
// 测试完成后关闭数据库连接
afterAll(async () => await dbHandler.closeDatabase());

describe('用户认证 E2E 测试', () => {
  it('应该完成注册->登录->获取个人信息流程', async () => {
    // 1. 注册新用户
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.token).toBeDefined();
    
    const token = registerRes.body.token;
    
    // 2. 使用令牌获取个人信息
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.user.username).toBe('testuser');
    expect(meRes.body.data.user.email).toBe('test@example.com');
    
    // 3. 注销（删除令牌）后再次尝试获取个人信息应该失败
    const meWithoutTokenRes = await request(app)
      .get('/api/auth/me');
    
    expect(meWithoutTokenRes.statusCode).toBe(401);
  });
});
```

### 日历记录管理流程测试

创建 `tests/e2e/records.test.js` 文件：

```javascript
const request = require('supertest');
const app = require('../../src/app');
const dbHandler = require('../db-handler');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

// 测试前连接数据库
beforeAll(async () => await dbHandler.connect());
// 每次测试后清理数据
afterEach(async () => await dbHandler.clearDatabase());
// 测试完成后关闭数据库连接
afterAll(async () => await dbHandler.closeDatabase());

describe('日历记录管理 E2E 测试', () => {
  let token;
  let user;
  
  // 每个测试前创建测试用户和认证令牌
  beforeEach(async () => {
    user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'testsecret', {
      expiresIn: '1h'
    });
  });
  
  it('应该完成创建->查询->更新->删除记录流程', async () => {
    // 1. 创建记录
    const createRes = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2023-08-01',
        title: '测试记录',
        description: '这是一个测试记录'
      });
    
    expect(createRes.statusCode).toBe(201);
    
    // 2. 获取特定日期记录
    const getRes = await request(app)
      .get('/api/records/2023-08-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.record.title).toBe('测试记录');
    
    // 3. 更新记录
    const updateRes = await request(app)
      .put('/api/records/2023-08-01')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '更新后的标题',
        marked: true
      });
    
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.record.title).toBe('更新后的标题');
    expect(updateRes.body.data.record.marked).toBe(true);
    
    // 4. 删除记录
    const deleteRes = await request(app)
      .delete('/api/records/2023-08-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(deleteRes.statusCode).toBe(204);
    
    // 5. 确认记录已删除
    const getAfterDeleteRes = await request(app)
      .get('/api/records/2023-08-01')
      .set('Authorization', `Bearer ${token}`);
    
    expect(getAfterDeleteRes.statusCode).toBe(404);
  });
});
```

## 性能测试

性能测试用于评估系统在特定负载下的性能。

### 使用 Apache Bench (ab) 进行 API 压力测试

1. 安装 Apache Bench 工具
2. 创建性能测试脚本 `tests/performance/api-load-test.sh`：

```bash
#!/bin/bash

# API 基础 URL
BASE_URL="http://localhost:5000/api"

# 获取授权令牌（先手动登录并复制令牌）
TOKEN="your_jwt_token_here"

# 测试获取所有记录的 API
echo "测试获取所有记录 API (200 请求, 10 并发)"
ab -n 200 -c 10 -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/records"

# 测试获取特定日期记录的 API
echo "测试获取特定日期记录 API (500 请求, 20 并发)"
ab -n 500 -c 20 -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/records/2023-08-01"

# 测试获取记录统计的 API
echo "测试获取记录统计 API (100 请求, 5 并发)"
ab -n 100 -c 5 -H "Authorization: Bearer ${TOKEN}" "${BASE_URL}/records/stats"
```

### 使用 k6 进行负载测试

1. 安装 [k6](https://k6.io/)
2. 创建 k6 测试脚本 `tests/performance/load-test.js`：

```javascript
import http from 'k6/http';
import { sleep, check } from 'k6';

// 配置
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // 逐渐增加到 20 个用户
    { duration: '1m', target: 20 },  // 保持 20 个用户 1 分钟
    { duration: '30s', target: 0 },  // 逐渐降到 0 用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 的请求应在 500ms 内完成
    'http_req_duration{name:get-records}': ['p(95)<400'],
    'http_req_duration{name:get-specific-record}': ['p(95)<300'],
  },
};

// 模拟用户行为
export default function() {
  const baseUrl = 'http://localhost:5000/api';
  const token = 'your_jwt_token_here'; // 预先获取的令牌
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  };
  
  // 获取所有记录
  const getAllRes = http.get(`${baseUrl}/records`, params, { tags: { name: 'get-records' } });
  check(getAllRes, {
    'status is 200': (r) => r.status === 200,
    'response has records': (r) => JSON.parse(r.body).data.records !== undefined,
  });
  
  sleep(1);
  
  // 获取特定日期记录
  const getSpecificRes = http.get(`${baseUrl}/records/2023-08-01`, params, { tags: { name: 'get-specific-record' } });
  check(getSpecificRes, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  sleep(2);
}
```

执行负载测试：

```bash
k6 run tests/performance/load-test.js
```

## 测试自动化

### 设置 Jest 测试脚本

更新 `package.json` 文件中的测试脚本：

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:unit": "jest src/**/*.test.js",
  "test:integration": "jest tests/integration",
  "test:e2e": "jest tests/e2e"
}
```

### 使用 GitHub Actions 自动化测试

创建 `.github/workflows/test.yml` 文件：

```yaml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x]

    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Generate coverage report
      run: npm run test:coverage
```

## 测试覆盖率

### 生成覆盖率报告

运行以下命令：

```bash
npm run test:coverage
```

这将生成覆盖率报告在 `coverage` 目录中。

### 覆盖率目标

设定以下覆盖率目标：

- 语句覆盖率：80%
- 分支覆盖率：70%
- 函数覆盖率：80%
- 行覆盖率：80%

### 在 CI 中检查覆盖率

更新 `.github/workflows/test.yml` 文件，添加覆盖率检查：

```yaml
- name: Check coverage thresholds
  run: npm run test:coverage -- --coverageThreshold='{"global":{"statements":80,"branches":70,"functions":80,"lines":80}}'
```

## 故障排除

### 常见测试问题

1. **连接超时**：检查 MongoDB 连接配置是否正确
2. **授权错误**：确保测试用例中使用了有效的 JWT 令牌
3. **不一致的测试结果**：确保每次测试都清理数据库，避免测试依赖

### 调试测试

1. 使用 `--verbose` 标志运行测试获取更多信息：

```bash
npm test -- --verbose
```

2. 使用 `.only` 运行特定测试：

```javascript
describe.only('特定测试套件', () => {
  // 测试...
});

it.only('特定测试用例', () => {
  // 测试...
});
```

3. 在测试中添加断点和 `console.log` 语句进行调试

### 测试最佳实践

1. **测试隔离**：确保每个测试都是独立的，不依赖于其他测试的状态
2. **模拟外部依赖**：为外部服务（如邮件、第三方 API）创建模拟
3. **可读性**：使用描述性的测试名称和清晰的断言
4. **边界条件**：测试边界条件和错误情况
5. **持续集成**：将测试集成到 CI/CD 管道中 