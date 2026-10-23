#!/usr/bin/env node
/**
 * Builds the immutable artifacts of this recipe repository:
 *
 *   1. validates recipes/<id>/recipe.toml and every markdown file it references
 *   2. mirrors each package into versions/<id>/<version>/ (frozen per version)
 *   3. packs releases/<id>-<version>.zip (deterministic, files at the archive root)
 *      and writes the matching SHA-256 digest next to it
 *   4. writes catalog.json, catalog-pinned.json and catalog-zip.json
 *   5. writes index.html for the GitHub Pages site
 *
 * Run: node scripts/build.mjs
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'X-T-E-R/kiki-recipes';
const BRANCH = 'main';
const rawUrl = (ref, relativePath) =>
  `https://raw.githubusercontent.com/${REPO}/${ref}/${relativePath}`;

/** Limits enforced by Kiki's recipe source reader. */
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const MAX_ENTRIES = 256;

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/u;
const VERSION_PATTERN =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const FORBIDDEN_PATH_CHARS = /[\\:<>|"*?\u0000-\u001F]/u;
const RESERVED_NAMES = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu;

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function decodeUtf8(bytes, label) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return fail(`${label} is not valid UTF-8`);
  }
}

/** Same rules Kiki applies to a referenced file before it reads it. */
function assertRecipePath(name, label) {
  assert(
    !FORBIDDEN_PATH_CHARS.test(name) &&
      !name.startsWith('/') &&
      name.split('/').every(
        (part) =>
          part.length > 0 &&
          part !== '.' &&
          part !== '..' &&
          !/[. ]$/u.test(part) &&
          !RESERVED_NAMES.test(part) &&
          !['__proto__', 'constructor', 'prototype'].includes(part),
      ),
    `${label}: "${name}" must be a relative path inside its package`,
  );
  assert(name.endsWith('.md'), `${label}: "${name}" must be a markdown file`);
  assert(!name.includes('/'), `${label}: "${name}" must live at the package root`);
}

function readField(source, key) {
  const match = new RegExp(`^${key}\\s*=\\s*(.+)$`, 'mu').exec(source);
  return match === null ? undefined : match[1].trim();
}

function readStringField(source, key) {
  const match = new RegExp(`^${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'mu').exec(source);
  return match === null ? undefined : JSON.parse(`"${match[1]}"`);
}

async function readPackage(directory) {
  const id = path.basename(directory);
  const manifestPath = path.join(directory, 'recipe.toml');
  assert(existsSync(manifestPath), `recipes/${id}/recipe.toml is missing`);

  const manifestBytes = await readFile(manifestPath);
  const manifest = decodeUtf8(manifestBytes, `recipes/${id}/recipe.toml`);
  const label = `recipes/${id}/recipe.toml`;

  assert(readField(manifest, 'schema_version') === '1', `${label}: schema_version must be 1`);

  const manifestId = readStringField(manifest, 'id');
  assert(manifestId !== undefined, `${label}: id is missing`);
  assert(ID_PATTERN.test(manifestId), `${label}: id "${manifestId}" is not a valid recipe id`);
  assert(manifestId === id, `${label}: id "${manifestId}" must match its directory "${id}"`);

  const name = readStringField(manifest, 'name');
  assert(name !== undefined && name.length > 0, `${label}: name is missing`);

  const version = readStringField(manifest, 'version');
  assert(version !== undefined, `${label}: version is missing`);
  assert(VERSION_PATTERN.test(version), `${label}: version "${version}" is not semver`);

  const description = readStringField(manifest, 'description');
  assert(description !== undefined && description.length > 0, `${label}: description is missing`);

  const referenced = [...manifest.matchAll(/\{\s*file\s*=\s*"([^"]+)"\s*\}/gu)].map((m) => m[1]);
  assert(referenced.length > 0, `${label}: no { file = "..." } prompt is declared`);

  const names = [...new Set(referenced)].sort();
  const files = [];
  let total = 0;
  for (const fileName of names) {
    assertRecipePath(fileName, label);
    const filePath = path.join(directory, fileName);
    assert(existsSync(filePath), `${label}: referenced file "${fileName}" is missing`);
    const bytes = await readFile(filePath);
    assert(
      bytes.length <= MAX_FILE_BYTES,
      `${label}: "${fileName}" is ${bytes.length} B, over Kiki's 256 KiB per-file limit`,
    );
    total += bytes.length;
    assert(
      total <= MAX_TOTAL_BYTES,
      `${label}: package exceeds Kiki's 4 MiB total text budget`,
    );
    decodeUtf8(bytes, `recipes/${id}/${fileName}`);
    files.push({ name: fileName, bytes });
  }

  const extra = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name !== 'recipe.toml' && !names.includes(entry.name))
    .map((entry) => entry.name);
  if (extra.length > 0) {
    console.warn(`  note  recipes/${id}: ${extra.join(', ')} is not referenced and will not be packaged`);
  }

  const entries = [{ name: 'recipe.toml', bytes: manifestBytes }, ...files].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );

  assert(entries.length <= MAX_ENTRIES, `${label}: package has too many files`);

  return { id, name, version, description, directory, entries };
}

