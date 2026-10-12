const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getPublished } = require('./registry.cjs');
const { packRelease } = require('./pack.cjs');
const { publishRelease } = require('./publish.cjs');
const { integrity } = require('./archive.cjs');
const { run, npmEnvironment } = require('./runtime.cjs');
const sha = 'a'.repeat(40);
const context = { sha, runId: '42', runAttempt: '1' };
const dependencies = { 'a-icons': ['a-base-icon'], 'aa-utils': ['ec-common'], amssui: ['a-icons'], assui: ['a-icons', 'aa-utils'] };
function fixture(t, names = ['a-base-icon', 'a-icons'], edges = dependencies) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ssui-release-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'node_modules'));
  fs.symlinkSync(path.dirname(require.resolve('lerna/package.json')), path.join(root, 'node_modules/lerna'), 'dir');
  const manifest = { schemaVersion: 1, branch: 'dev', baseSha: 'b'.repeat(40), tag: 'latest', packages: [] };
  for (const name of names) {
    const dir = path.join(root, 'packages', name); fs.mkdirSync(path.join(dir, 'lib'), { recursive: true }); fs.mkdirSync(path.join(dir, 'es'));
    for (const p of ['lib/index.js', 'lib/index.d.ts', 'es/index.js']) fs.writeFileSync(path.join(dir, p), '// fixture\n');
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '4.0.1', dependencies: Object.fromEntries((edges[name] || []).filter(n => names.includes(n)).map(n => [n, '^4.0.0'])), repository: 'git+https://github.com/spo-fee/ssui.git', main: './lib/index.js', module: './es/index.js', types: './lib/index.d.ts', files: ['lib', 'es'], scripts: { prepack: 'node -e "require(\'fs\').writeFileSync(\'EXECUTED\',\'bad\')"' } }));
    manifest.packages.push({ name, path: `packages/${name}`, oldVersion: '4.0.0', version: '4.0.1' });
  }
  const outDir = path.join(root, 'artifacts'); return { root, manifest, outDir };
}
function clock() {
  let elapsed = 0;
  const sleeps = [];
  const timers = [];
  let ticking = false;
  const tick = () => {
    if (ticking || !timers.length) return;
    ticking = true;
    setImmediate(() => {
      ticking = false;
      elapsed = Math.max(elapsed, Math.min(...timers.map(t => t.at)));
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= elapsed) timers.splice(i, 1)[0].resolve();
      tick();
    });
  };
  return {
    now: () => elapsed,
    sleep: ms => new Promise(resolve => { sleeps.push(ms); timers.push({ at: elapsed + ms, resolve }); tick(); }),
    log: () => {},
    sleeps,
  };
}
test('registry 只有明确的版本 404 是未发布，其他错误必须停止', async () => {
  assert.equal(await getPublished('a-icons', '4.0.1', { fetch: async () => ({ status: 404, ok: false }) }), null);
  for (const status of [401, 403, 429, 500]) await assert.rejects(getPublished('a-icons', '4.0.1', { fetch: async () => ({ status, ok: false }) }));
  await assert.rejects(getPublished('a-icons', '4.0.1', { fetch: async () => { throw new Error('offline'); } }));
});
test('registry 请求超时后中止', async () => {
  await assert.rejects(getPublished('a-icons', '4.0.1', {
    timeoutMs: 5,
    fetch: async (url, { signal }) => {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 100);
        signal.addEventListener('abort', () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
      });
      throw new Error('请求未按期限中止');
    },
  }), { name: 'TimeoutError' });
});
test('真实打包不执行钩子；首次部分失败，第二轮只补剩余包', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  assert.equal(fs.existsSync(path.join(f.root, 'packages/a-icons/EXECUTED')), false);
  const saved = JSON.parse(fs.readFileSync(path.join(f.outDir, 'artifact.json')));
  const registry = new Map(); let fail = true; const uploads = [];
  const lookup = async name => registry.get(name) || null;
  const upload = async (filename, entry) => {
    uploads.push(entry.name);
    if (entry.name === 'a-icons' && fail) throw new Error('temporary failure');
    registry.set(entry.name, { integrity: entry.integrity });
  };
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, lookup, upload, ...clock() }), /temporary failure/);
  assert.deepEqual([...registry.keys()], ['a-base-icon']);
  fail = false;
  const results = await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, lookup, upload });
  assert.deepEqual(results.map(x => x.status), ['skipped', 'uploaded']);
  assert.deepEqual(uploads, ['a-base-icon', 'a-icons', 'a-icons']);
  assert.equal(saved.packages.length, 2);
});
test('产物来源、摘要、同版本冲突及缺入口均阻止上传', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  const upload = async () => { assert.fail('不应上传'); };
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context: { ...context, runId: '999' }, upload }));
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, lookup: async () => ({ integrity: 'sha512-wrong' }), upload }), /内容冲突/);
  const artifact = JSON.parse(fs.readFileSync(path.join(f.outDir, 'artifact.json')));
  fs.appendFileSync(path.join(f.outDir, artifact.packages[1].filename), 'tampered');
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, lookup: async () => null, upload }), /摘要/);
  fs.rmSync(path.join(f.root, 'packages/a-icons/es/index.js'));
  await assert.rejects(packRelease({ ...f, outDir: path.join(f.root, 'other'), context }), /入口/);
});
test('冻结产物丢失和危险 publishConfig 均拒绝', async t => {
  const f=fixture(t);
  await assert.rejects(publishRelease({artifactDir:f.outDir,manifest:f.manifest,context}),/不存在或已过期/);
  const filename=path.join(f.root,'packages/a-icons/package.json');const p=JSON.parse(fs.readFileSync(filename));p.publishConfig={registry:'https://other.example/'};fs.writeFileSync(filename,JSON.stringify(p));
  await assert.rejects(packRelease({...f,context}),/publishConfig/);
});
test('六个包上传成功后立即完成，即使 registry 始终不可见也不查询或等待', async t => {
  const names = ['a-base-icon', 'a-icons', 'ec-common', 'aa-utils', 'amssui', 'assui'];
  const f = fixture(t, names); await packRelease({ ...f, context });
  const time = clock(), uploads = [], queries = [];
  const results = await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    lookup: async name => { queries.push(name); return null; },
    upload: async (file, entry) => { uploads.push(entry.name); },
  });
  assert.deepEqual(results.map(r => [r.name, r.status]), names.map(name => [name, 'uploaded']));
  assert.equal(uploads.length, 6);
  assert.equal(new Set(uploads).size, 6);
  assert.deepEqual(queries, names); // Only the preflight checks, no post-upload polling.
  assert.deepEqual(time.sleeps, []);
});

