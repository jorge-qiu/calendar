import { 
  formatDate, 
  getNextMonth, 
  getPrevMonth, 
  getCalendarDates, 
  isSameDate, 
  isDateToday, 
  isDateInCurrentMonth, 
  toDateString 
} from '../dateUtils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

describe('日期工具函数测试', () => {
  // 使用固定的日期进行测试，避免测试结果受当前日期影响
  const testDate = new Date(2023, 3, 15); // 2023年4月15日

  describe('formatDate', () => {
    it('应该使用默认格式格式化日期', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const expected = format(date, 'yyyy-MM-dd', { locale: zhCN });
      
      expect(formatDate(date)).toBe(expected);
    });
    
    it('应该使用自定义格式格式化日期', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const formatStr = 'yyyy年MM月dd日';
      const expected = format(date, formatStr, { locale: zhCN });
      
      expect(formatDate(date, formatStr)).toBe(expected);
    });
  });

  describe('getNextMonth', () => {
    it('应该返回下一个月的日期', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const expectedNextMonth = new Date(2023, 6, 15); // 2023年7月15日
      
      const result = getNextMonth(date);
      
      expect(result.getFullYear()).toBe(expectedNextMonth.getFullYear());
      expect(result.getMonth()).toBe(expectedNextMonth.getMonth());
      expect(result.getDate()).toBe(expectedNextMonth.getDate());
    });
    
    it('应该正确处理年份跨越', () => {
      const date = new Date(2023, 11, 15); // 2023年12月15日
      const expectedNextMonth = new Date(2024, 0, 15); // 2024年1月15日
      
      const result = getNextMonth(date);
      
      expect(result.getFullYear()).toBe(expectedNextMonth.getFullYear());
      expect(result.getMonth()).toBe(expectedNextMonth.getMonth());
      expect(result.getDate()).toBe(expectedNextMonth.getDate());
    });
  });

  describe('getPrevMonth', () => {
    it('应该返回上一个月的日期', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const expectedPrevMonth = new Date(2023, 4, 15); // 2023年5月15日
      
      const result = getPrevMonth(date);
      
      expect(result.getFullYear()).toBe(expectedPrevMonth.getFullYear());
      expect(result.getMonth()).toBe(expectedPrevMonth.getMonth());
      expect(result.getDate()).toBe(expectedPrevMonth.getDate());
    });
    
    it('应该正确处理年份跨越', () => {
      const date = new Date(2023, 0, 15); // 2023年1月15日
      const expectedPrevMonth = new Date(2022, 11, 15); // 2022年12月15日
      
      const result = getPrevMonth(date);
      
      expect(result.getFullYear()).toBe(expectedPrevMonth.getFullYear());
      expect(result.getMonth()).toBe(expectedPrevMonth.getMonth());
      expect(result.getDate()).toBe(expectedPrevMonth.getDate());
    });
  });

  describe('getCalendarDates', () => {
    it('应该返回包含42个日期的数组（6行7列）', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const result = getCalendarDates(date);
      
      expect(result.length).toBe(42);
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(item => item instanceof Date)).toBe(true);
    });
    
    it('应该包含当月的所有日期', () => {
      const date = new Date(2023, 5, 1); // 2023年6月1日
      const result = getCalendarDates(date);
      
      // 2023年6月有30天
      const daysInJune = 30;
      const datesInJune = result.filter(d => d.getMonth() === 5 && d.getFullYear() === 2023);
      
      expect(datesInJune.length).toBe(daysInJune);
    });
    
    it('应该包含上个月和下个月的部分日期', () => {
      const date = new Date(2023, 5, 1); // 2023年6月
      const result = getCalendarDates(date);
      
      // 检查是否包含上个月的日期
      const prevMonthDates = result.filter(d => d.getMonth() === 4 && d.getFullYear() === 2023);
      expect(prevMonthDates.length).toBeGreaterThan(0);
      
      // 检查是否包含下个月的日期
      const nextMonthDates = result.filter(d => d.getMonth() === 6 && d.getFullYear() === 2023);
      expect(nextMonthDates.length).toBeGreaterThan(0);
    });
  });

  describe('isSameDate', () => {
    it('对于相同的日期应该返回true', () => {
      const date1 = new Date(2023, 5, 15, 10, 30); // 2023年6月15日 10:30
      const date2 = new Date(2023, 5, 15, 15, 45); // 2023年6月15日 15:45
      
      expect(isSameDate(date1, date2)).toBe(true);
    });
    
    it('对于不同的日期应该返回false', () => {
      const date1 = new Date(2023, 5, 15); // 2023年6月15日
      const date2 = new Date(2023, 5, 16); // 2023年6月16日
      
      expect(isSameDate(date1, date2)).toBe(false);
    });
  });

  describe('isDateToday', () => {
    it('对于今天的日期应该返回true', () => {
      const today = new Date();
      
      expect(isDateToday(today)).toBe(true);
    });
    
    it('对于非今天的日期应该返回false', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(isDateToday(yesterday)).toBe(false);
    });
  });

  describe('isDateInCurrentMonth', () => {
    it('对于当月的日期应该返回true', () => {
      const currentMonth = new Date(2023, 5, 15); // 2023年6月15日
      const dateInCurrentMonth = new Date(2023, 5, 25); // 2023年6月25日
      
      expect(isDateInCurrentMonth(dateInCurrentMonth, currentMonth)).toBe(true);
    });
    
    it('对于非当月的日期应该返回false', () => {
      const currentMonth = new Date(2023, 5, 15); // 2023年6月15日
      const dateInNextMonth = new Date(2023, 6, 5); // 2023年7月5日
      
      expect(isDateInCurrentMonth(dateInNextMonth, currentMonth)).toBe(false);
    });
  });

  describe('toDateString', () => {
    it('应该返回格式化为YYYY-MM-DD的日期字符串', () => {
      const date = new Date(2023, 5, 15); // 2023年6月15日
      const expected = '2023-06-15';
      
      expect(toDateString(date)).toBe(expected);
    });
  });
}); 