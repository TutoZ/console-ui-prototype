/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 全站加载动画 — 统一为圆环 LoadingCircle（Toast 同源）。
 * 保留 MatrixLoader 导出名，兼容旧引用。
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingCircle } from './ToastLoadingIcon';

/** @deprecated 资源已统一到 LoadingCircle CSS 圆环；保留常量以免外部引用报错 */
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
  /** 深色底上显示为白圈 */
  onDark?: boolean;
};

/** 圆环加载；忽略传入的 animate-spin（自身已带动画） */
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
