import React from 'react';
import ReactImageGallery from 'react-image-gallery';
import { ImageGalleryProps } from '../../types';
import 'react-image-gallery/styles/css/image-gallery.css';
import styles from './ImageGallery.module.scss';

/**
 * 图片轮播组件
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  autoPlay = false,
  autoPlayInterval = 3000,
  showThumbnails = true,
  showFullscreenButton = true,
  showPlayButton = true
}) => {
  // 如果没有图片，显示空状态
  if (!images || images.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <p>暂无图片</p>
      </div>
    );
  }

  // 转换为react-image-gallery需要的格式
  const items = images.map(image => ({
    original: image.url,
    thumbnail: image.url,
    originalAlt: image.alt || '',
    thumbnailAlt: image.alt || '',
    description: image.alt || ''
  }));

  return (
    <div className={styles.galleryContainer}>
      <ReactImageGallery
        items={items}
        autoPlay={autoPlay}
        slideInterval={autoPlayInterval}
        showThumbnails={showThumbnails}
        showFullscreenButton={showFullscreenButton}
        showPlayButton={showPlayButton}
        showNav={true}
        showBullets={images.length > 1}
        showIndex={true}
        lazyLoad={true}
        slideDuration={450}
        slideOnThumbnailOver={false}
        additionalClass={styles.customGallery}
      />
    </div>
  );
};

export default ImageGallery; 