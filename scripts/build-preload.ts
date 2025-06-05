import type { OutputOptions } from 'rollup';
import { watch, rollup } from 'rollup';
import minimist from 'minimist';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import type { RollupOptions } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import { builtins, getEnv } from './utils';

const argv = minimist(process.argv.slice(2));
const TAG = '[build-preload.ts]';

interface PreloadEntry {
  name: string;
  input: string;
  output: string;
}

// 定义所有 preload 入口点
const preloadEntries: PreloadEntry[] = [
  {
    name: 'main',
    input: path.join(__dirname, '../electron/preload/index.ts'),
    output: path.join(__dirname, '../dist/preload/index.js'),
  },
  {
    name: 'welcome',
    input: path.join(__dirname, '../electron/preload/welcome.ts'),
    output: path.join(__dirname, '../dist/preload/welcome.js'),
  },
];

function createRollupConfig(entry: PreloadEntry): RollupOptions {
  const compilationInclude = ['electron/**/*.ts'];

  const plugins: any[] = [
    nodeResolve({
      extensions: ['.ts', '.js', 'json'],
    }),
    commonjs({
      include: compilationInclude,
    }),
    json(),
    typescript({
      sourceMap: false,
      noEmitOnError: true,
      include: compilationInclude,
    }),
    alias({
      entries: {
        '@': path.join(__dirname, '../src'),
      },
    }),
    replace({
      ...Object.entries({ ...getEnv(), NODE_ENV: argv.env }).reduce(
        (acc, [k, v]) =>
          Object.assign(acc, { [`process.env.${k}`]: JSON.stringify(v) }),
        {},
      ),
      preventAssignment: true,
    }),
  ];

  // 只在主 preload 构建时复制静态资源
  if (entry.name === 'main') {
    plugins.push(
      copy({
        targets: [
          { src: 'build/trayTemplate.png', dest: 'dist' },
          { src: 'build/tray.png', dest: 'dist' },
          { src: 'electron/welcome', dest: 'dist' }, // 复制 welcome 文件夹
        ],
      }),
    );
  }

  return {
    input: entry.input,
    output: {
      file: entry.output,
      format: 'cjs',
      sourcemap: false,
    },
    plugins,
    external: [...builtins(), 'electron'],
    onwarn: (warning) => {
      if (warning.code !== 'CIRCULAR_DEPENDENCY') {
        console.error(`(!) ${warning.message}`);
      }
    },
  };
}

async function buildEntry(entry: PreloadEntry) {
  const spinner = ora(`${TAG} Building ${entry.name} preload...`);

  try {
    spinner.start();
    const config = createRollupConfig(entry);
    const build = await rollup(config);
    await build.write(config.output as OutputOptions);
    spinner.succeed(`${TAG} ${entry.name} preload built successfully`);
    await build.close();
  } catch (error) {
    console.log(
      `\n${TAG} ${chalk.red(`${entry.name} preload 构建报错`)}\n`,
      error,
      '\n',
    );
    spinner.fail(`${TAG} ${entry.name} preload build failed`);
    throw error;
  }
}

async function watchEntry(entry: PreloadEntry) {
  const config = createRollupConfig(entry);
  const watcher = watch(config);

  watcher.on('event', (event) => {
    if (event.code === 'START') {
      console.log(`${TAG} ${chalk.blue(`${entry.name} preload building...`)}`);
    } else if (event.code === 'END') {
      console.log(
        `${TAG} ${chalk.green(`${entry.name} preload built successfully`)}`,
      );
    } else if (event.code === 'ERROR') {
      console.log(
        `${TAG} ${chalk.red(`${entry.name} preload build error:`)}`,
        event.error,
      );
    }
  });

  watcher.on('change', (filename) => {
    const log = chalk.yellow(`change -- ${filename}`);
    console.log(`${TAG} [${entry.name}]`, log);
  });

  return watcher;
}

(async () => {
  if (argv.watch) {
    console.log(
      `${TAG} ${chalk.blue('Starting watch mode for all preload scripts...')}`,
    );

    const watchers = await Promise.all(
      preloadEntries.map((entry) => watchEntry(entry)),
    );

    // 处理 Ctrl+C 退出
    process.on('SIGINT', () => {
      console.log(`\n${TAG} ${chalk.yellow('Closing watchers...')}`);
      watchers.forEach((watcher) => watcher.close());
      process.exit(0);
    });
  } else {
    console.log(`${TAG} ${chalk.blue('Building all preload scripts...')}`);

    try {
      // 串行构建所有 preload 脚本
      for (const entry of preloadEntries) {
        await buildEntry(entry);
      }

      console.log(
        `${TAG} ${chalk.green('All preload scripts built successfully!')}`,
      );
      process.exit(0);
    } catch {
      console.log(`${TAG} ${chalk.red('Build failed!')}`);
      process.exit(1);
    }
  }
})();
