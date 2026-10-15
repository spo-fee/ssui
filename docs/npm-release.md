# npm 发布流程

本流程用于从 `dev` 和 `dev-atnd-6.x` 发布 npm 包。本地脚本负责版本准备、提交和触发工作流；GitHub Actions 负责安装依赖、构建、测试、打包，并通过 npm Trusted Publishing（OIDC）上传。普通代码推送不触发发布。

## 仓库配置

1. 在两个发布分支部署发布脚本和 `.github/workflows/publish.yml`，保留各分支的源码、依赖和版本。GitHub 默认分支也必须包含该工作流。
2. 创建 GitHub Environment `npm-release`，仅允许两个发布分支，不设置人工审批或等待时间。环境变量 `NPM_PUBLISHERS` 为允许发布的 GitHub 用户名 JSON 数组。
3. 配置 CODEOWNERS 和分支保护规则。CODEOWNERS 管理发布文件的修改审批；`NPM_PUBLISHERS` 管理发布权限；Bypass list 管理分支规则的豁免权限。
4. 六个包分别配置 npm Trusted Publisher：`a-base-icon`、`a-icons`、`aa-utils`、`amssui`、`assui`、`ec-common`。

   | 字段 | 值 |
   |---|---|
   | Organization or user | `spo-fee` |
   | Repository | `ssui` |
   | Workflow filename | `publish.yml` |
   | Environment | `npm-release` |
   | Allowed actions | 允许 `npm publish` |

   包的 `repository.url` 应为 `git+https://github.com/spo-fee/ssui.git`。首次发布前完成配置；信任关系过期时需删除重建。

## 本地条件

- 已安装 Node 20.19+、Yarn Classic、项目依赖和 GitHub CLI。已有可用依赖时，无需为每次发布重新安装。
- 执行 `gh auth login --hostname github.com` 登录发布账号，通过 `gh auth status` 检查登录状态。本地无需配置 npm token。
- Git 提交身份已配置，账号具有推送发布提交和 tag 所需的权限。
- `origin` 指向 `spo-fee/ssui`，获取和推送地址均需检查：

  ```sh
  git remote -v
  ```

  旧仓库地址需按现有连接方式更新，选择其中一条：

  ```sh
  git remote set-url origin https://github.com/spo-fee/ssui.git
  # 或使用 SSH
  git remote set-url origin git@github.com:spo-fee/ssui.git
  ```

  若另行配置的推送地址仍指向旧仓库，执行 `git config --unset-all remote.origin.pushurl`，使推送使用新的 `origin` 地址。

## 日常发布

将待发布的源码、配置和锁文件合并到目标分支后执行：

```sh
git switch dev
git pull --ff-only origin dev
git status --short
```

发布 `dev-atnd-6.x` 时替换上述分支名。工作区必须干净，本地提交必须与远端分支一致。确认后启动发布：

```sh
yarn pub
```

配置了 Yarn 别名时，`y pub` 与 `yarn pub` 等价。

`yarn pub` 自动检查发布前提。`yarn pub --check` 为可选的独立检查命令，不修改版本、不触发发布，也不验证 CI 构建结果或 npm 信任关系。

1. 在 Lerna 中选择各包的新版本：常规递增或 Custom Version。新版本必须是递增的正式版本。
2. 检查包名及“旧版本 → 新版本”，确认后自动创建发布提交和包 tag，推送并触发 CI。
3. 终端显示 Actions 链接及运行结果。任务成功后，`yarn pub` 和 `--resume` 按 `+ 包名@新版本` 汇总发布清单；Actions 日志汇总本轮新上传成功的包。

两个分支独立选择版本，均发布到 `latest`；每个包最后成功发布的版本成为该包的 `latest`，发布者需协调发布顺序。

发布使用 CI 构建产物，不要求提前执行本地构建。`packages/*/lib`、`packages/*/es` 不提交 Git。

## CI 执行顺序

1. **构建任务**：检出指定提交 → 冻结安装并链接依赖 → 发布脚本测试 → 构建 → 项目测试 → 打包并保存产物。任一步失败即停止，不持有 npm 发布权限。
2. **发布任务**：检查原触发者和重跑者的权限 → 下载同一次运行的构建产物 → 校验所有包的信息、入口、摘要及同版本冲突 → 按依赖顺序逐包上传，前一个上传成功后才开始下一个。不会重新构建，也不执行发布生命周期脚本。

