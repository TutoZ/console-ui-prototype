import React from 'react';
import { cn } from '../cn';
import { LoadingCircle } from './LoadingCircle';

/** @deprecated 加载态已改为 CSS LoadingCircle；保留空串以免外部引用报错 */
export const MATRIX_LOADER_SRC = '';


function stripSpinClasses(className?: string) {
  return (className ?? '')
    .replace(/\banimate-spin(?:-slow)?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type MatrixLoaderProps = {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  /** @deprecated 已忽略；统一用 LoadingCircle 资源 */
  src?: string;
  onDark?: boolean;
};

export const MatrixLoader: React.FC<MatrixLoaderProps> = ({
  size = 16,
  className,
  style,
  title,
  onDark = false,
}) => {
  const numericSize =
    typeof size === 'string' ? Number.parseInt(size, 10) || 16 : size;
  const cleaned = stripSpinClasses(className)
    .replace(/\binvert\b/g, '')
    .replace(/\bbrightness-0\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const onDarkResolved =
    onDark ||
    /\binvert\b/.test(className ?? '') ||
    /\bbrightness-0\b/.test(className ?? '');


  return (
    <LoadingCircle
      size={numericSize}
      title={title}
      onDark={onDarkResolved}
      className={cn(cleaned)}
      style={style}
    />
  );
};

export default MatrixLoader;
