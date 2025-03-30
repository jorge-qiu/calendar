import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Admin from '../Admin';
import { CalendarProvider } from '../../../contexts/CalendarContext';
import { CalendarData, DateRecord } from '../../../types';

// 模拟RecordForm组件
jest.mock('../RecordForm', () => {
  return jest.fn(({ record, onSave, onCancel }) => (
    <div data-testid="record-form">
      <div data-testid="form-record">{JSON.stringify(record)}</div>
      <button data-testid="form-save" onClick={() => onSave(record || {
        date: '2023-06-20',
        title: '新记录',
        description: '描述',
        images: [],
        marked: false
      })}>保存</button>
      <button data-testid="form-cancel" onClick={onCancel}>取消</button>
    </div>
  ));
});

// 模拟样式模块
jest.mock('../Admin.module.scss', () => ({
  adminContainer: 'adminContainer',
  adminTitle: 'adminTitle',
  controlBar: 'controlBar',
  searchBar: 'searchBar',
  filterSelect: 'filterSelect',
  addButton: 'addButton',
  saveButton: 'saveButton',
  recordsGrid: 'recordsGrid',
  recordCard: 'recordCard',
  recordDate: 'recordDate',
  recordTitle: 'recordTitle',
  recordDescription: 'recordDescription',
  recordImages: 'recordImages',
  recordActions: 'recordActions',
  editButton: 'editButton',
  deleteButton: 'deleteButton',
  formOverlay: 'formOverlay'
}));

