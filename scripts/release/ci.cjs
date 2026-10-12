const fs = require('node:fs');
const path = require('node:path');
const { run } = require('./runtime.cjs');
const { MANIFEST, PACKAGES, check, ciContext, validateContext, validateIdentity, validateManifest } = require('./policy.cjs');
const { packRelease } = require('./pack.cjs');
const { publishRelease } = require('./publish.cjs');
function readRelease(root, context) {
  validateContext(context);
  check(run('git', ['rev-parse', 'HEAD'], { cwd: root }) === context.sha, 'checkout 提交不符');
  const manifest = validateManifest(JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')));
  check(context.ref === `refs/heads/${manifest.branch}`, '清单分支与运行分支不一致');
  const parent = run('git', ['rev-parse', 'HEAD^'], { cwd: root });
  check(parent === manifest.baseSha, '发布清单 baseSha 不是当前发布提交的父提交');
  const selected = new Map(manifest.packages.map(e => [e.name, e]));
  for (const name of PACKAGES) {
    const filename = `packages/${name}/package.json`;
    const before = JSON.parse(run('git', ['show', `${parent}:${filename}`], { cwd: root }));
    const after = JSON.parse(fs.readFileSync(path.join(root, filename), 'utf8'));
    const e = selected.get(name);
    if (e) check(before.version === e.oldVersion && after.version === e.version, `${name}: 提交版本与清单不符`);
    else check(before.version === after.version, `${name}: 版本变化遗漏于清单`);
  }
  return manifest;
}
function report(results = []) {
  const lines = ['| 包 | 版本 | 状态 |', '|---|---|---|', ...results.map(r => `| ${r.name} | ${r.version} | ${r.status} |`)];
  console.log(lines.join('\n'));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  const uploaded = results.filter(r => r.status === 'uploaded');
  if (uploaded.length) console.log(uploaded.map(r => `+ ${r.name}@${r.version}`).join('\n'));
}
function installDependencies(root, execute = run) {
  const locks = ['yarn.lock', ...PACKAGES.map(name => `packages/${name}/yarn.lock`)];
  for (const file of locks) check(fs.existsSync(path.join(root, file)), `缺少锁文件: ${file}，不允许非冻结安装`);
  execute('yarn', ['install', '--frozen-lockfile', '--ignore-scripts', '--non-interactive', '--prefer-offline'], { cwd: root, inherit: true });
  execute(process.execPath, [path.join(root, 'node_modules/lerna/cli.js'), 'bootstrap', '--ignore-scripts', '--force-local', '--', '--frozen-lockfile', '--non-interactive', '--prefer-offline'], { cwd: root, inherit: true });
  check(!execute('git', ['diff', '--name-only', '--', ...locks], { cwd: root }), '安装修改了锁文件，请先修复并提交锁文件');
}
async function main(mode) {
  const root = process.cwd(), context = ciContext();
  if (mode === 'publish') validateIdentity(context, process.env.NPM_PUBLISHERS);
  const manifest = readRelease(root, context);
  if (mode === 'install') { installDependencies(root); return; }
  if (mode === 'check') { console.log(`清单验证通过：${manifest.packages.map(e => `${e.name}@${e.version}`).join(', ')}`); return; }
  if (mode === 'pack') {
    const artifact = await packRelease({ root, manifest, outDir: process.env.RELEASE_ARTIFACT_DIR, context });
    console.log(`已打包 ${artifact.packages.length} 个包。`); return;
  }
  check(mode === 'publish', '使用 ci.cjs check|install|pack|publish');
  try { report(await publishRelease({ artifactDir: process.env.RELEASE_ARTIFACT_DIR, manifest, context })); }
  catch (e) { report(e.results); throw e; }
}
if (require.main === module) main(process.argv[2]).catch(e => { console.error(e.message); process.exitCode = 1; });
module.exports = { readRelease, installDependencies };
