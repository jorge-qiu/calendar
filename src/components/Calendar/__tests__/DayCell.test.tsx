import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DayCell from '../DayCell';

// 模拟样式模块
jest.mock('../DayCell.module.scss', () => ({
  dayCell: 'dayCell',
  otherMonth: 'otherMonth',
  selected: 'selected',
  today: 'today',
  hasImages: 'hasImages',
  'mark-event': 'mark-event',
  'mark-important': 'mark-important',
  'mark-holiday': 'mark-holiday',
  'mark-birthday': 'mark-birthday',
  dateNumber: 'dateNumber',
  imageIndicator: 'imageIndicator',
  imageIcon: 'imageIcon',
  markIndicator: 'markIndicator',
  'hover-zoom': 'hover-zoom',
  'hover-fade': 'hover-fade',
  'hover-slide': 'hover-slide'
}));

describe('DayCell组件测试', () => {
  // 测试的基本属性
  const baseProps = {
    date: new Date(2023, 3, 15), // 2023年4月15日
    isCurrentMonth: true,
    isSelected: false,
    isToday: false,
    hasImages: false,
    onSelect: jest.fn(),
    hoverEffect: 'zoom' as const
  };
  
  it('应该渲染日期数字', () => {
    render(<DayCell {...baseProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });
  
  it('当点击单元格时应该调用onSelect函数', () => {
    render(<DayCell {...baseProps} />);
    fireEvent.click(screen.getByText('15').closest('div')!);
    expect(baseProps.onSelect).toHaveBeenCalledWith(baseProps.date);
  });
  
  it('当isCurrentMonth为false时应该应用otherMonth类', () => {
    const { container } = render(<DayCell {...baseProps} isCurrentMonth={false} />);
    expect(container.firstChild).toHaveClass('otherMonth');
  });
  
  it('当isSelected为true时应该应用selected类', () => {
    const { container } = render(<DayCell {...baseProps} isSelected={true} />);
    expect(container.firstChild).toHaveClass('selected');
  });
  
  it('当isToday为true时应该应用today类', () => {
    const { container } = render(<DayCell {...baseProps} isToday={true} />);
    expect(container.firstChild).toHaveClass('today');
  });
  
  it('当hasImages为true时应该显示图片指示器', () => {
    render(<DayCell {...baseProps} hasImages={true} />);
    expect(screen.getByText('📷')).toBeInTheDocument();
  });
  
  it('当有markType时应该显示标记指示器', () => {
    const { container } = render(<DayCell {...baseProps} markType="event" />);
    const markIndicator = container.querySelector('.markIndicator');
    expect(markIndicator).toBeInTheDocument();
  });
  
  it('对不同的markType应该应用不同的类', () => {
    const markTypes = ['event', 'important', 'holiday', 'birthday'];
    
    markTypes.forEach(type => {
      const { container } = render(<DayCell {...baseProps} markType={type} />);
      expect(container.firstChild).toHaveClass(`mark-${type}`);
    });
  });
  
  it('应该根据hoverEffect属性应用不同的悬停效果类', () => {
    const hoverEffects = ['zoom', 'fade', 'slide', 'none'] as const;
    
    hoverEffects.forEach(effect => {
      if (effect === 'none') return; // none没有对应的类
      
      const { container } = render(
        <DayCell {...baseProps} hasImages={true} hoverEffect={effect} />
      );
      
      // 触发鼠标悬停
      fireEvent.mouseEnter(container.firstChild as Element);
      expect(container.firstChild).toHaveClass(`hover-${effect}`);
      
      // 移出鼠标
      fireEvent.mouseLeave(container.firstChild as Element);
      expect(container.firstChild).not.toHaveClass(`hover-${effect}`);
    });
  });
}); 