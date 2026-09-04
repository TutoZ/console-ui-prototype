/** 将 public 下与 PNG 同名的 WebP 路径（构建时 optimize-assets 生成） */
export function assetWebp(pngOrPath: string): string {
  return pngOrPath.replace(/\.png$/i, '.webp');
}
