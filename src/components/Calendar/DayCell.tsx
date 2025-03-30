import React, { useState } from 'react';
import { DayCellProps } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import styles from './DayCell.module.scss';

/**
 * 日期单元格组件
 */
const DayCell: React.FC<DayCellProps> = ({
  date,
  isCurrentMonth,
  isSelected,
  isToday,
  hasImages,
  markType,
  onSelect,
  hoverEffect = 'zoom'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 处理日期点击
  const handleClick = () => {
    onSelect(date);
  };
  
  // 构建CSS类名
  const cellClassNames = [
    styles.dayCell,
    isCurrentMonth ? '' : styles.otherMonth,
    isSelected ? styles.selected : '',
    isToday ? styles.today : '',
    hasImages ? styles.hasImages : '',
    markType ? styles[`mark-${markType}`] : '',
    isHovered && hasImages ? styles[`hover-${hoverEffect}`] : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={cellClassNames}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.dateNumber}>
        {formatDate(date, 'd')}
      </div>
      
      {hasImages && (
        <div className={styles.imageIndicator}>
          <span className={styles.imageIcon}>📷</span>
        </div>
      )}
      
      {markType && (
        <div className={styles.markIndicator} />
      )}
    </div>
  );
};

export default DayCell; 