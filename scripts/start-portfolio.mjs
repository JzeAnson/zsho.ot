import { spawn } from 'node:child_process';

const server = spawn(process.execPath, [
  'node_modules/vite/bin/vite.js',
  '--host', '127.0.0.1', '--port', '5173', '--strictPort',
], { stdio: ['inherit', 'pipe', 'inherit'] });
let opened = false;
let output = '';
server.stdout.on('data', chunk => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-4096);
  if (!opened && output.includes('http://127.0.0.1:5173/')) {
    opened = true;
    console.log('\nKeep this Terminal window open while using the portfolio.');
    console.log('Content editor: http://127.0.0.1:5173/edit\n');
    if (process.platform === 'darwin') {
      const browser = spawn('open', ['http://127.0.0.1:5173/'], { stdio: 'ignore' });
      browser.on('error', () => console.log('Open http://127.0.0.1:5173/ in your browser.'));
    }
  }
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.on('exit', code => { process.exitCode = code ?? 0; });
