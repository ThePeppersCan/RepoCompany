'use strict';
// Capture the current published game. Checkouts provide filenames, never bytes.
const { prepareMorogue } = require('./capture-published-morogue.cjs');
if (require.main === module) {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--write') options.write = true;
    else if (['--source', '--repo-source', '--output', '--version', '--cache-blobs', '--audit'].includes(arg) && args[i + 1]) {
      const key = { '--repo-source': 'repoSource', '--cache-blobs': 'cacheBlobs' }[arg] || arg.slice(2); options[key] = args[++i];
    } else throw Error('Unknown or incomplete capture option: ' + arg);
  }
  prepareMorogue(options).then(report => process.stdout.write(JSON.stringify({ ...report, receipts: `${report.receipts.length} per-file receipts in package-report.json` }, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
module.exports = { prepareMorogue };