test('上传响应丢失时只核实一次，同版本摘要一致可以继续', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  const time = clock(), uploaded = new Map(), queries = [], uploads = [];
  const results = await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    lookup: async name => { queries.push(name); return uploaded.get(name) || null; },
    upload: async (file, entry) => {
      uploads.push(entry.name); uploaded.set(entry.name, { integrity: entry.integrity });
      if (entry.name === 'a-base-icon') throw new Error('response lost');
    },
  });
  assert.deepEqual(results.map(r => r.status), ['uploaded', 'uploaded']);
  assert.deepEqual(uploads, ['a-base-icon', 'a-icons']);
  assert.deepEqual(queries, ['a-base-icon', 'a-icons', 'a-base-icon']);
  assert.deepEqual(time.sleeps, []);
});

test('上传报错且一次查询无法核实时失败，不轮询、不重复上传、不启动下游', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  for (const scenario of ['missing', 'conflict', 'offline']) {
    const time = clock(), uploads = [], queries = [];
    await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
      upload: async (file, entry) => { uploads.push(entry.name); throw new Error('upload failed'); },
      lookup: async name => {
        queries.push(name);
        if (!uploads.length || scenario === 'missing') return null;
        if (scenario === 'offline') throw new Error('registry offline');
        return { integrity: 'wrong' };
      },
    }), error => {
      assert.match(error.message, /upload failed/);
      if (scenario === 'conflict') assert.match(error.message, /内容冲突/);
      if (scenario === 'offline') assert.match(error.message, /registry offline/);
      assert.deepEqual(error.results.map(r => r.status), ['upload-unconfirmed', 'not-uploaded']);
      return true;
    });
    assert.deepEqual(uploads, ['a-base-icon']);
    assert.deepEqual(queries, ['a-base-icon', 'a-icons', 'a-base-icon']);
    assert.deepEqual(time.sleeps, []);
  }
});

test('无依赖包最多三个同时上传，上传完成后空位立即复用', async t => {
  const names = ['a-base-icon', 'a-icons', 'ec-common', 'aa-utils', 'amssui', 'assui'];
  const f = fixture(t, names, {}); await packRelease({ ...f, context });
  const time = clock();
  let active = 0, maximum = 0;
  const results = await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    upload: async () => {
      maximum = Math.max(maximum, ++active);
      await time.sleep(20000);
      active--;
    },
    lookup: async () => null,
  });
  assert.equal(maximum, 3);
  assert.equal(active, 0);
  assert.equal(time.now(), 40000);
  assert.deepEqual(results.map(r => r.status), Array(6).fill('uploaded'));
});

