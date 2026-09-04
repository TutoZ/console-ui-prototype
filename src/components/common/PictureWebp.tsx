import React from 'react';
import { assetWebp } from '@/lib/assetWebp';

type PictureWebpProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
};

/** PNG/JPG 优先 WebP，构建时 optimize-assets 生成同名 .webp */
export function PictureWebp({ src, alt = '', loading = 'lazy', decoding = 'async', ...imgProps }: PictureWebpProps) {
  if (!/\.png$/i.test(src)) {
    return <img src={src} alt={alt} loading={loading} decoding={decoding} {...imgProps} />;
  }
  return (
    <picture>
      <source srcSet={assetWebp(src)} type="image/webp" />
      <img src={src} alt={alt} loading={loading} decoding={decoding} {...imgProps} />
    </picture>
  );
}
