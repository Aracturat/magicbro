import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cliRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const repositoryRoot = resolve(cliRoot, '..');
const assetsRoot = resolve(cliRoot, 'package-assets');

await mkdir(assetsRoot, { recursive: true });
await Promise.all([
  copyFile(resolve(repositoryRoot, 'userscript/magicbro.user.js'), resolve(assetsRoot, 'magicbro.user.js')),
  copyFile(resolve(repositoryRoot, 'demo/demo.en.html'), resolve(assetsRoot, 'demo.en.html')),
  copyFile(resolve(repositoryRoot, 'demo/demo.ru.html'), resolve(assetsRoot, 'demo.ru.html')),
  copyFile(resolve(repositoryRoot, 'LICENSE'), resolve(cliRoot, 'LICENSE')),
  copyFile(resolve(repositoryRoot, 'README.md'), resolve(cliRoot, 'README.md')),
]);