test('并发失败停止新上传，但等待已启动上传结束，补发跳过成功包', async t => {
  const names = ['a-base-icon', 'a-icons', 'ec-common', 'aa-utils'];
  const f = fixture(t, names, {}); await packRelease({ ...f, context });
  const time = clock(), uploaded = new Map(), uploads = [];
  let fail = true;
  const upload = async (file, entry) => {
    uploads.push(entry.name);
    await time.sleep({ 'a-base-icon': 20000, 'a-icons': 40000, 'ec-common': 60000, 'aa-utils': 20000 }[entry.name]);
    if (entry.name === 'a-base-icon' && fail) throw new Error('upload failed');
    uploaded.set(entry.name, { integrity: entry.integrity });
  };
  const options = { artifactDir: f.outDir, manifest: f.manifest, context, ...time, upload,
    lookup: async name => uploaded.get(name) || null,
  };
  await assert.rejects(publishRelease(options), error => {
    assert.match(error.message, /upload failed/);
    assert.deepEqual(error.results.map(r => r.status), ['upload-unconfirmed', 'uploaded', 'uploaded', 'not-uploaded']);
    return true;
  });
  assert.deepEqual(uploads, ['a-base-icon', 'a-icons', 'ec-common']);
  assert.equal(time.now(), 60000);
  fail = false;
  const retried = await publishRelease({ ...options, context: { ...context, runAttempt: '2' } });
  assert.deepEqual(retried.map(r => r.status), ['uploaded', 'skipped', 'skipped', 'uploaded']);
  assert.deepEqual(uploads, ['a-base-icon', 'a-icons', 'ec-common', 'a-base-icon', 'aa-utils']);
});

test('依赖来自已校验 tarball，忽略 artifact 伪造依赖；已存在版本可立即解锁下游', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  const file = path.join(f.outDir, 'artifact.json');
  const artifact = JSON.parse(fs.readFileSync(file));
  for (const entry of artifact.packages) entry.dependencies = [];
  artifact.packages.reverse();
  fs.writeFileSync(file, JSON.stringify(artifact));
  const time = clock(), registry = new Map(), uploads = [];
  await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    upload: async (file, entry) => {
      uploads.push(entry.name);
      if (entry.name === 'a-icons') assert.ok(registry.has('a-base-icon'));
      await time.sleep(20000);
      registry.set(entry.name, { integrity: entry.integrity });
    }, lookup: async name => registry.get(name) || null,
  });
  assert.deepEqual(uploads, ['a-base-icon', 'a-icons']);
  registry.delete('a-icons'); uploads.length = 0;
  const retried = await publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    upload: async (file, entry) => { uploads.push(entry.name); registry.set(entry.name, { integrity: entry.integrity }); },
    lookup: async name => registry.get(name) || null,
  });
  assert.deepEqual(uploads, ['a-icons']);
  assert.deepEqual(retried.map(r => r.status), ['uploaded', 'skipped']);
});

test('可选依赖上传成功即可继续，无需等待可见；peer 循环不会阻塞，dry run 不上传', async t => {
  const f = fixture(t);
  for (const name of ['a-base-icon', 'a-icons']) {
    const file = path.join(f.root, 'packages', name, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(file));
    pkg.peerDependencies = { [name === 'a-icons' ? 'a-base-icon' : 'a-icons']: '^4.0.0' };
    if (name === 'a-icons') { pkg.optionalDependencies = pkg.dependencies; delete pkg.dependencies; }
    fs.writeFileSync(file, JSON.stringify(pkg));
  }
  await packRelease({ ...f, context });
  const time = clock(), uploaded = new Map(), uploads = [];
  const options = { artifactDir: f.outDir, manifest: f.manifest, context, ...time,
    lookup: async name => {
      const entry = uploaded.get(name);
      return entry && time.now() >= entry.at + 20000 ? entry : null;
    },
    upload: async (file, entry) => { uploads.push([entry.name, time.now()]); uploaded.set(entry.name, { integrity: entry.integrity, at: time.now() }); },
  };
  assert.deepEqual((await publishRelease({ ...options, dryRun: true })).map(r => r.status), ['would-publish', 'would-publish']);
  assert.equal(uploads.length, 0);
  await publishRelease(options);
  assert.deepEqual(uploads, [['a-base-icon', 0], ['a-icons', 0]]);
});

test('任何包发生版本冲突或运行时依赖成环，都必须在首次上传前拒绝', async t => {
  const f = fixture(t); await packRelease({ ...f, context });
  const upload = async () => assert.fail('不应上传任何包');
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, upload,
    lookup: async name => name === 'a-icons' ? { integrity: 'wrong' } : null,
  }), /内容冲突/);
  // Create a correctly hashed tarball with a reverse edge to exercise publisher validation independently of packRelease.
  const dir = path.join(f.root, 'packages/a-base-icon');
  const file = path.join(dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(file)); pkg.dependencies = { 'a-icons': '^4.0.0' };
  fs.writeFileSync(file, JSON.stringify(pkg));
  const config = npmEnvironment();
  try { run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', f.outDir], { cwd: dir, env: config.env }); }
  finally { config.cleanup(); }
  const artifactFile = path.join(f.outDir, 'artifact.json');
  const artifact = JSON.parse(fs.readFileSync(artifactFile));
  const entry = artifact.packages.find(e => e.name === 'a-base-icon');
  entry.integrity = integrity(path.join(f.outDir, entry.filename));
  fs.writeFileSync(artifactFile, JSON.stringify(artifact));
  await assert.rejects(publishRelease({ artifactDir: f.outDir, manifest: f.manifest, context, upload, lookup: async () => assert.fail('成环应在查询 npm 前拒绝') }), /依赖循环/);
});
