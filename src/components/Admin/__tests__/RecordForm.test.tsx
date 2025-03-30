import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import RecordForm from '../RecordForm';
import { DateRecord, DateImage } from '../../../types';
import userEvent from '@testing-library/user-event';

// 模拟UUID生成函数
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

// 模拟样式模块
jest.mock('../RecordForm.module.scss', () => ({
  formContainer: 'formContainer',
  formTitle: 'formTitle',
  formFields: 'formFields',
  formGroup: 'formGroup',
  label: 'label',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  checkboxGroup: 'checkboxGroup',
  checkbox: 'checkbox',
  imagesSection: 'imagesSection',
  uploadButton: 'uploadButton',
  imagesGrid: 'imagesGrid',
  imageItem: 'imageItem',
  imagePreview: 'imagePreview',
  deleteButton: 'deleteButton',
  moveButtons: 'moveButtons',
  moveUpButton: 'moveUpButton',
  moveDownButton: 'moveDownButton',
  actions: 'actions',
  saveButton: 'saveButton',
  cancelButton: 'cancelButton'
}));

describe('RecordForm组件测试', () => {
  // 测试数据
  const mockRecord: DateRecord = {
    date: '2023-06-15',
    title: '测试标题',
    description: '测试描述',
    images: [
      { id: '1', url: 'test1.jpg', alt: '测试图片1', order: 0 },
      { id: '2', url: 'test2.jpg', alt: '测试图片2', order: 1 }
    ],
    marked: true,
    markType: 'event'
  };
  
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  // 重置模拟函数
  beforeEach(() => {
    jest.clearAllMocks();
    // 模拟URL.createObjectURL和URL.revokeObjectURL
    Object.defineProperty(global.URL, 'createObjectURL', {
      value: jest.fn(() => 'mock-url'),
      writable: true
    });
    
    Object.defineProperty(global.URL, 'revokeObjectURL', {
      value: jest.fn(),
      writable: true
    });
  });
  
  it('应该使用空记录渲染表单', () => {
    render(<RecordForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 检查表单元素是否存在
    expect(screen.getByLabelText(/日期/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/标题/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/描述/i)).toBeInTheDocument();
    
    // 检查按钮是否存在
    expect(screen.getByText(/保存/i)).toBeInTheDocument();
    expect(screen.getByText(/取消/i)).toBeInTheDocument();
  });
  
  it('应该使用提供的记录数据填充表单', () => {
    render(<RecordForm record={mockRecord} onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 检查输入字段的值
    expect(screen.getByLabelText(/日期/i)).toHaveValue('2023-06-15');
    expect(screen.getByLabelText(/标题/i)).toHaveValue('测试标题');
    expect(screen.getByLabelText(/描述/i)).toHaveValue('测试描述');
    expect(screen.getByLabelText(/标记/i)).toBeChecked();
    
    // 检查图片预览是否存在
    const images = screen.getAllByAltText(/测试图片/);
    expect(images.length).toBe(2);
  });
  
  it('点击取消按钮应该调用onCancel', () => {
    render(<RecordForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText(/取消/i));
    expect(mockOnCancel).toHaveBeenCalled();
  });
  
  it('应该正确更新表单字段的值', async () => {
    render(<RecordForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 填写表单字段
    const dateInput = screen.getByLabelText(/日期/i);
    const titleInput = screen.getByLabelText(/标题/i);
    const descriptionInput = screen.getByLabelText(/描述/i);
    const markedCheckbox = screen.getByLabelText(/标记/i);
    const markTypeSelect = screen.getByLabelText(/标记类型/i);
    
    // 使用userEvent更真实地模拟用户输入
    await act(async () => {
      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, '2023-06-20');
      
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, '新测试标题');
      
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, '新测试描述');
      
      await userEvent.click(markedCheckbox);
      
      // 选择不同的标记类型
      await userEvent.selectOptions(markTypeSelect, 'important');
    });
    
    // 验证表单字段的值
    expect(dateInput).toHaveValue('2023-06-20');
    expect(titleInput).toHaveValue('新测试标题');
    expect(descriptionInput).toHaveValue('新测试描述');
    expect(markedCheckbox).toBeChecked();
    expect(markTypeSelect).toHaveValue('important');
  });
  
  it('提交表单应该调用onSave并传递正确的数据', async () => {
    render(<RecordForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 填写表单字段
    const dateInput = screen.getByLabelText(/日期/i);
    const titleInput = screen.getByLabelText(/标题/i);
    const descriptionInput = screen.getByLabelText(/描述/i);
    
    await act(async () => {
      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, '2023-06-20');
      
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, '新测试标题');
      
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, '新测试描述');
      
      // 提交表单
      fireEvent.click(screen.getByText(/保存/i));
    });
    
    // 验证onSave被调用，并且传递了正确的数据
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      date: '2023-06-20',
      title: '新测试标题',
      description: '新测试描述'
    }));
  });
  
  it('应该允许上传图片', async () => {
    render(<RecordForm onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 创建一个测试文件
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    // 获取文件输入框
    const fileInput = screen.getByLabelText(/上传图片/i);
    
    // 模拟文件上传
    await act(async () => {
      await userEvent.upload(fileInput, file);
    });
    
    // 验证图片是否已添加
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    });
    
    // 提交表单
    fireEvent.click(screen.getByText(/保存/i));
    
    // 验证表单提交时包含了图片
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      images: expect.arrayContaining([
        expect.objectContaining({
          url: 'mock-url',
          alt: 'test.png'
        })
      ])
    }));
  });
  
  it('应该允许删除图片', async () => {
    render(<RecordForm record={mockRecord} onSave={mockOnSave} onCancel={mockOnCancel} />);
    
    // 获取删除按钮（假设每个图片项目旁边都有一个删除按钮）
    const deleteButtons = screen.getAllByText(/删除/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
    
    // 点击第一个删除按钮
    await act(async () => {
      await userEvent.click(deleteButtons[0]);
    });
    
    // 提交表单
    fireEvent.click(screen.getByText(/保存/i));
    
    // 验证剩余的图片数量
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      images: expect.arrayContaining([
        expect.objectContaining({
          id: '2'
        })
      ])
    }));
    
    // 确保第一张图片已被删除
    const savedRecord = mockOnSave.mock.calls[0][0];
    expect(savedRecord.images.find(img => img.id === '1')).toBeUndefined();
  });
}); 