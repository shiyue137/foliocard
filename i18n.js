(function () {
  'use strict';
  const dictionary = {
    '画布拖动对象':'Canvas drag target','移动卡片':'Move card','移动背景':'Move background','上传背景图片后，可切换移动对象。':'Upload a background image to switch the drag target.',
    '拖动背景':'Move background','背景水平位置':'Background horizontal position','背景垂直位置':'Background vertical position','背景缩放':'Background scale','开启后在画布上拖动背景；先放大可获得更多移动空间。':'Enable to drag the background on the canvas. Zoom in for more room to move.',
    '品牌水印':'Brand watermark','在窗口右上角显示 Foliocard 图标':'Show the Foliocard icon in the header',
    '卡片宽度':'Card width','卡片高度':'Card height','卡片缩放':'Card scale','拖动卡片':'Move card','缩放卡片':'Scale card','调整卡片宽度':'Resize card width','调整卡片高度':'Resize card height','尺寸填 0 自动适应内容；拖动卡片移动，拖角缩放，拖边调整宽高。':'Use 0 for automatic sizing. Drag to move, drag the corner to scale, or drag an edge to resize.',
    '页面外观':'Appearance','亮色':'Light','暗色':'Dark','跟随系统':'System','界面语言':'Language',
    '本地渲染 · 无需上传':'Rendered locally · No uploads','让结构，':'A little structure,','一目了然':'a lot of clarity','。':'.',
    '粘贴目录树，做一张恰到好处的卡片。':'Paste a file tree. Make it worth sharing.',
    '目录内容':'Content','载入示例 ↺':'Load example ↺','目录树文本':'Directory tree','树形文本 / 缩进文本':'Tree / indented text','添加注释':'Add a comment',
    '从 GitHub 导入':'Import from GitHub','公开仓库 ↗':'Public repository ↗','仓库地址':'Repository URL','导入':'Import',
    '读取默认分支，最多显示 500 个条目。导入会访问 GitHub API。':'Read the default branch, up to 500 entries. Import uses the GitHub API.',
    '卡片风格':'Card style','挑一种气质':'Make it yours','柔和暗色':'Soft dark','轻盈文档':'Clean paper','暮色渐变':'Evening glow',
    '窗口标题':'Window title','字号':'Type size','留白':'Padding','显示层级':'Tree depth','全部展开':'All levels','根目录':'Root only','2 层':'2 levels','3 层':'3 levels','4 层':'4 levels',
    '图标颜色':'Icon color','Catppuccin 原色':'Catppuccin colors','统一单色':'Monochrome','主题强调色':'Accent',
    '显示说明':'Comments','保留每个目录的用途':'Show what each folder is for','窗口装饰':'Window controls','顶部的三个小圆点':'Three dots at the top',
    '透明背景':'Transparent canvas','只保留卡片本身':'Keep only the card','自定义背景':'Background image','移除':'Remove','＋ 选择一张图片':'+ Choose an image',
    '一个小工具，让文档多一点用心。':'A little care for your documentation.','画布预览':'Preview','每一处调整，即时呈现':'Every change, live',
    '保存作品':'Save project','打开作品':'Open project','保存文本和样式，下次继续编辑':'Save text and styles to edit later','预览缩放':'Preview zoom','适应画布':'Fit canvas',
    '准备好，放进你的 README。':'Ready for your README.','图标已内嵌，导出后不依赖外部资源。':'Embedded icons. No external resources.','导出 PNG':'Export PNG',
    '内容与样式编辑器':'Content and style editor','卡片预览':'Card preview','主题':'Themes','Foliocard 首页':'Foliocard home',
    '画布与构图':'Canvas & composition','画布大小':'Canvas size','自动适应内容':'Fit content','自定义尺寸':'Custom size','宽度':'Width','高度':'Height',
    '水平位置':'Horizontal position','垂直位置':'Vertical position','毛玻璃模糊':'Glass blur','卡片不透明度':'Card opacity',
    '请修正输入后继续':'Fix the input to continue',
    'SVG 已导出，图标和背景已内嵌。文字字体由查看设备提供。':'SVG exported with embedded icons and background. Fonts depend on the viewing device.',
    '这张图太大，无法可靠导出 PNG。请减少展示层级或内容，也可以导出 SVG。':'The canvas is too large for PNG. Reduce the content or export SVG.',
    '浏览器未能生成图片，请减少展示内容后重试。':'The browser could not generate an image. Reduce the content and try again.',
    '请选择 PNG、JPEG 或 WebP 图片。':'Choose a PNG, JPEG or WebP image.','请选择小于 12 MB 的背景图片。':'Choose a background smaller than 12 MB.','无法读取图片。':'Could not read the image.',
    '作品已保存。使用“打开作品”可以继续编辑，背景图片也会保留。':'Project saved. Use Open project to continue editing, including your background.',
    '这不是受支持的 Foliocard 作品文件。':'This is not a supported Foliocard project.',
    '作品中的样式数据无效。':'Invalid project style data.','作品中的尺寸设置无效。':'Invalid project dimensions.','作品中的显示设置无效。':'Invalid project display settings.',
    '作品中的背景图片格式无效。':'Invalid background image format.','作品文件超过 30 MB，请使用较小的背景图片。':'The project exceeds 30 MB. Use a smaller background.',
    '正在读取 GitHub 公开仓库的默认分支…':'Reading the public repository’s default branch…',
    '请输入 https://github.com/owner/repo 格式的仓库地址。':'Enter a repository URL: https://github.com/owner/repo.',
    'GitHub 请求受限，请稍后再试，或直接粘贴目录文本。':'GitHub rate limit reached. Try later or paste a tree.',
    '找不到公开仓库，请检查地址。暂不支持私有仓库。':'Public repository not found. Check the URL. Private repositories are not supported.',
    '仓库目录超出 GitHub 单次返回限制。为避免导入不完整结构，请改为粘贴所需子目录。':'GitHub truncated the tree. Paste the subtree you need instead.',
    '筛选后仍超过 500 项，请直接粘贴需要展示的子目录。':'More than 500 entries remain. Paste the subtree you want to show.',
    '仓库包含当前文本格式无法无损表示的名称，请手动整理需要展示的目录。':'Some names cannot be represented by this text format. Paste a curated tree instead.',
    '目录超过 500 行。请先选取一个子目录或删去不需要展示的内容。':'More than 500 entries. Choose a subtree or remove unnecessary content.',
    '请只粘贴一个目录树代码块。':'Paste only one tree code block.','无法识别连接线，请使用 ├── 或 └──。':'Unrecognized connector. Use ├── or └──.',
    '缺少文件或文件夹名称。':'Missing file or folder name.','缩进未对齐到已有层级。':'Indentation does not align with an existing level.'
  };
  const patterns = [
    [/^第 (\d+) 行：(.*)$/, (n, detail) => `Line ${n}: ${translate(detail)}`],
    [/^第 (\d+) 行太长，请缩短名称或说明。$/, n => `Line ${n} is too long. Shorten the name or comment.`],
    [/^PNG 已导出 · (.*)$/, size => `PNG exported · ${size}`],
    [/^导出失败：(.*)$/, detail => `Export failed: ${translate(detail)}`],
    [/^打开失败：(.*)$/, detail => `Could not open: ${translate(detail)}`],
    [/^GitHub 返回 (\d+)，请稍后重试。$/, code => `GitHub returned ${code}. Try again later.`],
    [/^已导入 (.*?) · (.*?)。已排除依赖、构建产物等 (\d+) 项；可用“显示层级”精简卡片。$/, (repo,branch,count) => `Imported ${repo} · ${branch}. Excluded ${count} dependency/build entries. Use Tree depth to simplify.`]
  ];
  let locale = 'zh-CN';
  const originals = new WeakMap();
  function translate(text) {
    if (locale !== 'en') return text;
    if (Object.hasOwn(dictionary,text)) return dictionary[text];
    for (const [pattern,format] of patterns) { const match = text.match(pattern); if (match) return format(...match.slice(1)); }
    return text;
  }
  function setLocale(next) {
    locale = next;
    document.documentElement.lang = next;
    document.title = next === 'en' ? 'Foliocard — A little structure. A lot of clarity.' : 'Foliocard — 给项目结构一个好看的位置';
    // Translate authored UI nodes only; user content and generated SVG are left intact.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('#preview, #source, #message, #tree-stats, output, script, style')) continue;
      if (!originals.has(node)) originals.set(node,node.textContent);
      const original = originals.get(node);
      node.textContent = original.replace(/\S(?:[\s\S]*\S)?/, value => translate(value));
    }
    document.querySelectorAll('[aria-label], [title]').forEach(element => {
      if (element.closest('#preview')) return;
      for (const attr of ['aria-label','title']) {
        if (!element.hasAttribute(attr)) continue;
        const key = `i18n-${attr}`;
        if (!element.hasAttribute(`data-${key}`)) element.setAttribute(`data-${key}`,element.getAttribute(attr));
        element.setAttribute(attr,translate(element.getAttribute(`data-${key}`)));
      }
    });
    document.getElementById('source').placeholder = next === 'en' ? 'my-project/\n├── src/  # Source code\n└── README.md' : 'my-project/\n├── src/  # 源代码\n└── README.md';
  }
  window.I18n = {t:translate,setLocale,get locale(){return locale;}};
})();
