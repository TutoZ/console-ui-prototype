/** 与 dist/index.js 相对：构建脚本会把 svg 拷到 dist/assets/ */
export const MATRIX_LOADER_SRC = new URL(
  './assets/matrix-loader.svg',
  import.meta.url,
).href;
