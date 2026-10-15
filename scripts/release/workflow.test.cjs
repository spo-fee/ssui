const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const workflow = YAML.parse(fs.readFileSync(path.resolve(__dirname, '../../.github/workflows/publish.yml'), 'utf8'));

test('构建没有发布权限；上传只取原 artifact，且每轮重新验证授权', () => {
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.deepEqual(workflow.permissions, {});
  assert.equal(workflow.concurrency['cancel-in-progress'], false);
  const { build, publish } = workflow.jobs;
  assert.deepEqual(build.permissions, { contents: 'read' });
  assert.equal(publish.permissions['id-token'], 'write');
  assert.equal(publish.environment, 'npm-release');
  assert.equal(publish.needs, 'build');
  const download = publish.steps.find(s => s.uses?.startsWith('actions/download-artifact@'));
  assert.equal(download.with['artifact-ids'], '${{ needs.build.outputs.artifact-id }}');
  assert.equal(download.with.name, undefined);
  assert.ok(publish.steps.some(s => s.run === 'node scripts/release/ci.cjs publish' && s.env.NPM_PUBLISHERS === '${{ vars.NPM_PUBLISHERS }}'));
  for (const job of [build, publish]) {
    const checkout = job.steps.find(s => s.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.with.ref, '${{ github.sha }}');
    assert.equal(checkout.with['persist-credentials'], false);
    for (const step of job.steps.filter(s => s.uses)) assert.match(step.uses, /@[a-f0-9]{40}$/);
  }
  assert.ok(!publish.steps.some(s => /yarn|lerna|npm (?:ci|install(?! --global))|ci\.cjs (?:install|pack)/.test(s.run || '')));
});

test('构建只缓存 Yarn 下载文件，缓存命中也不跳过安装；发布任务不读依赖缓存', () => {
  const { build, publish } = workflow.jobs;
  const cache = build.steps.find(s => s.uses?.startsWith('actions/cache@'));
  assert.ok(cache, '构建应恢复 Yarn 下载缓存');
  const install = build.steps.find(s => s.run === 'node scripts/release/ci.cjs install');
  assert.match(cache.with.path, /^\$\{\{ runner\.temp \}\}\/[^/]+$/);
  assert.equal(cache.with.path, install.env.YARN_CACHE_FOLDER, '根安装与子包安装必须使用恢复的下载缓存');
  assert.ok(build.steps.indexOf(cache) < build.steps.indexOf(install));
  assert.equal(install.if, undefined, '命中缓存也必须执行冻结安装及子包链接');
  for (const context of ['runner.os', 'runner.arch', 'github.ref_name']) assert.ok(cache.with.key.includes(context), context);
  assert.ok(cache.with.key.includes("hashFiles('yarn.lock', 'packages/*/yarn.lock')"), '所有根/子包锁文件参与缓存更新');
  const setup = build.steps.find(s => s.uses?.startsWith('actions/setup-node@'));
  assert.ok(cache.with.key.includes(`node${setup.with['node-version']}`), 'Node 版本变化必须区分缓存');
  const tools = build.steps.find(s => s.name === 'Install fixed release tools');
  const yarnVersion = tools.run.match(/yarn@(\d+\.\d+\.\d+)/)[1];
  assert.ok(cache.with.key.includes(`yarn${yarnVersion}`), 'Yarn 版本变化必须区分缓存');
  assert.equal(cache.with['restore-keys'].trim(), cache.with.key.slice(0, cache.with.key.lastIndexOf('${{ hashFiles(\'yarn.lock\'')), '回退仅复用同环境和分支的下载文件');
  for (const job of Object.values(workflow.jobs)) {
    const setupNode = job.steps.find(s => s.uses?.startsWith('actions/setup-node@'));
    assert.equal(setupNode.with['package-manager-cache'], false, '避免隐式启用另一份依赖缓存');
  }
  assert.ok(!publish.steps.some(s => s.uses?.startsWith('actions/cache') || s.with?.cache));
  assert.equal(publish.env?.YARN_CACHE_FOLDER, undefined);
  assert.ok(!publish.steps.some(s => s.env?.YARN_CACHE_FOLDER));
});

test('工作流和任务级 env 不引用该位置不可用的 runner 上下文', () => {
  // https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability
  for (const env of [workflow.env, ...Object.values(workflow.jobs).map(job => job.env)]) {
    for (const [name, value] of Object.entries(env || {})) {
      assert.doesNotMatch(String(value), /\$\{\{[^}]*\brunner\s*[.\[]/i, `${name}: runner 只能在支持它的步骤等位置使用`);
    }
  }
});
