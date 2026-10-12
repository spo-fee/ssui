#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const readline = require('node:readline/promises');
const { run } = require('./runtime.cjs');
const { prepareRelease, localPreflight } = require('./prepare.cjs');
const { publishPrepared, retryRun, watchRun } = require('./github.cjs');
const { MANIFEST, SHA, REPOSITORY, check, validateManifest } = require('./policy.cjs');
async function main(args) {
  if (args[0] === '--help') { console.log('y pub                 选择版本并触发 CI\ny pub --check         仅检查本地/GitHub 前提，不改版本\ny pub --resume SHA    恢复已准备的发布，不重新升版本\ny pub --retry RUN_ID  手动重跑一轮失败任务'); return; }
  check(args.length <= 2 && (!args.length || ['--check','--resume','--retry'].includes(args[0])), '参数错误，使用 y pub --help');
  const root = run('git', ['rev-parse', '--show-toplevel']);
  if (args[0] === '--retry') { await retryRun(args[1] || ''); console.log(`查看结果：gh run view ${args[1]} --repo ${REPOSITORY}`); return; }
  if (args[0] === '--check') { await localPreflight(root); console.log('本地前提检查通过。CI 构建和 npm 信任关系需在工作流中验证。'); return; }
  const git = a => run('git', a, { cwd: root });
  const statePath = path.resolve(root, git(['rev-parse', '--git-path', 'ssui-release-state.json']));
  let release, state;
  if (args[0] === '--resume') {
    check(SHA.test(args[1] || ''), '请提供完整发布提交 SHA');
    await localPreflight(root, run, { requireSynced: false });
    check(git(['rev-parse', 'HEAD']) === args[1], '先检出对应发布提交所在分支，再恢复');
    const manifest = validateManifest(JSON.parse(git(['show', `${args[1]}:${MANIFEST}`])));
    check(git(['branch', '--show-current']) === manifest.branch, '清单分支不一致');
    release = { sha: args[1], branch: manifest.branch, tags: manifest.packages.map(e => `${e.name}@${e.version}`), manifest };
    state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
    if (state?.sha !== release.sha) state = null;
  } else {
    release = await prepareRelease({ root, confirm: async question => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      try { return /^(y|yes)$/i.test((await rl.question(question)).trim()); }
      finally { rl.close(); }
    } });
    if (!release) return;
  }
  state ||= { sha: release.sha, requestId: randomUUID() };
  fs.writeFileSync(statePath, JSON.stringify(state));
  console.log(`发布提交：${release.sha}\n中断恢复：y pub --resume ${release.sha}`);
  const result = await publishPrepared(release, { requestId: state.requestId, run: (command, args, options) => run(command, args, { ...options, cwd: root }) });
  fs.writeFileSync(statePath, JSON.stringify({ ...state, ...result }));
  console.log(`CI：${result.url}\n失败补发：y pub --retry ${result.runId}`);
  watchRun(result.runId);
  console.log(release.manifest.packages.map(e => `+ ${e.name}@${e.version}`).join('\n'));
}
main(process.argv.slice(2)).catch(e => { console.error(`发布停止：${e.message}`); process.exitCode = 1; });
