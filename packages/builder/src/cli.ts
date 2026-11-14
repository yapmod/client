import { Command } from 'commander';
import { buildPlugin } from './build.ts';
import { startDevSession } from './dev.ts';

const program = new Command();

program.name('yapmod').description('Yapmod plugin builder CLI').version('1.0.0');

program
  .command('build')
  .description('Bundle a plugin entry into a loadable expression file')
  .requiredOption('--entry <file>', 'Plugin entry file (.ts, .tsx, .js, or .jsx)')
  .requiredOption('--outfile <file>', 'Output file path')
  .option('--minify', 'Minify the bundle')
  .action(async (opts) => {
    await buildPlugin({
      entry: opts.entry,
      outfile: opts.outfile,
      minify: opts.minify ?? false,
    });
    console.log(`built: ${opts.outfile}`);
  });

program
  .command('dev')
  .description('Start a dev session with hot reload')
  .requiredOption('--entry <file>', 'Plugin entry file (.ts, .tsx, .js, or .jsx)')
  .option('--port <port>', 'Dev server port', '5173')
  .option('--host <host>', 'Dev server host', '127.0.0.1')
  .option('--minify', 'Minify the bundle')
  .action(async (opts) => {
    const session = await startDevSession({
      entry: opts.entry,
      port: Number(opts.port),
      host: opts.host,
      minify: opts.minify ?? false,
    });

    console.log(`dev session running at ${session.url}`);
    console.log(`open the control page and click "Open Yapin"`);

    process.on('SIGINT', async () => {
      await session.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await session.close();
      process.exit(0);
    });
  });

program.parse();
