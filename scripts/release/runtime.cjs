const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
function run(command, args, options = {}) {
  const { cwd, inherit = false, env = process.env, input } = options;
  const result = spawnSync(command, args, { cwd, env, input, encoding: 'utf8', stdio: inherit ? 'inherit' : ['pipe', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} 执行失败 (${result.status})\n${result.stderr || result.stdout || ''}`);
  return (result.stdout || '').trim();
}
function npmEnvironment() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^npm_config_/i.test(k) || /^(NODE_AUTH_TOKEN|NPM_TOKEN)$/i.test(k)) delete env[k];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ssui-npm-'));
  fs.writeFileSync(path.join(dir, 'npmrc'), '');
  Object.assign(env, { NPM_CONFIG_USERCONFIG: path.join(dir, 'npmrc'), NPM_CONFIG_GLOBALCONFIG: path.join(dir, 'globalrc'), NPM_CONFIG_CACHE: path.join(os.tmpdir(), 'ssui-npm-cache'), NPM_CONFIG_IGNORE_SCRIPTS: 'true' });
  return { dir, env, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}
module.exports = { run, npmEnvironment };
