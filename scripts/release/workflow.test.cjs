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

test('发布构建仅使用本次运行的临时 Yarn 缓存，不跨运行恢复或保存依赖', () => {
  const { build, publish } = workflow.jobs;
  for (const job of Object.values(workflow.jobs)) {
    assert.ok(!job.steps.some(s => s.uses?.startsWith('actions/cache') || s.with?.cache), '发布工作流不得恢复或保存跨运行依赖缓存');
    const setupNode = job.steps.find(s => s.uses?.startsWith('actions/setup-node@'));
    assert.equal(setupNode.with['package-manager-cache'], false, '必须明确关闭 setup-node 的自动依赖缓存');
  }
  const install = build.steps.find(s => s.run === 'node scripts/release/ci.cjs install');
  assert.match(install.env?.YARN_CACHE_FOLDER, /^\$\{\{ runner\.temp \}\}\/[^/]+$/);
  assert.equal(install.if, undefined, '每次构建都必须执行冻结安装');
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
