# Kiki Recipes

五套 Kiki 模型配方。每套配方是一个自包含目录：一份 `recipe.toml` 加上它引用的 Markdown 提示词，可以直接导入，也可以作为一个市场订阅。

每套配方都有四种取用方式：跟随 `main` 的直连地址、按版本号冻结的地址、按 Git tag 冻结的地址，以及带 SHA-256 校验和的 ZIP。发过版的地址不会因为后续改动而变，需要更新时升 `version` 再发一版。

在线规格页（含镜像/通道切换与配方源码工作台）：<https://x-t-e-r.github.io/kiki-recipes/>。仓库以 MIT License 发布。

## 一键订阅（配方市场）

Kiki 里打开 `设置 → 模型 → 选择配方 → 市场`，粘贴下面任一地址：

| 订阅地址 | 拿到什么 | 更新行为 |
| --- | --- | --- |
| `https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog.json` | 每套配方的最新版 | 导入后 `update_mode = "follow"`，Kiki 每天检查一次，有新版本自动跟上 |
| `https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog-pinned.json` | 当前这一版的内容 | 地址里带版本目录，内容不会变；市场清单照常刷新 |
| `https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog-zip.json` | 带 SHA-256 的 ZIP 包 | Kiki 对带校验和的来源默认 `pinned`，装好之后不再自动更新 |

三个市场可以同时添加，`id` 取不同值即可。等价地写进 `config.toml`：

```toml
[[recipes.markets]]
id = "kiki-recipes-latest"
name = "Kiki Recipes（跟随更新）"
url = "https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog.json"
enabled = true

[[recipes.markets]]
id = "kiki-recipes-pinned"
name = "Kiki Recipes（锁定版本）"
url = "https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog-pinned.json"
enabled = true

[[recipes.markets]]
id = "kiki-recipes-zip"
name = "Kiki Recipes（ZIP 校验）"
url = "https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog-zip.json"
enabled = true
```

想单独装某一套，也可以跳过市场，在 Kiki 的配方导入里直接贴下面的 `.toml` 或 `.zip` 地址。

## 五套配方

| 配方 | `id` | 版本 | 适用定位 |
| --- | --- | --- | --- |
| GPT-6.1 Sol — 工作方式 | `gpt-6.1-sol-behavior` | 1.0.7 | 主控模型：先把意图和完成判据想清楚，再用判断和审美收口 |
| GPT-6 Astra — 工作方式 | `gpt-6-astra-behavior` | 1.0.7 | Astra 上的同一套工作方式，主控与子代理分工不变 |
| DeepSeek V4.1 — 先明意图、深想一层、闭环交付 | `deepseek-v4-intent-and-depth` | 1.0.0 | 针对思考偏浅、容易照字面机械执行的模型，把机制和反例想透再动手 |
| Gemini 4 Argon with Taste — 工作方式 | `gemini-4-argon-with-taste` | 1.1.0 | Argon 主控：文学通感的审美层，加合同内的子代理质量层 |
| Gemini 3.8 Flash — 锚定样板、留白克制、闭环交付 | `gemini-3.8-flash-craft` | 1.0.0 | 小参数高频模型：写作、前端与有界杂活，先锚样板再动手 |

### GPT-6.1 Sol — 工作方式

`gpt-6.1-sol-behavior` · v1.0.7

```
Latest    https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/recipes/gpt-6.1-sol-behavior/recipe.toml
版本目录  https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/versions/gpt-6.1-sol-behavior/1.0.7/recipe.toml
Git tag   https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/gpt-6.1-sol-behavior-v1.0.7/recipes/gpt-6.1-sol-behavior/recipe.toml
ZIP       https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/releases/gpt-6.1-sol-behavior-1.0.7.zip
SHA-256   409a78c1868795e4081c67fe74848b174ab4d5d19a5a0381d30bc07212220492
```

### GPT-6 Astra — 工作方式

`gpt-6-astra-behavior` · v1.0.7

```
Latest    https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/recipes/gpt-6-astra-behavior/recipe.toml
版本目录  https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/versions/gpt-6-astra-behavior/1.0.7/recipe.toml
Git tag   https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/gpt-6-astra-behavior-v1.0.7/recipes/gpt-6-astra-behavior/recipe.toml
ZIP       https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/releases/gpt-6-astra-behavior-1.0.7.zip
SHA-256   25fdbd268ea43cdfef0c890b78fb989a3f01dd83698090f41459f6ae78f31db4
```

### DeepSeek V4.1 — 先明意图、深想一层、闭环交付

`deepseek-v4-intent-and-depth` · v1.0.0

```
Latest    https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/recipes/deepseek-v4-intent-and-depth/recipe.toml
版本目录  https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/versions/deepseek-v4-intent-and-depth/1.0.0/recipe.toml
Git tag   https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/deepseek-v4-intent-and-depth-v1.0.0/recipes/deepseek-v4-intent-and-depth/recipe.toml
ZIP       https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/releases/deepseek-v4-intent-and-depth-1.0.0.zip
SHA-256   e29046020aa1a67dbaee75fbdaf8e7be8a7ee33b42b585cf966dd6ca0895bcef
```

