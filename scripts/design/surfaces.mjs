import {readFileSync,readdirSync,existsSync} from 'node:fs';
/** Fail when an authored extension DOM surface has no reviewed design-system owner. */
export function checkSurfaces(root, inventory) {
  const registered=new Set(inventory.surfaces.map(item=>item.controller));
  for(const item of inventory.surfaces) {
    if(!item.story) throw new Error(`Missing Storybook surface: ${item.id}`);
    for(const file of [item.controller,item.component,...item.styles]) if(!existsSync(new URL(file,root))) throw new Error(`Missing UI surface source: ${file}`);
  }
  for(const file of readdirSync(new URL('extension/',root),{recursive:true})) {
    if(!/\.(js|html|css)$/.test(file) || ['ui/tokens.js','ui/primitives.js','ui/react-runtime.js','ui/playback-settings.js','ui/gif-editor.js'].includes(file) || file.startsWith('gif/vendor/')) continue;
    const path='extension/'+file;
    const content=readFileSync(new URL(path,root),'utf8');
    if((/\.(html|css)$/.test(file) || /\bcreateElement(?:NS)?\s*\(|\battachShadow\s*\(|\.innerHTML\s*=|\binsertAdjacentHTML\s*\(/.test(content)) && !registered.has(path) && !inventory.nonvisualDom[path]) throw new Error(`Unregistered UI surface: ${path}. Register its shared component, styles and Storybook state.`);
  }
}
