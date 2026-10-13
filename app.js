(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const SAMPLE = `LoomStudio/
├── .github/                # 工作流与协作
│   └── workflows/
│       └── deploy.yml
├── apps/                   # 每个想法的入口
│   └── web/
│       ├── src/
│       │   ├── components/ # 可复用的界面
│       │   ├── hooks/
│       │   └── App.tsx
│       └── index.html
├── packages/               # 共享，让事情更简单
│   ├── ui/
│   └── utils/
├── public/                 # 图像、字体与静态资源
├── docs/                   # 写给未来的自己
├── tests/
├── package.json
├── pnpm-lock.yaml
└── README.md               # 从这里开始`;
  const settings = {theme:'mocha',title:'LoomStudio',fontSize:15,padding:48,depth:0,watermark:false,comments:true,chrome:true,transparent:false,iconColor:'original',background:null,backgroundX:50,backgroundY:50,backgroundZoom:100,canvasMode:'custom',canvasWidth:1200,canvasHeight:630,positionX:50,positionY:50,glassBlur:18,cardOpacity:65,cardWidth:0,cardHeight:0,cardZoom:100};
  const measureCanvas = document.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  let result = null;
  let renderFrame = 0;
  let importController = null;
  let backgroundRevision = 0;
  let backgroundAspect = 1;
  function notice(message, kind = 'info') {
    $('message').hidden = !message;
    $('message').textContent = I18n.t(message);
    $('message').dataset.kind = kind;
  }
  function render() {
    try {
      const nodes = TreeCore.parseTree($('source').value);
      result = TreeCore.createSVG(nodes, {...settings, locale:I18n.locale, backgroundAspect, anchor:dragState && dragState.kind !== 'move' ? {x:dragState.card.x,y:dragState.card.y} : null}, {...CATPPUCCIN,brandIcon:window.FOLIOCARD_ICON}, (text, size) => {
        measureContext.font = `${size}px 'SFMono-Regular', Consolas, 'Liberation Mono', 'PingFang SC', 'Microsoft YaHei', monospace`;
        return measureContext.measureText(text).width;
      });
      if (dragState && dragState.kind !== 'move') {
        const freeX = result.width-32-result.card.width*result.card.scale;
        const freeY = result.height-32-result.card.height*result.card.scale;
        settings.positionX = freeX > 0 ? Math.round((result.card.x-16)/freeX*100) : 50;
        settings.positionY = freeY > 0 ? Math.round((result.card.y-16)/freeY*100) : 50;
        syncComposition();
      }
      const first = $('preview').getBoundingClientRect();
      $('preview').innerHTML = result.svg;
      fitPreview(first);
      $('tree-stats').textContent = I18n.locale === 'en'
        ? `${result.folderCount} folders · ${result.fileCount} files${result.visible < result.total ? ` · ${result.total-result.visible} hidden` : ''}`
        : `${result.folderCount} 个文件夹 · ${result.fileCount} 个文件${result.visible < result.total ? ` · 隐藏 ${result.total-result.visible} 项` : ''}`;
      $('dimensions').textContent = `${Math.ceil(result.width)} × ${Math.ceil(result.height)} px`;
      $('export-png').disabled = !nodes.length;
      $('export-svg').disabled = !nodes.length;
      return true;
    } catch (error) {
      result = null;
      $('preview').replaceChildren();
      $('card-frame').hidden = true;
      $('tree-stats').textContent = I18n.t('请修正输入后继续');
      $('dimensions').textContent = '—';
      $('export-png').disabled = true;
      $('export-svg').disabled = true;
      notice(error.message, 'error');
      return false;
    }
  }
  let dragState = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let previewAnimation = null;
  function fitPreview(first) {
    if (!result) return;
    const area = $('canvas-area');
    const css = getComputedStyle(area);
    const availableWidth = Math.max(1, area.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight));
    const availableHeight = Math.max(1, area.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 42);
    const zoom = $('zoom').value;
    const scale = zoom === 'fit' ? Math.min(1, availableWidth / result.width, availableHeight / result.height) : Number(zoom);
    const preview = $('preview');
    previewAnimation?.cancel();
    preview.style.width = `${result.width * scale}px`;
    preview.style.height = `${result.height * scale}px`;
    // Keep overflowing explicit zoom levels anchored at the start, not clipped by centering.
    const wrap = preview.parentElement;
    wrap.style.margin = (result.width * scale > availableWidth || result.height * scale > availableHeight) ? '0' : 'auto';
    const last = preview.getBoundingClientRect();
    const frame = $('card-frame');
    frame.hidden = !result.total;
    frame.style.left = `${result.card.x * scale}px`;
    frame.style.top = `${result.card.y * scale}px`;
    frame.style.width = `${result.card.width * result.card.scale * scale}px`;
    frame.style.height = `${result.card.height * result.card.scale * scale}px`;
    if (!dragState && !backgroundDrag && first?.width && last.width && !reducedMotion.matches) {
      previewAnimation = preview.animate([
        {transform:`translate(${first.x-last.x}px, ${first.y-last.y}px) scale(${first.width/last.width}, ${first.height/last.height})`,opacity:.8},
        {transform:'none',opacity:1}
      ], {duration:230,easing:'cubic-bezier(.22,1,.36,1)'});
    }
  }
  new ResizeObserver(() => fitPreview()).observe($('canvas-area'));
  $('zoom').addEventListener('change', () => fitPreview($('preview').getBoundingClientRect()));
  const systemTheme = matchMedia('(prefers-color-scheme: dark)');
  function applyAppearance() {
    const choice = $('appearance').value;
    document.documentElement.dataset.appearance = choice === 'system' ? (systemTheme.matches ? 'dark' : 'light') : choice;
  }
  $('appearance').value = 'system';
  $('appearance').addEventListener('change', applyAppearance);
  systemTheme.addEventListener('change', applyAppearance);
  $('language').addEventListener('change', () => {
    I18n.setLocale($('language').value);
    notice(''); render();
  });
  applyAppearance();
  function scheduleRender() {
    cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(render);
  }
  function syncControls() {
    $('title').value = settings.title;
    $('font-size').value = settings.fontSize;
    $('font-value').value = settings.fontSize;
    $('padding').value = settings.padding;
    $('padding-value').value = settings.padding;
    $('depth').value = settings.depth;
    $('icon-color').value = settings.iconColor;
    for (const key of ['comments','chrome','transparent','watermark']) $(key).checked = settings[key];
    document.querySelectorAll('[data-theme]').forEach(button => {
      const selected = button.dataset.theme === settings.theme;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('clear-background').hidden = !settings.background;
    $('background-controls').hidden = !settings.background;
    $('edit-background').disabled = !settings.background || settings.transparent;
    $('background-mode-help').hidden = Boolean(settings.background);
    if (!settings.background || settings.transparent) setBackgroundEditing(false);
    syncComposition();
  }
  const compositionFields = {'background-x':'backgroundX','background-y':'backgroundY','background-zoom':'backgroundZoom','card-width':'cardWidth','card-height':'cardHeight','card-zoom':'cardZoom','canvas-width':'canvasWidth','canvas-height':'canvasHeight','position-x':'positionX','position-y':'positionY','glass-blur':'glassBlur','card-opacity':'cardOpacity'};
  function syncComposition() {
    $('canvas-mode').value = settings.canvasMode;
    $('canvas-dimensions').hidden = settings.canvasMode !== 'custom';
    for (const [id,key] of Object.entries(compositionFields)) {
      $(id).value = settings[key];
      const output = $(id+'-value');
      if (output) output.value = settings[key] + (id === 'glass-blur' ? '' : '%');
    }
  }
  $('canvas-mode').addEventListener('change', () => {settings.canvasMode = $('canvas-mode').value; syncComposition(); edited();});
  for (const [id,key] of Object.entries(compositionFields)) {
    $(id).addEventListener('input', () => {
      if (!$(id).validity.valid || !$(id).value) return;
      settings[key] = Number($(id).value);
      const output = $(id+'-value');
      if (output) output.value = settings[key] + (id === 'glass-blur' ? '' : '%');
      edited();
    });
    $(id).addEventListener('change', syncComposition);
  }
  let backgroundEditing = false;
  let backgroundDrag = null;
  function setBackgroundEditing(active) {
    backgroundEditing = active;
    $('edit-background').setAttribute('aria-pressed', String(active));
    $('edit-card').setAttribute('aria-pressed', String(!active));
    $('canvas-area').classList.toggle('editing-background', active);
  }
  $('edit-background').addEventListener('click', () => setBackgroundEditing(true));
  $('edit-card').addEventListener('click', () => setBackgroundEditing(false));
  $('preview').addEventListener('pointerdown', event => {
    if (!backgroundEditing || !settings.background || !result || event.button !== 0) return;
    event.preventDefault();
    previewAnimation?.cancel();
    const scale = $('preview').getBoundingClientRect().width / result.width;
    backgroundDrag = {id:event.pointerId,x:event.clientX,y:event.clientY,startX:settings.backgroundX,startY:settings.backgroundY,scale,width:result.background.width-result.width,height:result.background.height-result.height};
    $('preview').setPointerCapture(event.pointerId);
  });
  $('preview').addEventListener('pointermove', event => {
    const d = backgroundDrag;
    if (!d || d.id !== event.pointerId) return;
    if (d.width > 0) settings.backgroundX = Math.round(Math.max(0,Math.min(100,d.startX-(event.clientX-d.x)/d.scale/d.width*100)));
    if (d.height > 0) settings.backgroundY = Math.round(Math.max(0,Math.min(100,d.startY-(event.clientY-d.y)/d.scale/d.height*100)));
    syncComposition(); edited();
  });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) $('preview').addEventListener(event, () => {backgroundDrag = null;});
  function fixedCanvas() {
    if (settings.canvasMode === 'auto') {
      settings.canvasMode = 'custom';
      settings.canvasWidth = Math.min(4096,Math.max(320,Math.round(result.width)));
      settings.canvasHeight = Math.min(4096,Math.max(320,Math.round(result.height)));
      syncComposition();
    }
  }
  const frame = $('card-frame');
  frame.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !result) return;
    event.preventDefault(); fixedCanvas();
    previewAnimation?.cancel();
    const box = $('preview').getBoundingClientRect();
    dragState = {pointer:event.pointerId,kind:event.target.dataset.handle || 'move',startX:event.clientX,startY:event.clientY,viewScale:box.width/result.width,card:{...result.card},zoom:settings.cardZoom};
    frame.setPointerCapture(event.pointerId);
    frame.classList.add('dragging');
  });
  frame.addEventListener('pointermove', event => {
    if (!dragState || event.pointerId !== dragState.pointer) return;
    const d = dragState;
    const dx = (event.clientX-d.startX)/d.viewScale;
    const dy = (event.clientY-d.startY)/d.viewScale;
    const clamp = (value,min,max) => Math.min(max,Math.max(min,value));
    if (d.kind === 'move') {
      const freeX = result.width-32-d.card.width*d.card.scale;
      const freeY = result.height-32-d.card.height*d.card.scale;
      settings.positionX = freeX > 0 ? clamp((d.card.x+dx-16)/freeX*100,0,100) : 50;
      settings.positionY = freeY > 0 ? clamp((d.card.y+dy-16)/freeY*100,0,100) : 50;
    } else if (d.kind === 'width') {
      settings.cardWidth = Math.round(clamp(d.card.width+dx/d.card.scale,250,2400));
    } else if (d.kind === 'height') {
      settings.cardHeight = Math.round(clamp(d.card.height+dy/d.card.scale,d.card.minimumHeight,4000));
    } else {
      const oldDiagonal = Math.hypot(d.card.width*d.card.scale,d.card.height*d.card.scale);
      const newDiagonal = Math.hypot(Math.max(20,d.card.width*d.card.scale+dx),Math.max(20,d.card.height*d.card.scale+dy));
      settings.cardZoom = Math.round(clamp(d.card.scale*100*newDiagonal/oldDiagonal,20,150));
    }
    settings.positionX = Math.round(settings.positionX);
    settings.positionY = Math.round(settings.positionY);
    syncComposition(); scheduleRender();
  });
  function endDrag() { if (dragState) { cancelAnimationFrame(renderFrame); render(); } dragState = null; frame.classList.remove('dragging'); }
  frame.addEventListener('pointerup',endDrag);
  frame.addEventListener('pointercancel',endDrag);
  frame.addEventListener('lostpointercapture',endDrag);
  frame.addEventListener('keydown', event => {
    if (!result || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
    event.preventDefault(); fixedCanvas();
    const step = event.shiftKey ? 5 : 1;
    const handle = event.target.dataset.handle;
    const positive = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    if (handle === 'scale') settings.cardZoom = Math.max(20,Math.min(150,settings.cardZoom+(positive?step:-step)));
    else if (handle === 'width') settings.cardWidth = Math.round(Math.max(420,Math.min(2400,result.card.width+(positive?step:-step)*10)));
    else if (handle === 'height') settings.cardHeight = Math.round(Math.max(result.card.minimumHeight,Math.min(4000,result.card.height+(positive?step:-step)*10)));
    else {
      const key = ['ArrowLeft','ArrowRight'].includes(event.key) ? 'positionX':'positionY';
      settings[key] = Math.max(0,Math.min(100,settings[key]+(positive?step:-step)));
    }
    syncComposition(); edited();
  });
  function edited() { notice(''); scheduleRender(); }
  $('source').value = SAMPLE;
  $('source').addEventListener('input', () => { importController?.abort(); edited(); });
  $('source').addEventListener('keydown', event => {
    // Keep Tab available for keyboard navigation; editing indentation uses ordinary spaces.
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); exportPNG(); }
  });
  $('sample').addEventListener('click', () => {
    importController?.abort();
    $('source').value = SAMPLE;
    settings.title = 'LoomStudio';
    syncControls(); edited();
  });
  document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
    settings.theme = button.dataset.theme; syncControls(); edited();
  }));
  for (const [id,key] of [['title','title'],['font-size','fontSize'],['padding','padding'],['depth','depth'],['icon-color','iconColor']]) {
    $(id).addEventListener('input', () => {
      settings[key] = ['fontSize','padding','depth'].includes(key) ? Number($(id).value) : $(id).value;
      $('font-value').value = settings.fontSize; $('padding-value').value = settings.padding;
      edited();
    });
  }
  for (const key of ['comments','chrome','transparent','watermark']) $(key).addEventListener('change', () => {settings[key] = $(key).checked; syncControls(); edited();});
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function fileStem() { return (settings.title.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '-') || 'project-structure').slice(0, 80); }
  $('export-svg').addEventListener('click', () => {
    if (!render() || !result.total) return;
    download(new Blob([result.svg], {type:'image/svg+xml;charset=utf-8'}), fileStem() + '.svg');
    notice('SVG 已导出，图标和背景已内嵌。文字字体由查看设备提供。');
  });
  async function loadImage(src) {
    const image = new Image();
    image.src = src;
    await image.decode();
    return image;
  }
  async function exportPNG() {
    if ($('export-png').disabled || !render() || !result.total) return;
    const snapshot = result;
    const filename = fileStem();
    const scale = 2;
    const width = Math.ceil(snapshot.width * scale);
    const height = Math.ceil(snapshot.height * scale);
    if (width * height > 32000000 || width > 16000 || height > 16000) {
      notice('这张图太大，无法可靠导出 PNG。请减少展示层级或内容，也可以导出 SVG。', 'error'); return;
    }
    $('export-png').disabled = true;
    try {
      await document.fonts.ready;
      const image = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(snapshot.svg));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('浏览器未能生成图片，请减少展示内容后重试。');
      download(blob, filename + '.png');
      notice(`PNG 已导出 · ${width} × ${height} px`);
    } catch (error) { notice(`导出失败：${error.message}`, 'error'); }
    finally { $('export-png').disabled = !result?.total; }
  }
  $('export-png').addEventListener('click', exportPNG);
  $('background-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    const revision = ++backgroundRevision;
    try {
      if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('请选择 PNG、JPEG 或 WebP 图片。');
      if (file.size > 12 * 1024 * 1024) throw new Error('请选择小于 12 MB 的背景图片。');
      const data = await new Promise((resolve,reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('无法读取图片。')); reader.readAsDataURL(file);
      });
      const image = await loadImage(data);
      const ratio = Math.min(1, 2200 / Math.max(image.width,image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio);
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      if (revision !== backgroundRevision) return;
      settings.background = canvas.toDataURL('image/png');
      backgroundAspect = canvas.width / canvas.height;
      settings.backgroundX = settings.backgroundY = 50; settings.backgroundZoom = 100;
      settings.transparent = false;
      syncControls(); edited();
    } catch (error) { notice(error.message,'error'); }
    finally { event.target.value = ''; }
  });
  $('clear-background').addEventListener('click', event => {event.preventDefault(); backgroundRevision++; settings.background = null; syncControls(); edited();});
  $('save-source').addEventListener('click', () => {
    download(new Blob([JSON.stringify({version:1,source:$('source').value,settings},null,2)],{type:'application/json'}), fileStem() + '.foliocard.json');
    notice('作品已保存。使用“打开作品”可以继续编辑，背景图片也会保留。');
  });
  $('load-source').addEventListener('click', () => $('project-file').click());
  function validateProject(project) {
    if (!project || project.version !== 1 || typeof project.source !== 'string' || project.source.length > 600000) throw new Error('这不是受支持的 Foliocard 作品文件。');
    TreeCore.parseTree(project.source);
    const s = project.settings;
    if (!s || !Object.hasOwn(TreeCore.themes,s.theme) || typeof s.title !== 'string' || s.title.length > 80 || !['original','mono','accent'].includes(s.iconColor)) throw new Error('作品中的样式数据无效。');
    if (!Number.isInteger(s.fontSize) || s.fontSize < 12 || s.fontSize > 20 || !Number.isInteger(s.padding) || s.padding < 16 || s.padding > 80 || s.padding % 8 !== 0 || ![0,1,2,3,4].includes(s.depth)) throw new Error('作品中的尺寸设置无效。');
    if (['comments','chrome','transparent'].some(key => typeof s[key] !== 'boolean')) throw new Error('作品中的显示设置无效。');
    if (s.background !== null && (typeof s.background !== 'string' || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s.background))) throw new Error('作品中的背景图片格式无效。');
    const compositionDefaults = {canvasMode:'auto',canvasWidth:1200,canvasHeight:1000,positionX:50,positionY:50,glassBlur:18,cardOpacity:65,cardWidth:0,cardHeight:0,cardZoom:100};
    const normalized = {backgroundX:50,backgroundY:50,backgroundZoom:100,watermark:false,...compositionDefaults,...s};
    if (typeof normalized.watermark !== 'boolean') throw new Error('作品中的显示设置无效。');
    if (!['auto','custom'].includes(normalized.canvasMode)) throw new Error('作品中的尺寸设置无效。');
    for (const [key,min,max] of [['backgroundX',0,100],['backgroundY',0,100],['backgroundZoom',100,300],['canvasWidth',320,4096],['canvasHeight',320,4096],['positionX',0,100],['positionY',0,100],['glassBlur',0,40],['cardOpacity',10,100],['cardWidth',0,2400],['cardHeight',0,4000],['cardZoom',20,150]]) {
      if (!Number.isInteger(normalized[key]) || normalized[key] < min || normalized[key] > max) throw new Error('作品中的尺寸设置无效。');
    }
    return Object.fromEntries(Object.keys(settings).map(key => [key,normalized[key]]));
  }
  $('project-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('作品文件超过 30 MB，请使用较小的背景图片。');
      const project = JSON.parse(await file.text());
      const validated = validateProject(project);
      const backgroundImage = validated.background ? await loadImage(validated.background) : null;
      backgroundAspect = backgroundImage ? backgroundImage.width / backgroundImage.height : 1;
      importController?.abort(); backgroundRevision++;
      Object.assign(settings,validated); $('source').value = project.source;
      syncControls(); edited();
    } catch (error) { notice(`打开失败：${error.message}`,'error'); }
    finally {event.target.value = '';}
  });
  $('github-form').addEventListener('submit', async event => {
    event.preventDefault();
    importController?.abort();
    const controller = new AbortController(); importController = controller;
    const oldSource = $('source').value;
    const oldTitle = settings.title;
    $('import-repo').disabled = true;
    notice('正在读取 GitHub 公开仓库的默认分支…');
    try {
      const url = new URL($('repo-url').value.trim());
      const parts = url.pathname.replace(/\/$/,'').split('/').filter(Boolean);
      if (url.hostname !== 'github.com' || url.protocol !== 'https:' || parts.length !== 2 || !parts.every(part => /^[\w.-]+$/.test(part))) throw new Error('请输入 https://github.com/owner/repo 格式的仓库地址。');
      const [owner, rawRepo] = parts;
      const repo = rawRepo.replace(/\.git$/,'');
      const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      async function getJSON(path) {
        const response = await fetch(path,{signal:controller.signal,headers:{Accept:'application/vnd.github+json'}});
        if (!response.ok) {
          if (response.status === 403 || response.status === 429) throw new Error('GitHub 请求受限，请稍后再试，或直接粘贴目录文本。');
          if (response.status === 404) throw new Error('找不到公开仓库，请检查地址。暂不支持私有仓库。');
          throw new Error(`GitHub 返回 ${response.status}，请稍后重试。`);
        }
        return response.json();
      }
      const metadata = await getJSON(api);
      const tree = await getJSON(`${api}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`);
      if (tree.truncated) throw new Error('仓库目录超出 GitHub 单次返回限制。为避免导入不完整结构，请改为粘贴所需子目录。');
      const entries = tree.tree;
      const excluded = new Set(['node_modules','.git','.next','dist','build','coverage','.venv','vendor']);
      const selected = entries.filter(entry => !entry.path.split('/').some(part => excluded.has(part)));
      const prefix = repo + '/';
      const lines = [prefix];
      const ordered = selected.sort((a,b) => {
        const ap = a.path.split('/'), bp = b.path.split('/');
        for (let i=0; i<Math.min(ap.length,bp.length); i++) {
          if (ap[i] === bp[i]) continue;
          const aFolder = i < ap.length-1 || a.type === 'tree';
          const bFolder = i < bp.length-1 || b.type === 'tree';
          if (aFolder !== bFolder) return aFolder ? -1 : 1;
          return ap[i].localeCompare(bp[i], 'en');
        }
        return ap.length-bp.length;
      });
      if (ordered.length > 499) throw new Error('筛选后仍超过 500 项，请直接粘贴需要展示的子目录。');
      for (const entry of ordered) {
        const path = entry.path.split('/');
        const name = path.at(-1);
        if (/[\n\r\t]/.test(name) || /^\s|\s$/.test(name) || /\s+#(?:\s|$)/.test(name) || /^[│├└]/.test(name) || /^[+`\\|]--/.test(name)) throw new Error('仓库包含当前文本格式无法无损表示的名称，请手动整理需要展示的目录。');
        lines.push('  '.repeat(path.length) + name + (entry.type === 'tree' ? '/' : ''));
      }
      const text = lines.join('\n');
      TreeCore.parseTree(text);
      if (controller.signal.aborted || $('source').value !== oldSource) return;
      $('source').value = text;
      if (settings.title === oldTitle) settings.title = repo;
      syncControls(); render();
      notice(`已导入 ${repo} · ${metadata.default_branch}。已排除依赖、构建产物等 ${entries.length-selected.length} 项；可用“显示层级”精简卡片。`);
    } catch (error) { if (error.name !== 'AbortError') notice(error.message,'error'); }
    finally { if (importController === controller) {$('import-repo').disabled = false; importController = null;} }
  });
  I18n.setLocale('zh-CN');
  syncControls(); render();
})();