### Gemini 4 Argon with Taste — 工作方式

`gemini-4-argon-with-taste` · v1.1.0

```
Latest    https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/recipes/gemini-4-argon-with-taste/recipe.toml
版本目录  https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/versions/gemini-4-argon-with-taste/1.1.0/recipe.toml
Git tag   https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/gemini-4-argon-with-taste-v1.1.0/recipes/gemini-4-argon-with-taste/recipe.toml
ZIP       https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/releases/gemini-4-argon-with-taste-1.1.0.zip
SHA-256   00d637681a3219b7d1f916e4ee098ae0a8e427a8d45e212063262bcf92df712d
```

### Gemini 3.8 Flash — 锚定样板、留白克制、闭环交付

`gemini-3.8-flash-craft` · v1.0.0

```
Latest    https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/recipes/gemini-3.8-flash-craft/recipe.toml
版本目录  https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/versions/gemini-3.8-flash-craft/1.0.0/recipe.toml
Git tag   https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/gemini-3.8-flash-craft-v1.0.0/recipes/gemini-3.8-flash-craft/recipe.toml
ZIP       https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/releases/gemini-3.8-flash-craft-1.0.0.zip
SHA-256   a921746584fcbaadc1e4b9677f31302f7152a12aa0c109e1d668e72a94c41657
```

## 四种地址的区别

| 取用方式 | 可预测性 | Kiki 默认 `update_mode` |
| --- | --- | --- |
| `main` 分支上的 `.toml` | 随 `main` 变 | `follow`，每天检查，自动更新 |
| `versions/<id>/<version>/recipe.toml` | 该版本内容固定，地址可长期引用 | `follow`，但内容不会再变，检查等于空跑 |
| `<tag>/recipes/<id>/recipe.toml` | tag 不动，内容不动 | `follow`，同上 |
| `releases/<id>-<version>.zip` + SHA-256 | 校验和不匹配就拒绝导入 | `pinned`，不再自动更新 |

要自动追更就用第一种；要把某台机器钉死在某一版，用后两种。

## 维护与发版

```bash
# 1. 改 recipes/<id>/recipe.toml 或它引用的 .md，并把 recipe.toml 里的 version 升上去
# 2. 重新生成快照、ZIP、三个 catalog 和 Pages 首页
node scripts/build.mjs

git add -A
git commit -m "feat(<id>): v1.1.0"
git push

# 3. 给这一版打 tag（tag 名 = <id>-v<version>）
git tag <id>-v<version>
git push origin <id>-v<version>
```

`scripts/build.mjs` 做四件事：

1. 校验 `recipes/<id>/recipe.toml`：`schema_version = 1`、`id` 与目录同名、semver 版本、描述非空，并逐个确认 `{ file = "..." }` 引用的 Markdown 存在、是合法 UTF-8、单文件不超过 256 KiB、整包不超过 4 MiB。
2. 把整包镜像到 `versions/<id>/<version>/`。该目录一旦存在且内容不同，构建会报错而不是覆盖——已发布的版本不会被悄悄改写，要改就升版本号。
3. 打出 `releases/<id>-<version>.zip`（`recipe.toml` 与 `.md` 都在压缩包根目录，固定时间戳、按文件名排序、不压缩，同样输入永远得到同样的字节），并写出 `.zip.sha256`。
4. 生成 `catalog.json`、`catalog-pinned.json`、`catalog-zip.json` 和 Pages 首页 `index.html`。

发版后可以顺手核对一遍线上地址：

```bash
curl -sI https://raw.githubusercontent.com/X-T-E-R/kiki-recipes/main/catalog.json | head -1
```

## 目录结构

```
kiki-recipes/
├── recipes/<id>/recipe.toml        # 配方本体，以及它引用的 .md 提示词
├── versions/<id>/<version>/        # 每个版本的冻结副本（raw 地址长期有效）
├── releases/<id>-<version>.zip     # 便携 ZIP + .sha256
├── catalog.json                    # 市场清单：跟随 main
├── catalog-pinned.json             # 市场清单：按版本目录锁定
├── catalog-zip.json                # 市场清单：ZIP + SHA-256
├── index.html                      # GitHub Pages 首页（由构建脚本生成）
└── scripts/build.mjs               # 唯一的构建入口
```

配方文件遵循 Kiki 的包格式：`recipe.toml` 里的每个 `{ file = "..." }` 都是包内相对路径，不许跨目录；ZIP 压缩包根目录下只能有一个 `recipe.toml`。

## 许可

MIT License，Copyright (c) 2026 X-T-E-R。完整条款见 [LICENSE](LICENSE)：可以自由使用、修改、分发，包括商用，保留版权与许可声明即可。