构建任务使用工作流中固定的 Node、Yarn 和 npm 版本。每次执行全量依赖安装、六个包的构建和项目测试；打包、上传范围由本次发布清单决定。

两个分支共用发布队列，同一时间仅运行一轮发布。新排队请求可能替换旧的待运行请求，以 Actions 状态为准。发布任务超时限制为 40 分钟。

### 依赖缓存

- 使用 GitHub 官方 `actions/cache` 保存 Yarn 下载缓存，不缓存 `node_modules`、内部包链接或编译产物。
- 缓存按分支、系统、架构、固定 Node/Yarn 版本、安装配置和根目录及子包的 `yarn.lock` 区分。
- 锁文件变化时允许复用同环境的旧下载文件，再按当前锁文件下载缺失依赖；缓存命中不跳过冻结安装和子包链接。
- 缓存缺失时正常下载安装，构建任务成功后保存新缓存。清除缓存不会升级锁文件中的依赖版本。
- Actions 摘要显示是否精确命中，缓存步骤日志记录恢复结果。评估耗时时需计入缓存恢复与保存成本。

需要强制重新下载时，在仓库 Actions → Caches 中删除当前分支对应的 `yarn-download-v1-` 缓存，包括旧锁文件的回退缓存，再启动构建。

### 上传结果

`npm publish` 返回成功即记录为 `uploaded` 并继续，不查询或等待版本可见。任务成功表示上传完成；npm 后台处理结束前，新版本可能暂时无法查询或安装。

依赖关系从已校验的 tarball 读取。本批次运行时依赖（含可选依赖）上传成功后，才上传下游包；peer 依赖不作为排队条件。

上传命令报错时查询一次 registry：同版本摘要一致则视为上传成功，否则记录 `upload-unconfirmed` 并停止后续上传，不轮询、不自动重试。

| 状态 | 含义 |
|---|---|
| `uploaded` | 上传命令成功，或报错后确认 registry 中存在相同内容 |
| `skipped` | 上传前已存在同版本且摘要一致，跳过上传 |
| `upload-unconfirmed` | 上传命令报错，且未确认 registry 中存在相同内容 |
| `not-uploaded` | 尚未上传 |

## 失败补发

查看失败原因并处理后，在原 Actions 运行中点击 **Re-run failed jobs**，或执行：

```sh
yarn pub --retry 运行ID
```

运行 ID 可从终端输出或 Actions 链接的 `/actions/runs/<运行ID>` 获取。同一轮发布中的包共用一个运行 ID，每次重试只重跑一轮。查看结果：

```sh
gh run watch 运行ID --repo spo-fee/ssui --exit-status
```

- 构建或测试失败：尚未上传，可重跑失败任务。源码、配置的修复需要新提交，旧任务重跑不会包含新代码。
- 上传失败：复用原构建产物，跳过已存在且摘要相同的版本，补发剩余包；不重新递增版本或移动已跳过包的 `latest`。
- 上传结果不明确：先检查 npm 状态（`npm view 包名@版本 version --registry=https://registry.npmjs.org/`）；404 也可能表示仍在处理，不要立即重复上传。核实后可重跑原任务，无需重新升版。
- 同名同版本内容冲突：停止，不覆盖或撤回已发布版本。
- 原构建产物保留 30 天，缺失或过期时停止，需人工处理，不能直接重新构建后按原版本补发。

重试依据 registry 查询结果判断是否跳过，不保存跨重跑的上传成功记录。已上传但尚不可查询的版本可能被再次尝试上传。本地前置检查失败且未创建 Actions 运行时，修正问题后执行 `yarn pub`，不使用 `--retry`。

## 本地中断或取消

版本确认前取消，会保留 Lerna 已修改的本地版本文件，不创建发布提交或推送。再次操作前先处理这些变更。

确认后若推送或触发中断，保持在原分支的对应发布提交上，处理未提交内容后运行：

```sh
yarn pub --resume 完整发布提交SHA
```

恢复不重新升版本。保留本地请求记录时会优先找回原运行；尚未建立运行且远端分支已前进时停止。Git tag 缺失或冲突需人工检查。已知运行 ID 时可直接使用 `--retry` 补发。

官方说明：[npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。
