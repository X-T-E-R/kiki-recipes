/**
 * Golden Sample HTML/CSS/JS generator for Kiki Recipes (authored by Argon).
 * Produces a high-craft editorial specification sheet & interactive Recipe Studio.
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const META_BY_ID = {
  'gpt-6.1-sol-behavior': {
    order: 1,
    family: 'GPT-6.1 SOL',
    roleTag: 'FLAGSHIP CONTROLLER · XHIGH',
    targetModel: 'axon/gpt-6.1-sol',
    highlights: ['主控意图穿透', '品味与留白裁决', '最短完整闭环', '子代理契约协同'],
    branches: ['MAIN', 'SUB', 'INDEPENDENT', 'AGENT/TASK STEER'],
  },
  'gpt-6-astra-behavior': {
    order: 2,
    family: 'GPT-6 ASTRA',
    roleTag: 'ARCHITECTURAL REASONING',
    targetModel: 'axon/gpt-6-astra',
    highlights: ['主控方向把控', '独立职责边界', '同族工作流对齐', '长链路验收'],
    branches: ['MAIN', 'SUB', 'INDEPENDENT', 'AGENT/TASK STEER'],
  },
  'gemini-4-argon-with-taste': {
    order: 3,
    family: 'GEMINI 4 ARGON',
    roleTag: 'TASTE & SYNESTHESIA · HIGH',
    targetModel: 'axon-message/gcp/gemini-4-argon',
    highlights: ['文学通感视觉审美', '拒绝塞满与字海', '发散探路与直觉', '主创打样终审'],
    branches: ['MAIN', 'SUB', 'INDEPENDENT', 'AGENT/TASK STEER'],
  },
  'deepseek-v4-intent-and-depth': {
    order: 4,
    family: 'DEEPSEEK V4.1',
    roleTag: 'INTENT & MECHANISM DEPTH',
    targetModel: 'deepseek-v4-flash / deepseek-v4.1',
    highlights: ['先明真实意图', '深想一层机制与反例', '破除字面机械照搬', '端到端自验闭环'],
    branches: ['MAIN', 'SUB', 'INDEPENDENT', 'AGENT/TASK STEER'],
  },
  'gemini-3.8-flash-craft': {
    order: 5,
    family: 'GEMINI 3.8 FLASH',
    roleTag: 'GOLDEN-SAMPLE EXECUTION',
    targetModel: 'axon-message/gemini-3.8-flash',
    highlights: ['强制锚定黄金样板', '前端空间与字量留白', '改稿就地融合禁追加', '高并发工具有界交付'],
    branches: ['MAIN', 'SUB', 'INDEPENDENT', 'AGENT/TASK STEER'],
  },
};

export function renderIndex(packages, { repo = 'X-T-E-R/kiki-recipes', branch = 'main' } = {}) {
  const pagesBase = 'https://x-t-e-r.github.io/kiki-recipes';
  const rawBase = `https://raw.githubusercontent.com/${repo}/${branch}`;
  const rawTagBase = `https://raw.githubusercontent.com/${repo}`;

  const sortedPackages = [...packages].sort((a, b) => {
    const oa = META_BY_ID[a.id]?.order ?? 99;
    const ob = META_BY_ID[b.id]?.order ?? 99;
    return oa !== ob ? oa - ob : a.id.localeCompare(b.id);
  });

  const payload = sortedPackages.map((pkg, idx) => {
    const meta = META_BY_ID[pkg.id] ?? {
      order: idx + 1,
      family: pkg.id.toUpperCase(),
      roleTag: 'MODEL RECIPE',
      targetModel: pkg.id,
      highlights: [],
      branches: ['MAIN', 'SUB', 'INDEPENDENT'],
    };
    const totalBytes = pkg.entries.reduce((sum, e) => sum + e.bytes.length, 0);
    const files = pkg.entries.map((entry) => {
      const text = new TextDecoder('utf-8').decode(entry.bytes);
      return {
        name: entry.name,
        bytes: entry.bytes.length,
        lines: text.split('\n').length,
        content: text,
      };
    });
    // Put recipe.toml first, then main, sub, independent, steer
    files.sort((a, b) => {
      if (a.name === 'recipe.toml') return -1;
      if (b.name === 'recipe.toml') return 1;
      return a.name.localeCompare(b.name);
    });
    return {
      index: String(idx + 1).padStart(2, '0'),
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      sha256: pkg.sha256,
      zipBytes: pkg.zipBytes,
      totalBytes,
      fileCount: files.length,
      meta,
      files,
    };
  });

  const directoryRowsHtml = payload
    .map(
      (pkg) => `
            <a href="#recipe-${escapeHtml(pkg.id)}" class="dir-row">
              <span class="dir-idx">${escapeHtml(pkg.index)}</span>
              <span class="dir-main">
                <span class="dir-title">${escapeHtml(pkg.meta.family)}</span>
                <span class="dir-sub">${escapeHtml(pkg.id)}</span>
              </span>
              <span class="dir-ver">v${escapeHtml(pkg.version)}</span>
            </a>`,
    )
    .join('');

  const cardsHtml = payload
    .map((pkg, idx) => {
      const kb = (pkg.totalBytes / 1024).toFixed(1);
      const shortSha = `${pkg.sha256.slice(0, 10)}…${pkg.sha256.slice(-8)}`;
      const defaultLatestUrl = `${pagesBase}/recipes/${pkg.id}/recipe.toml`;
      const isFirst = idx === 0;
      const highlightsHtml = pkg.meta.highlights
        .map((h) => `<span class="trait-chip">${escapeHtml(h)}</span>`)
        .join('');
      const branchesHtml = pkg.meta.branches
        .map((b) => `<span class="branch-pill">${escapeHtml(b)}</span>`)
        .join('');
      const fileTabsHtml = pkg.files
        .map(
          (f, fIdx) => `
                  <button type="button" class="wb-tab ${fIdx === 0 ? 'is-active' : ''}" data-wb-tab="${escapeHtml(pkg.id)}" data-file-idx="${fIdx}">
                    <span class="wb-tab-name">${escapeHtml(f.name)}</span>
                    <span class="wb-tab-meta">${(f.bytes / 1024).toFixed(1)}k</span>
                  </button>`,
        )
        .join('');

      return `
      <article class="recipe-module" id="recipe-${escapeHtml(pkg.id)}" data-recipe-card="${escapeHtml(pkg.id)}">
        <div class="module-rail">
          <div class="module-num">${escapeHtml(pkg.index)}</div>
          <div class="module-family">${escapeHtml(pkg.meta.family)}</div>
          <div class="module-role">${escapeHtml(pkg.meta.roleTag)}</div>
          <div class="module-stats">
            <span>v${escapeHtml(pkg.version)}</span>
            <span>·</span>
            <span>${pkg.fileCount} FILES</span>
            <span>·</span>
            <span>${kb} KB</span>
          </div>
        </div>

        <div class="module-body">
          <div class="module-head">
            <div class="module-titles">
              <div class="module-id-row">
                <code class="pkg-id">${escapeHtml(pkg.id)}</code>
                <span class="target-alias">推荐绑定：<code>${escapeHtml(pkg.meta.targetModel)}</code></span>
              </div>
              <h3 class="module-title">${escapeHtml(pkg.name)}</h3>
            </div>
            <div class="branch-group" aria-label="覆盖分支">
              ${branchesHtml}
            </div>
          </div>

          <p class="module-desc">${escapeHtml(pkg.description)}</p>

          <div class="trait-row">
            ${highlightsHtml}
          </div>

          <div class="url-console" data-card-console="${escapeHtml(pkg.id)}">
            <div class="url-console-top">
              <div class="channel-pills" role="tablist" aria-label="单配方通道切换">
                <button type="button" class="ch-pill is-active" data-card-ch="latest" data-pkg="${escapeHtml(pkg.id)}">
                  <span class="ch-dot"></span>Latest 追更 (.toml)
                </button>
                <button type="button" class="ch-pill" data-card-ch="version" data-pkg="${escapeHtml(pkg.id)}">
                  Version 锁定 (v${escapeHtml(pkg.version)})
                </button>
                <button type="button" class="ch-pill" data-card-ch="tag" data-pkg="${escapeHtml(pkg.id)}">
                  Git Tag 锁定
                </button>
                <button type="button" class="ch-pill" data-card-ch="zip" data-pkg="${escapeHtml(pkg.id)}">
                  ZIP 离线包 (Pinned)
                </button>
              </div>
              <span class="mode-badge" data-card-mode-badge="${escapeHtml(pkg.id)}">KIKI MODE: FOLLOW (每日自动检查更新)</span>
            </div>

            <div class="url-bar-row">
              <div class="url-input-wrap" title="点击直接复制此地址" data-copy-url-box="${escapeHtml(pkg.id)}">
                <span class="url-protocol-tag" data-card-proto="${escapeHtml(pkg.id)}">TOML</span>
                <code class="url-input" data-card-url="${escapeHtml(pkg.id)}" aria-label="${escapeHtml(pkg.name)} 导入地址">${escapeHtml(defaultLatestUrl)}</code>
              </div>
              <button type="button" class="btn-primary" data-copy-card-url="${escapeHtml(pkg.id)}">
                复制配方地址
              </button>
            </div>

            <div class="module-Subactions">
              <div class="sha-group">
                <span class="sha-label">ZIP SHA-256</span>
                <code class="sha-code" title="${escapeHtml(pkg.sha256)}">${escapeHtml(shortSha)}</code>
                <button type="button" class="btn-ghost" data-copy-text="${escapeHtml(pkg.sha256)}" data-copy-label="复制完整 SHA-256">
                  复制完整 SHA-256
                </button>
                <a class="btn-ghost" href="${pagesBase}/releases/${escapeHtml(pkg.id)}-${escapeHtml(pkg.version)}.zip" download>
                  下载 .zip (${(pkg.zipBytes / 1024).toFixed(1)} KB)
                </a>
              </div>

              <div class="inspect-group">
                <button type="button" class="btn-inspect ${isFirst ? 'is-open' : ''}" data-toggle-wb="${escapeHtml(pkg.id)}" aria-expanded="${isFirst ? 'true' : 'false'}">
                  <span class="inspect-label">${isFirst ? '收起配方源码' : `检视配方源码 (${pkg.fileCount} 份文件)`}</span>
                  <span class="inspect-arrow">${isFirst ? '↑' : '↓'}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="workbench ${isFirst ? 'is-open' : ''}" data-wb-panel="${escapeHtml(pkg.id)}">
            <div class="wb-header">
              <div class="wb-tabs" role="tablist">
                ${fileTabsHtml}
              </div>
              <div class="wb-actions">
                <span class="wb-file-stats" data-wb-stats="${escapeHtml(pkg.id)}"></span>
                <button type="button" class="wb-copy-btn" data-wb-copy="${escapeHtml(pkg.id)}">复制当前文件</button>
              </div>
            </div>
            <div class="wb-Stage">
              <pre class="wb-pre"><code class="wb-code" data-wb-code="${escapeHtml(pkg.id)}"></code></pre>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join('\n');

  const embeddedJson = JSON.stringify({
    pagesBase,
    rawBase,
    rawTagBase,
    packages: payload,
  }).replaceAll('</script>', '<\\/script>');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kiki Recipes — 模型认知与工作方式配方库</title>
<meta name="description" content="五套面向 Kiki 的高阶模型配方：GPT-6.1 Sol、GPT-6 Astra、Gemini 4 Argon、DeepSeek V4.1 与 Gemini 3.8 Flash。支持一键订阅配方市场、Latest 自动追更与不可变版本锁定。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap">
<style>
  :root {
    --paper: #F4F1EA;
    --paper-elevated: #FAF8F4;
    --paper-well: #EAE5DA;
    --ink: #141413;
    --ink-secondary: #524E48;
    --ink-muted: #7A756C;
    --line: #DAD4C8;
    --line-strong: #B8B0A0;
    --vermilion: #C83E2B;
    --vermilion-deep: #A62F1E;
    --vermilion-soft: rgba(200, 62, 43, 0.08);
    --jade: #185C47;
    --jade-soft: rgba(24, 92, 71, 0.1);
    --obsidian: #151513;
    --obsidian-elevated: #1E1E1B;
    --obsidian-line: #2E2D29;
    --font-display: "Fraunces", "Songti SC", "Noto Serif SC", Georgia, serif;
    --font-sans: "Plus Jakarta Sans", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
    --font-mono: "IBM Plex Mono", "JetBrains Mono", "Cascadia Mono", ui-monospace, monospace;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background-color: var(--paper);
    background-image:
      linear-gradient(to right, rgba(20, 20, 19, 0.03) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(20, 20, 19, 0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Sticky Top Instrument Bar */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(244, 241, 234, 0.92);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .topbar-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.7rem 1.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
  .brand-cluster {
    display: flex;
    align-items: center;
    gap: 0.85rem;
  }
  .brand-mark {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--ink);
    text-decoration: none;
    white-space: nowrap;
  }
  .brand-dot {
    width: 8px;
    height: 8px;
    background: var(--vermilion);
    display: inline-block;
  }
  .brand-meta {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--ink-muted);
    padding-left: 0.85rem;
    border-left: 1px solid var(--line);
    white-space: nowrap;
  }
  .global-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .ctrl-group {
    display: inline-flex;
    align-items: center;
    background: var(--paper-well);
    border: 1px solid var(--line);
    padding: 2px;
  }
  .ctrl-label {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-muted);
    padding: 0 0.55rem;
  }
  .ctrl-btn {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--ink-secondary);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    padding: 0.26rem 0.52rem;
    cursor: pointer;
    transition: all 0.14s ease;
    white-space: nowrap;
  }
  .ctrl-btn:hover { color: var(--ink); }
  .ctrl-btn.is-active {
    background: var(--ink);
    color: var(--paper-elevated);
    font-weight: 500;
  }
  .repo-link {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    color: var(--ink);
    text-decoration: none;
    padding: 0.32rem 0.65rem;
    border: 1px solid var(--line-strong);
    background: var(--paper-elevated);
    transition: all 0.14s ease;
  }
  .repo-link:hover {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper-elevated);
  }

  /* Main Architectural Frame */
  .page-frame {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.75rem 5rem;
  }

  /* Hero Split Section */
  .hero {
    display: grid;
    grid-template-columns: 1.35fr 0.95fr;
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--paper-elevated);
  }
  .hero-left {
    padding: 3rem 2.75rem 2.75rem;
    border-right: 1px solid var(--line);
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--vermilion);
    margin: 0 0 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .hero-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: clamp(2.5rem, 4.5vw, 3.65rem);
    line-height: 1.03;
    letter-spacing: -0.02em;
    margin: 0 0 1rem;
    color: var(--ink);
  }
  .hero-title em {
    font-style: italic;
    font-weight: 400;
    color: var(--ink-secondary);
  }
  .hero-lede {
    font-size: 1.02rem;
    color: var(--ink-secondary);
    max-width: 40rem;
    margin: 0 0 2rem;
    line-height: 1.68;
  }

  /* Carbon Market Subscription Console */
  .market-console {
    background: var(--obsidian);
    color: #F3EFE6;
    border: 1px solid var(--ink);
    padding: 1.35rem 1.4rem 1.25rem;
  }
  .mc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.95rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--obsidian-line);
  }
  .mc-title {
    font-family: var(--font-mono);
    font-size: 0.74rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #A8A29E;
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .mc-title-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22C55E;
  }
  .mc-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    background: #0C0C0B;
    border: 1px solid var(--obsidian-line);
    padding: 2px;
    gap: 2px;
  }
  .mc-tab {
    appearance: none;
    border: none;
    background: transparent;
    color: #A8A29E;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 0.28rem 0.5rem;
    cursor: pointer;
    transition: all 0.14s ease;
    text-align: center;
    line-height: 1.35;
  }
  .mc-tab:hover { color: #F3EFE6; }
  .mc-tab.is-active {
    background: var(--vermilion);
    color: #FFFFFF;
    font-weight: 500;
  }
  .mc-bar {
    display: flex;
    gap: 0.55rem;
    align-items: stretch;
  }
  .mc-url-box {
    flex: 1;
    min-width: 0;
    background: #0C0C0B;
    border: 1px solid var(--obsidian-line);
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    cursor: pointer;
  }
  .mc-url-box:hover { border-color: #57534E; }
  .mc-url-input {
    width: 100%;
    border: none;
    background: transparent;
    color: #F3EFE6;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    line-height: 1.5;
    padding: 0.55rem 0;
    outline: none;
    cursor: pointer;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .mc-copy-btn {
    appearance: none;
    border: 1px solid var(--vermilion);
    background: var(--vermilion);
    color: #FFFFFF;
    font-family: var(--font-sans);
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0 1.15rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.14s ease;
  }
  .mc-copy-btn:hover { background: var(--vermilion-deep); }
  .mc-copy-btn.is-copied {
    background: var(--jade);
    border-color: var(--jade);
  }
  .mc-foot {
    margin-top: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    font-size: 0.76rem;
    color: #A8A29E;
  }
  .mc-foot code {
    font-family: var(--font-mono);
    color: #E7E5E4;
  }
  .mc-subbtns {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .mc-link-btn {
    appearance: none;
    background: transparent;
    border: 1px solid var(--obsidian-line);
    color: #D6D3CD;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 0.24rem 0.55rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.14s ease;
  }
  .mc-link-btn:hover {
    border-color: #A8A29E;
    color: #FFFFFF;
  }
  .mc-toml-drawer {
    display: none;
    margin-top: 0.85rem;
    padding-top: 0.85rem;
    border-top: 1px solid var(--obsidian-line);
  }
  .mc-toml-drawer.is-open { display: block; }
  .mc-toml-pre {
    margin: 0;
    padding: 0.75rem;
    background: #0C0C0B;
    border: 1px solid var(--obsidian-line);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.55;
    color: #D6D3CD;
    overflow-x: auto;
  }

  /* Hero Right: Package Index & Composition Spec */
  .hero-right {
    padding: 2.5rem 2.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: linear-gradient(180deg, var(--paper-elevated) 0%, #F5F2EB 100%);
    min-width: 0;
  }
  .spec-block-title {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin: 0 0 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dir-list {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
  }
  .dir-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.68rem 0.4rem;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
    color: var(--ink);
    transition: background 0.12s ease, padding-left 0.12s ease;
  }
  .dir-row:hover {
    background: var(--paper-well);
    padding-left: 0.75rem;
  }
  .dir-idx {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1rem;
    color: var(--vermilion);
    min-width: 1.6rem;
  }
  .dir-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.08rem;
  }
  .dir-title {
    font-weight: 600;
    font-size: 0.86rem;
    letter-spacing: 0.01em;
  }
  .dir-sub {
    font-family: var(--font-mono);
    font-size: 0.73rem;
    color: var(--ink-muted);
  }
  .dir-ver {
    font-family: var(--font-mono);
    font-size: 0.73rem;
    color: var(--ink-secondary);
  }

  .layer-diagram {
    margin-top: 1.75rem;
    padding: 1rem 1.1rem;
    background: var(--paper-well);
    border: 1px solid var(--line);
  }
  .layer-chain {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    margin-top: 0.45rem;
  }
  .layer-node {
    padding: 0.2rem 0.48rem;
    background: var(--paper-elevated);
    border: 1px solid var(--line-strong);
    color: var(--ink-secondary);
  }
  .layer-node.is-highlight {
    border-color: var(--vermilion);
    color: var(--vermilion);
    font-weight: 500;
    background: var(--vermilion-soft);
  }
  .layer-arrow { color: var(--ink-muted); }
  .layer-caption {
    margin: 0.55rem 0 0;
    font-size: 0.76rem;
    color: var(--ink-muted);
    line-height: 1.5;
  }

  /* Section Header Bar */
  .section-bar {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 2.6rem 0 1rem;
    border-bottom: 2px solid var(--ink);
  }
  .section-bar h2 {
    font-family: var(--font-display);
    font-size: 1.65rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }
  .section-bar-sub {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
  }

  /* Recipe Specification Modules */
  .recipes-stack {
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
  }
  .recipe-module {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    background: var(--paper-elevated);
    border-bottom: 1px solid var(--line);
  }
  .module-rail {
    padding: 2rem 1.5rem;
    border-right: 1px solid var(--line);
    background: rgba(234, 229, 218, 0.35);
    display: flex;
    flex-direction: column;
  }
  .module-num {
    font-family: var(--font-display);
    font-size: 2.75rem;
    font-weight: 400;
    font-style: italic;
    line-height: 1;
    color: var(--ink);
    margin-bottom: 0.75rem;
  }
  .module-family {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: var(--vermilion);
    margin-bottom: 0.25rem;
  }
  .module-role {
    font-family: var(--font-mono);
    font-size: 0.67rem;
    letter-spacing: 0.04em;
    color: var(--ink-muted);
    margin-bottom: auto;
  }
  .module-stats {
    margin-top: 1.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--line);
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: var(--ink-secondary);
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .module-body {
    padding: 2rem 2.25rem;
    min-width: 0;
  }
  .module-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.65rem;
  }
  .module-id-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }
  .pkg-id {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    background: var(--paper-well);
    border: 1px solid var(--line);
    padding: 0.12rem 0.5rem;
    color: var(--ink);
  }
  .target-alias {
    font-size: 0.78rem;
    color: var(--ink-muted);
  }
  .target-alias code {
    font-family: var(--font-mono);
    color: var(--ink-secondary);
  }
  .module-title {
    font-family: var(--font-display);
    font-size: 1.55rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.25;
  }
  .branch-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .branch-pill {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.05em;
    padding: 0.18rem 0.48rem;
    border: 1px solid var(--line-strong);
    color: var(--ink-secondary);
    background: var(--paper);
  }
  .module-desc {
    margin: 0.6rem 0 1rem;
    color: var(--ink-secondary);
    max-width: 52rem;
    font-size: 0.95rem;
  }
  .trait-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin-bottom: 1.35rem;
  }
  .trait-chip {
    font-size: 0.76rem;
    color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--line);
    padding: 0.2rem 0.62rem;
  }

  /* Per-Card URL Console */
  .url-console {
    background: var(--paper);
    border: 1px solid var(--line-strong);
    padding: 0.95rem 1.1rem;
  }
  .url-console-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 0.7rem;
  }
  .channel-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .ch-pill {
    appearance: none;
    border: 1px solid var(--line);
    background: var(--paper-elevated);
    color: var(--ink-secondary);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 0.26rem 0.65rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    transition: all 0.12s ease;
  }
  .ch-pill:hover {
    border-color: var(--ink);
    color: var(--ink);
  }
  .ch-pill.is-active {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper-elevated);
    font-weight: 500;
  }
  .ch-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--vermilion);
  }
  .mode-badge {
    font-family: var(--font-mono);
    font-size: 0.69rem;
    color: var(--ink-muted);
    letter-spacing: 0.03em;
  }
  .url-bar-row {
    display: flex;
    gap: 0.55rem;
    align-items: stretch;
  }
  .url-input-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    background: var(--paper-elevated);
    border: 1px solid var(--line-strong);
    padding: 0 0.65rem;
    cursor: pointer;
  }
  .url-input-wrap:hover { border-color: var(--ink); }
  .url-protocol-tag {
    font-family: var(--font-mono);
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    padding: 0.12rem 0.4rem;
    background: var(--paper-well);
    color: var(--ink-secondary);
    margin-right: 0.6rem;
    user-select: none;
  }
  .url-input {
    display: block;
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    font-family: var(--font-mono);
    font-size: 0.76rem;
    line-height: 1.5;
    color: var(--ink);
    padding: 0.5rem 0;
    outline: none;
    cursor: pointer;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  .btn-primary {
    appearance: none;
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--paper-elevated);
    font-family: var(--font-sans);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0 1.15rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.14s ease;
  }
  .btn-primary:hover {
    background: var(--vermilion);
    border-color: var(--vermilion);
  }
  .btn-primary.is-copied {
    background: var(--jade);
    border-color: var(--jade);
  }

  .module-Subactions {
    margin-top: 0.75rem;
    padding-top: 0.7rem;
    border-top: 1px dashed var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .sha-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .sha-label {
    font-family: var(--font-mono);
    font-size: 0.69rem;
    color: var(--ink-muted);
  }
  .sha-code {
    font-family: var(--font-mono);
    font-size: 0.73rem;
    color: var(--ink-secondary);
    background: var(--paper-well);
    padding: 0.12rem 0.42rem;
  }
  .btn-ghost {
    appearance: none;
    border: 1px solid var(--line);
    background: var(--paper-elevated);
    color: var(--ink-secondary);
    font-family: var(--font-mono);
    font-size: 0.71rem;
    padding: 0.22rem 0.58rem;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.12s ease;
  }
  .btn-ghost:hover {
    border-color: var(--ink);
    color: var(--ink);
  }
  .btn-ghost.is-copied {
    border-color: var(--jade);
    color: var(--jade);
    background: var(--jade-soft);
  }
  .btn-inspect {
    appearance: none;
    border: 1px solid var(--ink);
    background: transparent;
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.73rem;
    font-weight: 500;
    padding: 0.28rem 0.75rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.14s ease;
  }
  .btn-inspect:hover, .btn-inspect.is-open {
    background: var(--obsidian);
    color: #F3EFE6;
  }

  /* Inline Prompt Workbench Drawer */
  .workbench {
    display: none;
    margin-top: 1rem;
    background: var(--obsidian);
    border: 1px solid var(--ink);
    color: #E7E5E4;
  }
  .workbench.is-open { display: block; }
  .wb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    background: #0C0C0B;
    border-bottom: 1px solid var(--obsidian-line);
    padding: 0.45rem 0.75rem;
  }
  .wb-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    align-items: flex-start;
  }
  .wb-tab {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: #A8A29E;
    font-family: var(--font-mono);
    font-size: 0.72rem;
    padding: 0.3rem 0.62rem;
    cursor: pointer;
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    transition: all 0.12s ease;
    white-space: nowrap;
  }
  .wb-tab:hover { color: #F3EFE6; }
  .wb-tab.is-active {
    background: var(--obsidian-elevated);
    border-color: #44403C;
    color: #FFFFFF;
  }
  .wb-tab-meta {
    font-size: 0.64rem;
    color: #78716C;
  }
  .wb-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-left: auto;
  }
  .wb-file-stats {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    color: #A8A29E;
  }
  .wb-copy-btn {
    appearance: none;
    border: 1px solid #44403C;
    background: var(--obsidian-elevated);
    color: #E7E5E4;
    font-family: var(--font-mono);
    font-size: 0.71rem;
    padding: 0.24rem 0.65rem;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }
  .wb-copy-btn:hover { border-color: #A8A29E; color: #FFFFFF; }
  .wb-copy-btn.is-copied {
    background: var(--jade);
    border-color: var(--jade);
    color: #FFFFFF;
  }
  .wb-Stage {
    max-height: 440px;
    overflow: auto;
    padding: 1rem 1.2rem;
  }
  .wb-pre {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.78rem;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;
    color: #E7E5E4;
  }

  /* Bottom Specification Grid */
  .protocol-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-left: 1px solid var(--line);
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--paper-elevated);
  }
  .proto-cell {
    padding: 1.5rem 1.4rem;
    border-right: 1px solid var(--line);
  }
  .proto-cell:last-child { border-right: none; }
  .proto-tag {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--vermilion);
    margin-bottom: 0.4rem;
  }
  .proto-title {
    font-weight: 600;
    font-size: 0.95rem;
    margin: 0 0 0.45rem;
  }
  .proto-desc {
    margin: 0;
    font-size: 0.82rem;
    color: var(--ink-secondary);
    line-height: 1.55;
  }
  .proto-desc code {
    font-family: var(--font-mono);
    font-size: 0.76rem;
    background: var(--paper-well);
    padding: 0.05rem 0.3rem;
  }

  footer {
    margin-top: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
  }
  footer a { color: var(--ink); text-decoration: none; border-bottom: 1px solid var(--line-strong); }
  footer a:hover { border-color: var(--ink); }

  @media (max-width: 1120px) {
    .brand-meta { display: none; }
  }
  @media (max-width: 960px) {
    .hero { grid-template-columns: 1fr; }
    .hero-left { border-right: none; border-bottom: 1px solid var(--line); padding: 2.2rem 1.5rem; }
    .hero-right { padding: 1.8rem 1.5rem; }
    .recipe-module { grid-template-columns: 1fr; }
    .module-rail {
      border-right: none;
      border-bottom: 1px solid var(--line);
      padding: 1.25rem 1.5rem;
      flex-direction: row;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .module-num { font-size: 1.8rem; margin-bottom: 0; }
    .module-stats { margin-top: 0; padding-top: 0; border-top: none; margin-left: auto; }
    .module-body { padding: 1.5rem; }
    .protocol-grid { grid-template-columns: 1fr 1fr; }
    .proto-cell:nth-child(2) { border-right: none; }
    .proto-cell:nth-child(1), .proto-cell:nth-child(2) { border-bottom: 1px solid var(--line); }
  }
  @media (max-width: 600px) {
    .page-frame { padding: 0 1rem 3.5rem; }
    .topbar { position: static; }
    .topbar-inner { padding: 0.7rem 1rem 0.6rem; gap: 0.45rem; }
    .brand-cluster { order: 1; }
    .repo-link { order: 2; margin-left: auto; padding: 0.28rem 0.5rem; font-size: 0.68rem; }
    .global-controls { order: 3; width: 100%; flex-wrap: wrap; gap: 0.4rem; }
    .ctrl-group { flex: 1 1 100%; flex-wrap: wrap; padding: 2px 4px 4px; }
    .ctrl-label { flex: 0 0 100%; padding: 0 0.2rem 0.2rem; font-size: 0.6rem; }
    .mc-tabs { grid-template-columns: 1fr; }
    .hero-left { padding: 1.8rem 1.15rem; }
    .hero-right { padding: 1.5rem 1.15rem; }
    .mc-bar, .url-bar-row { flex-direction: column; }
    .mc-copy-btn, .btn-primary { padding: 0.6rem 1rem; text-align: center; }
    .mc-subbtns { flex-wrap: wrap; }
    .mc-foot { align-items: flex-start; }
    .section-bar { flex-direction: column; align-items: flex-start; gap: 0.4rem; padding-top: 2rem; }
    .section-bar h2 { font-size: 1.4rem; }
    .wb-tabs { width: 100%; flex-wrap: nowrap; overflow-x: auto; padding-bottom: 0.3rem; }
    .wb-actions { width: 100%; justify-content: space-between; }
    .module-rail { padding: 1rem 1.15rem; }
    .module-body { padding: 1.15rem; }
    .protocol-grid { grid-template-columns: 1fr; }
    .proto-cell { border-right: none; border-bottom: 1px solid var(--line); }
  }
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <div class="brand-cluster">
      <a href="#" class="brand-mark"><span class="brand-dot"></span>KIKI // RECIPES</a>
      <span class="brand-meta">SCHEMA V1 · MIT LICENSE</span>
    </div>

    <div class="global-controls">
      <div class="ctrl-group" role="group" aria-label="镜像源切换">
        <span class="ctrl-label">镜像源</span>
        <button type="button" class="ctrl-btn is-active" data-global-mirror="pages">Pages 国内直连</button>
        <button type="button" class="ctrl-btn" data-global-mirror="raw">GitHub Raw</button>
      </div>

      <div class="ctrl-group" role="group" aria-label="全局通道切换">
        <span class="ctrl-label">全部通道</span>
        <button type="button" class="ctrl-btn is-active" data-global-ch="latest">Latest 追更</button>
        <button type="button" class="ctrl-btn" data-global-ch="version">Version 锁定</button>
        <button type="button" class="ctrl-btn" data-global-ch="tag">Tag 锁定</button>
        <button type="button" class="ctrl-btn" data-global-ch="zip">ZIP + SHA256</button>
      </div>
    </div>

    <a class="repo-link" href="https://github.com/${escapeHtml(repo)}" target="_blank" rel="noopener">GitHub 仓库 ↗</a>
  </div>
</header>

<main class="page-frame">
  <section class="hero">
    <div class="hero-left">
      <div>
        <p class="eyebrow">MODEL COGNITION &amp; WORKFLOW PRESETS</p>
        <h1 class="hero-title">Kiki Recipes.<br><em>Judgment, depth &amp; taste.</em></h1>
        <p class="hero-lede">
          把经过高强度实战打磨的模型工作方式、认知锚点、子代理契约与近输入持续 Steer 打包成可复用的标准配方。支持通过「配方市场」一键订阅全部，或按单套配方的 Latest 追更流与不可变版本流单独挂载。
        </p>
      </div>

      <div class="market-console" aria-label="一键订阅配方市场">
        <div class="mc-top">
          <span class="mc-title"><span class="mc-title-dot"></span>RECIPE MARKET · 一键订阅市场目录</span>
          <div class="mc-tabs" role="tablist">
            <button type="button" class="mc-tab is-active" data-market-kind="latest">Latest 追更 (catalog.json)</button>
            <button type="button" class="mc-tab" data-market-kind="pinned">版本锁定 (catalog-pinned.json)</button>
            <button type="button" class="mc-tab" data-market-kind="zip">ZIP 校验 (catalog-zip.json)</button>
          </div>
        </div>

        <div class="mc-bar">
          <div class="mc-url-box" id="mc-url-box" title="点击直接复制市场订阅地址">
            <code class="mc-url-input" id="mc-url-input" aria-label="配方市场订阅地址">${pagesBase}/catalog.json</code>
          </div>
          <button type="button" class="mc-copy-btn" id="mc-copy-btn">一键复制市场地址</button>
        </div>

        <div class="mc-foot">
          <span>在 Kiki 打开 <code>设置 → 模型 → 选择配方 → 市场</code> 粘贴即可</span>
          <div class="mc-subbtns">
            <button type="button" class="mc-link-btn" id="mc-copy-toml-btn">复制 config.toml 片段</button>
            <button type="button" class="mc-link-btn" id="mc-toggle-toml-btn">查看配置格式</button>
            <a class="mc-link-btn" id="mc-open-raw" href="${pagesBase}/catalog.json" target="_blank" rel="noopener">查看 JSON ↗</a>
          </div>
        </div>

        <div class="mc-toml-drawer" id="mc-toml-drawer">
          <pre class="mc-toml-pre" id="mc-toml-pre"></pre>
        </div>
      </div>
    </div>

    <div class="hero-right">
      <div>
        <div class="spec-block-title">
          <span>CATALOG DIRECTORY · 收录配方索引</span>
          <span>01 — 05</span>
        </div>
        <nav class="dir-list" aria-label="配方快速导航">
          ${directoryRowsHtml}
        </nav>
      </div>

      <div class="layer-diagram">
        <div class="spec-block-title" style="margin-bottom:0.2rem;">
          <span>KIKI BINDING PRECEDENCE · 覆盖优先级</span>
        </div>
        <div class="layer-chain">
          <span class="layer-node">Saved Model</span>
          <span class="layer-arrow">→</span>
          <span class="layer-node is-highlight">Model Recipe</span>
          <span class="layer-arrow">→</span>
          <span class="layer-node is-highlight">Profile Recipe</span>
          <span class="layer-arrow">→</span>
          <span class="layer-node">Profile Overrides</span>
        </div>
        <p class="layer-caption">
          绑定瞬间冻结修订哈希（Revision Digest）与展开正文；冷恢复保持会话快照，<code>follow</code> 模式每日静默拉取更新且支持历史版本一键回滚。
        </p>
      </div>
    </div>
  </section>

  <div class="section-bar">
    <h2>配方规格与在线检视</h2>
    <span class="section-bar-sub">点击任一地址框或按钮直接复制 · 点击「检视配方源码」在线阅读全部 Prompt</span>
  </div>

  <section class="recipes-stack" aria-label="五套模型配方详情">
    ${cardsHtml}
  </section>

  <div class="section-bar">
    <h2>四种接入通道对比</h2>
    <span class="section-bar-sub">KIKI RECIPE SOURCE READER PROTOCOL</span>
  </div>

  <section class="protocol-grid" aria-label="四种通道协议说明">
    <div class="proto-cell">
      <div class="proto-tag">CHANNEL 01 · FOLLOW</div>
      <h3 class="proto-title">Latest 浮动分支直连</h3>
      <p class="proto-desc">
        指向 <code>recipes/&lt;id&gt;/recipe.toml</code>。导入 Kiki 后默认设为 <code>update_mode = "follow"</code>，每 24 小时检查一次更新，适合日常主力环境跟随演进。
      </p>
    </div>
    <div class="proto-cell">
      <div class="proto-tag">CHANNEL 02 · VERSION SNAPSHOT</div>
      <h3 class="proto-title">Version 版本目录冻结</h3>
      <p class="proto-desc">
        指向 <code>versions/&lt;id&gt;/&lt;ver&gt;/recipe.toml</code>。构建脚本强制校验已发版本字节不可变，无需填写 SHA-256 即可永久锁死该版本内容。
      </p>
    </div>
    <div class="proto-cell">
      <div class="proto-tag">CHANNEL 03 · GIT TAG</div>
      <h3 class="proto-title">Git Tag 不可变引用</h3>
      <p class="proto-desc">
        指向 <code>&lt;id&gt;-v&lt;ver&gt;</code> 标签下的清单文件。依托 Git 标签锁定历史快照，适合在团队文档或评测基线中跨版本引用。
      </p>
    </div>
    <div class="proto-cell">
      <div class="proto-tag">CHANNEL 04 · DETERMINISTIC ZIP</div>
      <h3 class="proto-title">ZIP + SHA-256 硬锁定</h3>
      <p class="proto-desc">
        指向 <code>releases/&lt;id&gt;-&lt;ver&gt;.zip</code> 并附 64 位校验和。Kiki 检测到 <code>sha256</code> 后自动将安装设为 <code>pinned</code>，杜绝任何远端漂移。
      </p>
    </div>
  </section>

  <footer>
    <span>构建与防呆校验：修改 <code>recipes/&lt;id&gt;/</code> 并升 <code>version</code> 后执行 <code>node scripts/build.mjs</code></span>
    <span>
      <a href="https://github.com/${escapeHtml(repo)}">GitHub (${escapeHtml(repo)})</a> ·
      <a href="LICENSE">MIT License</a>
    </span>
  </footer>
</main>

<script id="kiki-recipes-data" type="application/json">${embeddedJson}</script>
<script>
(() => {
  const dataEl = document.getElementById('kiki-recipes-data');
  if (!dataEl) return;
  const DATA = JSON.parse(dataEl.textContent);
  const pkgMap = new Map(DATA.packages.map((p) => [p.id, p]));

  let globalMirror = 'pages'; // 'pages' | 'raw'
  let marketKind = 'latest';  // 'latest' | 'pinned' | 'zip'
  const cardChannels = new Map(DATA.packages.map((p) => [p.id, 'latest']));
  const activeFileIdx = new Map(DATA.packages.map((p) => [p.id, 0]));

  function baseUrl() {
    return globalMirror === 'pages' ? DATA.pagesBase : DATA.rawBase;
  }

  function getMarketUrl(kind) {
    const file = kind === 'latest'
      ? 'catalog.json'
      : kind === 'pinned'
        ? 'catalog-pinned.json'
        : 'catalog-zip.json';
    return baseUrl() + '/' + file;
  }

  function getMarketToml(kind) {
    const idSuffix = kind === 'latest' ? 'latest' : kind === 'pinned' ? 'pinned' : 'zip';
    const label = kind === 'latest' ? '跟随更新' : kind === 'pinned' ? '锁定版本' : 'ZIP 校验硬锁定';
    return [
      '[[recipes.markets]]',
      'id = "kiki-recipes-' + idSuffix + '"',
      'name = "Kiki Recipes（' + label + '）"',
      'url = "' + getMarketUrl(kind) + '"',
      'enabled = true',
    ].join('\\n');
  }

  function getCardUrl(pkgId, ch) {
    const pkg = pkgMap.get(pkgId);
    if (!pkg) return '';
    if (ch === 'latest') {
      return baseUrl() + '/recipes/' + pkg.id + '/recipe.toml';
    }
    if (ch === 'version') {
      return baseUrl() + '/versions/' + pkg.id + '/' + pkg.version + '/recipe.toml';
    }
    if (ch === 'tag') {
      return DATA.rawTagBase + '/' + pkg.id + '-v' + pkg.version + '/recipes/' + pkg.id + '/recipe.toml';
    }
    return baseUrl() + '/releases/' + pkg.id + '-' + pkg.version + '.zip';
  }

  function getCardModeText(ch) {
    if (ch === 'latest') return 'KIKI MODE: FOLLOW (每日自动检查更新)';
    if (ch === 'version') return 'KIKI MODE: VERSION SNAPSHOT (版本目录永久冻结)';
    if (ch === 'tag') return 'KIKI MODE: GIT TAG LOCKED (Git 标签不可变引用)';
    return 'KIKI MODE: PINNED (带 SHA-256 校验，Kiki 自动硬锁定)';
  }

  function flashButton(btn, copiedText, originalText) {
    const prev = originalText ?? btn.dataset.origText ?? btn.textContent;
    btn.dataset.origText = prev;
    btn.textContent = copiedText;
    btn.classList.add('is-copied');
    clearTimeout(btn._timer);
    btn._timer = setTimeout(() => {
      btn.textContent = prev;
      btn.classList.remove('is-copied');
    }, 1600);
  }

  async function copyText(text, triggerBtn, copiedLabel) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (triggerBtn) {
      flashButton(triggerBtn, copiedLabel || '已复制 ✓');
    }
  }

  function renderMarketConsole() {
    const url = getMarketUrl(marketKind);
    const input = document.getElementById('mc-url-input');
    const openRaw = document.getElementById('mc-open-raw');
    const tomlPre = document.getElementById('mc-toml-pre');
    if (input) input.textContent = url;
    if (openRaw) openRaw.href = url;
    if (tomlPre) tomlPre.textContent = getMarketToml(marketKind);
    document.querySelectorAll('[data-market-kind]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.marketKind === marketKind);
    });
  }

  function renderCardConsole(pkgId) {
    const ch = cardChannels.get(pkgId) || 'latest';
    const url = getCardUrl(pkgId, ch);
    const urlInput = document.querySelector('[data-card-url="' + pkgId + '"]');
    const protoTag = document.querySelector('[data-card-proto="' + pkgId + '"]');
    const modeBadge = document.querySelector('[data-card-mode-badge="' + pkgId + '"]');
    if (urlInput) urlInput.textContent = url;
    if (protoTag) protoTag.textContent = ch === 'zip' ? 'ZIP' : 'TOML';
    if (modeBadge) modeBadge.textContent = getCardModeText(ch);
    document.querySelectorAll('[data-pkg="' + pkgId + '"][data-card-ch]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.cardCh === ch);
    });
  }

  function renderWorkbench(pkgId) {
    const pkg = pkgMap.get(pkgId);
    if (!pkg) return;
    const idx = activeFileIdx.get(pkgId) ?? 0;
    const file = pkg.files[idx] || pkg.files[0];
    if (!file) return;
    const codeEl = document.querySelector('[data-wb-code="' + pkgId + '"]');
    const statsEl = document.querySelector('[data-wb-stats="' + pkgId + '"]');
    if (codeEl) codeEl.textContent = file.content;
    if (statsEl) statsEl.textContent = file.name + ' · ' + file.lines + ' lines · ' + file.bytes + ' B';
    document.querySelectorAll('[data-wb-tab="' + pkgId + '"]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.fileIdx) === idx);
    });
  }

  // Init all cards & workbenches
  renderMarketConsole();
  for (const pkg of DATA.packages) {
    renderCardConsole(pkg.id);
    renderWorkbench(pkg.id);
  }

  // Global mirror buttons
  document.querySelectorAll('[data-global-mirror]').forEach((btn) => {
    btn.addEventListener('click', () => {
      globalMirror = btn.dataset.globalMirror;
      document.querySelectorAll('[data-global-mirror]').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.globalMirror === globalMirror);
      });
      renderMarketConsole();
      for (const pkg of DATA.packages) renderCardConsole(pkg.id);
    });
  });

  // Global channel buttons
  document.querySelectorAll('[data-global-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ch = btn.dataset.globalCh;
      document.querySelectorAll('[data-global-ch]').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.globalCh === ch);
      });
      for (const pkg of DATA.packages) {
        cardChannels.set(pkg.id, ch);
        renderCardConsole(pkg.id);
      }
    });
  });

  // Market console events
  document.querySelectorAll('[data-market-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      marketKind = btn.dataset.marketKind;
      renderMarketConsole();
    });
  });

  document.getElementById('mc-copy-btn')?.addEventListener('click', (e) => {
    copyText(getMarketUrl(marketKind), e.currentTarget, '市场地址已复制 ✓');
  });
  document.getElementById('mc-url-box')?.addEventListener('click', () => {
    copyText(getMarketUrl(marketKind), document.getElementById('mc-copy-btn'), '市场地址已复制 ✓');
  });
  document.getElementById('mc-copy-toml-btn')?.addEventListener('click', (e) => {
    copyText(getMarketToml(marketKind), e.currentTarget, 'config.toml 已复制 ✓');
  });
  document.getElementById('mc-toggle-toml-btn')?.addEventListener('click', (e) => {
    const drawer = document.getElementById('mc-toml-drawer');
    if (!drawer) return;
    const open = drawer.classList.toggle('is-open');
    e.currentTarget.textContent = open ? '收起配置格式' : '查看配置格式';
  });

  // Per-card channel pills
  document.querySelectorAll('[data-card-ch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.pkg;
      cardChannels.set(pkgId, btn.dataset.cardCh);
      renderCardConsole(pkgId);
    });
  });

  // Per-card URL copy
  document.querySelectorAll('[data-copy-card-url]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.copyCardUrl;
      const ch = cardChannels.get(pkgId) || 'latest';
      copyText(getCardUrl(pkgId, ch), btn, '配方地址已复制 ✓');
    });
  });
  document.querySelectorAll('[data-copy-url-box]').forEach((box) => {
    box.addEventListener('click', () => {
      const pkgId = box.dataset.copyUrlBox;
      const ch = cardChannels.get(pkgId) || 'latest';
      const btn = document.querySelector('[data-copy-card-url="' + pkgId + '"]');
      copyText(getCardUrl(pkgId, ch), btn, '配方地址已复制 ✓');
    });
  });

  // Generic SHA-256 copy buttons
  document.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', () => {
      copyText(btn.dataset.copyText, btn, 'SHA-256 已复制 ✓');
    });
  });

  // Workbench toggle & file tabs
  document.querySelectorAll('[data-toggle-wb]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.toggleWb;
      const panel = document.querySelector('[data-wb-panel="' + pkgId + '"]');
      const pkg = pkgMap.get(pkgId);
      if (!panel || !pkg) return;
      const open = panel.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const label = btn.querySelector('.inspect-label');
      const arrow = btn.querySelector('.inspect-arrow');
      if (label) label.textContent = open ? '收起配方源码' : '检视配方源码 (' + pkg.fileCount + ' 份文件)';
      if (arrow) arrow.textContent = open ? '↑' : '↓';
    });
  });

  document.querySelectorAll('[data-wb-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.wbTab;
      activeFileIdx.set(pkgId, Number(btn.dataset.fileIdx));
      renderWorkbench(pkgId);
    });
  });

  document.querySelectorAll('[data-wb-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pkgId = btn.dataset.wbCopy;
      const pkg = pkgMap.get(pkgId);
      const idx = activeFileIdx.get(pkgId) ?? 0;
      const file = pkg?.files[idx];
      if (file) copyText(file.content, btn, '文件内容已复制 ✓');
    });
  });
})();
</script>
</body>
</html>
`;
}
