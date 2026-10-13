/* Pure tree parsing and SVG rendering. No network, framework or DOM dependencies. */
(function () {
  'use strict';
  const palettes = {
    mocha: {rosewater:'#f5e0dc',flamingo:'#f2cdcd',pink:'#f5c2e7',mauve:'#cba6f7',red:'#f38ba8',maroon:'#eba0ac',peach:'#fab387',yellow:'#f9e2af',green:'#a6e3a1',teal:'#94e2d5',sky:'#89dceb',sapphire:'#74c7ec',blue:'#89b4fa',lavender:'#b4befe',text:'#cdd6f4',overlay1:'#7f849c'},
    latte: {rosewater:'#dc8a78',flamingo:'#dd7878',pink:'#ea76cb',mauve:'#8839ef',red:'#d20f39',maroon:'#e64553',peach:'#fe640b',yellow:'#df8e1d',green:'#40a02b',teal:'#179299',sky:'#04a5e5',sapphire:'#209fb5',blue:'#1e66f5',lavender:'#7287fd',text:'#4c4f69',overlay1:'#8c8fa1'}
  };
  const themes = {
    mocha: {palette:'mocha',background:'#11111b',card:'#1e1e2e',header:'#232335',line:'#45475a',guide:'#9399b2',text:'#cdd6f4',muted:'#9399b2',accent:'#cba6f7'},
    paper: {palette:'latte',background:'#e6e4ed',card:'#faf9fc',header:'#f2f0f7',line:'#d6d2e0',guide:'#626078',text:'#4c4f69',muted:'#7c7890',accent:'#88709f'},
    dusk: {palette:'mocha',background:'#302d4a',card:'#232438',header:'#2a2b43',line:'#53526b',guide:'#a4a2bc',text:'#e0def4',muted:'#a4a2bc',accent:'#c5b6ed'}
  };
  function escapeXML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  }
  function parseTree(input) {
    let lines = input.replace(/\r\n?/g, '\n').split('\n');
    const first = lines.findIndex(line => line.trim());
    if (first >= 0 && /^\s*(```|~~~)/.test(lines[first])) {
      const fence = lines[first].trim().slice(0, 3);
      lines[first] = '';
      let last = lines.length - 1;
      while (last > first && !lines[last].trim()) last--;
      if (lines[last].trim() === fence) lines[last] = '';
    }
    const nodes = [];
    const stack = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const raw = lines[lineIndex].replace(/\t/g, '  ');
      if (!raw.trim() || /^\s*\d+ director(?:y|ies)(?:, \d+ files?)?\s*$/.test(raw)) continue;
      if (/^\s*(```|~~~)/.test(raw)) throw new Error(`第 ${lineIndex + 1} 行：请只粘贴一个目录树代码块。`);
      const branch = raw.match(/^([\s│|]*)(?:[├└]─{2,}|[+`\\]--|\|--)\s*/);
      const indent = branch ? branch[1].length + 4 : raw.match(/^ */)[0].length;
      const content = (branch ? raw.slice(branch[0].length) : raw.trimStart()).trimEnd();
      if (/^[\s│|─]*$/.test(content)) continue;
      if (/^[│├└]/.test(content)) throw new Error(`第 ${lineIndex + 1} 行：无法识别连接线，请使用 ├── 或 └──。`);
      const delimiter = content.search(/\s+#(?:\s|$)/);
      let name = (delimiter < 0 ? content : content.slice(0, delimiter)).trim();
      const comment = delimiter < 0 ? '' : content.slice(delimiter).replace(/^\s+#\s?/, '').trim();
      if (!name) throw new Error(`第 ${lineIndex + 1} 行：缺少文件或文件夹名称。`);
      if (name.length > 300 || comment.length > 1000) throw new Error(`第 ${lineIndex + 1} 行太长，请缩短名称或说明。`);
      const folder = name.endsWith('/');
      if (folder && name.length > 1) name = name.slice(0, -1);
      while (stack.length && stack.at(-1).indent >= indent) stack.pop();
      if (nodes.length && indent > nodes[0].indent && !stack.length) throw new Error(`第 ${lineIndex + 1} 行：缩进未对齐到已有层级。`);
      // A dedent must land on a known sibling indentation, not invent an in-between level.
      if (nodes.length && indent < nodes.at(-1).indent && !nodes.some(n => n.indent === indent)) {
        throw new Error(`第 ${lineIndex + 1} 行：缩进未对齐到已有层级。`);
      }
      const parent = stack.at(-1);
      const node = {id:nodes.length,name,comment,folder,indent,depth:stack.length,parent:parent?.id ?? null,children:[]};
      if (parent) { parent.folder = true; parent.children.push(node.id); }
      nodes.push(node);
      stack.push(node);
      if (nodes.length > 500) throw new Error('目录超过 500 行。请先选取一个子目录或删去不需要展示的内容。');
    }
    return nodes;
  }
  function iconName(name, folder, assets) {
    const lower = name.toLowerCase();
    if (folder) return Object.hasOwn(assets.folderNames, lower) ? assets.folderNames[lower] : '_folder';
    if (Object.hasOwn(assets.fileNames, lower)) return assets.fileNames[lower];
    // Longest suffix first: spec.ts must win over ts.
    for (let index = lower.indexOf('.'); index >= 0; index = lower.indexOf('.', index + 1)) {
      const suffix = lower.slice(index + 1);
      const match = Object.hasOwn(assets.fileExtensions, suffix) ? assets.fileExtensions[suffix] : null;
      if (match) return match;
    }
    return '_file';
  }
  function wrap(text, maxWidth, measure) {
    const result = [];
    let line = '';
    for (const char of text) {
      if (line && measure(line + char) > maxWidth) { result.push(line); line = ''; }
      line += char;
    }
    if (line) result.push(line);
    return result;
  }
  function createSVG(nodes, options, assets, measureText) {
    const theme = themes[options.theme];
    const palette = palettes[theme.palette];
    const fontSize = options.fontSize;
    const measure = (text, size = fontSize) => measureText(text, size);
    const padding = options.padding;
    const visible = nodes.filter(node => !options.depth || node.depth < options.depth);
    const maxIndent = Math.max(0, ...visible.map(node => node.depth * 23));
    const naturalWidth = Math.max(470, ...visible.map(node => 73 + node.depth * 23 + measure(node.name) + (options.comments && node.comment ? 24 + measure(node.comment, fontSize - 2) : 0) + 32));
    const cardWidth = Math.max(maxIndent + 213, options.cardWidth > 0 ? Math.max(420, options.cardWidth) : Math.min(1040, naturalWidth));
    const width = options.canvasMode === 'custom' ? options.canvasWidth : cardWidth + padding * 2;
    const titleLines = wrap(options.title || 'Project structure', cardWidth - (options.chrome || options.watermark ? 180 : 90), text => measure(text, 13));
    const headerHeight = Math.max(62, titleLines.length * 19 + 28);
    const startY = padding + headerHeight + 23;
    let currentY = startY;
    const rows = visible.map(node => {
      const nameX = 73 + node.depth * 23;
      const available = cardWidth - nameX - 32;
      const nameLines = wrap(node.name, available, measure);
      const inlineX = nameX + measure(node.name) + 24;
      const inline = nameLines.length === 1 && cardWidth - 32 - inlineX >= 120;
      const commentX = inline ? inlineX : nameX;
      const commentOffset = inline ? 0 : nameLines.length;
      const commentLines = options.comments ? wrap(node.comment, cardWidth - 32 - commentX, text => measure(text, fontSize - 2)) : [];
      const lineHeight = fontSize + 8;
      const height = Math.max(nameLines.length, commentLines.length ? commentOffset + commentLines.length : 0, 1) * lineHeight + 10;
      const row = {node, y:currentY, center:currentY + lineHeight / 2, height, nameLines, commentLines, commentX, commentOffset, lineHeight};
      currentY += height;
      return row;
    });
    const bodyBottom = currentY + (rows.length ? 20 : 92);
    const minimumHeight = bodyBottom - padding;
    const cardHeight = Math.max(minimumHeight, options.cardHeight || 0);
    const height = options.canvasMode === 'custom' ? options.canvasHeight : cardHeight + padding * 2;
    const aspect = options.backgroundAspect || 1;
    const backgroundScale = (options.backgroundZoom || 100) / 100;
    const backgroundWidth = Math.max(width, height * aspect) * backgroundScale;
    const backgroundHeight = backgroundWidth / aspect;
    const backgroundX = (width - backgroundWidth) * (options.backgroundX ?? 50) / 100;
    const backgroundY = (height - backgroundHeight) * (options.backgroundY ?? 50) / 100;
    const backgroundGeometry = `x="${backgroundX}" y="${backgroundY}" width="${backgroundWidth}" height="${backgroundHeight}" preserveAspectRatio="none"`;
    const cardScale = Math.min((options.cardZoom || 100)/100, (width-(options.anchor?.x || 16)-16)/cardWidth, (height-(options.anchor?.y || 16)-16)/cardHeight);
    const dx = (options.anchor?.x ?? (16 + (width - 32 - cardWidth * cardScale) * options.positionX / 100)) - padding * cardScale;
    const dy = (options.anchor?.y ?? (16 + (height - 32 - cardHeight * cardScale) * options.positionY / 100)) - padding * cardScale;
    const opacity = options.cardOpacity / 100;
    const x = padding;
    const y = padding;
    const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="ct-tree-title ct-tree-desc"><title id="ct-tree-title">${escapeXML(options.title || '项目目录结构')}</title><desc id="ct-tree-desc">${escapeXML(visible.map(n => '  '.repeat(n.depth) + n.name + (n.folder ? '/' : '') + (options.comments && n.comment ? ' — ' + n.comment : '')).join('\n'))}</desc><defs><filter id="ct-glass-blur" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${options.glassBlur}"/></filter><linearGradient id="ct-canvas-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#776091"/><stop offset=".48" stop-color="#333650"/><stop offset="1" stop-color="#648897"/></linearGradient><linearGradient id="ct-card-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#373449"/><stop offset="1" stop-color="#222c3e"/></linearGradient><filter id="ct-card-shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#090812" flood-opacity="${options.theme === 'paper' ? '.10' : '.25'}"/></filter><clipPath id="ct-card-clip"><rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="13"/></clipPath></defs>`];
    if (!options.transparent) {
      svg.push(`<rect width="100%" height="100%" fill="${options.theme === 'dusk' ? 'url(#ct-canvas-gradient)' : theme.background}"/>`);
      if (options.background) svg.push(`<image href="${escapeXML(options.background)}" ${backgroundGeometry}/><rect width="100%" height="100%" fill="#191625" opacity=".18"/>`);
    }
    svg.push(`<g transform="translate(${dx} ${dy}) scale(${cardScale})"><rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="13" fill="${theme.card}" fill-opacity="${opacity}" filter="url(#ct-card-shadow)"/><g clip-path="url(#ct-card-clip)">`);
    if (!options.transparent) {
      svg.push(`<g transform="translate(${-dx/cardScale} ${-dy/cardScale}) scale(${1/cardScale})"><rect width="${width}" height="${height}" fill="${options.theme === 'dusk' ? 'url(#ct-canvas-gradient)' : theme.background}"/>`);
      if (options.background) svg.push(`<image href="${escapeXML(options.background)}" ${backgroundGeometry} filter="url(#ct-glass-blur)"/>`);
      svg.push('</g>');
    }
    svg.push(`<rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" fill="${options.theme === 'dusk' ? 'url(#ct-card-gradient)' : theme.card}" fill-opacity="${opacity}"/><rect x="${x}" y="${y}" width="${cardWidth}" height="${headerHeight}" fill="${theme.header}" fill-opacity=".75"/><path d="M${x} ${y + headerHeight}H${x + cardWidth}" stroke="${theme.line}" stroke-opacity=".5"/>`);
    if (options.chrome) ['#ed8796','#eed49f','#a6da95'].forEach((color, index) => svg.push(`<circle cx="${x + 26 + index * 17}" cy="${y + 31}" r="4.5" fill="${color}" opacity=".85"/>`));
    const font = "'SFMono-Regular',Consolas,'Liberation Mono','PingFang SC','Microsoft YaHei',monospace";
    const text = (value, tx, ty, size, color, extra = '') => `<text x="${tx}" y="${ty}" font-family="${font}" font-size="${size}" fill="${color}" ${extra}>${escapeXML(value)}</text>`;
    if (options.watermark && assets.brandIcon) svg.push(`<image href="${assets.brandIcon}" x="${x + cardWidth - 55}" y="${y + 15}" width="32" height="32"><title>Foliocard</title></image>`);
    titleLines.forEach((line, index) => svg.push(text(line, x + cardWidth / 2, y + 36 + index * 19, 13, theme.text, 'text-anchor="middle"')));
    const byId = new Map(rows.map(row => [row.node.id, row]));
    // Draw one continuous guide per parent, ending at its last visible child.
    for (const row of rows) {
      const childRows = row.node.children.map(id => byId.get(id)).filter(Boolean);
      if (!childRows.length) continue;
      const guideX = x + 34 + row.node.depth * 23;
      svg.push(`<path d="M${guideX} ${row.center + 11}V${childRows.at(-1).center}" fill="none" stroke="${theme.guide}" stroke-width="1.2" stroke-opacity=".8"/>`);
    }
    for (const row of rows) {
      const { node, center, nameLines, commentLines, lineHeight } = row;
      const arrowX = x + 34 + node.depth * 23;
      if (node.parent !== null && byId.has(node.parent)) svg.push(`<path d="M${arrowX - 23} ${center}H${arrowX - 8}" stroke="${theme.guide}" stroke-width="1.2" stroke-opacity=".8"/>`);
      if (node.folder) {
        const expanded = node.children.some(id => byId.has(id));
        svg.push(`<path d="${expanded ? `M${arrowX - 3} ${center - 2}l3 3 3-3` : `M${arrowX - 1} ${center - 4}l3 4-3 4`}" fill="none" stroke="${theme.muted}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`);
      }
      const key = iconName(node.name, node.folder, assets);
      let icon = assets.icons[key] || assets.icons[node.folder ? '_folder' : '_file'];
      icon = icon.replace(/var\(--vscode-ctp-(\w+)\)/g, (_, color) => options.iconColor === 'mono' ? theme.text : options.iconColor === 'accent' ? theme.accent : palette[color]);
      icon = icon.replace(/<svg\b[^>]*>/, `<svg x="${arrowX + 11}" y="${center - 9}" width="18" height="18" viewBox="0 0 16 16">`);
      svg.push(icon);
      nameLines.forEach((line, index) => svg.push(text(line, arrowX + 39, center + fontSize * .35 + index * lineHeight, fontSize, node.folder ? theme.text : (options.theme === 'paper' ? '#626078' : '#bac0d7'), node.folder ? 'font-weight="500"' : '')));
      if (commentLines.length) {
        commentLines.forEach((line, index) => svg.push(text(line, x + row.commentX, center + (fontSize - 2) * .35 + (row.commentOffset + index) * lineHeight, fontSize - 2, theme.muted)));
      }
    }
    if (!rows.length) svg.push(text(options.locale === 'en' ? 'Paste a tree to create your first card' : '粘贴目录，开始你的第一张卡片', x + cardWidth / 2, startY + 35, 13, theme.muted, 'text-anchor="middle"'));
    const folderCount = visible.filter(node => node.folder).length;
    const fileCount = visible.length - folderCount;
    svg.push(`</g><rect x="${x + .5}" y="${y + .5}" width="${cardWidth - 1}" height="${cardHeight - 1}" rx="13" fill="none" stroke="${theme.line}" stroke-opacity=".55"/></g></svg>`);
    return { svg:svg.join(''),width,height,background:{width:backgroundWidth,height:backgroundHeight},folderCount,fileCount,total:nodes.length,visible:visible.length,card:{x:dx+padding*cardScale,y:dy+padding*cardScale,width:cardWidth,height:cardHeight,scale:cardScale,minimumHeight} };
  }
  window.TreeCore = {parseTree,iconName,createSVG,themes};
})();
