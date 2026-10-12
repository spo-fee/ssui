const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runAsync } = require('./runtime.cjs');

test('异步上传进程不会阻塞其他包，并传播失败退出', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssui-process-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const waiting = runAsync(process.execPath, ['-e', 'setTimeout(() => require("fs").writeFileSync("done", process.env.RELEASE_TEST), 100)'], {
    cwd: dir, env: { ...process.env, RELEASE_TEST: 'ok' },
  });
  assert.equal(fs.existsSync(path.join(dir, 'done')), false, '启动子进程必须立即返回');
  await waiting;
  assert.equal(fs.readFileSync(path.join(dir, 'done'), 'utf8'), 'ok');
  await assert.rejects(runAsync(process.execPath, ['-e', 'process.exit(7)']), /7/);
  await assert.rejects(runAsync(path.join(dir, 'missing-command'), []), /ENOENT/);
});
