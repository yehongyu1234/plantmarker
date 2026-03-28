# PlantMarker 桌面端打包说明（Windows / macOS）

本文说明如何将项目构建为 **Windows 安装包（.exe）** 与 **macOS 安装包（.dmg / .app）**。底层使用 [electron-builder](https://www.electron.build/)。

---

## 前置条件

- **Node.js** 建议 20 LTS 或以上  
- **pnpm**（项目使用 `pnpm` 管理依赖）  
- 在项目根目录执行过：`pnpm install`

---

## 通用：先完成前端与主进程构建

打包前需要生成 `dist/`（渲染进程）和 `dist-electron/`（主进程 + `preload.cjs`）。

完整校验 + 构建（推荐在发版前使用）：

```bash
pnpm run build
```

上述命令会依次执行：`vue-tsc` → `vite build`（含复制 `electron/preload.cjs`）→ `electron-builder`（按当前系统默认目标打包）。

若只想先验证构建产物、暂不跑 electron-builder，可只执行：

```bash
pnpm exec vue-tsc --noEmit
pnpm exec vite build
```

---

## Windows：打包为 .exe（NSIS 安装程序）

在 **Windows** 环境下执行：

```bash
pnpm run build:win
```

说明：

- `package.json` 中已配置 `"win": { "target": "nsis" }`，会生成 NSIS 安装向导（`.exe`）。
- 安装包与未打包目录默认输出到项目下的 **`release/`** 目录（由 `build.directories.output` 指定）。
- 图标使用 `public/icon.png`；若安装器图标不理想，可准备 `.ico` 并在 `package.json` 的 `build.win` 中增加 `icon` 指向该文件。

**注意：** 在 Windows 上一般**无法**直接打出可用的 macOS `.dmg`（需 Apple 工具链）；macOS 包请在 Mac 上构建或使用 CI（见下文）。

---

## macOS：打包为 .dmg / .app

在 **macOS** 本机（或 macOS 虚拟机 / 云端 Mac CI）项目根目录执行：

```bash
pnpm exec vite build
pnpm exec electron-builder --mac
```

项目已提供脚本，直接执行：

```bash
pnpm run build:mac
```

说明：

- 未在 `package.json` 中写 `mac` 字段时，electron-builder 会使用默认目标（常见为 `dmg` + `zip`），产物仍在 **`release/`**。
- **图标：** App 图标建议使用 **`.icns`**。可将 `build.mac.icon` 设为 `build/icon.icns`（需自行准备并放入仓库），否则可能回退使用默认图标。
- **代码签名与公证：** 若要对用户分发、减少「无法打开」提示，需要 Apple 开发者账号，配置 `mac.identity`、`mas`/`notarize` 等；详见 [electron-builder 文档 - Code Signing](https://www.electron.build/code-signing)。个人/内网使用可先不签名，用户在「隐私与安全性」中允许即可。

---

## 输出目录一览

| 路径        | 内容 |
|-------------|------|
| `dist/`     | 渲染进程静态资源 |
| `dist-electron/` | `main.js`、`preload.cjs` 等 |
| `release/`  | electron-builder 生成的安装包、`.app` 等 |

---

## 常见问题

1. **`pnpm run build` 报错类型检查失败**  
   先执行 `pnpm run typecheck` 根据提示修复后再打包。

2. **Windows：`Cannot create symbolic link` / `客户没有所需的特权`（winCodeSign 解压失败）**  
   electron-builder 会下载 `winCodeSign` 工具包，其中带有 **符号链接**；在未开启「开发人员模式」且非管理员时，7-Zip 解压会失败。  
   **本项目已默认关闭本地 Windows 可执行文件签名**（`win.signAndEditExecutable: false`，且 `build:win` 使用 `CSC_IDENTITY_AUTO_DISCOVERY=false`），一般不再解压该包。  
   若仍报错，请依次尝试：  
   - 删除缓存目录后重打：`%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`（整个 `winCodeSign` 文件夹删掉即可）。  
   - 在 **Windows 设置 → 隐私和安全性 → 开发人员选项** 中打开 **开发人员模式**（允许创建符号链接）。  
   - 或在 **以管理员身份运行** 的终端中执行打包（不推荐作为长期方案）。  
   正式对外发布若需 Authenticode 签名，需自行配置证书与 electron-builder 签名选项，与上述「跳过签名」不同。

3. **Windows 上执行 `electron-builder --mac`**  
   通常不会得到可用的 macOS 产物；请在 macOS 或使用 GitHub Actions 等提供 `macos-latest` 的流程中构建。

4. **杀毒软件拦截 .exe**  
   未签名的安装包可能被误报；正式分发可考虑购买代码签名证书并为 Windows 配置 `signtool`（见 electron-builder 文档）。

5. **preload 与主进程路径**  
   当前使用 `dist-electron/preload.cjs`，由 Vite 在构建主进程时从 `electron/preload.cjs` 复制；勿手动删除 `electron/preload.cjs`。

---

## 版本号

发版前在 `package.json` 中修改 `"version"` 字段；安装包名称与关于界面通常会使用该版本号（视 electron-builder 与界面实现而定）。
