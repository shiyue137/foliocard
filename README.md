# Foliocard

把项目目录变成可放入 README 的卡片。原生 HTML、CSS、JavaScript，无框架、无安装、无构建步骤。

## 打开

直接双击 `index.html` 即可使用本地编辑、背景图片、作品文件和导出功能。也可以在此目录执行：

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

然后打开 http://127.0.0.1:8765/ 。将本目录作为静态站点目录即可部署；没有服务端或凭据。

## 已有功能

- 树形文本（`├──` / `└──`，也支持常见 ASCII 连接线）和缩进文本，可带一层 Markdown 代码围栏。
- 656 个 Catppuccin 原始 SVG，复用上游的文件名、复合扩展名、文件夹名称关联。
- Mocha、Paper、Dusk 三套卡片主题，原色 / 单色 / 强调色图标。
- 独立页面亮色 / 暗色 / 跟随系统，中英界面切换（不翻译用户输入）。
- 文档锁定视口，编辑区独立滚动，透明轨道滚动条；预览默认适应画布且不放大超过原尺寸，也可选择 50% / 75% / 100%。
- 预览尺寸变化使用 FLIP 过渡；遵循系统减少动态效果偏好。
- 自动或自定义画布宽高（320–4096px）、卡片水平与垂直位置、背景模糊强度及卡片不透明度。自定义小画布会等比缩小卡片，保证完整显示。
- 窗口标题、字号、留白、显示层级、说明、窗口圆点和透明背景。
- 自定义 PNG / JPEG / WebP 背景，本地处理，最长边缩至 2200px。
- PNG 2×、独立 SVG；同一份 SVG 同时用于预览和 PNG 栅格化。
- 保存 / 打开 `.foliocard.json`（也可打开旧 `.codetree.json`） 作品，包含原文、样式和背景；不自动写入浏览器存储。画布、位置、卡片尺寸和玻璃参数均随作品保存，旧作品会使用新增设置的默认值。
- 公开 GitHub 仓库默认分支导入，不读取文件正文。只在点击导入时访问 GitHub API。

## 输入约定

```text
my-project/
├── public/          # 公共资源
├── src/
│   └── main.js      # 程序入口
├── Dockerfile
└── README.md
```

也可以使用一致的空格缩进，Tab 按两个空格处理。目录尾部写 `/`；有子节点的条目会自动识别为目录。无扩展名的叶节点按文件处理，因此空目录必须加 `/`。

`空白 + # + 空白` 分隔文件名和说明；`a#b.ts` 中的 `#` 不会被拆开。当前格式不支持名称本身包含该注释分隔符、换行或前后空白。不是通用 Markdown 列表解析器，也不支持 `tree -L` 等命令本身、文件大小列或 Windows 驱动器标题。

最多 500 个条目。显示层级从根节点算起。长名称和说明会换行，卡片按内容调整尺寸。PNG 导出限定 3200 万像素且单边不超过 16000px；超出时减少内容或使用 SVG。

## GitHub 导入

输入 `https://github.com/owner/repo`，读取默认分支。无需 Token，不支持私有仓库或分支 / 子目录 URL。排除 `node_modules`、`.git`、`.next`、`dist`、`build`、`coverage`、`.venv`、`vendor` 及其后代；不是完整 `.gitignore` 解释器。

GitHub 返回截断结果、限流或筛选后超过 500 项时明确提示，不静默截取。特殊名称无法无损表示时也拒绝导入。编辑输入或载入示例 / 作品会取消正在进行的导入。

## 文件结构

```text
foliocard/
├── index.html                 页面和控件
├── style.css                  页面布局与样式
├── tree.js                    目录解析、图标匹配、SVG 渲染
├── i18n.js                    中英界面文案
├── app.js                     事件、导出、作品文件和 GitHub 导入
├── assets/catppuccin/
│   ├── icons/                 656 个上游 SVG 原件
│   ├── icons.js               离线使用的图标及关联数据
│   ├── LICENSE                上游 MIT 许可
│   └── SOURCE.md              来源与精确版本
└── tools/import-icons.mjs     从上游本地 checkout 更新资源
```

运行网站不需要 Node。只有更新上游资源时需要 Node 22.18+，详见 `assets/catppuccin/SOURCE.md`。

## 当前边界

Dusk 使用渐变背景。自定义背景支持卡片区域的高斯模糊与透明叠色，不模拟液态玻璃折射。字体使用系统等宽字体与中文回退；SVG 没有嵌入字体，在不同设备查看时字体可能不同，PNG 保留导出时的效果。当前不提供逐节点拖动 / 隐藏、自动同步仓库或账号系统。卡片整体可以拖动；右下角拖柄缩放，右侧与底部拖柄调整宽高，也可用方向键操作（Shift 加速）。直接操作会将自动画布固定为当前尺寸。卡片宽度按内容保留最小宽度，卡片高度不会小于完整内容高度；0 表示自动尺寸。

所有图标来自 [Catppuccin vscode-icons](https://github.com/catppuccin/vscode-icons)，其版权及许可保存在 `assets/catppuccin/LICENSE`。图标已嵌入导出内容，分发项目时请一并保留第三方许可。

## 品牌与发布

仓库：[shiyue137/foliocard](https://github.com/shiyue137/foliocard)。纯静态站点，资源使用相对路径，可部署到 GitHub Pages 仓库子路径；已添加 `.nojekyll`。GitHub Pages 使用 `main` 分支根目录发布，推送后自动更新。

在线使用：https://shiyue137.github.io/foliocard/

部署设置：仓库 **Settings → Pages → Build and deployment**，Source 选择 **Deploy from a branch**，Branch 选择 **main**，目录选择 **/ (root)**。本站无构建步骤，无需额外 Actions 工作流。

注释紧跟文件名，空间不足才换行；卡片不再含底部统计栏。品牌水印默认关闭，可在窗口 Header 右侧显示，PNG / SVG 均内嵌图标，作品保存包含开关。

图标通过内置 imagegen 生成，资源在 `assets/brand/`。当前生成图的透明边缘仍有少量杂点，大尺寸使用前需要进一步修订。

默认新画布为 1200 × 630；旧作品保持其原有画布设置。上传背景后可使用「画布与构图」顶部的“移动背景”模式或位置滑块调整裁切，背景缩放范围为铺满画布的 100% 至 300%。背景位置和缩放随作品保存，并同步应用于导出的毛玻璃背景。网站和水印采用第二版图标。
