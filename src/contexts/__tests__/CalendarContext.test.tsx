import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CalendarProvider, useCalendar } from '../CalendarContext';
import { DateRecord, CalendarData } from '../../types';

// 测试用的消费组件
const TestConsumer: React.FC = () => {
  const { 
    currentDate, 
    selectedDate, 
    calendarData, 
    setCurrentDate, 
    setSelectedDate,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecord,
    hasImages,
    getImages
  } = useCalendar();
  
  return (
    <div>
      <div data-testid="current-date">{currentDate.toISOString()}</div>
      <div data-testid="selected-date">{selectedDate?.toISOString() || 'null'}</div>
      <div data-testid="calendar-data">{JSON.stringify(calendarData)}</div>
      
      <button 
        data-testid="set-current-date" 
        onClick={() => setCurrentDate(new Date(2023, 5, 15))}
      >
        设置当前日期
      </button>
      
      <button 
        data-testid="set-selected-date" 
        onClick={() => setSelectedDate(new Date(2023, 5, 20))}
      >
        设置选中日期
      </button>
      
      <button 
        data-testid="clear-selected-date" 
        onClick={() => setSelectedDate(null)}
      >
        清除选中日期
      </button>
      
      <button 
        data-testid="add-record" 
        onClick={() => {
          const record: DateRecord = {
            date: '2023-06-25',
            title: '测试记录',
            description: '这是一条测试记录',
            images: [
              { id: '1', url: 'test.jpg', alt: '测试图片', order: 0 }
            ],
            marked: true,
            markType: 'event'
          };
          addRecord(record);
        }}
      >
        添加记录
      </button>
      
      <button 
        data-testid="update-record" 
        onClick={() => {
          const record: DateRecord = {
            date: '2023-06-25',
            title: '更新的记录',
            description: '这是一条更新后的记录',
            images: [
              { id: '1', url: 'test.jpg', alt: '测试图片', order: 0 }
            ],
            marked: true,
            markType: 'important'
          };
          updateRecord(record);
        }}
      >
        更新记录
      </button>
      
      <button 
        data-testid="delete-record" 
        onClick={() => deleteRecord('2023-06-25')}
      >
        删除记录
      </button>
      
      <button 
        data-testid="get-record" 
        onClick={() => {
          const record = getRecord('2023-06-25');
          if (record) {
            document.getElementById('record-result')!.textContent = JSON.stringify(record);
          }
        }}
      >
        获取记录
      </button>
      
      <div id="record-result" data-testid="record-result"></div>
      
      <button 
        data-testid="check-has-images" 
        onClick={() => {
          const result = hasImages(new Date(2023, 5, 25));
          document.getElementById('has-images-result')!.textContent = String(result);
        }}
      >
        检查是否有图片
      </button>
      
      <div id="has-images-result" data-testid="has-images-result"></div>
      
      <button 
        data-testid="get-images" 
        onClick={() => {
          const images = getImages(new Date(2023, 5, 25));
          document.getElementById('images-result')!.textContent = JSON.stringify(images);
        }}
      >
        获取图片
      </button>
      
      <div id="images-result" data-testid="images-result"></div>
    </div>
  );
};

