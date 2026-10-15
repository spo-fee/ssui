# npm 发布流程

本地选择版本并确认，GitHub Actions 安装依赖、构建、测试、打包，通过 npm OIDC 发布。普通代码推送不会触发发布。

## 首次配置

1. 在 `dev`、`dev-atnd-6.x` 分别部署发布脚本和 `.github/workflows/publish.yml`，保留各分支的源码、依赖和版本。GitHub 默认分支也必须包含该工作流。
2. 创建 GitHub Environment `npm-release`，只允许这两条分支，不设置人工审批或等待时间。设置环境变量 `NPM_PUBLISHERS` 为允许发布的 GitHub 用户名 JSON 数组，例如 `["EllaLee-spotec"]`。
3. 配置 CODEOWNERS 和分支保护规则。CODEOWNERS 管理发布文件的修改审批；`NPM_PUBLISHERS` 管理发布权限；Bypass list 管理分支规则的豁免权限。
4. 六个包分别配置 npm Trusted Publisher：`a-base-icon`、`a-icons`、`aa-utils`、`amssui`、`assui`、`ec-common`。

   | 字段 | 值 |
   |---|---|
   | Organization or user | `spo-fee` |
   | Repository | `ssui` |
   | Workflow filename | `publish.yml` |
   | Environment | `npm-release` |
   | Allowed actions | 允许 `npm publish` |

   包的 `repository.url` 应为 `git+https://github.com/spo-fee/ssui.git`。在首次发布前配置，已过期的信任关系需删除重建。
5. 本地安装 Node 20.19+、Yarn、项目依赖和 GitHub CLI，运行 `gh auth login --hostname github.com` 登录发布账号。CI 使用工作流中固定的 Node、Yarn 和 npm 版本，无需配置 npm token。

## 日常发布

```sh
git switch dev # 或 dev-atnd-6.x
git pull --ff-only
# 提交并推送需要发布的源码、配置和锁文件
yarn pub
```

`y pub` 是配置了 Yarn 别名后的等价命令。运行前工作区必须干净，本地提交必须与远端分支一致。

`yarn pub` 会自动执行前置检查，无需先运行 `yarn pub --check`。如果只想检查本地和 GitHub 前提、不修改版本或触发发布，可单独运行 `yarn pub --check`。

1. 在 Lerna 中选择各包的新版本：常规递增或 Custom Version。新版本必须是递增的正式版本。
2. 检查包名及“旧版本 → 新版本”，确认后自动创建发布提交和包 tag，推送并触发 CI。
3. 终端显示 Actions 链接及运行结果。检查通过后直接发布，无需再次人工审批。`yarn pub` 或 `--resume` 等待任务成功后，在终端逐行汇总本次发布清单，格式为 `+ 包名@新版本`；Actions 日志也会汇总本轮新上传成功的包。

两条分支独立选择版本，均发布到 `latest`；每个包最后成功发布的版本成为该包的 `latest`。

`packages/*/lib`、`packages/*/es` 不提交 Git。开发时可运行 `yarn build`，发布使用 CI 构建的产物。

## CI 执行顺序

1. **构建任务**：检出指定提交 → 冻结安装并链接依赖 → 发布脚本测试 → 构建 → 项目测试 → 打包并保存产物。任一步失败即停止，不持有 npm 发布权限。
2. **发布任务**：检查原触发者和重跑者的权限 → 下载同一次运行的构建产物 → 校验所有包的信息、入口、摘要及同版本冲突 → 按依赖顺序逐包上传，前一个上传成功后才开始下一个。不会重新构建，也不执行发布生命周期脚本。

- 使用 GitHub 官方 `actions/cache` 保存 Yarn 下载缓存，不缓存 `node_modules`、内部包链接或编译产物。
- 缓存按分支、系统、架构、固定 Node/Yarn 版本、安装配置和根目录及子包的 `yarn.lock` 区分。
- 锁文件变化时允许复用同环境的旧下载文件，再按当前锁文件下载缺失依赖；缓存命中不跳过冻结安装和子包链接。
- 缓存缺失时正常下载安装，构建任务成功后保存新缓存。清除缓存不会升级锁文件中的依赖版本。
- Actions 摘要显示是否精确命中，缓存步骤日志记录恢复结果。评估耗时时需计入缓存恢复与保存成本。

需要强制重新下载时，在仓库 Actions → Caches 中删除当前分支对应的 `yarn-download-v1-` 缓存，包括旧锁文件的回退缓存，再启动构建。

`npm publish` 返回成功即记录为 `uploaded` 并继续，不再查询或等待该版本可见。npm 可能仍在后台处理，任务成功表示上传完成，不保证新版本立即可安装。依赖关系从已校验的 tarball 读取：本批次运行时依赖（含可选依赖）上传成功后即可启动下游包；peer 依赖不作为排队条件。

仅在上传命令报错时查询一次：若同版本摘要一致，视为上传成功；否则记录 `upload-unconfirmed`，立即停止后续包的上传并汇总失败，不轮询、不自动重复上传。`skipped` 表示已存在且摘要一致，`not-uploaded` 表示尚未上传。发布任务总时限为 40 分钟。

两条分支共用发布队列。同一时间只运行一轮发布；新的排队请求可能替换旧的待运行请求，应以 Actions 状态为准。

## 失败补发

查看失败原因并处理后，在原 Actions 运行中点击 **Re-run failed jobs**，或执行：

```sh
yarn pub --retry 运行ID
```

每次手动触发只重跑一轮，再次失败即停止。

- 构建或测试失败：尚未上传，可重跑失败任务。源码、配置的修复需要新提交，旧任务重跑不会包含新代码。
- 上传失败：复用原构建产物，跳过已存在且摘要相同的版本，补发剩余包；不重新递增版本或移动已跳过包的 `latest`。
- 上传结果不明确：先检查 npm 状态（`npm view 包名@版本 version --registry=https://registry.npmjs.org/`）；404 也可能表示仍在处理，不要立即重复上传。核实后可重跑原任务，无需重新升版。
- 同名同版本内容冲突：停止，不覆盖或撤回已发布版本。
- 原构建产物保留 30 天，缺失或过期时停止，需人工处理，不能直接重新构建后按原版本补发。

## 本地中断或取消

版本确认前取消，会保留 Lerna 已修改的本地版本文件，不创建发布提交或推送。再次操作前先处理这些变更。

确认后若推送或触发中断，保持在原分支的对应发布提交上，处理未提交内容后运行：

```sh
yarn pub --resume 完整发布提交SHA
```

恢复不重新升版本。保留本地请求记录时会优先找回原运行；尚未建立运行且远端分支已前进时停止。Git tag 缺失或冲突需人工检查。已知运行 ID 时可直接使用 `--retry` 补发。

官方说明：[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。
