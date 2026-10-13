// Run with Node 22.18+: node tools/import-icons.mjs /path/to/catppuccin/vscode-icons
import { readFile, writeFile, readdir, cp } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const source = process.argv[2];
if (!source) throw new Error('Provide a local catppuccin/vscode-icons checkout.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { fileNames, fileExtensions } = await import(pathToFileURL(resolve(source, 'src/defaults/fileIcons.ts')));
const { folderNames } = await import(pathToFileURL(resolve(source, 'src/defaults/folderIcons.ts')));
const iconPath = resolve(source, 'icons/css-variables');
await cp(iconPath, resolve(root, 'assets/catppuccin/icons'), { recursive: true });
await cp(resolve(source, 'LICENSE'), resolve(root, 'assets/catppuccin/LICENSE'));
const icons = {};
for (const name of (await readdir(iconPath)).filter(name => name.endsWith('.svg')).sort()) {
  icons[name.slice(0, -4)] = await readFile(resolve(iconPath, name), 'utf8');
}
const commit = execFileSync('git', ['-C', resolve(source), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
await writeFile(resolve(root, 'assets/catppuccin/icons.js'), '// Generated from Catppuccin vscode-icons; see LICENSE and SOURCE.md.\nwindow.CATPPUCCIN = ' + JSON.stringify({ icons, fileNames, fileExtensions, folderNames }) + ';\n');
await writeFile(resolve(root, 'assets/catppuccin/SOURCE.md'), `# Catppuccin Icons\n\nSource: https://github.com/catppuccin/vscode-icons\n\nCommit: ${commit}\n\nLicense: MIT (see LICENSE). Original css-variables SVGs and default filename / extension / folder associations are retained. icons.js bundles those assets for offline file:// use.\n\nRegenerate with Node 22.18+: \`node tools/import-icons.mjs /path/to/vscode-icons\`.\n`);
console.log(`Imported ${Object.keys(icons).length} icons, commit ${commit}`);
