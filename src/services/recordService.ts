import api from './api';
import { DateRecord } from '../types';

// 记录统计接口
export interface RecordStats {
  totalRecords: number;
  recordsByType: {
    [key: string]: number;
  };
  recordsByMonth: {
    [key: string]: number;
  };
}

const recordService = {
  // 获取所有记录
  getAllRecords: async (): Promise<Record<string, DateRecord>> => {
    const response = await api.get<{ records: Record<string, DateRecord> }>('/records');
    return response.data.records;
  },

  // 获取指定日期的记录
  getRecord: async (date: string): Promise<DateRecord> => {
    const response = await api.get<{ record: DateRecord }>(`/records/${date}`);
    return response.data.record;
  },

  // 创建记录
  createRecord: async (record: DateRecord): Promise<DateRecord> => {
    const response = await api.post<{ record: DateRecord }>('/records', record);
    return response.data.record;
  },

  // 更新记录
  updateRecord: async (record: DateRecord): Promise<DateRecord> => {
    const response = await api.put<{ record: DateRecord }>(`/records/${record.date}`, record);
    return response.data.record;
  },

  // 删除记录
  deleteRecord: async (date: string): Promise<void> => {
    await api.delete(`/records/${date}`);
  },

  // 获取记录统计
  getStats: async (): Promise<RecordStats> => {
    const response = await api.get<{ stats: RecordStats }>('/records/stats');
    return response.data.stats;
  }
};

export default recordService; 