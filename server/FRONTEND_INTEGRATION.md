# 前端集成指南

本文档提供了将后端API服务与前端React应用集成的详细指南。

## 配置API连接

在前端项目中，创建一个API服务文件，如`src/services/api.js`：

```javascript
import axios from 'axios';

// 创建一个axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // 或生产环境URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(response => {
  return response.data;
}, error => {
  // 处理401错误 - 未授权（令牌过期等）
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error.response?.data || error);
});

export default api;
```

## 认证服务

创建一个认证服务，如`src/services/authService.js`：

```javascript
import api from './api';

// 用户注册
export const register = async (userData) => {
  return api.post('/auth/register', userData);
};

// 用户登录
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  return response;
};

// 注销
export const logout = () => {
  localStorage.removeItem('token');
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  return api.get('/auth/me');
};

// 检查是否已认证
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
```

## 日历记录服务

创建一个日历记录服务，如`src/services/recordService.js`：

```javascript
import api from './api';

// 获取所有记录
export const getAllRecords = async (params = {}) => {
  return api.get('/records', { params });
};

// 获取特定日期的记录
export const getRecord = async (date) => {
  return api.get(`/records/${date}`);
};

// 创建记录
export const createRecord = async (recordData) => {
  return api.post('/records', recordData);
};

// 更新记录
export const updateRecord = async (date, recordData) => {
  return api.put(`/records/${date}`, recordData);
};

// 删除记录
export const deleteRecord = async (date) => {
  return api.delete(`/records/${date}`);
};

// 获取记录统计
export const getRecordStats = async () => {
  return api.get('/records/stats');
};
```

## 图片上传服务

创建一个图片上传服务，如`src/services/imageService.js`：

```javascript
import api from './api';

// 上传单个图片
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  return api.post('/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 上传多个图片
export const uploadMultipleImages = async (imageFiles) => {
  const formData = new FormData();
  
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
  
  return api.post('/images/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// 删除图片
export const deleteImage = async (imageId, date) => {
  return api.delete(`/images/${imageId}?date=${date}`);
};

// 重新排序图片
export const reorderImages = async (date, images) => {
  return api.put('/images/reorder', { date, images });
};
```

## 与日历上下文集成

修改前端的`CalendarContext.tsx`以与后端API集成：

```jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAllRecords, createRecord, updateRecord, deleteRecord } from '../services/recordService';
import { uploadMultipleImages } from '../services/imageService';
import { toDateString } from '../utils/dateUtils';

// 创建上下文
const CalendarContext = createContext();

export const CalendarProvider = ({ children, initialDate, initialData }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarData, setCalendarData] = useState(initialData || { records: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载记录
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await getAllRecords();
        setCalendarData({ records: response.data.records });
        setError(null);
      } catch (err) {
        setError('无法加载日历数据');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  // 添加记录
  const addRecord = async (record) => {
    try {
      setLoading(true);
      
      // 如果包含新上传的图片文件
      if (record.imageFiles && record.imageFiles.length > 0) {
        const imageResponse = await uploadMultipleImages(record.imageFiles);
        record.images = imageResponse.data.images;
        delete record.imageFiles; // 删除临时属性
      }
      
      const response = await createRecord(record);
      
      setCalendarData(prev => ({
        ...prev,
        records: {
          ...prev.records,
          [record.date]: response.data.record
        }
      }));
      
      setError(null);
      return response.data.record;
    } catch (err) {
      setError('添加记录失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新记录
  const updateRecord = async (record) => {
    try {
      setLoading(true);
      
      // 处理新上传的图片
      if (record.imageFiles && record.imageFiles.length > 0) {
        const imageResponse = await uploadMultipleImages(record.imageFiles);
        record.images = [...(record.images || []), ...imageResponse.data.images];
        delete record.imageFiles; // 删除临时属性
      }
      
      const response = await updateRecord(record.date, record);
      
      setCalendarData(prev => ({
        ...prev,
        records: {
          ...prev.records,
          [record.date]: response.data.record
        }
      }));
      
      setError(null);
      return response.data.record;
    } catch (err) {
      setError('更新记录失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 删除记录
  const deleteRecord = async (date) => {
    try {
      setLoading(true);
      await deleteRecord(date);
      
      setCalendarData(prev => {
        const newRecords = { ...prev.records };
        delete newRecords[date];
        return {
          ...prev,
          records: newRecords
        };
      });
      
      setError(null);
      return true;
    } catch (err) {
      setError('删除记录失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 获取记录
  const getRecord = (date) => {
    return calendarData.records[date] || null;
  };

  // 检查日期是否有图片
  const hasImages = (date) => {
    const dateStr = date instanceof Date ? toDateString(date) : date;
    const record = calendarData.records[dateStr];
    return record && record.images && record.images.length > 0;
  };

  // 获取日期的图片
  const getImages = (date) => {
    const dateStr = date instanceof Date ? toDateString(date) : date;
    const record = calendarData.records[dateStr];
    return record && record.images ? record.images : [];
  };

  return (
    <CalendarContext.Provider
      value={{
        currentDate,
        selectedDate,
        calendarData,
        loading,
        error,
        setCurrentDate,
        setSelectedDate,
        addRecord,
        updateRecord,
        deleteRecord,
        getRecord,
        hasImages,
        getImages
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
```

## 受保护的路由

创建一个受保护的路由组件，以确保只有已认证的用户可以访问特定页面：

```jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    // 重定向到登录页面
    return <Navigate to="/login" replace />;
  }

  // 渲染子路由
  return <Outlet />;
};

export default ProtectedRoute;
```

在路由配置中使用此组件：

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Calendar from './pages/Calendar';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 受保护的路由 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Calendar />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## 登录和注册页面示例

以下是一个简单的登录页面示例：

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/'); // 登录成功后重定向到主页
    } catch (err) {
      setError(err.error?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>登录</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">电子邮箱</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p>
        还没有账号？<a href="/register">注册</a>
      </p>
    </div>
  );
};

export default Login;
```

## 测试API连接

在实际集成前，您可以使用以下工具测试API连接：

1. **Postman**: 使用Postman创建和保存API请求集合。
2. **curl**: 使用命令行工具测试API端点。
3. **Swagger UI**: 使用内置的Swagger UI (`http://localhost:5000/api-docs`)直接测试API。

## 注意事项

1. **CORS**：确保后端已正确配置CORS，以允许来自前端应用的请求。
2. **错误处理**：在前端实现全面的错误处理，以提供良好的用户体验。
3. **加载状态**：显示加载指示器，以在API请求期间提供反馈。
4. **离线支持**：考虑实现基本的离线支持，在网络不可用时提供有限的功能。 