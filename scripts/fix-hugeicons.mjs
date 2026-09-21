import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const names = ['Grid2X2CheckIcon', 'Grid2X2PlusIcon', 'Grid2X2Icon', 'Grid2X2XIcon', 'Grid3X2Icon', 'Grid3X3Icon'];
const mapName = (n) => n.replace('2X2', '2x2').replace('3X2', '3x2').replace('3X3', '3x3');
const exts = ['.js', '.d.ts', '.js.map'];

function fixBase(baseDir) {
  ['cjs', 'esm', 'types'].forEach((sub) => {
    const d = path.join(baseDir, sub);
    if (!fs.existsSync(d)) return;
    names.forEach((orig) => {
      const lower = mapName(orig);
      exts.forEach((ext) => {
        const origF = path.join(d, orig + ext);
        const lowF = path.join(d, lower + ext);
        if (fs.existsSync(origF) && !fs.existsSync(lowF)) {
          fs.copyFileSync(origF, lowF);
        }
      });
    });
  });
}

try {
  const dirs = execSync('find node_modules -type d -path "*@hugeicons/core-free-icons/dist" 2>/dev/null')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);
  dirs.forEach(fixBase);
} catch {
  // Ignore errors
}
