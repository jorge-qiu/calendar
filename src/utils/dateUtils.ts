/**
 * 日期工具函数
 */
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isSameMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期
 * @param date - 日期对象
 * @param formatStr - 格式化字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: Date, formatStr: string = 'yyyy-MM-dd'): string => {
  return format(date, formatStr, { locale: zhCN });
};

/**
 * 获取下一个月的日期
 * @param date - 当前日期
 * @returns 下一个月的日期
 */
export const getNextMonth = (date: Date): Date => {
  return addMonths(date, 1);
};

/**
 * 获取上一个月的日期
 * @param date - 当前日期
 * @returns 上一个月的日期
 */
export const getPrevMonth = (date: Date): Date => {
  return subMonths(date, 1);
};

/**
 * 获取日历网格所需的日期数组（包含当月所有日期及相邻月份的溢出日期）
 * @param date - 当前日期
 * @returns 日期数组
 */
export const getCalendarDates = (date: Date): Date[] => {
  // 当月的第一天
  const firstDayOfMonth = startOfMonth(date);
  // 当月的最后一天
  const lastDayOfMonth = endOfMonth(date);
  
  // 获取当月所有日期
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  // 计算第一天是星期几 (0 = 星期日, 1 = 星期一, ..., 6 = 星期六)
  const firstDayOfWeek = getDay(firstDayOfMonth);
  
  // 获取上个月的溢出日期（填充日历的前面部分）
  const prevMonthDays = [];
  if (firstDayOfWeek > 0) {
    const prevMonthLastDay = subMonths(firstDayOfMonth, 1);
    const prevMonthLastDayDate = endOfMonth(prevMonthLastDay);
    
    // 从上个月的最后一天开始，往前推算需要显示的天数
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(prevMonthLastDayDate);
      day.setDate(prevMonthLastDayDate.getDate() - i);
      prevMonthDays.push(day);
    }
  }
  
  // 获取下个月的溢出日期（填充日历的后面部分）
  const nextMonthDays = [];
  const totalDaysNeeded = 42; // 6行 x 7列 = 42个日期格子
  const remainingDays = totalDaysNeeded - (prevMonthDays.length + daysInMonth.length);
  
  if (remainingDays > 0) {
    const nextMonthFirstDay = addMonths(firstDayOfMonth, 1);
    
    for (let i = 0; i < remainingDays; i++) {
      const day = new Date(nextMonthFirstDay);
      day.setDate(nextMonthFirstDay.getDate() + i);
      nextMonthDays.push(day);
    }
  }
  
  // 合并所有日期
  return [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
};

/**
 * 检查两个日期是否是同一天
 * @param date1 - 第一个日期
 * @param date2 - 第二个日期
 * @returns 是否是同一天
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

/**
 * 检查日期是否是今天
 * @param date - 日期
 * @returns 是否是今天
 */
export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

/**
 * 检查日期是否在当前月份
 * @param date - 待检查的日期
 * @param currentMonth - 当前月份的日期对象
 * @returns 是否在当前月份
 */
export const isDateInCurrentMonth = (date: Date, currentMonth: Date): boolean => {
  return isSameMonth(date, currentMonth);
};

/**
 * 将日期转换为ISO字符串格式的日期部分（YYYY-MM-DD）
 * @param date - 日期对象
 * @returns 格式化的日期字符串
 */
export const toDateString = (date: Date): string => {
  return formatDate(date, 'yyyy-MM-dd');
}; 