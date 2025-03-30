/**
 * 日历组件类型定义
 */

// 日期图片数据
export interface DateImage {
  id: string;          // 图片唯一ID
  url: string;         // 图片URL
  alt?: string;        // 图片描述
  order: number;       // 排序顺序
}

// 日期记录
export interface DateRecord {
  date: string;        // 日期，格式：YYYY-MM-DD
  title?: string;      // 标题(可选)
  description?: string; // 描述(可选)
  images: DateImage[]; // 图片数组
  marked?: boolean;    // 是否标记
  markType?: string;   // 标记类型
}

// 完整日历数据
export interface CalendarData {
  records: Record<string, DateRecord>; // 以日期为键的记录对象
}

// 日历组件属性
export interface CalendarProps {
  initialDate?: Date;  // 初始选中的日期
  onDateSelect?: (date: Date) => void; // 日期选择回调函数
  markedDates?: Array<{date: Date, type: string}>; // 需要标记的日期数组
  imageData?: Record<string, Array<{url: string, alt?: string}>>; // 日期图片数据
  showImageGallery?: boolean; // 是否显示图片轮播
  autoPlay?: boolean; // 是否自动播放轮播图
  autoPlayInterval?: number; // 自动播放间隔(毫秒)
  hoverEffect?: 'zoom' | 'fade' | 'slide' | 'none'; // 鼠标悬停动画效果
}

// 日期单元格属性
export interface DayCellProps {
  date: Date;           // 日期
  isCurrentMonth: boolean; // 是否是当前月份
  isSelected: boolean;  // 是否被选中
  isToday: boolean;     // 是否为今天
  hasImages: boolean;   // 是否有图片
  markType?: string;    // 标记类型
  onSelect: (date: Date) => void; // 选择回调
  hoverEffect?: 'zoom' | 'fade' | 'slide' | 'none'; // 悬停效果
}

// 图片轮播组件属性
export interface ImageGalleryProps {
  images: Array<{url: string, alt?: string}>; // 图片数组
  autoPlay?: boolean;  // 是否自动播放
  autoPlayInterval?: number; // 自动播放间隔
  showThumbnails?: boolean; // 是否显示缩略图
  showFullscreenButton?: boolean; // 是否显示全屏按钮
  showPlayButton?: boolean; // 是否显示播放按钮
}

// 后台管理组件属性
export interface AdminProps {
  onSave?: (data: CalendarData) => void; // 保存回调函数
  initialData?: CalendarData; // 初始数据
  apiEndpoint?: string; // API端点(可选)
} 