describe('Admin组件测试', () => {
  // 测试数据
  const mockRecords: Record<string, DateRecord> = {
    '2023-06-15': {
      date: '2023-06-15',
      title: '测试记录1',
      description: '测试描述1',
      images: [{ id: '1', url: 'test1.jpg', alt: '测试图片1', order: 0 }],
      marked: true,
      markType: 'event'
    },
    '2023-06-20': {
      date: '2023-06-20',
      title: '测试记录2',
      description: '测试描述2',
      images: [],
      marked: false
    }
  };
  
  const mockInitialData: CalendarData = {
    records: mockRecords
  };
  
  const mockOnSave = jest.fn();
  
  const renderWithProvider = (ui: React.ReactElement, initialData = mockInitialData) => {
    return render(
      <CalendarProvider initialData={initialData}>
        {ui}
      </CalendarProvider>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('应该渲染管理面板标题和控制栏', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    expect(screen.getByText('日历记录管理')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/搜索/i)).toBeInTheDocument();
    expect(screen.getByText(/添加记录/i)).toBeInTheDocument();
    expect(screen.getByText(/保存所有/i)).toBeInTheDocument();
  });
  
  it('应该显示记录列表', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 检查记录是否显示
    expect(screen.getByText('测试记录1')).toBeInTheDocument();
    expect(screen.getByText('测试记录2')).toBeInTheDocument();
    expect(screen.getByText('测试描述1')).toBeInTheDocument();
    expect(screen.getByText('测试描述2')).toBeInTheDocument();
  });
  
  it('点击添加记录按钮应该显示表单', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 初始时表单不应该显示
    expect(screen.queryByTestId('record-form')).not.toBeInTheDocument();
    
    // 点击添加记录按钮
    fireEvent.click(screen.getByText(/添加记录/i));
    
    // 表单应该显示，且没有选定的记录
    expect(screen.getByTestId('record-form')).toBeInTheDocument();
    const formRecord = JSON.parse(screen.getByTestId('form-record').textContent || 'null');
    expect(formRecord).toBeNull();
  });
  
  it('点击编辑按钮应该显示带有记录数据的表单', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 找到记录卡片
    const recordCard = screen.getAllByText(/编辑/i)[0].closest('[class*="recordCard"]');
    
    // 点击编辑按钮
    if (recordCard) {
      const editButton = within(recordCard).getByText(/编辑/i);
      fireEvent.click(editButton);
    }
    
    // 表单应该显示，且包含选定的记录
    expect(screen.getByTestId('record-form')).toBeInTheDocument();
    const formRecord = JSON.parse(screen.getByTestId('form-record').textContent || '{}');
    expect(formRecord).not.toBeNull();
    expect(formRecord.title).toBeTruthy();
  });
  
  it('点击删除按钮应该删除记录', () => {
    // 模拟window.confirm返回true
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 记录数量
    const initialRecordCount = screen.getAllByText(/编辑/i).length;
    
    // 找到记录卡片
    const recordCard = screen.getAllByText(/删除/i)[0].closest('[class*="recordCard"]');
    
    // 点击删除按钮
    if (recordCard) {
      const deleteButton = within(recordCard).getByText(/删除/i);
      fireEvent.click(deleteButton);
    }
    
    // 记录应该被删除
    const newRecordCount = screen.getAllByText(/编辑/i).length;
    expect(newRecordCount).toBe(initialRecordCount - 1);
  });
  
  it('点击表单保存按钮应该添加新记录', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 初始记录数量
    const initialRecordCount = screen.getAllByText(/编辑/i).length;
    
    // 点击添加记录按钮
    fireEvent.click(screen.getByText(/添加记录/i));
    
    // 表单应该显示
    expect(screen.getByTestId('record-form')).toBeInTheDocument();
    
    // 点击表单保存按钮
    fireEvent.click(screen.getByTestId('form-save'));
    
    // 表单应该关闭
    expect(screen.queryByTestId('record-form')).not.toBeInTheDocument();
    
    // 记录数量应该增加
    const newRecordCount = screen.getAllByText(/编辑/i).length;
    expect(newRecordCount).toBe(initialRecordCount + 1);
    
    // 新记录应该显示
    expect(screen.getByText('新记录')).toBeInTheDocument();
  });
  
  it('点击表单取消按钮应该关闭表单', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 点击添加记录按钮
    fireEvent.click(screen.getByText(/添加记录/i));
    
    // 表单应该显示
    expect(screen.getByTestId('record-form')).toBeInTheDocument();
    
    // 点击表单取消按钮
    fireEvent.click(screen.getByTestId('form-cancel'));
    
    // 表单应该关闭
    expect(screen.queryByTestId('record-form')).not.toBeInTheDocument();
  });
  
  it('点击保存所有按钮应该调用onSave回调', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 点击保存所有按钮
    fireEvent.click(screen.getByText(/保存所有/i));
    
    // onSave回调应该被调用
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      records: expect.any(Object)
    }));
  });
  
  it('搜索应该过滤记录列表', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 初始应该显示所有记录
    expect(screen.getByText('测试记录1')).toBeInTheDocument();
    expect(screen.getByText('测试记录2')).toBeInTheDocument();
    
    // 输入搜索词
    const searchInput = screen.getByPlaceholderText(/搜索/i);
    fireEvent.change(searchInput, { target: { value: '记录1' } });
    
    // 应该只显示匹配的记录
    expect(screen.getByText('测试记录1')).toBeInTheDocument();
    expect(screen.queryByText('测试记录2')).not.toBeInTheDocument();
  });
  
  it('过滤选择应该过滤记录列表', () => {
    renderWithProvider(<Admin onSave={mockOnSave} />);
    
    // 初始应该显示所有记录
    expect(screen.getByText('测试记录1')).toBeInTheDocument();
    expect(screen.getByText('测试记录2')).toBeInTheDocument();
    
    // 选择标记过滤器
    const filterSelect = screen.getByLabelText(/过滤/i);
    fireEvent.change(filterSelect, { target: { value: 'marked' } });
    
    // 应该只显示标记的记录
    expect(screen.getByText('测试记录1')).toBeInTheDocument();
    expect(screen.queryByText('测试记录2')).not.toBeInTheDocument();
  });
}); 