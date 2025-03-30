import api from './api';

export interface ImageUploadResponse {
  id: number;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
}

const imageService = {
  // 上传单张图片
  uploadImage: async (file: File, recordDate: string): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('recordDate', recordDate);
    
    const response = await api.post<{ image: ImageUploadResponse }>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.image;
  },
  
  // 删除图片
  deleteImage: async (imageId: number | string): Promise<void> => {
    const id = typeof imageId === 'string' ? parseInt(imageId, 10) : imageId;
    await api.delete(`/images/${id}`);
  },
  
  // 获取完整图片URL
  getImageUrl: (relativePath: string): string => {
    // 如果已经是完整URL，直接返回
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    // 确保路径正确
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${baseUrl}${path}`;
  }
};

export default imageService; 