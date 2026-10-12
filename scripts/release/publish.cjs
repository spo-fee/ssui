const fs = require('node:fs');
const path = require('node:path');
const { validateManifest, check, REGISTRY, TAG } = require('./policy.cjs');
const { integrity, inspectArchive } = require('./archive.cjs');
const { getPublished } = require('./registry.cjs');
const { run, npmEnvironment } = require('./runtime.cjs');
function verifiedArtifacts(artifactDir, manifest, context) {
  validateManifest(manifest);
  const file = path.join(artifactDir, 'artifact.json');
  check(fs.existsSync(file), '构建产物不存在或已过期，请检查原运行；不会自动重新构建');
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  check(artifact.schemaVersion === 1 && artifact.commit === context.sha && artifact.runId === context.runId, '产物来源与发布运行不一致');
  check(/^\d+$/.test(artifact.runAttempt) && Number(artifact.runAttempt) <= Number(context.runAttempt), '产物运行轮次无效');
  check(JSON.stringify(artifact.manifest) === JSON.stringify(manifest), '产物内发布清单与原提交不一致');
  check(Array.isArray(artifact.packages) && artifact.packages.length === manifest.packages.length, '产物包数量不符');
  const seen = new Set(), packages = [];
  const names = new Set(manifest.packages.map(e => e.name));
  for (const item of artifact.packages) {
    const e = manifest.packages.find(e => e.name === item.name);
    check(e && e.version === item.version && e.path === item.path && !seen.has(e.name), '产物包清单不符');
    seen.add(e.name);
    check(item.filename === `${e.name}-${e.version}.tgz`, '非法 tarball 名称');
    const tarball = path.join(artifactDir, item.filename);
    check(fs.lstatSync(tarball).isFile(), 'tarball 必须是普通文件');
    check(item.integrity === integrity(tarball), `${e.name}: 产物摘要不匹配`);
    const pkg = inspectArchive(tarball, e);
    // Read dependencies from the verified tarball, not untrusted artifact fields.
    // Peer dependencies can form legitimate cycles (a-icons <-> assui).
    const dependencies = Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies }).filter(name => names.has(name));
    packages.push({ ...item, dependencies });
  }
  const byName = new Map(packages.map(e => [e.name, e]));
  const visiting = new Set(), visited = new Set(), ordered = [];
  function visit(name) {
    if (visited.has(name)) return;
    check(!visiting.has(name), `运行时内部依赖循环: ${name}`);
    visiting.add(name);
    for (const dep of byName.get(name).dependencies) visit(dep);
    visiting.delete(name); visited.add(name); ordered.push(byName.get(name));
  }
  for (const e of packages) visit(e.name);
  return ordered;
}
function npmUpload(file) {
  check(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, '真实上传只能在 OIDC 工作流内执行');
  check(!process.env.NPM_TOKEN && !process.env.NODE_AUTH_TOKEN, '不接受长期 npm token');
  const config = npmEnvironment();
  try { run('npm', ['publish', file, '--ignore-scripts', `--registry=${REGISTRY}`, `--tag=${TAG}`, '--access=public', '--provenance'], { cwd: config.dir, env: config.env, inherit: true }); }
  finally { config.cleanup(); }
}
async function publishRelease({ artifactDir, manifest, context, lookup = getPublished, upload = npmUpload, dryRun = false, log = console.log }) {
  const packages = verifiedArtifacts(artifactDir, manifest, context);
  const statuses = new Map();
  const results = () => packages.map(e => ({ name: e.name, version: e.version, status: statuses.get(e.name) || 'not-uploaded' }));
  try {
    // Check every collision before starting any new upload.
    const existing = new Map();
    for (const e of packages) {
      const remote = await lookup(e.name, e.version);
      if (remote) check(remote.integrity === e.integrity, `${e.name}@${e.version}: 已发布版本内容冲突或缺少摘要`);
      existing.set(e.name, remote);
    }
    for (const e of packages) if (existing.get(e.name)) statuses.set(e.name, 'skipped');
    if (dryRun) {
      for (const e of packages) if (!statuses.has(e.name)) statuses.set(e.name, 'would-publish');
      return results();
    }
    for (const e of packages) {
      if (statuses.has(e.name)) continue;
      const label = `${e.name}@${e.version}`;
      log(`${label}: 开始上传`);
      try {
        await upload(path.join(artifactDir, e.filename), e);
      } catch (uploadError) {
        // A lost response may hide a successful upload. Check once, never poll or re-upload.
        try {
          const remote = await lookup(e.name, e.version);
          check(remote, 'npm 暂未查到该版本，上传结果尚不明确');
          check(remote.integrity === e.integrity, '已发布版本内容冲突或缺少摘要');
          log(`${label}: 上传命令报错，但已核实 npm 同版本及摘要一致`);
        } catch (verificationError) {
          statuses.set(e.name, 'upload-unconfirmed');
          throw new Error(`${label}: 上传命令报错（${uploadError.message}）；${verificationError.message}。停止后续上传，不会自动重复上传；请核实 npm 状态后手动重跑原任务`, { cause: uploadError });
        }
      }
      statuses.set(e.name, 'uploaded');
      log(`${label}: 上传成功；npm 可能仍在处理，新版本暂时无法安装属于正常情况`);
    }
    return results();
  } catch (error) {
    error.results = results();
    throw error;
  }
}
module.exports = { publishRelease, verifiedArtifacts };