async function syncVersionSnapshot(pkg) {
  const target = path.join(ROOT, 'versions', pkg.id, pkg.version);
  const rel = `versions/${pkg.id}/${pkg.version}`;
  if (existsSync(target)) {
    const existing = (await readdir(target, { withFileTypes: true })).filter((e) => e.isFile());
    const expected = new Set(pkg.entries.map((entry) => entry.name));
    const sameSet =
      existing.length === expected.size &&
      existing.every((entry) => expected.has(entry.name));
    let identical = sameSet;
    if (sameSet) {
      for (const entry of pkg.entries) {
        const current = await readFile(path.join(target, entry.name));
        if (!current.equals(entry.bytes)) {
          identical = false;
          break;
        }
      }
    }
    assert(
      identical,
      `${rel} already published different content. Bump version in recipes/${pkg.id}/recipe.toml instead of editing a released snapshot`,
    );
    return { rel, changed: false };
  }
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  for (const entry of pkg.entries) {
    await writeFile(path.join(target, entry.name), entry.bytes);
  }
  return { rel, changed: true };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Deterministic ZIP: stored entries in name order, fixed timestamp
 * (1980-01-01 00:00), UTF-8 names, no extra fields, no directory entries.
 * Identical inputs always produce identical bytes, whatever the Node or zlib version.
 */
function buildZip(entries) {
  const DOS_TIME = 0;
  const DOS_DATE = (0 << 9) | (1 << 5) | 1;
  const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const local = [];
  const central = [];
  let offset = 0;

  for (const entry of sorted) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = entry.bytes;
    const checksum = crc32(data);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(DOS_TIME, 10);
    header.writeUInt16LE(DOS_DATE, 12);
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    header.writeUInt16LE(0, 28);
    local.push(header, name, data);

    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt16LE(0, 10);
    record.writeUInt16LE(DOS_TIME, 12);
    record.writeUInt16LE(DOS_DATE, 14);
    record.writeUInt32LE(checksum, 16);
    record.writeUInt32LE(data.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt16LE(0, 30);
    record.writeUInt16LE(0, 32);
    record.writeUInt16LE(0, 34);
    record.writeUInt16LE(0, 36);
    record.writeUInt32LE(0, 38);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);

    offset += header.length + name.length + data.length;
  }

  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...local, directory, end]);
}

async function writeRelease(pkg) {
  const stem = `${pkg.id}-${pkg.version}`;
  const zipPath = path.join(ROOT, 'releases', `${stem}.zip`);
  const zip = buildZip(pkg.entries);
  const sha256 = createHash('sha256').update(zip).digest('hex');

  if (existsSync(zipPath)) {
    const current = await readFile(zipPath);
    assert(
      current.equals(zip),
      `releases/${stem}.zip already published different bytes. Bump version in recipes/${pkg.id}/recipe.toml instead of rewriting a release`,
    );
  } else {
    await mkdir(path.dirname(zipPath), { recursive: true });
    await writeFile(zipPath, zip);
  }

  const digestPath = path.join(ROOT, 'releases', `${stem}.zip.sha256`);
  const digest = `${sha256}\n`;
  const existingDigest = existsSync(digestPath)
    ? decodeUtf8(await readFile(digestPath), `releases/${stem}.zip.sha256`)
    : undefined;
  if (existingDigest !== digest) await writeFile(digestPath, digest);

  return { sha256, zipBytes: zip.length };
}

