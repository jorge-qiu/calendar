import React, { useState, useEffect } from 'react';
import { AdminProps, CalendarData, DateRecord } from '../../types';
import { useCalendar } from '../../contexts/CalendarContext';
import RecordForm from './RecordForm';
import { formatDate, toDateString } from '../../utils/dateUtils';
import styles from './Admin.module.scss';

/**
 * 后台管理组件
 */
const Admin: React.FC<AdminProps> = ({
  onSave,
  initialData,
  apiEndpoint
}) => {
  // 使用日历上下文
  const { calendarData, addRecord, updateRecord, deleteRecord } = useCalendar();
  
  // 状态
  const [records, setRecords] = useState<Record<string, DateRecord>>({});
  const [selectedRecord, setSelectedRecord] = useState<DateRecord | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // 初始化记录
  useEffect(() => {
    setRecords(calendarData.records);
  }, [calendarData.records]);
  
  // 处理添加记录
  const handleAddRecord = () => {
    setSelectedRecord(null);
    setIsFormVisible(true);
  };
  
  // 处理编辑记录
  const handleEditRecord = (record: DateRecord) => {
    setSelectedRecord(record);
    setIsFormVisible(true);
  };
  
  // 处理删除记录
  const handleDeleteRecord = (dateStr: string) => {
    if (window.confirm(`确定要删除 ${dateStr} 的记录吗？`)) {
      deleteRecord(dateStr);
    }
  };
  
  // 处理保存记录
  const handleSaveRecord = (record: DateRecord) => {
    if (selectedRecord) {
      updateRecord(record);
    } else {
      addRecord(record);
    }
    setIsFormVisible(false);
    setSelectedRecord(null);
  };
  
  // 处理取消表单
  const handleCancelForm = () => {
    setIsFormVisible(false);
    setSelectedRecord(null);
  };
  
  // 处理保存所有数据
  const handleSaveAll = () => {
    if (onSave) {
      onSave({ records });
    }
  };
  
  // 过滤和搜索记录
  const filteredRecords = Object.values(records).filter(record => {
    // 搜索条件
    const matchesSearch = 
      record.date.includes(searchTerm) || 
      (record.title && record.title.includes(searchTerm)) ||
      (record.description && record.description.includes(searchTerm));
    
    // 过滤条件
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'marked' && record.marked) ||
      (filterType === 'withImages' && record.images.length > 0) ||
      (filterType === record.markType);
    
    return matchesSearch && matchesFilter;
  });
  
  // 按日期排序
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  return (
    <div className={styles.adminContainer}>
      <h1 className={styles.adminTitle}>日历记录管理</h1>
      
      {isFormVisible ? (
        <RecordForm
          record={selectedRecord || undefined}
          onSave={handleSaveRecord}
          onCancel={handleCancelForm}
        />
      ) : (
        <>
          <div className={styles.adminControls}>
            <div className={styles.searchFilter}>
              <input
                type="text"
                placeholder="搜索日期、标题或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">全部记录</option>
                <option value="marked">已标记</option>
                <option value="withImages">有图片</option>
                <option value="event">事件</option>
                <option value="important">重要</option>
                <option value="holiday">假日</option>
                <option value="birthday">生日</option>
              </select>
            </div>
            
            <div className={styles.actionButtons}>
              <button onClick={handleAddRecord} className={styles.addButton}>
                添加记录
              </button>
              <button onClick={handleSaveAll} className={styles.saveAllButton}>
                保存所有更改
              </button>
            </div>
          </div>
          
          <div className={styles.recordsContainer}>
            {sortedRecords.length > 0 ? (
              <div className={styles.recordsList}>
                {sortedRecords.map(record => (
                  <div key={record.date} className={styles.recordCard}>
                    <div className={styles.recordHeader}>
                      <div className={styles.recordDate}>
                        {formatDate(new Date(record.date), 'yyyy年MM月dd日')}
                        {record.marked && (
                          <span className={`${styles.recordBadge} ${styles[`badge-${record.markType || 'event'}`]}`}>
                            {record.markType === 'important' && '重要'}
                            {record.markType === 'event' && '事件'}
                            {record.markType === 'holiday' && '假日'}
                            {record.markType === 'birthday' && '生日'}
                          </span>
                        )}
                      </div>
                      <div className={styles.recordActions}>
                        <button
                          onClick={() => handleEditRecord(record)}
                          className={styles.editButton}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.date)}
                          className={styles.deleteButton}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    
                    {record.title && (
                      <h3 className={styles.recordTitle}>{record.title}</h3>
                    )}
                    
                    {record.description && (
                      <p className={styles.recordDescription}>{record.description}</p>
                    )}
                    
                    {record.images.length > 0 && (
                      <div className={styles.recordImages}>
                        <p className={styles.imagesCount}>
                          图片: {record.images.length}张
                        </p>
                        <div className={styles.imageThumbnails}>
                          {record.images.slice(0, 3).map((image, index) => (
                            <div key={image.id} className={styles.imageThumbnail}>
                              <img src={image.url} alt={image.alt || '缩略图'} />
                            </div>
                          ))}
                          {record.images.length > 3 && (
                            <div className={styles.moreImages}>
                              +{record.images.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>没有找到符合条件的记录</p>
                <button onClick={handleAddRecord} className={styles.addButton}>
                  添加第一条记录
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Admin; 