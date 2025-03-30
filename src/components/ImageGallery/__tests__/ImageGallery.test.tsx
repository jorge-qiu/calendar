import React from 'react';
import { render, screen } from '@testing-library/react';
import ImageGallery from '../ImageGallery';

// 模拟react-image-gallery组件
jest.mock('react-image-gallery', () => {
  return jest.fn(props => (
    <div data-testid="mock-image-gallery">
      <div data-testid="gallery-props">{JSON.stringify(props)}</div>
      {props.items.map((item: any, index: number) => (
        <div key={index} data-testid={`gallery-item-${index}`}>
          <img src={item.original} alt={item.originalAlt} />
        </div>
      ))}
    </div>
  ));
});

// 模拟样式模块
jest.mock('../ImageGallery.module.scss', () => ({
  galleryContainer: 'galleryContainer',
  customGallery: 'customGallery',
  emptyGallery: 'emptyGallery'
}));

describe('ImageGallery组件测试', () => {
  const mockImages = [
    { url: 'image1.jpg', alt: '图片1' },
    { url: 'image2.jpg', alt: '图片2' },
    { url: 'image3.jpg', alt: '图片3' }
  ];
  
  it('当没有图片时应该显示空状态', () => {
    render(<ImageGallery images={[]} />);
    expect(screen.getByText('暂无图片')).toBeInTheDocument();
  });
  
  it('应该正确渲染图片数组', () => {
    render(<ImageGallery images={mockImages} />);
    
    const gallery = screen.getByTestId('mock-image-gallery');
    expect(gallery).toBeInTheDocument();
    
    // 检查是否正确传递了所有图片
    mockImages.forEach((_, index) => {
      expect(screen.getByTestId(`gallery-item-${index}`)).toBeInTheDocument();
    });
  });
  
  it('应该将图片数据正确转换为react-image-gallery需要的格式', () => {
    render(<ImageGallery images={mockImages} />);
    
    const propsData = JSON.parse(screen.getByTestId('gallery-props').textContent || '{}');
    
    expect(propsData.items).toHaveLength(mockImages.length);
    expect(propsData.items[0]).toEqual({
      original: 'image1.jpg',
      thumbnail: 'image1.jpg',
      originalAlt: '图片1',
      thumbnailAlt: '图片1',
      description: '图片1'
    });
  });
  
  it('应该正确传递配置属性', () => {
    render(
      <ImageGallery
        images={mockImages}
        autoPlay={true}
        autoPlayInterval={5000}
        showThumbnails={false}
        showFullscreenButton={false}
        showPlayButton={false}
      />
    );
    
    const propsData = JSON.parse(screen.getByTestId('gallery-props').textContent || '{}');
    
    expect(propsData.autoPlay).toBe(true);
    expect(propsData.slideInterval).toBe(5000);
    expect(propsData.showThumbnails).toBe(false);
    expect(propsData.showFullscreenButton).toBe(false);
    expect(propsData.showPlayButton).toBe(false);
  });
  
  it('应该使用默认配置', () => {
    render(<ImageGallery images={mockImages} />);
    
    const propsData = JSON.parse(screen.getByTestId('gallery-props').textContent || '{}');
    
    expect(propsData.autoPlay).toBe(false);
    expect(propsData.slideInterval).toBe(3000);
    expect(propsData.showThumbnails).toBe(true);
    expect(propsData.showFullscreenButton).toBe(true);
    expect(propsData.showPlayButton).toBe(true);
  });
}); 