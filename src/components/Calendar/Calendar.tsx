import React, { useState, useEffect } from 'react';
import { CalendarProps } from '../../types';
import { getCalendarDates, formatDate, getNextMonth, getPrevMonth, toDateString, isDateToday, isDateInCurrentMonth, isSameDate } from '../../utils/dateUtils';
import DayCell from './DayCell';
import ImageGallery from '../ImageGallery/ImageGallery';
import { useCalendar } from '../../contexts/CalendarContext';
import styles from './Calendar.module.scss';

/**
 * 日历组件
 */
const Calendar: React.FC<CalendarProps> = ({
  initialDate = new Date(),
  onDateSelect,
  markedDates = [],
  imageData = {},
  showImageGallery = true,
  autoPlay = false,
  autoPlayInterval = 3000,
  hoverEffect = 'zoom'
}) => {
  // 使用日历上下文
  const { 
    currentDate, 
    selectedDate, 
    setCurrentDate, 
    setSelectedDate,
    hasImages,
    getImages
  } = useCalendar();
  
  // 日历日期数组
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  // 星期标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  // 初始化日历日期
  useEffect(() => {
    setCalendarDates(getCalendarDates(currentDate));
  }, [currentDate]);
  
  // 处理日期选择
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };
  
  // 处理月份切换
  const handlePrevMonth = () => {
    setCurrentDate(getPrevMonth(currentDate));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(getNextMonth(currentDate));
  };
  
  // 处理今天按钮点击
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    if (onDateSelect) {
      onDateSelect(today);
    }
  };
  
  // 获取日期的标记类型
  const getMarkType = (date: Date): string | undefined => {
    const marked = markedDates.find(md => isSameDate(md.date, date));
    return marked?.type;
  };
  
  // 渲染日历头部
  const renderHeader = () => (
    <div className={styles.calendarHeader}>
      <div className={styles.monthNavigation}>
        <button onClick={handlePrevMonth} className={styles.navButton}>
          &lt;
        </button>
        <h2 className={styles.currentMonth}>
          {formatDate(currentDate, 'yyyy年MM月')}
        </h2>
        <button onClick={handleNextMonth} className={styles.navButton}>
          &gt;
        </button>
      </div>
      <button onClick={handleTodayClick} className={styles.todayButton}>
        今天
      </button>
    </div>
  );
  
  // 渲染星期标题
  const renderWeekDays = () => (
    <div className={styles.weekDays}>
      {weekDays.map(day => (
        <div key={day} className={styles.weekDay}>
          {day}
        </div>
      ))}
    </div>
  );
  
  // 渲染日期单元格
  const renderDays = () => (
    <div className={styles.daysGrid}>
      {calendarDates.map((date, index) => (
        <DayCell
          key={index}
          date={date}
          isCurrentMonth={isDateInCurrentMonth(date, currentDate)}
          isSelected={selectedDate ? isSameDate(date, selectedDate) : false}
          isToday={isDateToday(date)}
          hasImages={hasImages(date)}
          markType={getMarkType(date)}
          onSelect={handleDateSelect}
          hoverEffect={hoverEffect}
        />
      ))}
    </div>
  );
  
  // 渲染图片轮播
  const renderImageGallery = () => {
    if (!showImageGallery || !selectedDate) {
      return null;
    }
    
    const images = getImages(selectedDate);
    
    return (
      <div className={styles.gallerySection}>
        <h3 className={styles.galleryTitle}>
          {formatDate(selectedDate, 'yyyy年MM月dd日')} 的图片
        </h3>
        <ImageGallery
          images={images}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
          showThumbnails={true}
          showFullscreenButton={true}
          showPlayButton={true}
        />
      </div>
    );
  };
  
  return (
    <div className={styles.calendarContainer}>
      {renderHeader()}
      <div className={styles.calendarBody}>
        {renderWeekDays()}
        {renderDays()}
      </div>
      {renderImageGallery()}
    </div>
  );
};

export default Calendar; 