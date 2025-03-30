import React, { useState } from 'react';
import Admin from '../components/Admin';
import { CalendarProvider } from '../contexts/CalendarContext';
import { CalendarData } from '../types';
import styles from './AdminPage.module.scss';

/**
 * 后台管理页面组件
 */
const AdminPage: React.FC = () => {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // 处理保存数据
  const handleSave = (data: CalendarData) => {
    setSaveStatus('saving');
    
    // 模拟API保存
    setTimeout(() => {
      try {
        // 在实际应用中，这里应该调用API保存数据
        localStorage.setItem('calendarData', JSON.stringify(data));
        setSaveStatus('success');
        
        // 3秒后重置状态
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } catch (error) {
        console.error('保存数据失败:', error);
        setSaveStatus('error');
      }
    }, 1000);
  };
  
  // 获取初始数据
  const getInitialData = (): CalendarData | undefined => {
    try {
      const savedData = localStorage.getItem('calendarData');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('获取保存的数据失败:', error);
    }
    return undefined;
  };
  
  return (
    <div className={styles.adminPage}>
      <header className={styles.header}>
        <h1 className={styles.title}>日历管理</h1>
        
        {saveStatus === 'saving' && (
          <div className={`${styles.statusMessage} ${styles.saving}`}>
            正在保存...
          </div>
        )}
        
        {saveStatus === 'success' && (
          <div className={`${styles.statusMessage} ${styles.success}`}>
            保存成功！
          </div>
        )}
        
        {saveStatus === 'error' && (
          <div className={`${styles.statusMessage} ${styles.error}`}>
            保存失败，请重试。
          </div>
        )}
      </header>
      
      <main className={styles.main}>
        <CalendarProvider initialData={getInitialData()}>
          <Admin onSave={handleSave} />
        </CalendarProvider>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} 日历组件管理系统</p>
      </footer>
    </div>
  );
};

export default AdminPage; 