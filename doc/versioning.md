# 版本号与 GitHub Pages 发布机制

## 为什么按版本发布

游戏的积木结构、检查规则和 URL 编码格式会持续变化。分享链接需要指向生成它的那一版游戏，才能在后续更新后继续还原当时的局面。

每个已发布版本保存完整的应用文件，使用独立地址。首个版本为 **0.0.1**。旧的无版本分享链接不做兼容处理。

## 版本号与地址

`package.json` 中的 `version` 是发布版本号，`package-lock.json` 同步记录该值。版本号使用 `主版本.次版本.修订版本`，例如 `0.0.1`；支持 `0.0.2-beta.1` 这样的预发布版本，当前实现不接受 `+build` 后缀。

建议修复问题时增加修订版本，增加功能时增加次版本；对分享格式或交互做较大调整时，根据改动规模选择版本。即使只是修复小问题，更新线上内容也需要新版本号。

以下地址均相对于 GitHub Pages 项目根目录：

| 地址 | 用途 |
| --- | --- |
| `/` | 自动跳转到最新正式版本；没有正式版本时跳转到最新预发布版本 |
| `/v/0.0.1/` | 固定运行 0.0.1 版游戏 |
| `/v/0.0.2/` | 固定运行 0.0.2 版游戏 |
| `/versions.json` | 记录最新版本和站点包含的版本列表 |

例如项目部署在 `https://example.github.io/mltt-block-workshop/`，首版地址就是 `https://example.github.io/mltt-block-workshop/v/0.0.1/`。

分享和自动更新 URL 时保留当前的 `/v/<版本号>/` 路径。预设关卡使用关卡标识，自定义局面使用压缩后的完整数据，两者都由相应版本的游戏读取。

无版本根地址跳转时会丢弃原有的查询参数和 hash，从最新版本的初始页面开始。需要分享具体局面时，应复制游戏更新后的带版本地址，或使用分享按钮。

## CI 怎样发布

工作流位于 [pages.yml](../.github/workflows/pages.yml)。推送、Pull Request 和手动运行都会执行检查；只有 `main` 分支的非 Pull Request 运行会发布。

1. 读取版本号，安装依赖，运行 ESLint、核心测试、发布脚本测试和浏览器测试，构建应用。
2. 将通过检查的构建产物传给发布任务，使用同一个提交的 SHA 创建 `v<版本号>` 标签和 GitHub Release。
3. 先创建 Release 草稿，上传归档和校验信息，再公开该 Release。
4. 下载所有已发布版本的归档，分别放入 `/v/<版本号>/`，生成根目录跳转页和 `versions.json`。
5. 将包含全部版本的站点部署到 GitHub Pages。

每个 Release 包含两个附件：

| 附件 | 内容 |
| --- | --- |
| `mltt-workshop-0.0.1.tar.gz` | 该版本的完整应用及资源 |
| `mltt-workshop-0.0.1.json` | 版本号、提交 SHA、归档文件名和 SHA-256 校验值 |

已公开的版本不会被后续运行覆盖。相同版本再次运行 CI 时会复用已发布的归档，因此只修改代码、保持版本号不变，线上仍使用该版本原来的内容。新发布的版本号必须高于所有已发布版本。

Pages 每次部署都重新包含全部历史版本。请保留已发布的 Release 和附件；删除它们会影响历史地址，缺失或损坏的归档会让部署失败。

## 发布一个新版本

确认本次修改已经完成后，在项目根目录更新版本：

```powershell
npm version patch --no-git-tag-version
```

例如从 `0.0.1` 升到 `0.0.2`。也可以指定版本：

```powershell
npm version 0.1.0 --no-git-tag-version
```

将代码改动与两个版本文件一起提交，推送到 `main`。CI 会在检查通过后创建标签、发布归档并部署 Pages，无需手动创建标签或 Release。

首次发布前，仓库的 **Settings → Pages → Build and deployment → Source** 需要设置为 **GitHub Actions**。私有仓库需要支持 Pages 的 GitHub 套餐。

## 失败后怎样处理

| 失败位置 | 处理方式 |
| --- | --- |
| 检查或构建失败 | 修复后重新提交；尚未发布的版本号可以继续使用 |
| Release 草稿已创建，上传或公开失败 | 重新运行原来的工作流；草稿只能由原提交继续完成 |
| Release 已公开，Pages 部署失败 | 重新运行工作流，复用已发布归档并重新组装站点 |
| 已公开版本本身存在问题 | 增加版本号发布修复，保留旧版本 |

如果已有同名标签指向其他提交，发布会停止，避免把一个版本对应到两份代码。不要通过移动标签或覆盖已公开附件修复版本。

## 浏览器中的本地数据

草稿、笔记、进度和模式选择按版本保存，使用 `mltt.<版本号>.*` 的本地存储键。打开新版本时会使用独立数据，返回旧版本仍可以读取旧版保存的内容。

开发服务器使用 `mltt.dev.*`，与发布版本分开。语言偏好在各版本间共享。清除浏览器站点数据仍会删除这些本地内容；分享 URL 中的局面数据可以独立恢复。

## 本地验证与实现位置

```powershell
npm run test:release
npm run test:release:ui
```

前者检查版本比较、发布策略、草稿续传、校验值和多版本组装；后者实际构建两个版本，在浏览器中检查根地址跳转、分享链接恢复和本地数据隔离。

| 文件 | 职责 |
| --- | --- |
| [tools/release/version.mjs](../tools/release/version.mjs) | 校验、比较版本号，决定创建、续传或复用 Release |
| [tools/release/publish.mjs](../tools/release/publish.mjs) | 发布通过检查的构建产物 |
| [tools/release/archive.mjs](../tools/release/archive.mjs) | 打包、校验和解包归档 |
| [tools/release/assemble.mjs](../tools/release/assemble.mjs) | 组装全部历史版本和根目录跳转页 |
| [src/ui/version.js](../src/ui/version.js) | 提供应用版本号与本地存储键 |
| [vite.config.mjs](../vite.config.mjs) | 注入版本号，生成构建信息，使用相对资源路径 |
