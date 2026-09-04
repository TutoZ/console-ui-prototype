import React from 'react';
import { cn } from '../cn';
import { MATRIX_LOADER_SRC } from '../loaderAsset';

export { MATRIX_LOADER_SRC };

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
  /** 覆盖默认 SVG 地址 */
  src?: string;
};

export const MatrixLoader: React.FC<MatrixLoaderProps> = ({
  size = 16,
  className,
  style,
  title,
  src = MATRIX_LOADER_SRC,
}) => {
  const numericSize =
    typeof size === 'string' ? Number.parseInt(size, 10) || 16 : size;
  const cleaned = stripSpinClasses(className);
  const hasExplicitBox = /\b(h-|w-|size-)/.test(cleaned);

  return (
    <img
      src={src}
      alt=""
      title={title}
      width={hasExplicitBox ? undefined : numericSize}
      height={hasExplicitBox ? undefined : numericSize}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={cn(
        'inline-block shrink-0 object-contain select-none pointer-events-none',
        cleaned,
      )}
      style={style}
      draggable={false}
    />
  );
};

export default MatrixLoader;
