import React, { useState, useEffect } from 'react';
import { DateRecord, DateImage } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import styles from './RecordForm.module.scss';

interface RecordFormProps {
  record?: DateRecord;
  onSave: (record: DateRecord) => void;
  onCancel: () => void;
}

const RecordForm: React.FC<RecordFormProps> = ({
  record,
  onSave,
  onCancel
}) => {
  // 初始化空记录
  const emptyRecord: DateRecord = {
    date: '',
    title: '',
    description: '',
    images: [],
    marked: false,
    markType: 'event'
  };
  
  // 表单状态
  const [formData, setFormData] = useState<DateRecord>(record || emptyRecord);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // 当记录变化时更新表单数据
  useEffect(() => {
    if (record) {
      setFormData(record);
    }
  }, [record]);
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理复选框变化
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // 处理选择框变化
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    setImageFiles(prev => [...prev, ...newFiles]);
    
    // 创建预览URL
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    
    // 添加到表单数据
    const newImages: DateImage[] = newFiles.map((file, index) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file), // 临时URL，实际应用中应该上传到服务器
      alt: file.name,
      order: formData.images.length + index
    }));
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };
  
  // 删除图片
  const handleDeleteImage = (index: number) => {
    // 释放预览URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    // 更新状态
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  // 移动图片顺序
  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.images.length - 1)
    ) {
      return;
    }
    
    const newImages = [...formData.images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // 交换位置
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    // 更新order属性
    newImages.forEach((img, i) => {
      img.order = i;
    });
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };
  
  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        {record ? '编辑日期记录' : '添加日期记录'}
      </h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="date">日期</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className={styles.formControl}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="title">标题</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleInputChange}
            className={styles.formControl}
            placeholder="输入标题（可选）"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">描述</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            className={styles.formControl}
            rows={4}
            placeholder="输入描述（可选）"
          />
        </div>
        
        <div className={styles.formGroup}>
          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="marked"
              name="marked"
              checked={formData.marked || false}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
            />
            <label htmlFor="marked">标记此日期</label>
          </div>
        </div>
        
        {formData.marked && (
          <div className={styles.formGroup}>
            <label htmlFor="markType">标记类型</label>
            <select
              id="markType"
              name="markType"
              value={formData.markType || 'event'}
              onChange={handleSelectChange}
              className={styles.formControl}
            >
              <option value="event">事件</option>
              <option value="important">重要</option>
              <option value="holiday">假日</option>
              <option value="birthday">生日</option>
            </select>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label>图片</label>
          <div className={styles.imageUpload}>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className={styles.fileInput}
            />
            <label htmlFor="images" className={styles.uploadButton}>
              选择图片
            </label>
          </div>
        </div>
        
        {formData.images.length > 0 && (
          <div className={styles.imagePreviewContainer}>
            {formData.images.map((image, index) => (
              <div key={image.id} className={styles.imagePreview}>
                <img src={image.url} alt={image.alt || '预览图片'} />
                <div className={styles.imageActions}>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                    className={styles.actionButton}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === formData.images.length - 1}
                    className={styles.actionButton}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(index)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            取消
          </button>
          <button type="submit" className={styles.saveButton}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordForm; 