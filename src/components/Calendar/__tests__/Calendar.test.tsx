import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../Calendar';
import { CalendarProvider } from '../../../contexts/CalendarContext';
import { formatDate } from '../../../utils/dateUtils';

// 模拟样式模块
jest.mock('../Calendar.module.scss', () => ({
  calendarContainer: 'calendarContainer',
  calendarHeader: 'calendarHeader',
  monthNavigation: 'monthNavigation',
  navButton: 'navButton',
  currentMonth: 'currentMonth',
  todayButton: 'todayButton',
  calendarBody: 'calendarBody',
  weekDays: 'weekDays',
  weekDay: 'weekDay',
  daysGrid: 'daysGrid',
  gallerySection: 'gallerySection',
  galleryTitle: 'galleryTitle'
}));

// 模拟DayCell组件
jest.mock('../DayCell', () => {
  return jest.fn(props => (
    <div 
      data-testid="day-cell"
      data-date={props.date.toISOString()}
      data-current-month={props.isCurrentMonth}
      data-selected={props.isSelected}
      data-today={props.isToday}
      data-has-images={props.hasImages}
      data-mark-type={props.markType}
      data-hover-effect={props.hoverEffect}
      onClick={() => props.onSelect(props.date)}
    >
      {props.date.getDate()}
    </div>
  ));
});

// 模拟ImageGallery组件
jest.mock('../../ImageGallery/ImageGallery', () => {
  return jest.fn(props => (
    <div data-testid="image-gallery">
      <div data-testid="image-count">{props.images.length}</div>
      <div data-testid="auto-play">{String(props.autoPlay)}</div>
      <div data-testid="auto-play-interval">{props.autoPlayInterval}</div>
    </div>
  ));
});

describe('Calendar组件测试', () => {
  const renderWithProvider = (ui: React.ReactElement, initialDate = new Date()) => {
    return render(
      <CalendarProvider initialDate={initialDate}>
        {ui}
      </CalendarProvider>
    );
  };
  
  it('应该渲染月份导航和当前月份标题', () => {
    const testDate = new Date(2023, 5, 15); // 2023年6月15日
    renderWithProvider(<Calendar initialDate={testDate} />, testDate);
    
    // 检查月份标题
    expect(screen.getByText('2023年06月')).toBeInTheDocument();
    
    // 检查导航按钮
    expect(screen.getByText('<')).toBeInTheDocument();
    expect(screen.getByText('>')).toBeInTheDocument();
  });
  
  it('应该渲染星期标题', () => {
    renderWithProvider(<Calendar />);
    
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    weekDays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });
  
  it('应该渲染日期网格', () => {
    renderWithProvider(<Calendar />);
    
    // 日历网格中应该有42个日期单元格（6行x7列）
    const dayCells = screen.getAllByTestId('day-cell');
    expect(dayCells.length).toBe(42);
  });
  
  it('点击上个月按钮应该更新日历', () => {
    const testDate = new Date(2023, 5, 15); // 2023年6月15日
    renderWithProvider(<Calendar initialDate={testDate} />, testDate);
    
    // 初始月份
    expect(screen.getByText('2023年06月')).toBeInTheDocument();
    
    // 点击上个月按钮
    fireEvent.click(screen.getByText('<'));
    
    // 应该更新为5月
    expect(screen.getByText('2023年05月')).toBeInTheDocument();
  });
  
  it('点击下个月按钮应该更新日历', () => {
    const testDate = new Date(2023, 5, 15); // 2023年6月15日
    renderWithProvider(<Calendar initialDate={testDate} />, testDate);
    
    // 初始月份
    expect(screen.getByText('2023年06月')).toBeInTheDocument();
    
    // 点击下个月按钮
    fireEvent.click(screen.getByText('>'));
    
    // 应该更新为7月
    expect(screen.getByText('2023年07月')).toBeInTheDocument();
  });
  
  it('点击今天按钮应该转到当前日期', () => {
    // 使用过去的日期作为初始值
    const pastDate = new Date(2023, 0, 1); // 2023年1月1日
    renderWithProvider(<Calendar initialDate={pastDate} />, pastDate);
    
    // 点击今天按钮
    fireEvent.click(screen.getByText('今天'));
    
    // 应该更新为当前月份
    const today = new Date();
    const expectedMonthTitle = formatDate(today, 'yyyy年MM月');
    expect(screen.getByText(expectedMonthTitle)).toBeInTheDocument();
  });
  
  it('点击日期单元格应该选中该日期', () => {
    const testDate = new Date(2023, 5, 15); // 2023年6月15日
    const onDateSelect = jest.fn();
    renderWithProvider(<Calendar initialDate={testDate} onDateSelect={onDateSelect} />, testDate);
    
    // 选择一个日期单元格（例如第10个）
    const dayCells = screen.getAllByTestId('day-cell');
    fireEvent.click(dayCells[10]);
    
    // 检查回调是否被调用
    expect(onDateSelect).toHaveBeenCalled();
  });
  
  it('当设置showImageGallery为false时不应该显示图片轮播', () => {
    const testDate = new Date(2023, 5, 15);
    renderWithProvider(<Calendar initialDate={testDate} showImageGallery={false} />, testDate);
    
    // 选择一个日期
    const dayCells = screen.getAllByTestId('day-cell');
    fireEvent.click(dayCells[10]);
    
    // 检查图片轮播是否不存在
    expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
  });
  
  it('当选中日期后应该显示图片轮播', () => {
    // 创建一个有图片的日期记录
    const testDate = new Date(2023, 5, 15);
    const initialData = {
      records: {
        '2023-06-15': {
          date: '2023-06-15',
          title: '测试事件',
          description: '描述',
          images: [
            { id: '1', url: 'test1.jpg', alt: '测试1', order: 0 },
            { id: '2', url: 'test2.jpg', alt: '测试2', order: 1 }
          ],
          marked: true
        }
      }
    };
    
    renderWithProvider(
      <Calendar initialDate={testDate} showImageGallery={true} />, 
      testDate
    );
    
    // 选择一个日期
    const dayCells = screen.getAllByTestId('day-cell');
    fireEvent.click(dayCells[10]);
    
    // 图片轮播应该存在
    expect(screen.queryByTestId('image-gallery')).toBeInTheDocument();
  });
  
  it('应该将autoPlay和autoPlayInterval属性传递给ImageGallery', () => {
    const testDate = new Date(2023, 5, 15);
    const customInterval = 5000;
    
    renderWithProvider(
      <Calendar 
        initialDate={testDate} 
        showImageGallery={true} 
        autoPlay={true} 
        autoPlayInterval={customInterval}
      />, 
      testDate
    );
    
    // 选择一个日期
    const dayCells = screen.getAllByTestId('day-cell');
    fireEvent.click(dayCells[10]);
    
    // 检查属性是否正确传递
    expect(screen.getByTestId('auto-play').textContent).toBe('true');
    expect(screen.getByTestId('auto-play-interval').textContent).toBe(String(customInterval));
  });
}); 