describe('CalendarContext测试', () => {
  const mockInitialData: CalendarData = {
    records: {
      '2023-01-15': {
        date: '2023-01-15',
        title: '初始记录',
        description: '这是一条初始记录',
        images: [],
        marked: false
      }
    }
  };
  
  const mockInitialDate = new Date(2023, 0, 1);
  
  it('应该提供默认的上下文值', () => {
    render(
      <CalendarProvider>
        <TestConsumer />
      </CalendarProvider>
    );
    
    // 检查当前日期是否是今天（近似比较）
    const currentDateElement = screen.getByTestId('current-date');
    const currentDateValue = new Date(currentDateElement.textContent || '');
    const today = new Date();
    
    expect(currentDateValue.getFullYear()).toBe(today.getFullYear());
    expect(currentDateValue.getMonth()).toBe(today.getMonth());
    expect(currentDateValue.getDate()).toBe(today.getDate());
    
    // 检查选中日期是否为null
    expect(screen.getByTestId('selected-date').textContent).toBe('null');
    
    // 检查日历数据是否为空对象
    const calendarData = JSON.parse(screen.getByTestId('calendar-data').textContent || '{}');
    expect(calendarData).toEqual({ records: {} });
  });
  
  it('应该使用提供的初始值', () => {
    render(
      <CalendarProvider initialDate={mockInitialDate} initialData={mockInitialData}>
        <TestConsumer />
      </CalendarProvider>
    );
    
    // 检查当前日期是否是初始日期
    const currentDateElement = screen.getByTestId('current-date');
    expect(currentDateElement.textContent).toBe(mockInitialDate.toISOString());
    
    // 检查日历数据是否是初始数据
    const calendarData = JSON.parse(screen.getByTestId('calendar-data').textContent || '{}');
    expect(calendarData).toEqual(mockInitialData);
  });
  
  it('应该允许更新当前日期', () => {
    render(
      <CalendarProvider>
        <TestConsumer />
      </CalendarProvider>
    );
    
    // 点击设置当前日期按钮
    act(() => {
      screen.getByTestId('set-current-date').click();
    });
    
    // 检查当前日期是否已更新
    const expectedDate = new Date(2023, 5, 15).toISOString();
    expect(screen.getByTestId('current-date').textContent).toBe(expectedDate);
  });
  
  it('应该允许设置和清除选中日期', () => {
    render(
      <CalendarProvider>
        <TestConsumer />
      </CalendarProvider>
    );
    
    // 点击设置选中日期按钮
    act(() => {
      screen.getByTestId('set-selected-date').click();
    });
    
    // 检查选中日期是否已设置
    const expectedDate = new Date(2023, 5, 20).toISOString();
    expect(screen.getByTestId('selected-date').textContent).toBe(expectedDate);
    
    // 点击清除选中日期按钮
    act(() => {
      screen.getByTestId('clear-selected-date').click();
    });
    
    // 检查选中日期是否已清除
    expect(screen.getByTestId('selected-date').textContent).toBe('null');
  });
  
  it('应该允许添加、更新和删除记录', () => {
    render(
      <CalendarProvider>
        <TestConsumer />
      </CalendarProvider>
    );
    
    // 添加记录
    act(() => {
      screen.getByTestId('add-record').click();
    });
    
    // 检查记录是否已添加
    let calendarData = JSON.parse(screen.getByTestId('calendar-data').textContent || '{}');
    expect(calendarData.records['2023-06-25']).toBeDefined();
    expect(calendarData.records['2023-06-25'].title).toBe('测试记录');
    
    // 更新记录
    act(() => {
      screen.getByTestId('update-record').click();
    });
    
    // 检查记录是否已更新
    calendarData = JSON.parse(screen.getByTestId('calendar-data').textContent || '{}');
    expect(calendarData.records['2023-06-25'].title).toBe('更新的记录');
    expect(calendarData.records['2023-06-25'].markType).toBe('important');
    
    // 获取记录
    act(() => {
      screen.getByTestId('get-record').click();
    });
    
    // 检查获取的记录是否正确
    const recordResult = JSON.parse(screen.getByTestId('record-result').textContent || '{}');
    expect(recordResult.title).toBe('更新的记录');
    
    // 检查是否有图片
    act(() => {
      screen.getByTestId('check-has-images').click();
    });
    
    // 应该有图片
    expect(screen.getByTestId('has-images-result').textContent).toBe('true');
    
    // 获取图片
    act(() => {
      screen.getByTestId('get-images').click();
    });
    
    // 检查获取的图片是否正确
    const imagesResult = JSON.parse(screen.getByTestId('images-result').textContent || '[]');
    expect(imagesResult).toHaveLength(1);
    expect(imagesResult[0].url).toBe('test.jpg');
    
    // 删除记录
    act(() => {
      screen.getByTestId('delete-record').click();
    });
    
    // 检查记录是否已删除
    calendarData = JSON.parse(screen.getByTestId('calendar-data').textContent || '{}');
    expect(calendarData.records['2023-06-25']).toBeUndefined();
  });
}); 