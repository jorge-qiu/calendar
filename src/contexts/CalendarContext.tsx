import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CalendarData, DateRecord, DateImage } from '../types';
import { toDateString } from '../utils/dateUtils';
import recordService from '../services/recordService';
import imageService from '../services/imageService';

// 添加一些额外类型
export interface RecordWithContent extends DateRecord {
  content?: string;
  type?: string;
}

// 日历上下文接口
interface CalendarContextType {
  // 状态
  currentDate: Date;
  selectedDate: Date | null;
  calendarData: CalendarData;
  loading: boolean;
  error: string | null;
  
  // 操作方法
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  addRecord: (record: RecordWithContent) => Promise<void>;
  updateRecord: (record: RecordWithContent) => Promise<void>;
  deleteRecord: (dateStr: string) => Promise<void>;
  getRecord: (dateStr: string) => DateRecord | undefined;
  hasImages: (date: Date) => boolean;
  getImages: (date: Date) => Array<{url: string, alt?: string}>;
  uploadImage: (file: File, date: string) => Promise<void>;
  deleteImage: (imageId: string, date: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

// 创建上下文
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// 上下文提供者属性
interface CalendarProviderProps {
  children: ReactNode;
  initialData?: CalendarData;
  initialDate?: Date;
}

// 上下文提供者组件
export const CalendarProvider: React.FC<CalendarProviderProps> = ({ 
  children, 
  initialData = { records: {} },
  initialDate = new Date()
}) => {
  // 状态
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从API获取所有记录
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await recordService.getAllRecords();
      setCalendarData({ records });
    } catch (err) {
      setError((err as Error).message || '获取日历数据失败');
      console.error('获取日历数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 初始加载数据
  useEffect(() => {
    refreshData();
  }, [refreshData]);
  
  // 添加记录
  const addRecord = useCallback(async (record: RecordWithContent) => {
    try {
      setLoading(true);
      setError(null);
      const newRecord = await recordService.createRecord(record);
      setCalendarData(prevData => ({
        ...prevData,
        records: {
          ...prevData.records,
          [newRecord.date]: newRecord
        }
      }));
    } catch (err) {
      setError((err as Error).message || '添加记录失败');
      console.error('添加记录失败', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 更新记录
  const updateRecord = useCallback(async (record: RecordWithContent) => {
    try {
      setLoading(true);
      setError(null);
      const updatedRecord = await recordService.updateRecord(record);
      setCalendarData(prevData => ({
        ...prevData,
        records: {
          ...prevData.records,
          [updatedRecord.date]: updatedRecord
        }
      }));
    } catch (err) {
      setError((err as Error).message || '更新记录失败');
      console.error('更新记录失败', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 删除记录
  const deleteRecord = useCallback(async (dateStr: string) => {
    try {
      setLoading(true);
      setError(null);
      await recordService.deleteRecord(dateStr);
      setCalendarData(prevData => {
        const newRecords = { ...prevData.records };
        delete newRecords[dateStr];
        return {
          ...prevData,
          records: newRecords
        };
      });
    } catch (err) {
      setError((err as Error).message || '删除记录失败');
      console.error('删除记录失败', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 获取记录
  const getRecord = useCallback((dateStr: string) => {
    return calendarData.records[dateStr];
  }, [calendarData.records]);
  
  // 检查日期是否有图片
  const hasImages = useCallback((date: Date) => {
    const dateStr = toDateString(date);
    const record = calendarData.records[dateStr];
    return !!record && record.images.length > 0;
  }, [calendarData.records]);
  
  // 获取日期的图片
  const getImages = useCallback((date: Date) => {
    const dateStr = toDateString(date);
    const record = calendarData.records[dateStr];
    if (!record || !record.images.length) {
      return [];
    }
    
    // 按照order排序并转换为轮播组件需要的格式
    return record.images
      .sort((a, b) => a.order - b.order)
      .map(img => ({
        url: imageService.getImageUrl(img.url),
        alt: img.alt
      }));
  }, [calendarData.records]);
  
  // 上传图片
  const uploadImage = useCallback(async (file: File, dateStr: string) => {
    try {
      setLoading(true);
      setError(null);
      const uploadedImage = await imageService.uploadImage(file, dateStr);
      
      // 查找现有记录
      const existingRecord = calendarData.records[dateStr] as RecordWithContent;
      
      if (existingRecord) {
        // 更新现有记录
        const updatedRecord = {
          ...existingRecord,
          images: [
            ...existingRecord.images,
            {
              id: String(uploadedImage.id), // 转换为字符串
              url: uploadedImage.url,
              order: existingRecord.images.length,
              alt: file.name
            } as DateImage
          ]
        };
        await updateRecord(updatedRecord);
      } else {
        // 创建新记录
        const newRecord: RecordWithContent = {
          date: dateStr,
          type: 'general',
          title: '新记录',
          content: '',
          images: [{
            id: String(uploadedImage.id), // 转换为字符串
            url: uploadedImage.url,
            order: 0,
            alt: file.name
          }]
        };
        await addRecord(newRecord);
      }
    } catch (err) {
      setError((err as Error).message || '上传图片失败');
      console.error('上传图片失败', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarData.records, addRecord, updateRecord]);
  
  // 删除图片
  const deleteImage = useCallback(async (imageId: string, dateStr: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await imageService.deleteImage(Number(imageId)); // 转换为数字
      
      const existingRecord = calendarData.records[dateStr] as RecordWithContent;
      if (existingRecord) {
        // 更新记录，移除已删除的图片
        const updatedImages = existingRecord.images
          .filter(img => img.id !== imageId)
          // 重新排序
          .map((img, index) => ({ ...img, order: index }));
        
        const updatedRecord = {
          ...existingRecord,
          images: updatedImages
        };
        
        // 如果没有图片且内容为空，可以选择删除整个记录
        if (updatedImages.length === 0 && (!existingRecord.content || !existingRecord.content.trim())) {
          await deleteRecord(dateStr);
        } else {
          await updateRecord(updatedRecord);
        }
      }
    } catch (err) {
      setError((err as Error).message || '删除图片失败');
      console.error('删除图片失败', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [calendarData.records, updateRecord, deleteRecord]);
  
  // 上下文值
  const contextValue: CalendarContextType = {
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
    getImages,
    uploadImage,
    deleteImage,
    refreshData
  };
  
  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

// 自定义Hook，用于访问日历上下文
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar必须在CalendarProvider内部使用');
  }
  return context;
}; 