function catalogFor(packages, kind) {
  const recipes = packages.map((pkg) => {
    const base = {
      id: pkg.id,
      displayName: pkg.name,
      description: pkg.description,
      version: pkg.version,
    };
    if (kind === 'latest') {
      return { ...base, source: rawUrl(BRANCH, `recipes/${pkg.id}/recipe.toml`) };
    }
    if (kind === 'pinned') {
      return {
        ...base,
        source: rawUrl(BRANCH, `versions/${pkg.id}/${pkg.version}/recipe.toml`),
      };
    }
    return {
      ...base,
      source: rawUrl(BRANCH, `releases/${pkg.id}-${pkg.version}.zip`),
      sha256: pkg.sha256,
    };
  });
  return { version: 1, recipes };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderIndex(packages) {
  const rows = packages
    .map((pkg) => {
      const short = `${pkg.sha256.slice(0, 12)}…${pkg.sha256.slice(-8)}`;
      return `        <li>
          <div class="row-head">
            <h3>${escapeHtml(pkg.name)}</h3>
            <span class="version">v${escapeHtml(pkg.version)}</span>
          </div>
          <p class="id">${escapeHtml(pkg.id)}</p>
          <p class="note">${escapeHtml(pkg.description)}</p>
          <p class="links">
            <a href="${rawUrl(BRANCH, `recipes/${pkg.id}/recipe.toml`)}">recipe.toml</a>
            <a href="${rawUrl(BRANCH, `releases/${pkg.id}-${pkg.version}.zip`)}">zip</a>
            <a href="${rawUrl(BRANCH, `releases/${pkg.id}-${pkg.version}.zip.sha256`)}">sha256</a>
            <span class="digest">${escapeHtml(short)}</span>
          </p>
        </li>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kiki Recipes</title>
<meta name="description" content="五套 Kiki 模型配方：工作方式、思考深度与审美取向，按订阅或按版本锁定的方式引入。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Sans:wght@400;500&display=swap">
<style>
  :root {
    --paper: #faf8f3;
    --ink: #1b1a17;
    --muted: #6b665c;
    --line: #e2ddd2;
    --accent: #1f5a4c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: "IBM Plex Sans", "Helvetica Neue", sans-serif;
    font-size: 16px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 46rem; margin: 0 auto; padding: 6rem 1.5rem 5rem; }
  header { margin-bottom: 4.5rem; }
  h1 {
    font-family: "Fraunces", Georgia, serif;
    font-weight: 600;
    font-size: clamp(2.6rem, 6vw, 3.9rem);
    line-height: 1.02;
    letter-spacing: -0.015em;
    margin: 0 0 1.1rem;
  }
  .lede { font-size: 1.1rem; color: var(--muted); max-width: 32rem; margin: 0; text-wrap: balance; }
  h2 {
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 1.4rem;
  }
  section { margin-bottom: 4.5rem; }
  .markets { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
  .markets li { padding: 1.1rem 0; border-bottom: 1px solid var(--line); }
  .markets .label { font-weight: 500; }
  .markets .mode { color: var(--muted); font-size: 0.9rem; margin-left: 0.5rem; }
  .markets a { display: block; margin-top: 0.35rem; color: var(--accent); font-size: 0.9rem; overflow-wrap: anywhere; }
  .recipes { list-style: none; margin: 0; padding: 0; }
  .recipes li { padding: 1.6rem 0; border-top: 1px solid var(--line); }
  .recipes li:last-child { border-bottom: 1px solid var(--line); }
  .row-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
  .row-head h3 {
    font-family: "Fraunces", Georgia, serif;
    font-weight: 400;
    font-size: 1.35rem;
    line-height: 1.25;
    margin: 0;
  }
  .version { font-size: 0.85rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .id { font-size: 0.82rem; color: var(--muted); margin: 0.15rem 0 0.5rem; }
  .id, .digest { font-family: ui-monospace, "SFMono-Regular", "Cascadia Mono", monospace; }
  .note { margin: 0 0 0.7rem; color: #3d3a34; }
  .links { display: flex; flex-wrap: wrap; align-items: baseline; gap: 1.1rem; margin: 0; font-size: 0.9rem; }
  .links a { color: var(--accent); text-decoration: none; border-bottom: 1px solid rgba(31, 90, 76, 0.28); }
  .links a:hover { border-bottom-color: var(--accent); }
  .digest { color: var(--muted); font-size: 0.78rem; }
  footer { border-top: 1px solid var(--line); padding-top: 1.4rem; color: var(--muted); font-size: 0.88rem; }
  a { color: var(--accent); }
  @media (max-width: 34rem) {
    main { padding: 3.5rem 1.25rem 3rem; }
    header { margin-bottom: 3rem; }
    section { margin-bottom: 3rem; }
  }
</style>
</head>
<body>
<main>
  <header>
    <h1>Kiki Recipes</h1>
    <p class="lede">五套模型配方：工作方式、思考深度与审美取向。订阅市场自动追更，或按版本锁定长期不动。</p>
  </header>

  <section>
    <h2>订阅市场</h2>
    <ul class="markets">
      <li>
        <span class="label">catalog.json</span><span class="mode">跟随 main 更新</span>
        <a href="catalog.json">catalog.json</a>
      </li>
      <li>
        <span class="label">catalog-pinned.json</span><span class="mode">锁定当前版本的内容</span>
        <a href="catalog-pinned.json">catalog-pinned.json</a>
      </li>
      <li>
        <span class="label">catalog-zip.json</span><span class="mode">ZIP + SHA-256 硬锁定</span>
        <a href="catalog-zip.json">catalog-zip.json</a>
      </li>
    </ul>
  </section>

  <section>
    <h2>配方</h2>
    <ul class="recipes">
${rows}
    </ul>
  </section>

  <footer>
    维护：改动 <span class="digest">recipes/&lt;id&gt;/</span> 并升级 version，然后运行 <span class="digest">node scripts/build.mjs</span>。
  </footer>
</main>
</body>
</html>
`;
}

async function main() {
  const recipesDir = path.join(ROOT, 'recipes');
  const ids = (await readdir(recipesDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert(ids.length > 0, 'recipes/ is empty');

  const packages = [];
  for (const id of ids) {
    const pkg = await readPackage(path.join(recipesDir, id));
    const snapshot = await syncVersionSnapshot(pkg);
    const release = await writeRelease(pkg);
    packages.push({ ...pkg, ...release });
    console.log(
      `${snapshot.changed ? 'snapshot' : 'kept    '}  ${id}@${pkg.version}  ${release.zipBytes} B  ${release.sha256}`,
    );
  }

  const catalogs = [
    ['catalog.json', catalogFor(packages, 'latest')],
    ['catalog-pinned.json', catalogFor(packages, 'pinned')],
    ['catalog-zip.json', catalogFor(packages, 'zip')],
  ];
  for (const [name, catalog] of catalogs) {
    await writeFile(path.join(ROOT, name), `${JSON.stringify(catalog, null, 2)}\n`);
  }

  await writeFile(path.join(ROOT, 'index.html'), renderIndex(packages));

  console.log('');
  for (const pkg of packages) {
    console.log(`${pkg.id}@${pkg.version}`);
    console.log(`  latest  ${rawUrl(BRANCH, `recipes/${pkg.id}/recipe.toml`)}`);
    console.log(`  locked  ${rawUrl(BRANCH, `versions/${pkg.id}/${pkg.version}/recipe.toml`)}`);
    console.log(`  tag     ${rawUrl(`${pkg.id}-v${pkg.version}`, `recipes/${pkg.id}/recipe.toml`)}`);
    console.log(`  zip     ${rawUrl(BRANCH, `releases/${pkg.id}-${pkg.version}.zip`)}`);
    console.log(`  sha256  ${pkg.sha256}`);
  }
}

main().catch((error) => {
  console.error(`build failed: ${error.message}`);
  process.exitCode = 1;
});
